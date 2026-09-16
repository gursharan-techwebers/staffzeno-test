"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  GroupLabel,
  items,
}: {
  GroupLabel: string;
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    exact?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const pathname = usePathname();

  const allUrls = items.flatMap((item) => [
    item.url,
    ...(item.items?.map((subItem) => subItem.url) ?? []),
  ]);

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }

    if (pathname === href) {
      return true;
    }

    if (!pathname.startsWith(`${href}/`)) {
      return false;
    }

    // If another sidebar URL is a more specific match,
    // this URL should not be active.
    const hasMoreSpecificMatch = allUrls.some(
      (url) =>
        url !== href &&
        url.startsWith(`${href}/`) &&
        (pathname === url || pathname.startsWith(`${url}/`)),
    );

    return !hasMoreSpecificMatch;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{GroupLabel}</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const hasItems = !!item.items?.length;

          if (!hasItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link
                    href={item.url}
                    onClick={handleNavClick}
                    className={
                      isActive(item.url, item.exact) ? "text-primary" : ""
                    }
                  >
                    {isActive(item.url, item.exact) && (
                      <span className="h-5 w-0.5 shrink-0 bg-primary animate-in fade-in slide-in-from-left-2 duration-200" />
                    )}
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon}
                    <span>{item.title}</span>

                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link
                            href={subItem.url}
                            onClick={handleNavClick}
                            className={
                              isActive(subItem.url) ? "text-primary" : ""
                            }
                          >
                            {isActive(subItem.url) && (
                              <span className="h-5 w-0.5 shrink-0 bg-primary animate-in fade-in slide-in-from-left-2 duration-200" />
                            )}
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
