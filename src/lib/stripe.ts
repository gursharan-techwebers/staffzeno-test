import { env } from "@/env";
import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    stripe = new Stripe(secretKey, {
      apiVersion: "2026-08-26.dahlia",
    });
  }

  return stripe;
}