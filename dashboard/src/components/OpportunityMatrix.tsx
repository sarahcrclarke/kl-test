import type { SiteSnapshot, TrendsData } from "../types";
import { TAG_ORDER, TAG_META } from "../taxonomy";

const OPPORTUNITY_THRESHOLD = 20; // matches scraper/diff.mjs OPPORTUNITY_THRESHOLD (as a %)

export function OpportunityMatrix({
  own,
  sites,
  trends,
}: {
  own: SiteSnapshot;
  sites: SiteSnapshot[];
  trends: TrendsData | null;
}) {
  const okSites = sites.filter((s) => s.status === "ok");
  const rows = [own, ...okSites];

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Opportunity matrix</h2>
        <p className="panel-desc">
          Which homepage tactics each brand uses. Your row is pinned at the top — an amber dot marks a
          tactic at least {OPPORTUNITY_THRESHOLD}% of competitors use that you don't.
        </p>
      </div>
      <div className="matrix-scroll">
        <table className="matrix">
          <thead>
            <tr>
              <th className="matrix-corner">Brand</th>
              {TAG_ORDER.map((tag) => (
                <th key={tag} title={TAG_META[tag].label}>
                  <span className="matrix-col-label">{TAG_META[tag].label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((site) => (
              <tr key={site.slug} className={site.isOwn ? "matrix-row--own" : undefined}>
                <th className="matrix-row-label">
                  {site.name}
                  {site.isOwn && <span className="badge badge--own badge--inline">You</span>}
                </th>
                {TAG_ORDER.map((tag) => {
                  const has = site.tags.includes(tag);
                  const prevalence = trends?.tagPrevalence?.[tag]?.pct ?? 0;
                  const isGap = site.isOwn && !has && prevalence >= OPPORTUNITY_THRESHOLD;
                  return (
                    <td key={tag} className="matrix-cell">
                      {has && (
                        <span
                          className="matrix-dot"
                          style={{ background: TAG_META[tag].color }}
                          title={`${site.name}: ${TAG_META[tag].label}`}
                        />
                      )}
                      {isGap && (
                        <span
                          className="matrix-gap"
                          title={`Opportunity: ${prevalence}% of competitors use ${TAG_META[tag].label}`}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="matrix-row--prevalence">
              <th className="matrix-row-label">% of competitors</th>
              {TAG_ORDER.map((tag) => (
                <td key={tag} className="matrix-cell matrix-cell--prevalence">
                  {trends?.tagPrevalence?.[tag]?.pct ?? 0}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
