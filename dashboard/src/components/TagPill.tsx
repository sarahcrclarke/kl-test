import type { TagId } from "../types";
import { TAG_META } from "../taxonomy";

export function TagPill({ tag, muted }: { tag: TagId; muted?: boolean }) {
  const meta = TAG_META[tag];
  if (!meta) return null;
  return (
    <span
      className="tag-pill"
      style={
        muted
          ? undefined
          : ({ "--pill-color": meta.color } as React.CSSProperties)
      }
      data-muted={muted || undefined}
    >
      {meta.label}
    </span>
  );
}
