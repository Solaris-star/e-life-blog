import Link from "next/link";
import { ArrowRight, Code } from "lucide-react";
import { projects } from "@/lib/site-data";

export default function ProjectsPage() {
  const openSource = projects.filter((project) => project.type === "开源项目");
  const demos = projects.filter((project) => project.type === "小工具 / Demo");

  return (
    <div className="space-y-10 pb-8">
      <header className="mcm-panel relative overflow-hidden p-7 md:p-10">
        <div className="absolute right-8 top-8 hidden md:block">
          <Code className="h-16 w-16 text-[color:var(--accent)]" />
        </div>
        <div className="space-y-4">
          <p className="section-kicker">Projects</p>
          <h1 className="text-4xl font-black tracking-normal text-[color:var(--foreground)] md:text-6xl">
            项目
          </h1>
          <p className="max-w-2xl leading-8 text-[color:var(--walnut)]">
            这里放开源项目、小工具和一些还在路上的 Demo。
          </p>
        </div>
      </header>

      <ProjectSection title="开源项目" items={openSource} />
      <ProjectSection title="小工具 / Demo" items={demos} />
    </div>
  );
}

function ProjectSection({
  title,
  items,
}: {
  title: string;
  items: typeof projects;
}) {
  return (
    <section className="space-y-5">
      <div>
        <p className="section-kicker">{title}</p>
        <h2 className="mt-3 text-2xl font-black text-[color:var(--foreground)]">
          {title}
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((project) => (
          <article key={project.name} className="mcm-card p-6 md:p-7">
            <h3 className="text-xl font-black text-[color:var(--foreground)]">
              {project.name}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--walnut)]">
              {project.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {project.stack.map((item) => (
                <span key={item} className="mcm-tag">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-black text-[color:var(--accent-strong)]">
              <Link href={project.githubUrl} className="inline-flex items-center gap-2">
                GitHub
                <ArrowRight className="h-4 w-4" />
              </Link>
              {project.demoUrl && (
                <Link href={project.demoUrl} className="inline-flex items-center gap-2">
                  Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
