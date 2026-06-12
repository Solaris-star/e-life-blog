import { createHmac } from "crypto";

import type { PostAccessLevel } from "./content";

const ZW_MARKER = "\u2060\u2060";
const ZW_END = "\u2060\u200D\u2060";
const ZW_BIT_0 = "\u200C";
const ZW_BIT_1 = "\u200B";
const ZW_SEP = "\u200D";

const PROTECTED_ACCESS_LEVELS: PostAccessLevel[] = ["basic", "pro", "lifetime"];

function getWatermarkSecret() {
  const secret = process.env.CONTENT_WATERMARK_SECRET || process.env.MEMBER_AUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("CONTENT_WATERMARK_SECRET or MEMBER_AUTH_SECRET is required in production");
  }
  return secret || "local-content-watermark-secret";
}

function encodeToZeroWidth(value: string) {
  let result = ZW_MARKER;
  for (const char of value) {
    const nibble = Number.parseInt(char, 16);
    if (Number.isNaN(nibble)) continue;
    for (let bit = 3; bit >= 0; bit--) {
      result += (nibble >> bit) & 1 ? ZW_BIT_1 : ZW_BIT_0;
    }
    result += ZW_SEP;
  }
  return result + ZW_END;
}

function decodeFromZeroWidth(value: string) {
  const start = value.indexOf(ZW_MARKER);
  if (start === -1) return "";
  let index = start + ZW_MARKER.length;
  let bits = "";
  let output = "";
  while (index < value.length) {
    if (value.startsWith(ZW_END, index)) break;
    const char = value[index];
    if (char === ZW_BIT_0 || char === ZW_BIT_1) {
      bits += char === ZW_BIT_1 ? "1" : "0";
      if (bits.length === 4) {
        output += Number.parseInt(bits, 2).toString(16);
        bits = "";
      }
    }
    index += 1;
  }
  return output;
}

export function needsContentProtection(access: PostAccessLevel = "public") {
  return PROTECTED_ACCESS_LEVELS.includes(access);
}

export function createContentWatermark(input: { userId: string; slug: string }) {
  const payload = `${input.userId}:${input.slug}`;
  const digest = createHmac("sha256", getWatermarkSecret()).update(payload).digest("hex").slice(0, 32);
  return {
    digest,
    text: encodeToZeroWidth(digest),
  };
}

export function injectWatermarkIntoMarkdown(markdown: string, watermark: string) {
  if (!watermark) return markdown;
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (/^```/.test(trimmed)) {
        inFence = !inFence;
        return line;
      }
      if (inFence || !trimmed) return line;
      if (/^(#{1,6}\s|[-*+]\s|\d+\.\s|>|---|\|)/.test(trimmed)) return line;
      return `${watermark}${line}`;
    })
    .join("\n");
}

export function extractWatermark(text: string) {
  const zeroWidthChars = text.match(/[\u200B\u200C\u200D\u2060]/g);
  if (!zeroWidthChars) return "";
  return decodeFromZeroWidth(zeroWidthChars.join(""));
}
