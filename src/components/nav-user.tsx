"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SharedAvatar from "./shared/SharedAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { logoutUser } from "@/server/auth/logout";
import {
  ChevronsUpDownIcon,
  SparklesIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Loader from "./shared/Loader";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

type NavUserProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  organizationSlug: string;
};

export function NavUser({ user, organizationSlug }: NavUserProps) {
  const { isMobile } = useSidebar();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

  const onLogoutClick = async () => {
    try {
      setIsLoggingOut(true);
      const result = await logoutUser();

      if (!result.success) {
        toast.error("Logout Failed", {
          description:
            result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      toast.success("Logout Success", {
        description: result.message || "Logout Successfully",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout Failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isLoggingOut ? (
              <div className="w-full h-12 bg-sidebar-accent rounded-2xl flex items-center justify-center border text-sm gap-2 font-medium">
                <Loader />
                Logging out...
              </div>
            ) : (
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>
                    <SharedAvatar title={getInitials(user.name)} />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-foreground">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            {/* <DropdownMenuSeparator /> */}
            {/* <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup> */}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link
                href={`/org/${organizationSlug}/account-settings`}
              >
                <DropdownMenuItem>
                  <BadgeCheckIcon />
                  Account Settings
                </DropdownMenuItem>
              </Link>
              {/* <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogoutClick}>
              {isLoggingOut ? (
                <Loader />
              ) : (
                <>
                  <LogOutIcon />
                  Log out
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
