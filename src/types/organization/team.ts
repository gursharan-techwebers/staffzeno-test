export type OrganizationEmployeeRole = "admin" | "member";

export type OrganizationEmployee = {
  id: string;
  userId: string;
  role: OrganizationEmployeeRole;
  title: string | null;
  teamId: string | null;
  createdAt: Date;

  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };

  teams: TeamOption[];
};

export type TeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: OrganizationEmployeeRole;
  title: string | null;
  createdAt: Date | null;
};

export type Team = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: Date;
  members: TeamMember[];
};

export type TeamOption = Pick<Team, "id" | "name">;