"use client";

import {
  BellIcon,
  Building2Icon,
  CalendarClockIcon,
  ClipboardListIcon,
  KeyRoundIcon,
  LockIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const icons = {
  bell: BellIcon,
  building: Building2Icon,
  calendar: CalendarClockIcon,
  clipboard: ClipboardListIcon,
  key: KeyRoundIcon,
  lock: LockIcon,
  shield: ShieldCheckIcon,
  user: UserIcon,
  warning: TriangleAlertIcon,
} satisfies Record<string, LucideIcon>;

export type SettingsSidebarItem = {
  id: string;
  label: string;
  icon: keyof typeof icons;
  danger?: boolean;
};

type SettingsSidebarProps = {
  title?: string;
  items: SettingsSidebarItem[];
};

const SettingsSidebar = ({
  title = "Settings",
  items,
}: SettingsSidebarProps) => {
  const [activeSection, setActiveSection] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) {
      return;
    }

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [items]);

  return (
    <aside className="sticky top-6 hidden w-56 shrink-0 self-start md:block">
      <div className="w-full">
        <div className="mb-3 px-3">
          <p className="text-sm font-semibold">{title}</p>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = icons[item.icon];
            const isActive = activeSection === item.id;

            return (
              <Link
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={[
                  "flex w-full items-center gap-2 rounded-md px-3 py-2",
                  "text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? item.danger
                      ? "bg-destructive/10 font-medium text-destructive"
                      : "bg-muted font-medium text-foreground"
                    : item.danger
                      ? "text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                ].join(" ")}
              >
                <Icon className="size-4 shrink-0" />

                <span className="truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default SettingsSidebar;