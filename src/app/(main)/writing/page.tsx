import Link from "next/link";
import { getAllTags, getPosts } from "@/lib/content";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const readingPaths = [
  {
    eyebrow: "PATH 01",
    title: "先解决订阅支付",
    description: "从海外支付、虚拟卡和订阅账号准备开始，先把工具使用成本降下来。",
    href: "/tags/海外支付",
  },
  {
    eyebrow: "PATH 02",
    title: "再整理账号体系",
    description: "域名邮箱、云服网络和基础服务是长期稳定使用各类工具的底座。",
    href: "/tags/域名邮箱",
  },
  {
    eyebrow: "PATH 03",
    title: "最后跟 AI 与羊毛",
    description: "集中看福利羊毛、AI 研究和 OPC 实战，把零散机会整理成可执行清单。",
    href: "/tags/AI研究",
  },
];

const writingTopics = [
  {
    title: "海外支付",
    description: "海外账户、虚拟卡、订阅支付和风控注意事项，按实际开通流程整理。",
    articles: [
      { title: "Fiat24 注册教程（已失效，6月5日关停）", href: "/articles/fiat24" },
      { title: "Bybit Card 虚拟卡开卡教程", href: "/articles/bybit-card" },
    ],
  },
  {
    title: "域名邮箱",
    description: "域名注册、邮箱账号、别名体系和长期账号资产管理。",
    articles: [
      { title: "免费域名盘点总结（2026版）", href: "/articles/free-domain-list" },
    ],
  },
  {
    title: "云服网络",
    description: "VPS、Cloudflare、自建服务、网络配置和部署过程中的实践记录。",
    articles: [
      { title: "免费容器和类 VPS 平台推荐：能跑服务、能建站、能部署小项目", href: "/articles/free-container-vps-platforms" },
    ],
  },
  {
    title: "福利羊毛",
    description: "优惠额度、免费试用、低成本方案和活动线索，先记录再筛选。",
    articles: [
      { title: "每月白嫖 ChatGPT Plus", href: "/articles/free-gpt-plus" },
      { title: "Agnes AI 免费 API", href: "/articles/agnes-free-api" },
      { title: "Sourceful Riverflow V2.5 OpenRouter 免费 AI 画图", href: "/articles/sourceful-riverflow-v25-openrouter-free-image" },
    ],
  },
  {
    title: "OPC实战",
    description: "OPC 清单、流程、复盘和执行笔记，保留可以重复使用的方法。",
    articles: [],
  },
  {
    title: "AI研究",
    description: "AI 工具、Agent、模型能力、多模态 API 和可复用工作流研究。",
    articles: [],
  },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function pickTopic(tags: string[] | undefined) {
  const normalizedTags = tags?.map((tag) => tag.toLowerCase()) ?? [];

  // 优先判断福利羊毛（避免被"虚拟卡"误判为海外支付）
  if (normalizedTags.some((tag) => ["福利羊毛", "免费", "免费api", "gpt plus"].includes(tag))) {
    return "福利羊毛";
  }

  // 优先判断域名邮箱（避免 cloudflare 邮箱被误判为云服网络）
  if (normalizedTags.some((tag) => ["域名邮箱", "邮箱", "域名", "临时邮箱"].includes(tag))) {
    return "域名邮箱";
  }

  if (normalizedTags.some((tag) => ["海外支付", "fiat24", "bybit", "虚拟卡"].includes(tag))) {
    return "海外支付";
  }

  if (normalizedTags.some((tag) => ["云服网络", "vps", "cloudflare", "windows", "tips"].includes(tag))) {
    return "云服网络";
  }

  if (normalizedTags.some((tag) => ["opc实战", "opc"].includes(tag))) {
    return "OPC实战";
  }

  if (normalizedTags.some((tag) => ["ai研究", "chatgpt", "agnesai", "图片生成", "视频生成", "多模态"].includes(tag))) {
    return "AI研究";
  }

  return "AI研究";
}

export default function WritingPage() {
  const posts = getPosts();
  const tags = getAllTags();
  const recentUpdates = posts
    .map((post) => ({
      title: post.meta.title,
      date: post.meta.date,
      href: `/articles/${post.slug}`,
      topic: pickTopic(post.meta.tags),
      type: "文章",
    }))
    .sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1))
    .slice(0, 6);

  return (
    <main className={styles.writingPage}>
      <section className={styles.writingHero}>
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>{"// WRITING"}</div>
          <h1>写作</h1>
          <p>按海外支付、域名邮箱、云服网络、福利羊毛、OPC 实战和 AI 研究六个方向整理长期文章。</p>
          <div className={styles.heroActions}>
            <a href="#paths">从海外支付开始 →</a>
            <a href="#topics">看 AI 研究</a>
            <Link href="/articles">浏览全部文章</Link>
          </div>
        </div>

        <div className={styles.heroArtwork} aria-hidden="true">
          <img
            src="/images/writing/writing-books-hero.png"
            alt=""
            className={styles.heroArtworkImage}
          />
        </div>
      </section>

      <section id="paths" className={styles.sectionBlock} aria-labelledby="paths-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>Reading Paths</p>
          <h2 id="paths-title">推荐阅读路径</h2>
        </div>
        <div className={styles.pathGrid}>
          {readingPaths.map((path) => (
            <Link key={path.title} href={path.href} className={styles.pathCard}>
              <span>{path.eyebrow}</span>
              <h3>{path.title}</h3>
              <p>{path.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="recent-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>Latest</p>
          <h2 id="recent-title">最近更新</h2>
        </div>
        <div className={styles.recentList}>
          {recentUpdates.map((item) => (
            <Link
              key={`${item.type}-${item.href}-${item.date}`}
              href={item.href}
              className={styles.recentItem}
            >
              <time dateTime={item.date}>{formatDate(item.date)}</time>
              <strong>{item.title}</strong>
              <span>{item.topic}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="topics" className={styles.sectionBlock} aria-labelledby="topics-title">
        <div className={styles.sectionHeader}>
          <p className={styles.sectionKicker}>Topics</p>
          <h2 id="topics-title">写作专题</h2>
        </div>
        <div className={styles.topicGrid}>
          {writingTopics.map((topic) => (
            <article key={topic.title} className={styles.topicCard}>
              <div>
                <p className={styles.topicLabel}>专题</p>
                <h3>{topic.title}</h3>
                <p className={styles.topicDescription}>{topic.description}</p>
              </div>
              {topic.articles.length > 0 && (
                <>
                <ul className={styles.articleList}>
                {topic.articles.map((article) => (
                  <li key={`${topic.title}-${article.href}-${article.title}`}>
                    <Link href={article.href}>{article.title}</Link>
                  </li>
                ))}
              </ul>
                </>
              )}
              <Link className={styles.topicButton} href={`/tags/${topic.title}`}>
                进入专题
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.tagPanel} aria-labelledby="tags-title">
        <div>
          <p className={styles.sectionKicker}>Tags</p>
          <h2 id="tags-title">按标签筛选</h2>
        </div>
        <div className={styles.tagList}>
          {tags.map((tag) => (
            <Link key={tag} href={`/tags/${tag}`}>
              #{tag}
            </Link>
          ))}
          {tags.length === 0 && <p>暂无标签。</p>}
        </div>
      </section>
    </main>
  );
}
