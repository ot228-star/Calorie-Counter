const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const FOOD_DB_PATH = path.join(ROOT, "app", "src", "data", "foodDatabase.ts");
const EXTRA_PATH = path.join(ROOT, "app", "src", "data", "extraFoods.ts");
const OUT_PATH = path.join(ROOT, "app", "src", "data", "foodComPhotoMap.ts");

function fetch(url, depth = 0) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        },
        (res) => {
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location &&
            depth < 5
          ) {
            const next = res.headers.location.startsWith("http")
              ? res.headers.location
              : new URL(res.headers.location, url).toString();
            resolve(fetch(next, depth + 1));
            return;
          }
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => resolve({ status: res.statusCode, data }));
        }
      )
      .on("error", reject);
  });
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const stop = new Set([
    "with",
    "and",
    "the",
    "a",
    "an",
    "of",
    "in",
    "on",
    "to",
    "for",
    "recipe",
    "recipes",
    "food",
    "easy",
    "best",
    "homemade",
    "healthy",
    "light",
  ]);
  return normalize(text)
    .split(" ")
    .filter((x) => x.length > 2 && !stop.has(x));
}

function extractFoodNames(tsSource) {
  const names = [];
  const re = /name:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(tsSource))) names.push(m[1]);
  return names;
}

function extractRecipeLinks(html) {
  const links = new Set();
  const abs = html.match(/https:\/\/www\.food\.com\/recipe\/[^"'<\s]+/g) || [];
  abs.forEach((x) => links.add(x.replace(/[),.;\\]+$/, "")));
  const rel = html.match(/href="\/recipe\/[^"]+"/g) || [];
  rel.forEach((x) => {
    const m = x.match(/href="([^"]+)"/);
    if (m) links.add(`https://www.food.com${m[1].replace(/[),.;\\]+$/, "")}`);
  });
  return Array.from(links).filter((u) => /\/recipe\/[a-z0-9-]+-\d+/i.test(u));
}

function pickMeta(html, property) {
  const re = new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]+)"`, "i");
  const m = html.match(re);
  return m?.[1] ?? "";
}

function pickRecipeImage(html) {
  const urls = Array.from(
    new Set(html.match(/https:\/\/img\.sndimg\.com\/food\/image\/upload\/[^"'\s<]+/g) || [])
  ).filter((u) => !u.includes("food_avatar"));
  if (!urls.length) return "";
  const pref = urls.find((u) => u.includes("w_555,h_416,c_fit"));
  if (pref) return pref;
  const pref2 = urls.find((u) => u.includes("w_744"));
  if (pref2) return pref2;
  return urls[0];
}

function titleScore(foodName, recipeTitle) {
  const a = tokenize(foodName);
  const bSet = new Set(tokenize(recipeTitle));
  if (!a.length || !bSet.size) return 0;
  const overlap = a.filter((x) => bSet.has(x)).length;
  const exactNormA = normalize(foodName);
  const exactNormB = normalize(recipeTitle);
  let score = overlap / a.length;
  if (exactNormB.includes(exactNormA) || exactNormA.includes(exactNormB)) score += 0.9;
  if (overlap === a.length) score += 0.25;
  return score;
}

async function collectRecipeCatalog(seedUrls) {
  const catalog = [];
  const seen = new Set();
  for (const url of seedUrls) {
    try {
      const page = await fetch(url);
      if (page.status !== 200) continue;
      const links = extractRecipeLinks(page.data);
      for (const link of links) {
        if (seen.has(link)) continue;
        seen.add(link);
      }
    } catch {
      // ignore
    }
  }

  const recipeUrls = Array.from(seen).slice(0, 260);
  for (let i = 0; i < recipeUrls.length; i += 1) {
    const url = recipeUrls[i];
    try {
      const page = await fetch(url);
      if (page.status !== 200) continue;
      const titleMeta = pickMeta(page.data, "og:title") || "";
      const titleTag = (page.data.match(/<title>([^<]+)<\/title>/i)?.[1] || "").trim();
      const title = (titleMeta || titleTag).replace(/\s*recipe\s*-\s*food\.com\s*$/i, "").replace(/\s*-\s*food\.com\s*$/i, "").trim();
      const image = pickMeta(page.data, "og:image") || pickRecipeImage(page.data);
      if (!title || !image) continue;
      if (!/img\.sndimg\.com\/food\/image\/upload\//.test(image)) continue;
      catalog.push({ title, image, url });
      if ((i + 1) % 25 === 0) {
        console.log(`parsed ${i + 1}/${recipeUrls.length}`);
      }
    } catch {
      // ignore
    }
  }
  return catalog;
}

function makeMap(foodNames, catalog) {
  const out = [];
  for (const food of foodNames) {
    let best = null;
    let bestScore = -1;
    for (const item of catalog) {
      const score = titleScore(food, item.title);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }
    if (best && bestScore >= 1.15) {
      out.push({ food, image: best.image, recipeTitle: best.title, score: Number(bestScore.toFixed(2)) });
      console.log("match", food, "=>", best.title, bestScore.toFixed(2));
    }
  }
  return out;
}

function emitTs(entries) {
  const lines = [];
  lines.push("/* Auto-generated from public Food.com recipe pages via scripts/generate_foodcom_map.js */");
  lines.push("export const FOOD_COM_PHOTO_BY_FOOD: Record<string, string> = {");
  for (const e of entries) {
    const k = e.food.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const v = e.image.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(`  "${k}": "${v}",`);
  }
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const seedPages = [
    "https://www.food.com/",
  ];
  const catalog = await collectRecipeCatalog(seedPages);
  console.log("catalog size", catalog.length);

  const foodNames = Array.from(
    new Set([
      ...extractFoodNames(fs.readFileSync(FOOD_DB_PATH, "utf8")),
      ...extractFoodNames(fs.readFileSync(EXTRA_PATH, "utf8")),
    ])
  ).sort((a, b) => a.localeCompare(b));

  const entries = makeMap(foodNames, catalog);
  fs.writeFileSync(OUT_PATH, emitTs(entries), "utf8");
  console.log("mapped", entries.length, "foods");
  console.log("output", OUT_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

