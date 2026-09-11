"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { OrganizationSwitcher } from "@/components/organization-switcher";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  Settings2Icon,
  LayoutDashboardIcon,
  Clock3Icon,
  CalendarDaysIcon,
  WalletCardsIcon,
  CalendarIcon,
  UsersIcon,
  ChartNoAxesCombinedIcon,
  NetworkIcon,
} from "lucide-react";
import { SidebarTeam } from "@/server/team/getSidebarTeams";

type User = {
  name: string;
  email: string;
  image?: string | null;
};

type Organization = {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
};

type Team = {
  id: string;
  name: string;
  memberCount: number;
};

type UserOrganization = {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
};

type OrganizationRole = "owner" | "admin" | "member";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  organization: Organization;
  allUserOrganizations: UserOrganization[];
  organizationSlug: string;
  user: User;
  teams: SidebarTeam[];
  role: OrganizationRole;
};

export function AppSidebar({
  organization,
  allUserOrganizations,
  organizationSlug,
  user,
  teams,
  role,
  ...props
}: AppSidebarProps) {
  const isOwnerOrAdmin = role === "owner" || role === "admin";

  const data = {
    navMain: [
      // Everyone
      {
        title: "Dashboard",
        url: `/org/${organizationSlug}`,
        icon: <LayoutDashboardIcon />,
      },

      // Everyone
      {
        title: "Attendance",
        url: `/org/${organizationSlug}/attendance`,
        icon: <Clock3Icon />,
      },

      // Everyone
      {
        title: "Leave",
        url: `/org/${organizationSlug}/leave`,
        icon: <CalendarDaysIcon />,
      },

      // Owner only
      ...(isOwnerOrAdmin
        ? [
            {
              title: "Payroll",
              url: `/org/${organizationSlug}/payroll`,
              icon: <WalletCardsIcon />,
            },
          ]
        : []),

      // Everyone
      {
        title: "Calendar",
        url: `/org/${organizationSlug}/calendar`,
        icon: <CalendarIcon />,
      },
    ],

    management: [
      // Owner + Admin
      ...(isOwnerOrAdmin
        ? [
            {
              title: "Employees",
              url: "#",
              icon: <UsersIcon />,
              items: [
                {
                  title: "All Employees",
                  url: `/org/${organizationSlug}/employees`,
                },
                {
                  title: "Invitations",
                  url: `/org/${organizationSlug}/invitations`,
                },
              ],
            },
          ]
        : []),

      // Everyone
      {
        title: "Teams",
        url: "#",
        icon: <NetworkIcon />,
        items: [
          {
            title: "All Teams",
            url: `/org/${organizationSlug}/teams`,
          },

          ...teams.map((team) => ({
            title: team.name,
            url: `/org/${organizationSlug}/teams/${team.id}`,
          })),
        ],
      },
    ],

    // Owner + Admin only
    settings: [
      ...(isOwnerOrAdmin
        ? [
            {
              title: "Settings",
              url: `/org/${organizationSlug}/settings`,
              icon: <Settings2Icon />,
            },
          ]
        : []),
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher
          organizations={allUserOrganizations.map((organization) => ({
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="size-5 rounded-full object-cover"
              />
            ) : undefined,
            plan: "Starter",
          }))}
          activeOrganizationId={organization.id}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain GroupLabel="Main" items={data.navMain} />

        {data.management.length > 0 && (
          <NavMain GroupLabel="Management" items={data.management} />
        )}

        {data.settings.length > 0 && (
          <NavMain GroupLabel="Settings" items={data.settings} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} organizationSlug={organizationSlug} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
