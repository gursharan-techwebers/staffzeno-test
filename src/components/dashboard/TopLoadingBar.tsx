"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export function TopLoadingBar() {
  const pathname = usePathname();

  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const previousPathname = React.useRef(pathname);

  /*
   * Detect when navigation has actually completed.
   */
  React.useEffect(() => {
    if (previousPathname.current === pathname) {
      return;
    }

    previousPathname.current = pathname;

    if (!loading) {
      return;
    }

    // Navigation completed.
    setProgress(100);

    const timeout = window.setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [pathname, loading]);

  /*
   * Listen for navigation start.
   */
  React.useEffect(() => {
    const handleStart = () => {
      setLoading(true);
      setProgress(10);
    };

    window.addEventListener("staffzeno:navigation-start", handleStart);

    return () => {
      window.removeEventListener("staffzeno:navigation-start", handleStart);
    };
  }, []);

  /*
   * While the page is actually loading,
   * smoothly move toward 90%.
   */
  React.useEffect(() => {
    if (!loading) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          return current;
        }

        const remaining = 90 - current;

        return current + Math.max(0.5, remaining * 0.08);
      });
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading]);

  if (!loading) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-9999 h-0.5 bg-primary transition-[width] duration-200 ease-out"
      style={{
        width: `${progress}%`,
      }}
    />
  );
}
