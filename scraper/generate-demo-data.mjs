// Generates a clearly-labeled DEMO dataset (2 weeks) so the dashboard is fully
// functional before the first live GitHub Actions capture runs. Every value here
// is synthetic — deterministic per-brand pseudo-random tag assignment plus
// rendered placeholder "homepage" mockups (NOT real screenshots). Safe to delete
// once real data exists: `rm -rf dashboard/public/data` and re-run capture.mjs.
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "dashboard", "public", "data");
const SNAPSHOTS_DIR = path.join(DATA_DIR, "snapshots");
const SCREENSHOTS_DIR = path.join(DATA_DIR, "screenshots");

const { own, competitors, segments } = JSON.parse(
  readFileSync(path.join(__dirname, "src", "competitors.json"), "utf-8")
);
const { tags } = JSON.parse(readFileSync(path.join(__dirname, "src", "taxonomy.json"), "utf-8"));
const ALL_SITES = [{ ...own, isOwn: true }, ...competitors.map((c) => ({ ...c, isOwn: false }))];

const SEGMENT_COLOR = {
  own: "#2a78d6",
  "bags-leather": "#eb6834",
  "jewellery-accessories": "#e87ba4",
  "gifting-lifestyle": "#1baf7a",
  "luxury-fashion": "#4a3aa7",
  "contemporary-fashion": "#eda100",
};

const SEGMENT_TAG_WEIGHT = {
  own: {},
  "bags-leather": { promo: 0.3, new_in: 0.5, bestsellers: 0.4, gifting: 0.5, personalisation: 0.6, social_proof: 0.4, sustainability: 0.3, loyalty: 0.2, free_shipping: 0.5, editorial: 0.4 },
  "jewellery-accessories": { promo: 0.4, new_in: 0.5, bestsellers: 0.5, gifting: 0.6, personalisation: 0.5, social_proof: 0.5, sustainability: 0.3, loyalty: 0.3, free_shipping: 0.5, editorial: 0.3 },
  "gifting-lifestyle": { promo: 0.3, new_in: 0.4, bestsellers: 0.4, gifting: 0.7, personalisation: 0.2, social_proof: 0.5, sustainability: 0.4, loyalty: 0.3, free_shipping: 0.6, editorial: 0.5 },
  "luxury-fashion": { promo: 0.05, new_in: 0.5, bestsellers: 0.1, gifting: 0.1, personalisation: 0.1, social_proof: 0.1, sustainability: 0.3, loyalty: 0.1, free_shipping: 0.2, editorial: 0.7 },
  "contemporary-fashion": { promo: 0.6, new_in: 0.6, bestsellers: 0.5, gifting: 0.3, personalisation: 0.1, social_proof: 0.4, sustainability: 0.4, loyalty: 0.3, free_shipping: 0.6, editorial: 0.4 },
};

const OWN_WEEK1_TAGS = ["gifting", "new_in", "bestsellers", "social_proof"];
const OWN_WEEK2_TAGS = ["gifting", "new_in", "bestsellers", "social_proof", "free_shipping"];
const ERROR_SLUGS_WEEK2 = new Set(["jacquemus", "alaia"]);

// deterministic pseudo-random in [0,1) from a string seed
function seededRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  h = Math.imul(h ^ (h >>> 15), 1 | h);
  h = (h ^ (h >>> 7)) * (61 | h);
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

function tagsForSite(site, weekSalt) {
  if (site.isOwn) return weekSalt === "week1" ? OWN_WEEK1_TAGS : OWN_WEEK2_TAGS;
  const weights = SEGMENT_TAG_WEIGHT[site.segment] || {};
  return tags.filter((t) => seededRand(`${site.slug}:${t.id}:${weekSalt}`) < (weights[t.id] ?? 0.3)).map((t) => t.id);
}

