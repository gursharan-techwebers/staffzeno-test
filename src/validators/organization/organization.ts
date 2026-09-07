import z from "zod";
import { organizationNameSchema } from "./common";

// Create Organization
export const createOrganizationSchema = z.object({
  name: organizationNameSchema,
});

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationSchema
>;