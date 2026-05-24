import type { Post } from "@/lib/content";
import type { DailyBrief, ProjectItem } from "@/lib/site-data";

export type RecommendationType = "article" | "daily" | "project" | "random";

export type Recommendation = {
  id: string;
  type: RecommendationType;
  title: string;
  description?: string;
  href: string;
  label?: string;
};

export function getGardenRecommendations({
  posts,
  ideas,
  dailyBriefs,
  projects,
}: {
  posts: Post[];
  ideas: Post[];
  dailyBriefs: DailyBrief[];
  projects: ProjectItem[];
}): Recommendation[] {
  const articleItems = posts.slice(0, 6).map((post) => ({
    id: `article-${post.slug}`,
    type: "article" as const,
    title: post.meta.title,
    description: post.meta.description,
    href: `/articles/${post.slug}`,
    label: "WRITING",
  }));

  const ideaItems = ideas.slice(0, 4).map((idea) => ({
    id: `idea-${idea.slug}`,
    type: "daily" as const,
    title: idea.meta.title,
    description: idea.meta.description || idea.content.slice(0, 72),
    href: "/ideas",
    label: "IDEA",
  }));

  const dailyItems = dailyBriefs.slice(0, 6).map((brief) => ({
    id: `daily-${brief.date}-${brief.title}`,
    type: "daily" as const,
    title: brief.title,
    description: brief.summary,
    href: "/daily",
    label: brief.date === dailyBriefs[0]?.date ? "TODAY" : "DAILY",
  }));

  const projectItems = projects.slice(0, 4).map((project) => ({
    id: `project-${project.name}`,
    type: "project" as const,
    title: project.name,
    description: project.description,
    href: "/projects",
    label: "PROJECT",
  }));

  return [...articleItems, ...dailyItems, ...ideaItems, ...projectItems];
}
