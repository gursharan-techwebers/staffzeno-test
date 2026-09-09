"use client";

import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";

type DashboardLinkProps = LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function DashboardLink({ onClick, ...props }: DashboardLinkProps) {
  const pathname = usePathname();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    const target = event.currentTarget;

    if (target.target === "_blank") {
      return;
    }

    const targetPathname = target.pathname;

    if (targetPathname === pathname) {
      return;
    }

    window.dispatchEvent(new CustomEvent("staffzeno:navigation-start"));
  };

  return <Link {...props} onClick={handleClick} />;
}
