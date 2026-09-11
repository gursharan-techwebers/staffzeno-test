export type OrganizationHoliday = {
  id: string;
  organizationId: string;
  name: string;
  date: Date;
  description: string | null;
};