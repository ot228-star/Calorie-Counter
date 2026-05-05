/**
 * Local image crawler: downloads 1 image per meal from CRAWLER_MEALS.
 *
 * Usage (from repo root):
 *   npm i -D playwright
 *   npx playwright install chromium
 *   node scripts/crawl-food-images-local.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MEALS_FILE = path.join(ROOT, "src", "components", "stitch", "StitchAllFoodsScreen.tsx");
const FIX_LIST_FILE = path.join(ROOT, "src", "components", "stitch", "StitchCrawlerFixList.tsx");
const OUT_DIR = path.join(ROOT, "downloads", "crawler-meals");
const REPORT_PATH = path.join(OUT_DIR, "report.json");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_MEALS = Number(process.env.CRAWLER_MAX_MEALS || "0");
const ONLY_MEALS = (process.env.CRAWLER_ONLY_MEALS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const HEADLESS = process.env.CRAWLER_HEADLESS !== "false";
const PROVIDERS = (process.env.CRAWLER_PROVIDERS || "google,bing,duckduckgo")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const HARD_REJECT_URL_PARTS = [
  "headshot",
  "avatar",
  "profile",
  "author",
  "logo",
  "icon",
  "clipart",
  "vector",
  "cartoon",
  "anime",
  "mascot",
  "toy",
  "plush",
  "figurine",
  "sticker",
  "head",
  "portrait",
  "person",
  "menu",
  "takeout-menu",
  "restaurantguru.com",
  "img.restaurantguru.com",
  "receipt",
  "guest-check",
  "pngtree.com",
  "vecteezy.com",
  "freepik.com",
  "alamy.com",
  "shutterstock.com",
  "dreamstime.com",
  "gettyimages.com",
  "istockphoto.com",
  "adobestock.com",
  "depositphotos.com",
  "123rf.com",
  "shutterstock.com",
  "cliparts.co"
];
const SOFT_NEGATIVE_URL_PARTS = ["background", "wallpaper", "stock-photo", "illustration"];
const ALL_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const SOFT_POSITIVE_URL_PARTS = [
  "restaurant",
  "menu",
  "dish",
  "recipe",
  "food",
  "kitchen",
  "cooking",
  "plated",
  "meal",
  "gourmet"
];

function slugify(value) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "meal";
}

function readMeals() {
  const src = fs.readFileSync(MEALS_FILE, "utf8");
  const match = src.match(/CRAWLER_MEALS\s*=\s*\[(.*?)\];/s);
  if (!match) {
    throw new Error("Could not find CRAWLER_MEALS array in StitchAllFoodsScreen.tsx");
  }
  const body = match[1];
  const meals = [];
  const re = /"([^"]+)"/g;
  let m;
  while ((m = re.exec(body))) {
    meals.push(m[1].trim());
  }
  return meals;
}

function readFixList() {
  const src = fs.readFileSync(FIX_LIST_FILE, "utf8");
  const readArray = (name) => {
    const match = src.match(new RegExp(`${name}\\s*:\\s*string\\[\\]\\s*=\\s*\\[(.*?)\\];`, "s"));
    if (!match) return [];
    const out = [];
    const re = /"([^"]+)"/g;
    let m;
    while ((m = re.exec(match[1]))) out.push(m[1]);
    return out;
  };
  return {
    failedMeals: readArray("CRAWLER_FAILED_MEALS"),
    wrongFilesRemoved: readArray("CRAWLER_WRONG_FILES_REMOVED")
  };
}

function writeFixList({ failedMeals, wrongFilesRemoved }) {
  const renderList = (items) => {
    if (items.length === 0) return "";
    return `\n${items.map((x) => `  ${JSON.stringify(x)},`).join("\n")}\n`;
  };
  const content = `export const CRAWLER_FAILED_MEALS: string[] = [${renderList(failedMeals)}];

export const CRAWLER_WRONG_FILES_REMOVED: string[] = [${renderList(wrongFilesRemoved)}];

/** Re-crawl target list (removed wrong files + any failed meals). */
export const CRAWLER_RETRY_FILE_TARGETS: string[] = [...CRAWLER_WRONG_FILES_REMOVED];
`;
  fs.writeFileSync(FIX_LIST_FILE, content, "utf8");
}

function findExistingMealFile(slug) {
  for (const ext of ALL_IMAGE_EXTS) {
    const target = path.join(OUT_DIR, `${slug}${ext}`);
    if (fs.existsSync(target)) return target;
  }
  return "";
}

function querySafeMealLabel(meal) {
  return meal
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchBuffer(url, referer = "") {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
  };
  if (referer) headers.Referer = referer;
  let lastError = null;
  for (let i = 0; i < 3; i += 1) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (!contentType.startsWith("image/")) {
        throw new Error(`Not an image response (${contentType || "unknown"})`);
      }
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    } catch (error) {
      lastError = error;
      await sleep(400 + i * 500);
    }
  }
  throw lastError ?? new Error("Failed to download image");
}

function extensionFromUrl(url) {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return ".png";
  if (clean.endsWith(".webp")) return ".webp";
  if (clean.endsWith(".gif")) return ".gif";
  return ".jpg";
}

function buildSearchQueries(meal) {
  const label = querySafeMealLabel(meal);
  return [
    `${label} restaurant menu photo plated dish`,
    `${label} plated meal professional food photography`,
    `${label} dish close up food`
  ];
}

function isHardRejectedUrl(url) {
  const u = url.toLowerCase();
  if (u.includes("calorie") && u.includes("menu")) return true;
  if (u.includes("nutrition") && (u.includes("label") || u.includes("facts"))) return true;
  if (u.includes("icons") || u.includes("icon-set")) return true;
  if (u.includes("emoji")) return true;
  return HARD_REJECT_URL_PARTS.some((x) => u.includes(x));
}

function scoreCandidateUrl(url, meal) {
  const u = url.toLowerCase();
  let score = 0;
  if (u.endsWith(".jpg") || u.endsWith(".jpeg") || u.includes(".jpg?") || u.includes(".jpeg?")) score += 2;
  if (u.endsWith(".webp") || u.includes(".webp?")) score += 2;
  if (u.endsWith(".png") || u.includes(".png?")) score -= 2;

  for (const s of SOFT_POSITIVE_URL_PARTS) {
    if (u.includes(s)) score += 1;
  }
  for (const s of SOFT_NEGATIVE_URL_PARTS) {
    if (u.includes(s)) score -= 1;
  }

  const words = meal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 4);
  let matches = 0;
  for (const w of words.slice(0, 4)) {
    if (u.includes(w)) matches += 1;
  }
  score += matches * 2;

  return score;
}

async function getGoogleCandidates(page, searchQuery) {
  const query = encodeURIComponent(searchQuery);
  const url = `https://www.google.com/search?tbm=isch&q=${query}&hl=en`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  // Best-effort consent accept (varies by locale/account).
  const consentButtons = [
    "button:has-text('I agree')",
    "button:has-text('Accept all')",
    "button:has-text('Accept')",
    "button:has-text('Agree')"
  ];
  for (const sel of consentButtons) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 500 })) {
        await btn.click({ timeout: 1000 });
        break;
      }
    } catch {
      // continue
    }
  }

  await page.waitForTimeout(2200);
  await page.mouse.wheel(0, 2200);
  await page.waitForTimeout(900);

  const blocked = page.url().includes("/sorry/");
  if (blocked) return { blocked: true, candidates: [], referer: url };

  const candidates = await page.evaluate(() => {
    const out = new Set();

    const addUrl = (raw) => {
      if (typeof raw !== "string") return;
      const u = raw.trim();
      if (!u.startsWith("http")) return;
      if (u.includes("gstatic.com")) return;
      if (u.includes("/images/branding/")) return;
      out.add(u);
    };

    // 1) Direct image nodes
    for (const img of document.querySelectorAll("img")) {
      addUrl(img.currentSrc || img.src);
      addUrl(img.getAttribute("data-src") || "");
      const srcset = img.getAttribute("srcset") || "";
      for (const part of srcset.split(",")) {
        const maybe = part.trim().split(" ")[0];
        addUrl(maybe);
      }
    }

    // 2) Parse imgurl from result links (/imgres?...imgurl=...)
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("imgurl=")) continue;
      try {
        const full = href.startsWith("http") ? href : `https://www.google.com${href}`;
        const u = new URL(full);
        const imgurl = u.searchParams.get("imgurl");
        if (imgurl) addUrl(decodeURIComponent(imgurl));
      } catch {
        // ignore malformed hrefs
      }
    }

    return Array.from(out);
  });

  const unique = Array.from(new Set(candidates));
  return { blocked: false, candidates: unique, referer: url };
}

