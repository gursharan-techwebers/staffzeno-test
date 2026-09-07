"use server";

import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { SignupInput, signupSchema } from "@/validators/auth/auth";

type SignupSuccess = {
  userId: string;
  email: string;
};

export async function signupUser(
  input: SignupInput,
): Promise<ActionResult<SignupSuccess>> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    return actionResponse(
      ACTION_STATUS.CREATED,
      {
        userId: result.user.id,
        email: result.user.email,
      },
      "Check your inbox to verify your email.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.BAD_REQUEST,
        error.body?.message ?? "Could not create your account.",
        "BAD_REQUEST",
      );
    }

    console.error("[signupUser] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
