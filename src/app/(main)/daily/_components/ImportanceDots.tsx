// ─────────────────────────────────────────────────────
// ImportanceDots — visual importance indicator
// ─────────────────────────────────────────────────────
export function ImportanceDots({ level }: { level: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(level)));
  return (
    <span className="inline-flex gap-[3px]" title={`重要度 ${clamped}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`inline-block h-[6px] w-[6px] ${
            i <= clamped
              ? "bg-[var(--accent)]"
              : "bg-[var(--line)]"
          }`}
        />
      ))}
    </span>
  );
}
