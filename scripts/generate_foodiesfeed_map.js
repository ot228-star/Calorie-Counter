const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const FOOD_DB_PATH = path.join(ROOT, "app", "src", "data", "foodDatabase.ts");
const EXTRA_PATH = path.join(ROOT, "app", "src", "data", "extraFoods.ts");
const OUT_PATH = path.join(ROOT, "app", "src", "data", "foodiesfeedPhotoMap.ts");

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  const stop = new Set(["with", "and", "the", "a", "an", "of", "in", "on", "to", "for", "style", "mixed", "prepared"]);
  return normalize(text)
    .split(" ")
    .filter((x) => x.length > 2 && !stop.has(x));
}

function overlapScore(name, photo) {
  const nameNorm = normalize(name);
  const nameTokens = tokenize(name);
  const text = [photo.title, photo.slug, ...(Array.isArray(photo.tags) ? photo.tags : [])].join(" ");
  const photoNorm = normalize(text);
  const photoTokens = new Set(tokenize(text));
  if (!nameTokens.length) return 0;

  let score = 0;
  if (photoNorm.includes(nameNorm) || nameNorm.includes(photoNorm)) score += 1.2;
  const overlap = nameTokens.filter((t) => photoTokens.has(t)).length;
  score += overlap / nameTokens.length;
  if (overlap === nameTokens.length) score += 0.35;
  return score;
}

function extractNames(tsSource) {
  const names = [];
  const re = /name:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(tsSource))) names.push(m[1]);
  return names;
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
            Accept: "application/json",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(`HTTP ${res.statusCode} for ${url}`));
              return;
            }
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on("error", reject);
  });
}

async function fetchBestPhoto(foodName) {
  const q = encodeURIComponent(foodName);
  const url = `https://www.foodiesfeed.com/api/photos?page=1&limit=12&locale=en&searchQuery=${q}`;
  const json = await requestJson(url);
  const photos = Array.isArray(json.photos) ? json.photos : [];
  let best = null;
  let bestScore = -1;
  for (const p of photos) {
    const score = overlapScore(foodName, p);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  // Keep only high-confidence matches to avoid wrong food-photo pairings.
  if (!best || bestScore < 1.6) return null;
  return {
    name: foodName,
    url: best.master_url || best.webp_url || best.thumbnail_url || "",
    title: best.title || "",
    score: Number(bestScore.toFixed(2)),
  };
}

function toTsMap(entries) {
  const lines = [];
  lines.push("/* Auto-generated from Foodiesfeed API via scripts/generate_foodiesfeed_map.js */");
  lines.push("export const FOODIESFEED_PHOTO_BY_FOOD: Record<string, string> = {");
  for (const e of entries) {
    if (!e.url) continue;
    const key = e.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const val = e.url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(`  "${key}": "${val}",`);
  }
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const baseNames = extractNames(fs.readFileSync(FOOD_DB_PATH, "utf8"));
  const extraNames = extractNames(fs.readFileSync(EXTRA_PATH, "utf8"));
  const allNames = Array.from(new Set([...baseNames, ...extraNames])).sort((a, b) => a.localeCompare(b));

  const matches = [];
  const misses = [];

  for (let i = 0; i < allNames.length; i += 1) {
    const name = allNames[i];
    try {
      const best = await fetchBestPhoto(name);
      if (best && best.url) {
        matches.push(best);
        console.log(`[${i + 1}/${allNames.length}] match`, name, "=>", best.title, `(score ${best.score})`);
      } else {
        misses.push(name);
        console.log(`[${i + 1}/${allNames.length}] miss`, name);
      }
    } catch (e) {
      misses.push(name);
      console.log(`[${i + 1}/${allNames.length}] error`, name, e.message);
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  fs.writeFileSync(OUT_PATH, toTsMap(matches), "utf8");
  console.log("");
  console.log("done");
  console.log("matched:", matches.length);
  console.log("missed:", misses.length);
  console.log("output:", OUT_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

