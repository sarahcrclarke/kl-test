// Weekly homepage capture: screenshots + text signals for every tracked competitor.
// Designed to run in GitHub Actions (needs real internet access — will not work
// from a network-sandboxed session). Writes into ../dashboard/public/data so the
// PWA can fetch it as static JSON with no backend.
import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "dashboard", "public", "data");
const SNAPSHOTS_DIR = path.join(DATA_DIR, "snapshots");
const SCREENSHOTS_DIR = path.join(DATA_DIR, "screenshots");

const { own, competitors } = JSON.parse(
  readFileSync(path.join(__dirname, "src", "competitors.json"), "utf-8")
);
const { tags } = JSON.parse(
  readFileSync(path.join(__dirname, "src", "taxonomy.json"), "utf-8")
);

const ALL_SITES = [{ ...own, isOwn: true }, ...competitors.map((c) => ({ ...c, isOwn: false }))];

function mostRecentSunday(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function applyTags(rawText) {
  const haystack = rawText.toLowerCase();
  return tags
    .filter((tag) => tag.keywords.some((kw) => haystack.includes(kw.toLowerCase())))
    .map((tag) => tag.id);
}

async function dismissCookieBanner(page) {
  const candidates = [
    'button:has-text("Accept All")',
    'button:has-text("Accept all")',
    'button:has-text("Accept")',
    'button:has-text("I Accept")',
    'button:has-text("Allow all")',
    'button:has-text("Allow All")',
    '#onetrust-accept-btn-handler',
  ];
  for (const selector of candidates) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 1500 })) {
        await el.click({ timeout: 1500 });
        await page.waitForTimeout(400);
        return;
      }
    } catch {
      // best-effort only — homepage capture still proceeds without dismissal
    }
  }
}

async function captureSite(browser, site, weekOf) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const result = {
    slug: site.slug,
    name: site.name,
    url: site.url,
    segment: site.segment,
    isOwn: !!site.isOwn,
    status: "ok",
  };

  try {
    await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await dismissCookieBanner(page);
    await page.waitForTimeout(1500); // let lazy-loaded hero content settle

    const extracted = await page.evaluate(() => {
      const title = document.title || "";
      const metaDescription =
        document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
      const navSelectors = ['header nav a', '[role="navigation"] a', 'nav a'];
      const navSet = new Set();
      for (const sel of navSelectors) {
        document.querySelectorAll(sel).forEach((a) => {
          const t = a.innerText?.trim();
          if (t && t.length < 40) navSet.add(t);
        });
        if (navSet.size > 0) break;
      }
      const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((h) => h.innerText?.trim())
        .filter(Boolean)
        .slice(0, 60);
      const bodyText = (document.body.innerText || "").slice(0, 20000);
      return {
        title,
        metaDescription,
        navL1: Array.from(navSet).slice(0, 20),
        headings,
        bodyText,
      };
    });

    const combinedText = [
      extracted.title,
      extracted.metaDescription,
      extracted.headings.join(" "),
      extracted.bodyText,
    ].join(" \n ");

    const screenshotDir = path.join(SCREENSHOTS_DIR, weekOf);
    mkdirSync(screenshotDir, { recursive: true });
    const heroPath = path.join(screenshotDir, `${site.slug}-hero.jpg`);
    const fullPath = path.join(screenshotDir, `${site.slug}-full.jpg`);
    await page.screenshot({ path: heroPath, type: "jpeg", quality: 70 });
    await page.screenshot({ path: fullPath, type: "jpeg", quality: 55, fullPage: true });

    result.title = extracted.title;
    result.metaDescription = extracted.metaDescription;
    result.navL1 = extracted.navL1;
    result.heroHeading = extracted.headings[0] || "";
    result.textSample = extracted.bodyText.slice(0, 3000);
    result.tags = applyTags(combinedText);
    result.screenshots = {
      hero: `data/screenshots/${weekOf}/${site.slug}-hero.jpg`,
      full: `data/screenshots/${weekOf}/${site.slug}-full.jpg`,
    };
  } catch (err) {
    result.status = "error";
    result.error = String(err?.message || err).slice(0, 300);
    result.tags = [];
    result.navL1 = [];
  } finally {
    await context.close();
  }
  return result;
}

async function main() {
  const weekOf = process.env.CAPTURE_WEEK_OF || mostRecentSunday(new Date());
  console.log(`Capturing homepages for week of ${weekOf} (${ALL_SITES.length} sites)`);

  mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch(
    process.env.PW_EXECUTABLE_PATH ? { executablePath: process.env.PW_EXECUTABLE_PATH } : {}
  );
  const results = [];
  for (const site of ALL_SITES) {
    process.stdout.write(`  - ${site.name}... `);
    const r = await captureSite(browser, site, weekOf);
    console.log(r.status === "ok" ? `ok (${r.tags.length} tags)` : `FAILED (${r.error})`);
    results.push(r);
  }
  await browser.close();

  const snapshot = {
    weekOf,
    capturedAt: new Date().toISOString(),
    sites: results,
  };

  const snapshotPath = path.join(SNAPSHOTS_DIR, `${weekOf}.json`);
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  writeFileSync(path.join(DATA_DIR, "latest.json"), JSON.stringify(snapshot, null, 2));

  const indexPath = path.join(DATA_DIR, "index.json");
  const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf-8")) : { weeks: [] };
  if (!index.weeks.includes(weekOf)) index.weeks.push(weekOf);
  index.weeks.sort();
  writeFileSync(indexPath, JSON.stringify(index, null, 2));

  const failed = results.filter((r) => r.status === "error");
  console.log(`\nDone. ${results.length - failed.length}/${results.length} captured successfully.`);
  if (failed.length) {
    console.log("Failed:", failed.map((f) => f.name).join(", "));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
