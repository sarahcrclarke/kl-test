import type { TrendsData, WeekSnapshot } from "../types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function StatTiles({ snapshot, trends }: { snapshot: WeekSnapshot; trends: TrendsData | null }) {
  const trackedCount = snapshot.sites.filter((s) => !s.isOwn).length;
  const failedCount = snapshot.sites.filter((s) => s.status === "error").length;
  const trendSignals = trends ? trends.narrative.length : 0;
  const opportunityCount = trends ? trends.opportunities.length : 0;

  const tiles = [
    { label: "Competitors Tracked", value: String(trackedCount), sub: failedCount ? `${failedCount} failed to capture` : "all captured" },
    { label: "Trend Signals This Week", value: String(trendSignals), sub: trends?.isBaseline ? "baseline week" : "vs last week" },
    { label: "Open Opportunities", value: String(opportunityCount), sub: "gaps vs. competitors" },
    { label: "Last Captured", value: formatDate(snapshot.capturedAt), sub: `week of ${formatDate(snapshot.weekOf)}` },
  ];

  return (
    <div className="stat-tiles">
      {tiles.map((t) => (
        <div className="stat-tile" key={t.label}>
          <div className="stat-tile-value">{t.value}</div>
          <div className="stat-tile-label">{t.label}</div>
          <div className="stat-tile-sub">{t.sub}</div>
        </div>
      ))}
    </div>
  );
}
