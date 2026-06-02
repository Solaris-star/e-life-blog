// ─────────────────────────────────────────────────────
// brandIcon — derive a brand/entity icon from an item's URL.
// Pure, server-safe helpers (no DOM, no Math.random).
//
// Icons come from public favicon / avatar endpoints (browser-side
// <img> fetch, cached by the browser). When resolution fails the UI
// falls back to a deterministic monogram tile (see monogram()).
// ─────────────────────────────────────────────────────

/** Hostname without the leading "www.", or null when the URL is unusable. */
export function domainOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Google's favicon service — free, keyless, well cached. */
export function faviconUrl(
  url: string | undefined | null,
  size = 128,
): string | null {
  const domain = domainOf(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

/** GitHub serves org/user avatars directly at github.com/<login>.png. */
export function githubAvatarUrl(
  owner: string | undefined | null,
  size = 80,
): string | null {
  if (!owner) return null;
  const login = owner.trim().replace(/^@/, "").split("/")[0];
  if (!login) return null;
  return `https://github.com/${encodeURIComponent(login)}.png?size=${size}`;
}

/**
 * Deterministic fallback tile content for when no icon resolves.
 * `variant` (0–4) selects a retro tint class defined in globals.css,
 * so colors stay theme-aware while still varying per entity.
 */
export function monogram(name: string | undefined | null): {
  letter: string;
  variant: number;
} {
  const trimmed = (name ?? "").trim();
  const letter = trimmed ? trimmed[0].toUpperCase() : "·";
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }
  return { letter, variant: Math.abs(hash) % 5 };
}
