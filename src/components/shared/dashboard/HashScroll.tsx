"use client";

import { useEffect } from "react";

type HashScrollProps = {
  /**
   * Optional target ID.
   *
   * If omitted, the component uses the current URL hash.
   *
   * Examples:
   * <HashScroll />
   * <HashScroll targetId="attendance" />
   */
  targetId?: string;

  /**
   * Scroll behavior.
   */
  behavior?: ScrollBehavior;

  /**
   * How the target should be positioned in the viewport.
   */
  block?: ScrollLogicalPosition;

  /**
   * Delay before scrolling.
   *
   * Useful when the target section is rendered slightly after
   * the component mounts.
   */
  delay?: number;
};

const HashScroll = ({
  targetId,
  behavior = "smooth",
  block = "start",
  delay = 0,
}: HashScrollProps) => {
  useEffect(() => {
    const hashTarget =
      targetId ?? decodeURIComponent(window.location.hash.replace(/^#/, ""));

    if (!hashTarget) return;

    const scrollToTarget = () => {
      const element = document.getElementById(hashTarget);

      if (!element) return;

      element.scrollIntoView({
        behavior,
        block,
      });
    };

    if (delay > 0) {
      const timeout = window.setTimeout(scrollToTarget, delay);

      return () => window.clearTimeout(timeout);
    }

    const frame = window.requestAnimationFrame(scrollToTarget);

    return () => window.cancelAnimationFrame(frame);
  }, [targetId, behavior, block, delay]);

  return null;
};

export default HashScroll;
