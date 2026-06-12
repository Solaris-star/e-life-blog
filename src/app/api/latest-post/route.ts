import { NextResponse } from "next/server";
import { getPostListDescription, getPosts } from "@/lib/content";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const latest = getPosts()[0];
  if (!latest) {
    return NextResponse.json({ latest: null }, { headers: { "cache-control": "no-store" } });
  }

  return NextResponse.json(
    {
      latest: {
        slug: latest.slug,
        title: latest.meta.title,
        description: getPostListDescription(latest),
        date: latest.meta.date,
        url: `/articles/${latest.slug}`,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
