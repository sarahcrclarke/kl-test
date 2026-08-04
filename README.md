# Katie Loxton — Competitor Homepage Dashboard

An installable PWA that tracks what Katie Loxton and ~27 competitors are
featuring on their homepages, week on week (Sunday–Saturday), and surfaces
trends and gaps at a glance.

## How it works

- **`/scraper`** — a Playwright script that visits every tracked homepage,
  screenshots it, extracts signals (nav categories, hero copy, headings, body
  text down to the footer), and tags each capture against a shared taxonomy
  (Sale/Promo, New-In, Bestsellers, Gifting, Personalisation, Social Proof,
  Sustainability, Loyalty, Free Shipping, Editorial) using keyword heuristics.
  A second script (`diff.mjs`) compares this week's capture to last week's and
  writes trend callouts + an opportunity list (tactics competitors use that
  Katie Loxton's homepage currently doesn't).
- **`.github/workflows/weekly-capture.yml`** — runs the scraper every Sunday
  at 06:00 UTC (and on-demand via "Run workflow"), then commits the refreshed
  data straight into `dashboard/public/data`.
- **`/dashboard`** — a React + Vite PWA that reads that static JSON/screenshot
  data. No backend, no API keys, installable to your phone or desktop.

## Why demo data ships in this branch

The scraper needs normal internet access to reach competitor sites, which the
session that built this doesn't have (sandboxed to an allowlist of dev
infra). So `dashboard/public/data` currently contains **synthetic placeholder
data** — clearly labeled in the UI with a banner — so the dashboard is fully
functional to review today. The moment the weekly capture workflow runs for
real (merge to the default branch + wait for Sunday, or trigger it manually
from the Actions tab), it overwrites the demo data with real captures.

To regenerate demo data locally: `cd scraper && npm install && npm run
capture` won't work outside real internet access, but `node
generate-demo-data.mjs` will (see `/scraper` README).

## Local development

```
cd dashboard
npm install
npm run dev
```

## Before the first live capture

Open `scraper/src/competitors.json` and double check the URLs — several are
best-guess UK storefronts and a few brands (J.Crew, Beis, Coach) may not have
a dedicated UK site.

## Roadmap

This is v1: homepage snapshot + trends + opportunity matrix. Next phase
(explicitly deferred): SEO signals — meta/title patterns, on-page keyword
targeting, structured data presence, etc. — layered onto the same weekly
capture pipeline.
