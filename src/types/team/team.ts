export type TeamMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "member";
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