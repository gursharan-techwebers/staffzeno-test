import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

export const getSession = cache(async () => {
  const totalStart = Date.now();

  // -------------------------------------------------------------------------
  // Get request headers
  // -------------------------------------------------------------------------

  const headersStart = Date.now();

  const requestHeaders = await headers();

  console.log(
    "[STAFFZENO] getSession headers:",
    Date.now() - headersStart,
    "ms",
  );

  // -------------------------------------------------------------------------
  // Better Auth session lookup
  // -------------------------------------------------------------------------

  const authStart = Date.now();

  const result = await auth.api.getSession({
    headers: requestHeaders,
  });

  console.log(
    "[STAFFZENO] Better Auth getSession:",
    Date.now() - authStart,
    "ms",
  );

  // -------------------------------------------------------------------------
  // Total
  // -------------------------------------------------------------------------

  console.log("[STAFFZENO] getSession TOTAL:", Date.now() - totalStart, "ms");

  return result;
});
