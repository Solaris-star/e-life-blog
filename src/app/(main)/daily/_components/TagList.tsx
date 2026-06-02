// ─────────────────────────────────────────────────────
// TagList — inline tags
// ─────────────────────────────────────────────────────
export function TagList({ tags, max = 4 }: { tags: string[]; max?: number }) {
  if (!tags.length) return null;
  const display = tags.slice(0, max);
  return (
    <span className="flex flex-wrap gap-1">
      {display.map((tag) => (
        <span
          key={tag}
          className="inline-block border border-[var(--line)] px-1.5 py-0 text-[12px] font-bold text-[var(--walnut)]/90"
        >
          {tag}
        </span>
      ))}
    </span>
  );
}
