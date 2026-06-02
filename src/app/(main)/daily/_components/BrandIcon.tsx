"use client";

// ─────────────────────────────────────────────────────
// BrandIcon — small brand/entity icon with graceful fallback.
// Renders a favicon/avatar <img>; on load error swaps to a
// deterministic monogram tile so a row never shows a broken image.
// Decorative (aria-hidden) — the adjacent title link carries meaning.
// ─────────────────────────────────────────────────────
import { useState } from "react";
import { monogram } from "@/lib/daily/brandIcon";

export function BrandIcon({
  src,
  name,
  size = 36,
  rounded = false,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  rounded?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;
  const { letter, variant } = monogram(name);

  const cls = [
    "brand-icon",
    rounded ? "is-round" : "",
    showImg ? "" : `brand-icon-fallback bif--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} style={{ width: size, height: size }} aria-hidden="true">
      {showImg ? (
        <img
          src={src as string}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        letter
      )}
    </span>
  );
}
