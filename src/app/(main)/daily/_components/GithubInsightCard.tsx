import type { GithubInsight } from "../types";

export function GithubInsightCard({
  insight,
  fallback,
}: {
  insight?: GithubInsight;
  fallback?: string;
}) {
  const summary = (fallback || insight?.core || "").trim();
  if (!summary) return null;

  return (
    <div className="ai-note ai-note--compact" data-style="github">
      <p className="ai-note-kicker">README 概括</p>
      <p className="ai-note-lead">{summary}</p>
    </div>
  );
}