async function getBingCandidates(page, searchQuery) {
  const query = encodeURIComponent(searchQuery);
  const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC3&first=1`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1500);

  const candidates = await page.$$eval("a.iusc", (nodes) => {
    const urls = [];
    for (const node of nodes) {
      const raw = node.getAttribute("m");
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const murl = typeof parsed?.murl === "string" ? parsed.murl : "";
        if (murl.startsWith("http")) urls.push(murl);
      } catch {
        // ignore malformed metadata
      }
    }
    return Array.from(new Set(urls));
  });

  return { blocked: false, candidates, referer: url };
}

async function getDuckDuckGoCandidates(page, searchQuery) {
  const query = encodeURIComponent(searchQuery);
  const url = `https://duckduckgo.com/?q=${query}&iax=images&ia=images`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(1800);
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(700);

  const candidates = await page.evaluate(() => {
    const out = new Set();
    const add = (raw) => {
      if (typeof raw !== "string") return;
      const u = raw.trim();
      if (!u.startsWith("http")) return;
      if (u.includes("/logo_") || u.includes("duckduckgo.com/assets")) return;
      out.add(u);
    };
    for (const img of document.querySelectorAll("img")) {
      add(img.currentSrc || img.src);
      add(img.getAttribute("data-src") || "");
      const srcset = img.getAttribute("srcset") || "";
      for (const part of srcset.split(",")) {
        add(part.trim().split(" ")[0] || "");
      }
    }
    return Array.from(out);
  });

  return { blocked: false, candidates, referer: url };
}

