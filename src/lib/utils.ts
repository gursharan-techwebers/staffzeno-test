import { clsx, type ClassValue } from "clsx";
import { randomInt } from "crypto";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
};

export function generateOrganizationSlug(): string {
  const min = 1_000_000_000_000;
  const max = 9_999_999_999_999;

  return randomInt(min, max + 1).toString();
}

export function formatDate(date: Date | string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(new Date(date));

  const datePart = formatted
    .filter((part) => ["month", "day", "year"].includes(part.type))
    .map((part) => part.value)
    .join(" ");

  const timePart = formatted
    .filter((part) => ["hour", "minute", "dayPeriod"].includes(part.type))
    .map((part) => part.value)
    .join("");

  return `${datePart} at ${timePart}`;
}