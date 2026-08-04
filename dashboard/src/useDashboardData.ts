import { useEffect, useState } from "react";
import type { WeekSnapshot, TrendsData, DataIndex } from "./types";

interface DashboardData {
  snapshot: WeekSnapshot | null;
  trends: TrendsData | null;
  index: DataIndex | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardData {
  const [snapshot, setSnapshot] = useState<WeekSnapshot | null>(null);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [index, setIndex] = useState<DataIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.BASE_URL;
    Promise.all([
      fetch(`${base}data/latest.json`).then((r) => {
        if (!r.ok) throw new Error("No captured data yet");
        return r.json();
      }),
      fetch(`${base}data/trends/latest.json`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${base}data/index.json`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([snap, trend, idx]) => {
        if (cancelled) return;
        setSnapshot(snap);
        setTrends(trend);
        setIndex(idx);
      })
      .catch((err) => !cancelled && setError(String(err.message || err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { snapshot, trends, index, loading, error };
}