function providerGetter(name) {
  if (name === "bing") return getBingCandidates;
  if (name === "google") return getGoogleCandidates;
  if (name === "duckduckgo") return getDuckDuckGoCandidates;
  return null;
}

async function ensurePage(browserRef, pageRef) {
  let browser = browserRef;
  let page = pageRef;
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: HEADLESS });
    page = await browser.newPage();
    return { browser, page };
  }
  if (!page || page.isClosed()) {
    page = await browser.newPage();
  }
  return { browser, page };
}

async function crawlOneMeal(page, meal) {
  let provider = "none";
  let unique = [];
  let referer = "";
  const queries = buildSearchQueries(meal);

  for (const q of queries) {
    for (const p of PROVIDERS) {
      const getter = providerGetter(p);
      if (!getter) continue;
      try {
        const result = await getter(page, q);
        provider = p;
        referer = result.referer || "";
        if (!result.blocked && result.candidates.length > 0) {
          const ranked = Array.from(new Set(result.candidates))
            .filter((u) => !isHardRejectedUrl(u))
            .sort((a, b) => scoreCandidateUrl(b, meal) - scoreCandidateUrl(a, meal));
          if (ranked.length > 0) {
            unique = ranked;
            break;
          }
        }
      } catch {
        // try next provider
      }
    }
    if (unique.length > 0) break;
  }

  if (unique.length === 0) {
    return { ok: false, meal, reason: "no_candidates", provider };
  }

  const slug = slugify(meal);
  for (const candidate of unique) {
    try {
      const ext = extensionFromUrl(candidate);
      const target = path.join(OUT_DIR, `${slug}${ext}`);
      const buf = await fetchBuffer(candidate, referer);
      if (buf.length < 20_000) continue; // skip tiny files
      fs.writeFileSync(target, buf);
      return { ok: true, meal, file: target, source: candidate, bytes: buf.length, provider };
    } catch {
      // Try next candidate.
    }
  }
  return { ok: false, meal, reason: "download_failed", provider };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const allMeals = readMeals();
  const existingFixList = readFixList();
  const removedBadFiles = [];
  for (const file of existingFixList.wrongFilesRemoved) {
    const fullPath = path.join(OUT_DIR, file);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      removedBadFiles.push(file);
    }
  }
  const retryMeals = new Set(existingFixList.failedMeals);
  const mealsNeedingImages = allMeals.filter((meal) => !findExistingMealFile(slugify(meal)));
  const targetMeals = Array.from(new Set([...mealsNeedingImages, ...retryMeals]));
  let meals = MAX_MEALS > 0 ? targetMeals.slice(0, MAX_MEALS) : targetMeals;
  if (ONLY_MEALS.length > 0) {
    const wanted = new Set(ONLY_MEALS.map((m) => m.toLowerCase()));
    meals = targetMeals.filter((meal) => wanted.has(meal.toLowerCase()));
  }

  let browser = await chromium.launch({ headless: HEADLESS });
  let page = await browser.newPage();
  const report = {
    totalMeals: allMeals.length,
    mealsWithExistingImages: allMeals.length - mealsNeedingImages.length,
    attemptedMeals: meals.length,
    providers: PROVIDERS,
    downloaded: 0,
    failed: 0,
    removedBadFiles,
    results: []
  };

  try {
    for (let i = 0; i < meals.length; i += 1) {
      const meal = meals[i];
      process.stdout.write(`[${i + 1}/${meals.length}] ${meal} ... `);

      ({ browser, page } = await ensurePage(browser, page));

      let result;
      try {
        result = await crawlOneMeal(page, meal);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result = { ok: false, meal, reason: `crawler_error: ${message}` };
        // Recreate page when Google invalidates/closes current target page.
        try {
          if (!page.isClosed()) await page.close();
        } catch {
          // ignore close errors
        }
        ({ browser, page } = await ensurePage(browser, page));
      }

      report.results.push(result);
      if (result.ok) {
        report.downloaded += 1;
        process.stdout.write("ok\n");
      } else {
        report.failed += 1;
        process.stdout.write(`failed (${result.reason})\n`);
      }
      await sleep(1200 + Math.floor(Math.random() * 1000));
    }
  } finally {
    if (browser.isConnected()) await browser.close();
    const failedMeals = report.results.filter((x) => !x.ok).map((x) => x.meal);
    writeFixList({
      failedMeals: Array.from(new Set([...existingFixList.failedMeals, ...failedMeals])).sort(),
      wrongFilesRemoved: Array.from(new Set(existingFixList.wrongFilesRemoved)).sort()
    });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  }

  console.log(`\\nDone. Downloaded: ${report.downloaded}, Failed: ${report.failed}`);
  console.log(`Images folder: ${OUT_DIR}`);
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});