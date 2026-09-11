import { Session } from "better-auth";

export type AuthUserResult = {
  userId: string;
  email: string;
};

export type DashboardContext = {
  session: Session;

  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };

  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };

  membership: {
    id: string;
    role: "owner" | "admin" | "member";
  };
};