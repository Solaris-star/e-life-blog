import { getIdeas } from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

export default function IdeasPage() {
  const ideas = getIdeas();

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-8">
      <header className="mcm-panel space-y-4 p-7 md:p-10">
        <p className="section-kicker">Ideas</p>
        <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
          想法 & 碎碎念
        </h1>
        <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
          一些不够写成文章的短思考、日常记录和灵感火花。
        </p>
      </header>

      <div className="space-y-6">
        {ideas.map((idea) => (
          <article
            key={idea.slug}
            className="mcm-card p-6 md:p-7"
          >
            <time dateTime={idea.meta.date} className="mb-5 block text-xs font-black uppercase text-[color:var(--walnut)]">
              {new Date(idea.meta.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time>
            <div className="post-body max-w-none space-y-4 text-base leading-8 text-[color:var(--foreground)]">
              <MDXRemote
                source={idea.content}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                  }
                }}
              />
            </div>
            {idea.meta.tags && idea.meta.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {idea.meta.tags.map(tag => (
                  <span key={tag} className="mcm-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}

        {ideas.length === 0 && (
          <div className="mcm-card py-12 text-center text-[color:var(--walnut)]">
            <p>暂无想法记录。</p>
          </div>
        )}
      </div>
    </div>
  );
}