function mostRecentSunday(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d;
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

const week2Date = mostRecentSunday(new Date());
const week1Date = new Date(week2Date);
week1Date.setUTCDate(week1Date.getUTCDate() - 7);
const WEEK1 = isoDate(week1Date);
const WEEK2 = isoDate(week2Date);

function placeholderHtml(site, tagIds, weekLabel) {
  const color = SEGMENT_COLOR[site.segment] || "#898781";
  const tagLabels = tagIds.map((id) => tags.find((t) => t.id === id)?.label || id);
  const navItems = ["New In", "Shop All", "Gifting", "Edit", "Sale", "About"];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin:0; padding:0; font-family: system-ui, -apple-system, sans-serif; }
    body { width: 1440px; background: #fcfcfb; position: relative; overflow: hidden; }
    .watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      transform: rotate(-18deg); font-size: 46px; font-weight: 700; color: rgba(11,11,11,0.06);
      letter-spacing: 4px; white-space: nowrap; z-index: 5; pointer-events: none; }
    header { display:flex; align-items:center; justify-content:space-between; padding: 24px 56px; border-bottom: 1px solid #e1e0d9; }
    .brand { font-size: 22px; font-weight: 700; letter-spacing: 1px; color: #0b0b0b; }
    nav { display:flex; gap: 28px; }
    nav span { font-size: 13px; color: #52514e; text-transform: uppercase; letter-spacing: 0.5px; }
    .hero { padding: 90px 56px; background: linear-gradient(135deg, ${color}22, ${color}0d); }
    .hero h1 { font-size: 52px; color: #0b0b0b; max-width: 760px; line-height: 1.1; }
    .hero p { margin-top: 16px; font-size: 16px; color: #52514e; max-width: 560px; }
    .pills { display:flex; flex-wrap: wrap; gap: 10px; padding: 32px 56px; }
    .pill { padding: 8px 16px; border-radius: 999px; background: ${color}1f; color: ${color}; font-size: 13px; font-weight: 600; border: 1px solid ${color}55; }
    .blocks { display:flex; gap: 16px; padding: 0 56px 56px; }
    .block { flex:1; height: 260px; border-radius: 12px; background: #f0efec; border: 1px solid #e1e0d9; }
    footer { padding: 24px 56px; font-size: 12px; color: #898781; border-top: 1px solid #e1e0d9; }
  </style></head><body>
    <div class="watermark">DEMO PLACEHOLDER — ${weekLabel}</div>
    <header><div class="brand">${site.name}</div><nav>${navItems.map((n) => `<span>${n}</span>`).join("")}</nav></header>
    <div class="hero"><h1>${site.name} homepage mockup</h1><p>Synthetic placeholder content for dashboard development. Not the real ${site.name} homepage.</p></div>
    <div class="pills">${tagLabels.map((l) => `<span class="pill">${l}</span>`).join("") || '<span class="pill">No tags detected</span>'}</div>
    <div class="blocks"><div class="block"></div><div class="block"></div><div class="block"></div></div>
    <footer>Demo data generated for kl-test dashboard scaffolding — replace by running the weekly capture workflow.</footer>
  </body></html>`;
}

async function buildSnapshot(browser, weekOf, weekSalt, weekLabel) {
  const screenshotDir = path.join(SCREENSHOTS_DIR, weekOf);
  mkdirSync(screenshotDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const sites = [];
  for (const site of ALL_SITES) {
    const isError = weekSalt === "week2" && ERROR_SLUGS_WEEK2.has(site.slug);
    if (isError) {
      sites.push({
        slug: site.slug, name: site.name, url: site.url, segment: site.segment, isOwn: !!site.isOwn,
        status: "error", error: "Timed out waiting for page load (simulated demo failure)", tags: [], navL1: [],
      });
      continue;
    }
    const tagIds = tagsForSite(site, weekSalt);
    await page.setContent(placeholderHtml(site, tagIds, weekLabel), { waitUntil: "load" });
    const heroPath = path.join(screenshotDir, `${site.slug}-hero.jpg`);
    const fullPath = path.join(screenshotDir, `${site.slug}-full.jpg`);
    await page.screenshot({ path: heroPath, type: "jpeg", quality: 70 });
    await page.screenshot({ path: fullPath, type: "jpeg", quality: 60, fullPage: true });
    sites.push({
      slug: site.slug,
      name: site.name,
      url: site.url,
      segment: site.segment,
      isOwn: !!site.isOwn,
      status: "ok",
      title: `${site.name} | Demo Placeholder`,
      metaDescription: "Synthetic demo data.",
      navL1: ["New In", "Shop All", "Gifting", "Edit", "Sale", "About"],
      heroHeading: `${site.name} homepage mockup`,
      textSample: "Synthetic placeholder content for dashboard development.",
      tags: tagIds,
      screenshots: {
        hero: `data/screenshots/${weekOf}/${site.slug}-hero.jpg`,
        full: `data/screenshots/${weekOf}/${site.slug}-full.jpg`,
      },
    });
  }
  await page.close();
  return { weekOf, capturedAt: new Date().toISOString(), isDemoData: true, sites };
}

async function main() {
  mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  const browser = await chromium.launch(
    process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {}
  );

  console.log(`Generating demo week 1 (${WEEK1})...`);
  const snap1 = await buildSnapshot(browser, WEEK1, "week1", "Week 1");
  writeFileSync(path.join(SNAPSHOTS_DIR, `${WEEK1}.json`), JSON.stringify(snap1, null, 2));

  console.log(`Generating demo week 2 (${WEEK2})...`);
  const snap2 = await buildSnapshot(browser, WEEK2, "week2", "Week 2 (latest)");
  writeFileSync(path.join(SNAPSHOTS_DIR, `${WEEK2}.json`), JSON.stringify(snap2, null, 2));

  await browser.close();

  writeFileSync(path.join(DATA_DIR, "latest.json"), JSON.stringify(snap2, null, 2));
  writeFileSync(path.join(DATA_DIR, "index.json"), JSON.stringify({ weeks: [WEEK1, WEEK2] }, null, 2));

  console.log("Running diff.mjs to generate trends from demo data...");
  execSync("node diff.mjs", { cwd: __dirname, stdio: "inherit" });

  console.log("\nDemo data generated. Remember: this is entirely synthetic placeholder data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
