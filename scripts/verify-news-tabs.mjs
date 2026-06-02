import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tabsPath = path.join(root, "src/app/(main)/daily/_components/TabbedSections.tsx");
const dailyPath = path.join(root, "src/app/(main)/daily/page.tsx");
const newsPath = path.join(root, "src/app/(main)/news/page.tsx");

const tabs = fs.readFileSync(tabsPath, "utf8");
const daily = fs.readFileSync(dailyPath, "utf8");
const news = fs.readFileSync(newsPath, "utf8");

const checks = [
  ["news reuses daily page", news.includes('export { default } from "../daily/page";')],
  ["tab component exists", tabs.includes("TabbedSections")],
  ["risk tab removed", !tabs.includes("风险与争议")],
  ["only three tabs remain", (tabs.match(/key: "tools"|key: "research"|key: "business"/g) ?? []).length === 3],
  ["daily page still renders tabbed sections", daily.includes("<TabbedSections sections={sections} />")],
];

const failed = checks.filter(([, ok]) => !ok);

if (failed.length > 0) {
  console.error("News tabs verification failed:");
  for (const [label] of failed) {
    console.error(`- ${label}`);
  }
  process.exit(1);
}

console.log("News tabs static verification passed.");
