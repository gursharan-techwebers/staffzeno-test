import "server-only";

import type { PlanName } from "@/config/plans";

const VALID_PLANS: PlanName[] = ["free", "growth", "business"];

export async function getUserPlan(userId: string): Promise<PlanName> {
  void userId;

  const testPlan = process.env.STAFFZENO_TEST_PLAN;

  if (
    process.env.NODE_ENV !== "production" &&
    testPlan &&
    VALID_PLANS.includes(testPlan as PlanName)
  ) {
    return testPlan as PlanName;
  }

  // Stripe is not connected yet.
  // Every StaffZeno account starts on the Free plan.
  return "free";
}
