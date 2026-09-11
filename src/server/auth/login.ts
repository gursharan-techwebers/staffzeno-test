"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  actionResponse,
  ACTION_STATUS,
  type ActionResult,
} from "@/lib/actionResponse";
import { LoginInput, loginSchema } from "@/validators/auth/auth";
import { AuthUserResult } from "@/types/auth/auth";

export async function loginUser(
  input: LoginInput,
): Promise<ActionResult<AuthUserResult>> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return actionResponse(
      ACTION_STATUS.VALIDATION_ERROR,
      "Please fix the highlighted fields.",
      "VALIDATION_ERROR",
      parsed.error.flatten().fieldErrors,
    );
  }

  const { email, password } = parsed.data;

  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
      headers: await headers(),
    });

    return actionResponse(
      ACTION_STATUS.OK,
      {
        userId: result.user.id,
        email: result.user.email,
      },
      "Login successful.",
    );
  } catch (error) {
    if (error instanceof APIError) {
      return actionResponse(
        ACTION_STATUS.UNAUTHORIZED,
        error.body?.message ?? "Invalid email or password.",
        "INVALID_CREDENTIALS",
      );
    }

    console.error("[loginUser] unexpected error:", error);

    return actionResponse(
      ACTION_STATUS.INTERNAL_SERVER_ERROR,
      "Something went wrong. Please try again.",
      "UNKNOWN_ERROR",
    );
  }
}
