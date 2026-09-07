import z from "zod";

import {
  nameSchema,
  phoneSchema,
} from "./common";

// Update Account Profile
export const updateAccountProfileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
});

export type UpdateAccountProfileInput = z.infer<
  typeof updateAccountProfileSchema
>;