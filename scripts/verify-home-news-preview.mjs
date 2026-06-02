import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const homePath = path.join(root, "src/app/(main)/page.tsx");
const dailyDataPath = path.join(root, "src/lib/daily/getRadarData.ts");

const home = fs.readFileSync(homePath, "utf8");
const dailyData = fs.existsSync(dailyDataPath) ? fs.readFileSync(dailyDataPath, "utf8") : "";

const checks = [
  ["shared radar helper exists", fs.existsSync(dailyDataPath)],
  ["helper normalizes daily brief", dailyData.includes("normalizeDailyBrief")],
  ["home imports getRadarData", home.includes('import { getRadarData } from "@/lib/daily/getRadarData";')],
  ["home imports TopStoryItem type", home.includes("TopStoryItem") && home.includes("./daily/types")],
  ["home no longer imports static dailyBriefs", !home.includes("dailyBriefs")],
  ["home component is async", home.includes("export default async function Home()")],
  ["home reads top stories", home.includes("radar?.sections.top_stories.slice(0, 3)")],
  ["DailyPreview accepts top stories", home.includes("function DailyPreview({ stories }: { stories: TopStoryItem[] })")],
  ["Daily section links to news", home.includes('href="/news"') && home.includes('linkText="查看全部"')],
  ["Daily section title remains", home.includes('title="Daily / 近期记录"')],
  ["Daily cards use story URL fallback", home.includes("item.url || \"/news\"")],
];

const failed = checks.filter(([, ok]) => !ok);

if (failed.length > 0) {
  console.error("Home news preview verification failed:");
  for (const [label] of failed) {
    console.error(`- ${label}`);
  }
  process.exit(1);
}

console.log("Home news preview static verification passed.");
