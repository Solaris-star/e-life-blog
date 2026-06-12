"use client";

import "./admin.css";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-shell pb-10">
      <header className="admin-hero">
        <div className="space-y-4">
          <p className="admin-kicker">Error</p>
          <h1>后台加载出错</h1>
          <p>刷新页面重试，如果问题持续请检查服务日志。</p>
        </div>
      </header>
      <section className="admin-section">
        <div className="admin-panel space-y-4">
          <p className="font-mono text-sm text-[color:var(--admin-muted)]">
            {error.message || "未知错误"}
            {error.digest ? ` · ${error.digest}` : ""}
          </p>
          <button onClick={reset} className="admin-button primary">
            重试
          </button>
        </div>
      </section>
    </div>
  );
}
