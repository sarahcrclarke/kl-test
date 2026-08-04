# scraper

Playwright-based weekly capture for the competitor dashboard. Writes directly
into `../dashboard/public/data` so the PWA can serve it as static files.

## Commands

```
npm install
npm run capture   # visits every site in src/competitors.json, screenshots + tags it
npm run diff      # compares the two most recent weeks, writes trend/opportunity data
```

`capture` needs real internet access — it will not work from a
network-sandboxed environment. It's designed to run in GitHub Actions (see
`.github/workflows/weekly-capture.yml` at the repo root) where that's not a
problem.

## Demo data

`node generate-demo-data.mjs` fabricates two weeks of clearly-labeled
synthetic data (rendered mockups, not real screenshots) so the dashboard has
something to show before the first real capture runs. Safe to blow away once
real data exists:

```
rm -rf ../dashboard/public/data
npm run capture
npm run diff
```

## Editing the taxonomy or competitor list

- `src/competitors.json` — who gets tracked, and their URL/segment. `slug` is
  the stable id used across weeks; don't rename it once data has been
  captured for that competitor, or its history will start over.
- `src/taxonomy.json` — the ten homepage-signal tags and the keyword lists
  used to detect them. Keyword matching is a first draft, not ground truth —
  tune the keyword lists as you see false positives/negatives in real data.

## Local browser note

If running locally in an environment with a pre-installed Chromium at a
non-standard path (as in this session), set `PW_EXECUTABLE_PATH` to point at
it, e.g. `PW_EXECUTABLE_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
npm run capture`. GitHub Actions installs its own matching browser via
`npx playwright install --with-deps chromium` and doesn't need this.
