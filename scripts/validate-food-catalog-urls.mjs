/**
 * HEAD-checks image URLs extracted from a seed SQL file or raw URL list.
 * Usage: node scripts/validate-food-catalog-urls.mjs [path/to/food_catalog_seed.sql]
 * Exit 1 on any hard failure unless --warn-only
 */
import fs from "fs";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const warnOnly = process.argv.includes("--warn-only");
const fileArg = process.argv.find((a) => a.endsWith(".sql") || a.endsWith(".csv"));

function extractUrlsFromSql(sql) {
  const set = new Set();
  const re = /https:\/\/[^'"\\\s)]+/g;
  let m;
  while ((m = re.exec(sql))) {
    let u = m[0].replace(/[,;]+$/, "");
    if (u.includes("'))")) u = u.split("'))")[0];
    set.add(u);
  }
  return [...set];
}

function headCheck(url) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith("https:") ? https : http;
      const req = lib.request(
        url,
        { method: "HEAD", timeout: 12000, headers: { "User-Agent": "CalorieCounter-catalog-validator/1.0" } },
        (res) => {
          const code = res.statusCode ?? 0;
          if (code >= 200 && code < 400) resolve({ url, ok: true, code });
          else if (code === 405 || code === 403) {
            // Some CDNs disallow HEAD — try GET range
            resolve({ url, ok: "retry", code });
          } else resolve({ url, ok: false, code });
        },
      );
      req.on("error", (e) => resolve({ url, ok: false, error: e.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ url, ok: false, error: "timeout" });
      });
      req.end();
    } catch (e) {
      resolve({ url, ok: false, error: String(e) });
    }
  });
}

function getCheck(url) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith("https:") ? https : http;
      const req = lib.request(
        url,
        { method: "GET", timeout: 15000, headers: { "User-Agent": "CalorieCounter-catalog-validator/1.0", Range: "bytes=0-0" } },
        (res) => {
          const code = res.statusCode ?? 0;
          resolve({ url, ok: code >= 200 && code < 400, code });
        },
      );
      req.on("error", (e) => resolve({ url, ok: false, error: e.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ url, ok: false, error: "timeout" });
      });
      req.end();
    } catch (e) {
      resolve({ url, ok: false, error: String(e) });
    }
  });
}

async function main() {
  const defaultSql = path.join(__dirname, "..", "supabase", "seed", "food_catalog_seed.sql");
  const target = fileArg || defaultSql;
  if (!fs.existsSync(target)) {
    console.error(`File not found: ${target}`);
    process.exit(2);
  }
  const sql = fs.readFileSync(target, "utf8");
  const urls = extractUrlsFromSql(sql);
  console.error(`Checking ${urls.length} URLs from ${target} ...`);
  let failed = 0;
  for (const url of urls) {
    let r = await headCheck(url);
    if (r.ok === "retry") r = await getCheck(url);
    if (r.ok === true) console.error(`OK ${r.code} ${url.slice(0, 72)}...`);
    else {
      failed += 1;
      console.error(`FAIL ${url}: ${JSON.stringify(r)}`);
    }
  }
  if (failed && !warnOnly) process.exit(1);
  if (failed && warnOnly) console.error(`--warn-only: ${failed} failures`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
