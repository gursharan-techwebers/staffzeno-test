"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export function TopLoadingBar() {
  const pathname = usePathname();

  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const previousPathname = React.useRef(pathname);
  const animationFrame = React.useRef<number | null>(null);

  /*
   * Smoothly animate progress while navigation is loading.
   */
  React.useEffect(() => {
    if (!loading) {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }

      return;
    }

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      setProgress((current) => {
        if (current >= 90) {
          return current;
        }

        const remaining = 90 - current;

        // Progress gets slower as it approaches 90%.
        const speed = Math.max(0.002, remaining * 0.0008);

        return Math.min(current + speed * delta, 90);
      });

      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
    };
  }, [loading]);

  /*
   * Detect when navigation has completed.
   */
  React.useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;

    if (!loading) {
      return;
    }

    // Finish the progress smoothly.
    setProgress(100);

    const hideTimeout = window.setTimeout(() => {
      setLoading(false);

      const resetTimeout = window.setTimeout(() => {
        setProgress(0);
      }, 150);

      return () => window.clearTimeout(resetTimeout);
    }, 350);

    return () => window.clearTimeout(hideTimeout);
  }, [pathname, loading]);

  /*
   * Listen for navigation start.
   */
  React.useEffect(() => {
    const handleStart = () => {
      setLoading(true);
      setProgress(0);

      // Smoothly move away from 0 instead of jumping immediately.
      requestAnimationFrame(() => {
        setProgress(12);
      });
    };

    window.addEventListener("staffzeno:navigation-start", handleStart);

    return () => {
      window.removeEventListener("staffzeno:navigation-start", handleStart);
    };
  }, []);

  if (!loading && progress === 0) {
    return null;
  }

  return (
    <div
      className="
        pointer-events-none
        fixed
        inset-x-0
        top-0
        z-9999
        h-0.5
        overflow-hidden
      "
    >
      <div
        className="
          relative
          h-full
          bg-primary
          transition-[width]
          duration-300
          ease-out
          shadow-[0_0_8px_var(--primary)]
        "
        style={{
          width: `${progress}%`,
        }}
      >
        {/* Moving highlight */}
        <div
          className="
            absolute
            inset-y-0
            right-0
            w-24
            translate-x-full
            animate-[loading-shine_1.4s_ease-in-out_infinite]
            bg-linear-to-r
            from-transparent
            via-white/50
            to-transparent
          "
        />
      </div>
    </div>
  );
}
