// src/server/auth/getAuthContext.ts

import "server-only";

import { cache } from "react";

import { getSession } from "@/server/user/getSession";

export const getAuthContext = cache(async () => {
  const result = await getSession();

  if (!result) {
    return null;
  }

  return {
    session: result.session,
    user: result.user,
  };
});

export type AuthContext = NonNullable<
  Awaited<ReturnType<typeof getAuthContext>>
>;
