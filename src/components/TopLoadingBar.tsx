"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopLoadingBar() {
  const pathname = usePathname();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const targetPathRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Ignore modified clicks
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");

      if (!href) return;

      // Ignore external links
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//")
      ) {
        return;
      }

      // Ignore anchors
      if (href.startsWith("#")) return;

      // Ignore downloads
      if (link.hasAttribute("download")) return;

      // Resolve the destination path
      const url = new URL(href, window.location.origin);

      const currentPath =
        window.location.pathname +
        window.location.search +
        window.location.hash;

      const targetPath = url.pathname + url.search + url.hash;

      // Same path → don't show loader
      if (targetPath === currentPath) {
        return;
      }

      targetPathRef.current = targetPath;

      setLoading(true);
      setProgress(10);

      // Simulate progress while Next.js navigation is happening
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setProgress((current) => {
          if (current >= 90) return current;

          const increment = current < 40 ? 15 : current < 70 ? 8 : 3;

          return Math.min(current + increment, 90);
        });
      }, 200);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pathname]);

  // Navigation completed
  useEffect(() => {
    if (!loading) return;

    const currentPath =
      window.location.pathname + window.location.search + window.location.hash;

    if (targetPathRef.current && currentPath === targetPathRef.current) {
      setProgress(100);

      const timeout = setTimeout(() => {
        setLoading(false);
        setProgress(0);
        targetPathRef.current = null;

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 200);

      return () => clearTimeout(timeout);
    }
  }, [pathname, loading]);

  if (!loading) return null;

  return (
    <div
      className="fixed left-0 top-0 z-99999 h-0.75 pointer-events-none"
      style={{
        width: `${progress}%`,
        transition: "width 200ms ease-out",
        background:
          "linear-gradient(90deg, color-mix(in oklch, var(--primary) 75%, black), var(--primary) 55%, color-mix(in oklch, var(--primary) 40%, var(--primary) 20%))",
        boxShadow:
          "0 0 6px color-mix(in oklch, var(--primary) 55%, transparent), 0 0 14px color-mix(in oklch, var(--primary) 25%, transparent)",
      }}
    />
  );
}
