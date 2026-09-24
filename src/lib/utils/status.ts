import { AttendanceStatus } from "@/generated/prisma/enums";
import {
  BanIcon,
  CheckCircle2Icon,
  Clock3Icon,
  TriangleAlertIcon,
  UserXIcon,
  XCircleIcon,
} from "lucide-react";

export const STATUS_CONFIG = {
  success: {
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400",
    icon: CheckCircle2Icon,
  },

  warning: {
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
    icon: Clock3Icon,
  },

  danger: {
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
    icon: XCircleIcon,
  },

  info: {
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400",
    icon: BanIcon,
  },

  purple: {
    className:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-400",
    icon: CheckCircle2Icon,
  },

  orange: {
    className:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400",
    icon: TriangleAlertIcon,
  },

  neutral: {
    className: "border-border bg-muted text-muted-foreground",
    icon: Clock3Icon,
  },
} as const;

export type StatusVariant = keyof typeof STATUS_CONFIG;

export type StatusConfig = {
  label: string;
  className: string;
  icon: (typeof STATUS_CONFIG)[StatusVariant]["icon"];
};

export const createStatusConfig = (
  label: string,
  variant: StatusVariant,
): StatusConfig => {
  return {
    label,
    ...STATUS_CONFIG[variant],
  };
};

export const getAttendanceStatusConfig = (status: AttendanceStatus) => {
  switch (status) {
    case "COMPLETE":
      return createStatusConfig("Complete", "success");

    case "SHORT":
      return createStatusConfig("Short", "warning");

    case "ABSENT":
      return {
        ...createStatusConfig("Absent", "danger"),
        icon: UserXIcon,
      };

    case "HOLIDAY":
      return createStatusConfig("Holiday", "purple");

    case "WEEKEND":
      return createStatusConfig("Weekend", "neutral");

    case "INCOMPLETE":
      return createStatusConfig("Incomplete", "orange");
  }
};
