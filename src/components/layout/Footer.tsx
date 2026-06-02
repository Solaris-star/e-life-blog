export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="shell-container border-x-[3px] border-t-[3px] border-[color:var(--line)] bg-[color:var(--foreground)] px-4 py-5 text-[color:var(--paper-light)] md:px-6">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 border border-[color:var(--paper-light)] bg-[color:var(--accent)]" />
            <p className="mono-label text-sm font-bold">
              © 2026 我的博客
            </p>
          </div>
          <p className="max-w-md text-sm font-bold leading-6 text-[color:var(--paper-light)]/85">
            记录技术、生活与思考，也保留一点复古的松弛和热气。
          </p>
        </div>
      </div>
    </footer>
  );
}
