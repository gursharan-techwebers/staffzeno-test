import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export const getSession = cache(async () => {
  const requestHeaders = await headers();

  return auth.api.getSession({
    headers: requestHeaders,
  });
});