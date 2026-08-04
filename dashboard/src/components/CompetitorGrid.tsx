import { useMemo, useState } from "react";
import type { SiteSnapshot, TrendsData } from "../types";
import { SEGMENT_LABELS } from "../taxonomy";
import { CompetitorCard } from "./CompetitorCard";
import { CompetitorModal } from "./CompetitorModal";

export function CompetitorGrid({
  sites,
  own,
  trends,
}: {
  sites: SiteSnapshot[];
  own: SiteSnapshot;
  trends: TrendsData | null;
}) {
  const [segment, setSegment] = useState<string>("all");
  const [selected, setSelected] = useState<SiteSnapshot | null>(null);

  const segments = useMemo(() => {
    const set = new Set(sites.map((s) => s.segment));
    return ["all", ...Array.from(set)];
  }, [sites]);

  const changedSlugs = useMemo(
    () => new Set((trends?.competitorChanges || []).map((c) => c.slug)),
    [trends]
  );

  const filtered = segment === "all" ? sites : sites.filter((s) => s.segment === segment);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Homepage snapshot</h2>
        <div className="segment-filters">
          {segments.map((seg) => (
            <button
              key={seg}
              className={`segment-filter${segment === seg ? " segment-filter--active" : ""}`}
              onClick={() => setSegment(seg)}
            >
              {seg === "all" ? "All" : SEGMENT_LABELS[seg] || seg}
            </button>
          ))}
        </div>
      </div>
      <div className="competitor-grid">
        <CompetitorCard site={own} onOpen={() => setSelected(own)} />
        {filtered.map((s) => (
          <CompetitorCard key={s.slug} site={s} onOpen={() => setSelected(s)} isNew={changedSlugs.has(s.slug)} />
        ))}
      </div>
      {selected && <CompetitorModal site={selected} own={own} onClose={() => setSelected(null)} />}
    </section>
  );
}
