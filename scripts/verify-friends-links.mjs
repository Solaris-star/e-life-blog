import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const friendsPagePath = join(projectRoot, "src/app/(main)/friends/page.tsx");
const linuxDoLogoPath = join(projectRoot, "public/images/friends/linuxdo-logo.png");

const requiredSnippets = [
  "https://linux.do/",
  "https://invite.linuxdo.org/",
  "Linux.do",
  "L \u7ad9",
  "\u56fd\u5185\u76f4\u8fde\uff0c\u4e0d\u8981\u6302 VPN",
  'export const dynamic = "force-dynamic"',
];

const forbiddenSnippets = [
  "John Doe",
  "Jane Smith",
  "Olivia Explorer",
  "https://example.com",
  "UI/UX Designer and Frontend Engineer",
  "A passionate developer building awesome things",
];

function fail(message) {
  console.error(`[verify-friends-links] ${message}`);
  process.exit(1);
}

if (!existsSync(friendsPagePath)) {
  fail(`Missing friends page: ${friendsPagePath}`);
}

if (!existsSync(linuxDoLogoPath)) {
  fail(`Missing Linux.do logo: ${linuxDoLogoPath}`);
}

const source = readFileSync(friendsPagePath, "utf8");

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    fail(`Friends page is missing required snippet: ${snippet}`);
  }
}

for (const snippet of forbiddenSnippets) {
  if (source.includes(snippet)) {
    fail(`Friends page still contains mock data: ${snippet}`);
  }
}

console.log("[verify-friends-links] Friends page is pinned to Linux.do.");
