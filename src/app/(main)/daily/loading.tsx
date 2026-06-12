// ─────────────────────────────────────────────────────
// DailyLoading — /daily 路由级骨架屏。
// 复古纸张面板 + 脉冲占位条（.daily-skel-bar，见 globals.css 末尾
// daily-scoped 段，reduced-motion 下静止），轮廓对齐正式页：
// Hero 时间轴 + 左主列（重磅新闻 / 分栏卡片）+ 右侧雷达栏。
// ─────────────────────────────────────────────────────

const NODES = Array.from({ length: 9 }, (_, i) => i);
const STORIES = Array.from({ length: 6 }, (_, i) => i);
const CARDS = Array.from({ length: 4 }, (_, i) => i);
const SIDE_ROWS = Array.from({ length: 6 }, (_, i) => i);

export default function DailyLoading() {
  return (
    <div
      className="mx-auto max-w-[1200px] space-y-5 px-4 pb-10 pt-4 md:px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">每日记录加载中…</span>

      {/* ═════ Hero 时间轴骨架 ═════ */}
      <header className="mcm-panel p-4 md:p-5" aria-hidden="true">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="daily-skel-bar h-3 w-28" />
            <span className="daily-skel-bar mt-3 h-7 w-52" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="daily-skel-bar h-7 w-16" />
            <span className="daily-skel-bar h-7 w-16" />
            <span className="daily-skel-bar h-7 w-16" />
          </div>
        </div>

        <span className="daily-skel-bar mt-6 h-2.5 w-full" />

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          {NODES.map((i) => (
            <span
              key={i}
              className="daily-skel-bar h-14"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      </header>

      {/* ═════ 双栏骨架 ═════ */}
      <div className="daily-grid" aria-hidden="true">
        {/* 左:重磅新闻 + 分栏卡片 */}
        <div className="daily-main-col">
          <section className="top-stories-panel">
            <div className="top-stories-head">
              <span className="daily-skel-bar h-4 w-20" />
              <span className="daily-skel-bar h-3 w-10" />
            </div>
            <div>
              {STORIES.map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 border-b border-dashed border-[color:var(--line)]/30 py-3 last:border-b-0"
                >
                  <span
                    className="daily-skel-bar h-6 w-7 shrink-0"
                    style={{ animationDelay: `${i * 110}ms` }}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <span
                      className="daily-skel-bar h-4 w-3/4"
                      style={{ animationDelay: `${i * 110}ms` }}
                    />
                    <span
                      className="daily-skel-bar h-3 w-full"
                      style={{ animationDelay: `${i * 110 + 60}ms` }}
                    />
                    <span
                      className="daily-skel-bar h-3 w-1/2"
                      style={{ animationDelay: `${i * 110 + 120}ms` }}
                    />
                  </div>
                  <span
                    className="daily-skel-bar hidden h-12 w-16 shrink-0 sm:block"
                    style={{ animationDelay: `${i * 110}ms` }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="mcm-panel p-4">
            <div className="flex flex-wrap gap-1.5">
              <span className="daily-skel-bar h-8 w-20" />
              <span className="daily-skel-bar h-8 w-20" />
              <span className="daily-skel-bar h-8 w-20" />
              <span className="daily-skel-bar h-8 w-20" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {CARDS.map((i) => (
                <div
                  key={i}
                  className="rounded-[3px] border-2 border-[color:var(--line)]/35 p-3"
                >
                  <div className="flex gap-3">
                    <span
                      className="daily-skel-bar h-10 w-10 shrink-0"
                      style={{ animationDelay: `${i * 110}ms` }}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <span
                        className="daily-skel-bar h-4 w-5/6"
                        style={{ animationDelay: `${i * 110}ms` }}
                      />
                      <span
                        className="daily-skel-bar h-3 w-full"
                        style={{ animationDelay: `${i * 110 + 60}ms` }}
                      />
                      <span
                        className="daily-skel-bar h-3 w-2/3"
                        style={{ animationDelay: `${i * 110 + 120}ms` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 右:雷达侧栏(GitHub 热门 / X 生态热点) */}
        <div className="daily-side-col">
          <aside className="space-y-3">
            {[0, 1].map((panel) => (
              <section key={panel} className="mcm-panel p-3.5">
                <div className="flex items-center justify-between">
                  <span className="daily-skel-bar h-4 w-24" />
                  <span className="daily-skel-bar h-3 w-10" />
                </div>
                <div className="mt-2">
                  {SIDE_ROWS.map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 border-b border-dashed border-[color:var(--line)]/30 py-2.5 last:border-b-0"
                    >
                      <span
                        className="daily-skel-bar is-round h-6 w-6 shrink-0"
                        style={{ animationDelay: `${i * 110}ms` }}
                      />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <span
                          className="daily-skel-bar h-3.5 w-2/3"
                          style={{ animationDelay: `${i * 110}ms` }}
                        />
                        <span
                          className="daily-skel-bar h-3 w-full"
                          style={{ animationDelay: `${i * 110 + 60}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
