import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "src/app/(main)/writing/page.tsx");
const cssPath = path.join(root, "src/app/(main)/writing/page.module.css");
const heroImagePath = path.join(root, "public/images/writing/writing-books-hero.png");

const page = fs.readFileSync(pagePath, "utf8");
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
const expectedTopics = ["海外支付", "域名邮箱", "云服网络", "福利羊毛", "OPC实战", "AI研究"];

const checks = [
  ["imports page.module.css", page.includes('import styles from "./page.module.css";')],
  ["renders writing hero", page.includes("styles.writingHero")],
  ["uses hero artwork asset", page.includes('/images/writing/writing-books-hero.png')],
  ["keeps artwork decorative", page.includes('aria-hidden="true"') && page.includes('alt=""')],
  ["defines three reading paths", page.includes("readingPaths") && ["PATH 01", "PATH 02", "PATH 03"].every((label) => page.includes(label))],
  ["defines six topics", page.includes("writingTopics") && expectedTopics.every((topic) => page.includes(`title: "${topic}"`))],
  ["renders topic article lists", page.includes("topic.articles.map")],
  ["renders recent updates", page.includes("recentUpdates") && page.includes("最近更新")],
  ["renders tag filter", page.includes("按标签筛选")],
  ["has responsive one-column media query", /@media\s*\(max-width:\s*768px\)/.test(css)],
  ["has desktop two-column topics", /\.topicGrid[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(css)],
  ["does not use global mcm-card hover cards", !page.includes("mcm-card")],
  ["hero image exists", fs.existsSync(heroImagePath)],
];

const failed = checks.filter(([, ok]) => !ok);

if (failed.length > 0) {
  console.error("Writing page verification failed:");
  for (const [label] of failed) {
    console.error(`- ${label}`);
  }
  process.exit(1);
}

console.log("Writing page static verification passed.");
