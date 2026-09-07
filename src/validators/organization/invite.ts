import z from "zod";
import { emailSchema } from "../auth/common";
import { titleSchema } from "./common";

export const inviteMemberSchema = z.object({
  title: titleSchema,
  email: emailSchema,
  teamId: z.string().min(1, "Please select a team."),
  role: z.enum(["member", "admin"]),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
