// Computes week-on-week trend callouts and homepage opportunities from the two
// most recent snapshots. Safe to run after a single week too (baseline mode).
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "dashboard", "public", "data");
const SNAPSHOTS_DIR = path.join(DATA_DIR, "snapshots");
const TRENDS_DIR = path.join(DATA_DIR, "trends");

const { tags } = JSON.parse(
  readFileSync(path.join(__dirname, "src", "taxonomy.json"), "utf-8")
);
const tagLabel = Object.fromEntries(tags.map((t) => [t.id, t.label]));

const OPPORTUNITY_THRESHOLD = 0.2; // a tag counts as an opportunity once >=20% of tracked competitors show it

function loadSnapshot(weekOf) {
  return JSON.parse(readFileSync(path.join(SNAPSHOTS_DIR, `${weekOf}.json`), "utf-8"));
}

function tagPrevalence(snapshot) {
  const competitorSites = snapshot.sites.filter((s) => !s.isOwn && s.status === "ok");
  const counts = {};
  for (const tag of tags) counts[tag.id] = { count: 0, brands: [] };
  for (const site of competitorSites) {
    for (const tagId of site.tags || []) {
      counts[tagId].count += 1;
      counts[tagId].brands.push(site.name);
    }
  }
  const total = competitorSites.length || 1;
  return Object.fromEntries(
    Object.entries(counts).map(([id, v]) => [id, { ...v, pct: v.count / total }])
  );
}

function buildOpportunities(snapshot, prevalence) {
  const own = snapshot.sites.find((s) => s.isOwn);
  const ownTags = new Set(own?.tags || []);
  return Object.entries(prevalence)
    .filter(([id, v]) => v.pct >= OPPORTUNITY_THRESHOLD && !ownTags.has(id))
    .map(([id, v]) => ({
      tag: id,
      label: tagLabel[id] || id,
      prevalencePct: Math.round(v.pct * 100),
      competitorCount: v.count,
      exampleBrands: v.brands.slice(0, 6),
    }))
    .sort((a, b) => b.prevalencePct - a.prevalencePct);
}

function buildCompetitorChanges(current, previous) {
  if (!previous) return [];
  const prevBySlug = Object.fromEntries(previous.sites.map((s) => [s.slug, s]));
  const changes = [];
  for (const site of current.sites) {
    const prev = prevBySlug[site.slug];
    if (!prev || site.status !== "ok" || prev.status !== "ok") continue;
    const curTags = new Set(site.tags || []);
    const prevTags = new Set(prev.tags || []);
    const added = [...curTags].filter((t) => !prevTags.has(t));
    const removed = [...prevTags].filter((t) => !curTags.has(t));
    const heroChanged = (site.heroHeading || "") !== (prev.heroHeading || "");
    if (added.length || removed.length || heroChanged) {
      changes.push({
        slug: site.slug,
        name: site.name,
        isOwn: site.isOwn,
        tagsAdded: added.map((id) => tagLabel[id] || id),
        tagsRemoved: removed.map((id) => tagLabel[id] || id),
        heroChanged,
        previousHero: prev.heroHeading,
        currentHero: site.heroHeading,
      });
    }
  }
  return changes;
}

function buildPrevalenceDeltas(currentPrevalence, previousPrevalence) {
  if (!previousPrevalence) return [];
  return tags
    .map((tag) => {
      const cur = currentPrevalence[tag.id];
      const prev = previousPrevalence[tag.id];
      return {
        tag: tag.id,
        label: tag.label,
        currentPct: Math.round(cur.pct * 100),
        previousPct: Math.round(prev.pct * 100),
        deltaPct: Math.round((cur.pct - prev.pct) * 100),
      };
    })
    .filter((d) => d.deltaPct !== 0)
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
}

function buildNarrative({ weekOf, isBaseline, opportunities, competitorChanges, prevalenceDeltas }) {
  const bullets = [];
  if (isBaseline) {
    bullets.push(
      `Baseline captured for week of ${weekOf} — this is the first tracked week, so week-on-week trends will start appearing next Sunday.`
    );
  } else {
    for (const d of prevalenceDeltas.slice(0, 3)) {
      const dir = d.deltaPct > 0 ? "up" : "down";
      bullets.push(
        `${d.label} is trending ${dir}: ${d.currentPct}% of tracked competitors now show it (was ${d.previousPct}%).`
      );
    }
    for (const c of competitorChanges.slice(0, 5)) {
      if (c.tagsAdded.length) {
        bullets.push(`${c.name} added ${c.tagsAdded.join(", ")} to their homepage this week.`);
      }
      if (c.tagsRemoved.length) {
        bullets.push(`${c.name} dropped ${c.tagsRemoved.join(", ")} from their homepage this week.`);
      }
    }
  }
  if (opportunities.length) {
    const top = opportunities[0];
    bullets.push(
      `Biggest open opportunity: ${top.prevalencePct}% of competitors feature "${top.label}" on their homepage — Katie Loxton currently doesn't.`
    );
  }
  return bullets;
}

function main() {
  const indexPath = path.join(DATA_DIR, "index.json");
  if (!existsSync(indexPath)) {
    console.error("No index.json found — run capture.mjs first.");
    process.exit(1);
  }
  const { weeks } = JSON.parse(readFileSync(indexPath, "utf-8"));
  if (weeks.length === 0) {
    console.error("No captured weeks found.");
    process.exit(1);
  }
  const weekOf = weeks[weeks.length - 1];
  const previousWeekOf = weeks.length > 1 ? weeks[weeks.length - 2] : null;

  const current = loadSnapshot(weekOf);
  const previous = previousWeekOf ? loadSnapshot(previousWeekOf) : null;

  const currentPrevalence = tagPrevalence(current);
  const previousPrevalence = previous ? tagPrevalence(previous) : null;

  const opportunities = buildOpportunities(current, currentPrevalence);
  const competitorChanges = buildCompetitorChanges(current, previous);
  const prevalenceDeltas = buildPrevalenceDeltas(currentPrevalence, previousPrevalence);
  const isBaseline = !previous;

  const trends = {
    weekOf,
    previousWeekOf,
    isBaseline,
    generatedAt: new Date().toISOString(),
    opportunities,
    competitorChanges,
    prevalenceDeltas,
    tagPrevalence: Object.fromEntries(
      Object.entries(currentPrevalence).map(([id, v]) => [
        id,
        { count: v.count, pct: Math.round(v.pct * 100) },
      ])
    ),
    narrative: buildNarrative({ weekOf, isBaseline, opportunities, competitorChanges, prevalenceDeltas }),
  };

  mkdirSync(TRENDS_DIR, { recursive: true });
  writeFileSync(path.join(TRENDS_DIR, `${weekOf}.json`), JSON.stringify(trends, null, 2));
  writeFileSync(path.join(TRENDS_DIR, "latest.json"), JSON.stringify(trends, null, 2));

  console.log(`Trends written for week of ${weekOf}${isBaseline ? " (baseline)" : ""}.`);
  console.log(`Opportunities: ${opportunities.length}, Competitor changes: ${competitorChanges.length}`);
}

main();
