"use client";

import { useRef, useEffect, useCallback } from "react";

export default function Lightbox({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const close = useCallback(() => {
    const el = overlayRef.current;
    if (!el) return;
    el.classList.remove("opacity-100");
    el.classList.add("opacity-0", "pointer-events-none");
    document.body.style.overflow = "";
    setTimeout(() => {
      if (imgRef.current) {
        imgRef.current.src = "";
        imgRef.current = null;
      }
    }, 300);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [close]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG") return;

      // Skip cover image or decorative images
      const img = target as HTMLImageElement;
      if (!img.src || img.closest(".mcm-panel")) return;

      const overlay = overlayRef.current;
      if (!overlay) return;

      const overlayImg = overlay.querySelector("img");
      if (!overlayImg) return;

      overlayImg.src = img.src;
      overlayImg.alt = img.alt || "";
      imgRef.current = overlayImg;

      overlay.classList.remove("opacity-0", "pointer-events-none");
      overlay.classList.add("opacity-100");
      document.body.style.overflow = "hidden";
    },
    []
  );

  return (
    <>
      <div ref={overlayRef} onClick={close} className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/80 opacity-0 transition-opacity duration-300 pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="max-h-[90vh] max-w-[90vw] rounded-[2px] object-contain shadow-2xl"
          alt=""
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div onClick={handleClick}>
        {children}
        <style>{".post-body img:hover { cursor: zoom-in; }"}</style>
      </div>
    </>
  );
}