import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="面包屑" className="mb-6 flex flex-wrap items-center gap-2 text-sm font-black text-[color:var(--walnut)]">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-[color:var(--accent-strong)]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[color:var(--foreground)]">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="text-[color:rgb(107_93_79_/_45%)]">›</span>}
        </span>
      ))}
    </nav>
  );
}
