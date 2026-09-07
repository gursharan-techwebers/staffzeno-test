import z from "zod";
import { TeamNameSchema } from "./common";

export const createTeamSchema = z.object({
  name: TeamNameSchema,
});

export type CreateTeamInput = z.infer<
  typeof createTeamSchema
>;