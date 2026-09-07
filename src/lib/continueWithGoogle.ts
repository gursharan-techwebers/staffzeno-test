"use client";

import { authClient } from "@/lib/auth-client";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "./actionResponse";

type GoogleLoginSuccess = {
  redirecting: true;
};

export async function continueWithGoogle(
  callbackURL: string = "/",
): Promise<ActionResult<GoogleLoginSuccess>> {
  const { error } = await authClient.signIn.social({
    provider: "google",
    callbackURL,
  });

  if (error) {
    return actionResponse(
      ACTION_STATUS.BAD_REQUEST,
      error.message ?? "Could not continue with Google.",
      "BAD_REQUEST",
    );
  }

  return actionResponse(
    ACTION_STATUS.OK,
    {
      redirecting: true,
    },
    "Redirecting to Google...",
  );
}
