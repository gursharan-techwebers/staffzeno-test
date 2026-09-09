import { z } from "zod";
import {
    emailSchema,
  optionalAddressSchema,
  optionalPhoneSchema,
  organizationNameSchema,
} from "../common";

export const updateOrganizationGeneralSchema = z.object({
  name: organizationNameSchema,

  email: emailSchema,

  phone: optionalPhoneSchema,

  address: optionalAddressSchema,
});

export type UpdateOrganizationGeneralInput = z.infer<
  typeof updateOrganizationGeneralSchema
>;
