import { createHash, createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const envFile = join(process.cwd(), ".env.edgeone");

if (existsSync(envFile)) {
  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const endpoint = "teo.tencentcloudapi.com";
const service = "teo";
const version = "2022-09-01";
const action = "CreatePurgeTask";
const algorithm = "TC3-HMAC-SHA256";
const timestamp = Math.floor(Date.now() / 1000);
const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

const secretId = process.env.TENCENTCLOUD_SECRET_ID;
const secretKey = process.env.TENCENTCLOUD_SECRET_KEY;
const zoneId = process.env.EDGEONE_ZONE_ID;
const domain = process.env.EDGEONE_PURGE_DOMAIN ?? "blog.sovoice.asia";
const purgeType = process.env.EDGEONE_PURGE_TYPE ?? "purge_host";
const targets = (process.env.EDGEONE_PURGE_TARGETS ?? domain)
  .split(",")
  .map((target) => target.trim())
  .filter(Boolean);

function hmac(key, content, encoding) {
  return createHmac("sha256", key).update(content).digest(encoding);
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function fail(message) {
  console.error(`[purge-edgeone-cache] ${message}`);
  process.exit(1);
}

if (!zoneId) {
  fail("Missing EDGEONE_ZONE_ID.");
}

if (!targets.length) {
  fail("Missing purge targets. Set EDGEONE_PURGE_TARGETS or EDGEONE_PURGE_DOMAIN.");
}

const payload = JSON.stringify({
  ZoneId: zoneId,
  Type: purgeType,
  Targets: targets,
});

console.log(`[purge-edgeone-cache] action=${action}`);
console.log(`[purge-edgeone-cache] type=${purgeType}`);
console.log(`[purge-edgeone-cache] targets=${targets.join(", ")}`);

if (dryRun) {
  console.log(`[purge-edgeone-cache] dry-run payload=${payload}`);
  process.exit(0);
}

if (!secretId || !secretKey) {
  fail("Missing TENCENTCLOUD_SECRET_ID or TENCENTCLOUD_SECRET_KEY.");
}

const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${endpoint}\nx-tc-action:${action.toLowerCase()}\n`;
const signedHeaders = "content-type;host;x-tc-action";
const canonicalRequest = [
  "POST",
  "/",
  "",
  canonicalHeaders,
  signedHeaders,
  sha256(payload),
].join("\n");
const credentialScope = `${date}/${service}/tc3_request`;
const stringToSign = [
  algorithm,
  String(timestamp),
  credentialScope,
  sha256(canonicalRequest),
].join("\n");
const secretDate = hmac(`TC3${secretKey}`, date);
const secretService = hmac(secretDate, service);
const secretSigning = hmac(secretService, "tc3_request");
const signature = hmac(secretSigning, stringToSign, "hex");
const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

const response = await fetch(`https://${endpoint}`, {
  method: "POST",
  headers: {
    Authorization: authorization,
    "Content-Type": "application/json; charset=utf-8",
    Host: endpoint,
    "X-TC-Action": action,
    "X-TC-Timestamp": String(timestamp),
    "X-TC-Version": version,
  },
  body: payload,
});

const result = await response.json().catch(() => null);

if (!response.ok || result?.Response?.Error) {
  console.error("[purge-edgeone-cache] purge failed:");
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log("[purge-edgeone-cache] purge submitted:");
console.log(JSON.stringify(result, null, 2));
