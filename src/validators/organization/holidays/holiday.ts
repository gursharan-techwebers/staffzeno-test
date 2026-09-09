import { z } from "zod";

const organizationHolidayFields = {
  name: z
    .string()
    .trim()
    .min(1, "Holiday name is required.")
    .max(100, "Holiday name cannot exceed 100 characters."),

  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a valid holiday date."),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional(),
};

export const createOrganizationHolidaySchema = z.object({
  ...organizationHolidayFields,
});

export type CreateOrganizationHolidayInput = z.infer<
  typeof createOrganizationHolidaySchema
>;

export const updateOrganizationHolidaySchema = z.object({
  ...organizationHolidayFields,
});

export type UpdateOrganizationHolidayInput = z.infer<
  typeof updateOrganizationHolidaySchema
>;
