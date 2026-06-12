import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const resourcesPagePath = join(projectRoot, "src/app/(main)/resources/page.tsx");
const linuxDoIconPath = join(projectRoot, "public/images/friends/linuxdo-icon.png");

const requiredSnippets = [
  "https://linux.do/",
  "https://invite.linuxdo.org/",
  "Linux.do",
  "L \u7ad9",
  "自助邀请码",
  "\u56fd\u5185\u76f4\u8fde\uff0c\u4e0d\u8981\u6302 VPN",
  "/images/friends/linuxdo-icon.png",
  'export const dynamic = "force-dynamic"',
];

const forbiddenSnippets = [
  "John Doe",
  "Jane Smith",
  "Olivia Explorer",
  "https://example.com",
  "UI/UX Designer and Frontend Engineer",
  "A passionate developer building awesome things",
  "自主邀请码",
  "/images/friends/linuxdo-logo.png",
];

function fail(message) {
  console.error(`[verify-friends-links] ${message}`);
  process.exit(1);
}

if (!existsSync(resourcesPagePath)) {
  fail(`Missing resources page: ${resourcesPagePath}`);
}

if (!existsSync(linuxDoIconPath)) {
  fail(`Missing Linux.do icon: ${linuxDoIconPath}`);
}

const source = readFileSync(resourcesPagePath, "utf8");

for (const snippet of requiredSnippets) {
  if (!source.includes(snippet)) {
    fail(`Resources page is missing required snippet: ${snippet}`);
  }
}

for (const snippet of forbiddenSnippets) {
  if (source.includes(snippet)) {
    fail(`Resources page still contains mock data: ${snippet}`);
  }
}

const linuxDoIconMetadata = await sharp(linuxDoIconPath).metadata();

if (linuxDoIconMetadata.format !== "png") {
  fail(`Linux.do icon must be a PNG: ${linuxDoIconPath}`);
}

if (!linuxDoIconMetadata.hasAlpha) {
  fail("Linux.do icon must use transparency instead of a white background.");
}

if (linuxDoIconMetadata.width !== linuxDoIconMetadata.height) {
  fail(
    `Linux.do icon must be square, got ${linuxDoIconMetadata.width}x${linuxDoIconMetadata.height}.`
  );
}

if ((linuxDoIconMetadata.width ?? 0) > 96 || (linuxDoIconMetadata.width ?? 0) < 32) {
  fail(
    `Linux.do icon should contain only the compact mark, got ${linuxDoIconMetadata.width}px wide.`
  );
}

console.log("[verify-resources-page] Resources page is pinned to Linux.do.");
