import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const issuer = "E-Life Blog";

export function createTwoFactorSecret() {
  return base32Encode(randomBytes(20));
}

export function getTwoFactorOtpAuthUri(input: { email: string; secret: string }) {
  const label = `${issuer}:${input.email}`;
  const params = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

export function verifyTotpToken(input: { secret: string; token: string; window?: number }) {
  const token = input.token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) return false;

  const secret = base32Decode(input.secret);
  const step = Math.floor(Date.now() / 1000 / 30);
  const window = input.window ?? 1;

  for (let offset = -window; offset <= window; offset += 1) {
    const expected = generateTotp(secret, step + offset);
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }

  return false;
}

function generateTotp(secret: Buffer, counter: number) {
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac("sha1", secret).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

function base32Encode(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(value: string) {
  const clean = value.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  let bits = 0;
  let current = 0;
  const bytes: number[] = [];

  for (const char of clean) {
    const index = base32Alphabet.indexOf(char);
    if (index < 0) continue;
    current = (current << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((current >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}
