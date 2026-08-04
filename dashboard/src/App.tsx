import { useDashboardData } from "./useDashboardData";
import { StatTiles } from "./components/StatTiles";
import { CompetitorGrid } from "./components/CompetitorGrid";
import { TrendFeed } from "./components/TrendFeed";
import { OpportunityMatrix } from "./components/OpportunityMatrix";
import { DemoBanner } from "./components/DemoBanner";
import "./App.css";

export default function App() {
  const { snapshot, trends, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="app-status">
        <p>Loading dashboard data…</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="app-status">
        <p>Couldn't load capture data ({error || "no data"}).</p>
        <p>Run the scraper (see /scraper/README.md) to generate a snapshot.</p>
      </div>
    );
  }

  const own = snapshot.sites.find((s) => s.isOwn)!;
  const competitors = snapshot.sites.filter((s) => !s.isOwn);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Katie Loxton — Competitor Homepage Dashboard</h1>
          <p className="app-header-sub">
            Tracking {competitors.length} competitors · week of{" "}
            {new Date(snapshot.weekOf).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </header>

      {snapshot.isDemoData && <DemoBanner />}

      <main className="app-main">
        <StatTiles snapshot={snapshot} trends={trends} />
        <TrendFeed trends={trends} />
        <CompetitorGrid sites={competitors} own={own} trends={trends} />
        <OpportunityMatrix own={own} sites={competitors} trends={trends} />
      </main>

      <footer className="app-footer">
        Built for katieloxton.com · data refreshes every Sunday · tags are heuristic first-drafts, not ground truth
      </footer>
    </div>
  );
}
