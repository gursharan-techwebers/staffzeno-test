export type Invitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  title: string | null;
  organizationId: string;
  expiresAt: Date;
  createdAt: Date;
};