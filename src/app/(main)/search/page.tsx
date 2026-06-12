import { SearchClient, type SearchFilter } from "@/components/search/SearchClient";

export const dynamic = "force-dynamic";

const VALID_TYPES: readonly SearchFilter[] = ["全部", "文章", "想法", "项目", "Daily"];

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[]; type?: string | string[] }>;
}

function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type } = await searchParams;
  const initialQuery = firstParam(q).slice(0, 100);
  const rawType = firstParam(type);
  const initialType: SearchFilter = (VALID_TYPES as readonly string[]).includes(rawType)
    ? (rawType as SearchFilter)
    : "全部";

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Search</p>
        <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          搜索
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          搜索当前站内的文章、想法、项目和 Daily 简报。
        </p>
      </header>

      <SearchClient initialQuery={initialQuery} initialType={initialType} />
    </div>
  );
}
