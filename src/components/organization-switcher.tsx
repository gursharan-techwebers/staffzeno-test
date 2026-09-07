"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
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

import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import SharedAvatar from "./shared/SharedAvatar";
import CreateOrganizationDialog from "./organization/create-organization-dialog";
import { Spinner } from "./ui/spinner";

import { setActiveOrganizationBySlug } from "@/server/organization/setActiveOrganizationBySlug";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import Image from "next/image";

type Organization = {
  id: string;
  name: string;
  logo?: React.ReactNode;
  plan: string;
  slug: string;
};

type OrganizationSwitcherProps = {
  organizations: Organization[];
  activeOrganizationId: string;
};

export function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
}: OrganizationSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const [organizationFormOpen, setOrganizationFormOpen] = React.useState(false);

  const [isSwitching, setIsSwitching] = React.useState(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  const activeOrganization =
    organizations.find(
      (organization) => organization.id === activeOrganizationId,
    ) ?? organizations[0];

  if (!activeOrganization) {
    return null;
  }

  const handleOrganizationChange = async (organization: Organization) => {
    if (
      isSwitching ||
      isRedirecting ||
      organization.id === activeOrganization.id
    ) {
      return;
    }

    try {
      setIsSwitching(true);

      const result = await setActiveOrganizationBySlug(organization.slug);

      if (!result.success) {
        toast.error("Unable to switch organization", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        setIsSwitching(false);
        return;
      }

      // Server action succeeded.
      // Keep the loading state active while Next.js navigates.
      setIsSwitching(false);
      setIsRedirecting(true);

      router.push(`/org/${organization.slug}`);
    } catch (error) {
      console.error("[OrganizationSwitcher] switch organization error:", error);

      toast.error("Unable to switch organization", {
        description: "Something went wrong. Please try again.",
      });

      setIsSwitching(false);
    }
  };

  const handleCreateOrganization = () => {
    setOrganizationFormOpen(true);
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                disabled={isSwitching || isRedirecting}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-6 items-center justify-center rounded-full">
                  {activeOrganization.logo ? (
                    activeOrganization.logo
                  ) : (
                    <Image
                      src="/logos/icon/staffzeno_icon_blue.svg"
                      alt={activeOrganization.name}
                      width={30}
                      height={30}
                      className="w-full h-auto ml-1.5"
                    />
                  )}
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                  <span className="truncate font-medium">
                    {activeOrganization.name}
                  </span>

                  <span className="truncate text-xs text-muted-foreground ml-0.5 mt-0.5">
                    {activeOrganization.plan}
                  </span>
                </div>

                {isSwitching || isRedirecting ? (
                  <Spinner className="ml-auto size-4" />
                ) : (
                  <ChevronsUpDownIcon className="ml-auto" />
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-fit min-w-60"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Organizations
              </DropdownMenuLabel>

              {organizations.map((organization) => (
                <DropdownMenuItem
                  key={organization.id}
                  disabled={isSwitching}
                  onClick={() => handleOrganizationChange(organization)}
                  className="gap-2 px-2 py-3"
                >
                  <div className="flex size-8 items-center justify-center rounded-full border">
                    {organization.logo ? (
                      organization.logo
                    ) : (
                      <SharedAvatar title={organization.name[0]} />
                    )}
                  </div>

                  <span className="flex-1">{organization.name}</span>

                  {organization.id === activeOrganization.id && (
                    <Badge variant={"outline"}>Active</Badge>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="gap-0 p-2"
                onSelect={handleCreateOrganization}
              >
                <Button size={"icon"} variant={"ghost"}>
                  <PlusIcon />
                </Button>

                <div className="font-medium text-muted-foreground">
                  Create new organization
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateOrganizationDialog
        open={organizationFormOpen}
        onOpenChange={setOrganizationFormOpen}
      />
    </>
  );
}
