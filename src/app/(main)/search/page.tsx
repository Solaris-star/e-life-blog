import { getIdeas, getPosts } from "@/lib/content";
import { dailyBriefs, projects } from "@/lib/site-data";
import { SearchClient, SearchItem } from "@/components/search/SearchClient";

export default function SearchPage() {
  const posts = getPosts();
  const ideas = getIdeas();

  const items: SearchItem[] = [
    ...posts.map((post) => ({
      title: post.meta.title,
      description: post.meta.description || post.content.slice(0, 120),
      href: `/articles/${post.slug}`,
      type: "文章" as const,
      tags: post.meta.tags,
    })),
    ...ideas.map((idea) => ({
      title: idea.meta.title,
      description: idea.meta.description || idea.content.slice(0, 120),
      href: "/ideas",
      type: "想法" as const,
      tags: idea.meta.tags,
    })),
    ...projects.map((project) => ({
      title: project.name,
      description: project.description,
      href: "/projects",
      type: "项目" as const,
      tags: project.stack,
    })),
    ...dailyBriefs.map((brief) => ({
      title: brief.title,
      description: `${brief.summary} ${brief.comment}`,
      href: "/daily",
      type: "Daily" as const,
      tags: [brief.category, brief.sourceName],
    })),
  ];

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

      <SearchClient items={items} />
    </div>
  );
}
