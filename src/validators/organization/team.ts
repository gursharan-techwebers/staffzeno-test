import z from "zod";
import { teamNameSchema } from "./common";

export const createTeamSchema = z.object({
  name: teamNameSchema,
});

export type CreateTeamInput = z.infer<
  typeof createTeamSchema
>;