"use client";

import {
  AlertTriangleIcon,
  CoffeeIcon,
  LogInIcon,
  LogOutIcon,
  MoveRight,
  ShieldCheckIcon,
} from "lucide-react";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getAttendanceStatusConfig } from "@/lib/utils/status";

import { AttendanceStatus } from "@/generated/prisma/enums";
import { WorkSummaryContent } from "./WorkSummaryContent";

export type AttendanceDetails = {
  id: string;

  date: string | Date;

  status: AttendanceStatus;

  employee: {
    name: string;
    title: string;
    email: string;
    image: string | null;
  };

  requiredMinutes: number;

  workedMinutes: number;

  regularMinutes: number;

  overtimeMinutes: number;

  shortfallMinutes: number;

  isFinalized: boolean;

  finalizedAt: string | Date | null;

  sessions: AttendanceSessionDetails[];
};

type AttendanceSessionDetails = {
  id: string;

  sessionNumber: number;

  punchedInAt: string | Date;

  punchedOutAt: string | Date | null;

  status: "PUNCHED_IN" | "ON_BREAK" | "PUNCHED_OUT";

  closedBy: "EMPLOYEE" | "SYSTEM" | "ADMIN" | null;

  /*
   * Name of the administrator who closed
   * the session.
   *
   * This is populated by getAttendanceDetails()
   * when closedBy === "ADMIN".
   */
  closedByName: string | null;

  /*
   * Complete administrator information.
   *
   * This is optional for the UI, but keeping it
   * here makes the returned attendance type match
   * the server response.
   */
  closedByUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;

  totalSessionMinutes: number;

  totalBreakMinutes: number;

  workedMinutes: number;

  workSummary: string | null;

  breaks: {
    id: string;

    startedAt: string | Date;

    endedAt: string | Date | null;

    durationMinutes: number;
  }[];
};

const formatMinutes = (minutes: number) => {
  if (minutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

const formatTime = (value: string | Date) => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatDate = (value: string | Date) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const getClosedByMessage = (
  closedBy: AttendanceSessionDetails["closedBy"],
  closedByName: AttendanceSessionDetails["closedByName"],
) => {
  switch (closedBy) {
    case "EMPLOYEE":
      return "Punched out by the employee";

    case "ADMIN":
      return closedByName
        ? `Closed by ${closedByName}`
        : "Closed by an administrator";

    case "SYSTEM":
      return "Closed automatically by the system";

    default:
      return null;
  }
};

export function AttendanceDetailsContent({
  attendance,
}: {
  attendance: AttendanceDetails;
}) {
  const status = getAttendanceStatusConfig(attendance.status);

  const StatusIcon = status.icon;

  const totalSessionMinutes = attendance.sessions.reduce(
    (total, session) => total + session.totalSessionMinutes,
    0,
  );

  const totalBreakMinutes = attendance.sessions.reduce(
    (total, session) => total + session.totalBreakMinutes,
    0,
  );

  return (
    <>
      {/* Header */}

      <DialogHeader className="px-6 pt-6">
        <div className="flex items-start gap-3">
          <Avatar className="size-11 shrink-0">
            <AvatarImage
              src={attendance.employee.image ?? undefined}
              alt={attendance.employee.name}
            />

            <AvatarFallback>
              {attendance.employee.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <DialogTitle className="text-lg">
              {attendance.employee.name}
            </DialogTitle>

            <DialogDescription className="text-xs">
              {attendance.employee.title} | {formatDate(attendance.date)}
            </DialogDescription>
          </div>

          <Badge
            variant="outline"
            className={`mr-10 gap-1.5 text-xs font-medium ${status.className}`}
          >
            <StatusIcon className="size-3.5" />

            {status.label}
          </Badge>
        </div>
      </DialogHeader>

      <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
        <div className="space-y-6 px-6 pb-6 pt-5">
          {/* Summary */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard
              label="Required"
              value={formatMinutes(attendance.requiredMinutes)}
            />

            <SummaryCard
              label="Worked"
              value={formatMinutes(attendance.workedMinutes)}
              highlight
            />

            <SummaryCard
              label="Overtime"
              value={
                attendance.overtimeMinutes > 0
                  ? `+${formatMinutes(attendance.overtimeMinutes)}`
                  : "—"
              }
            />

            <SummaryCard
              label="Shortfall"
              value={
                attendance.shortfallMinutes > 0
                  ? formatMinutes(attendance.shortfallMinutes)
                  : "—"
              }
            />
          </div>

          {/* Timeline */}

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Attendance timeline</h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Work sessions and breaks recorded for this day.
              </p>
            </div>

            {attendance.sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No work sessions recorded for this day.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {attendance.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border bg-muted/20 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Session {session.sessionNumber}
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1.5">
                          {formatTime(session.punchedInAt)}
                          <MoveRight className="size-3" />
                          {session.punchedOutAt
                            ? formatTime(session.punchedOutAt)
                            : "Still active"}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className="border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400"
                      >
                        {formatMinutes(session.workedMinutes)} worked
                      </Badge>
                    </div>

                    {!session.workSummary && session.punchedOutAt && (
                      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />

                        <div className="min-w-0">
                          <p className="text-xs font-medium">
                            Work summary not provided
                          </p>
                          <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-300/70">
                            No work summary was recorded for this session.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative ml-2 space-y-5 border-l pl-6">
                      <TimelineItem
                        icon={LogInIcon}
                        title="Punched in"
                        time={formatTime(session.punchedInAt)}
                        description="Work session started"
                      />

                      {session.breaks.map((breakItem) => (
                        <div key={breakItem.id} className="space-y-5">
                          <TimelineItem
                            icon={CoffeeIcon}
                            title="Break started"
                            time={formatTime(breakItem.startedAt)}
                            description="Employee started a break"
                          />

                          {breakItem.endedAt && (
                            <TimelineItem
                              icon={CoffeeIcon}
                              title="Break ended"
                              time={formatTime(breakItem.endedAt)}
                              description={`${formatMinutes(
                                breakItem.durationMinutes,
                              )} break`}
                            />
                          )}
                        </div>
                      ))}

                      {session.punchedOutAt ? (
                        <TimelineItem
                          icon={LogOutIcon}
                          title="Punched out"
                          time={formatTime(session.punchedOutAt)}
                          description={
                            getClosedByMessage(
                              session.closedBy,
                              session.closedByName,
                            ) ?? "Closed"
                          }
                          workSummary={session.workSummary}
                        />
                      ) : (
                        <TimelineItem
                          icon={LogOutIcon}
                          title="Session still active"
                          time="Currently working"
                          description="No punch-out recorded yet"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Attendance Summary */}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Attendance summary</h3>

            <div className="rounded-xl border">
              <SummaryRow
                label="Total session time"
                value={formatMinutes(totalSessionMinutes)}
              />

              <SummaryRow
                label="Total break time"
                value={formatMinutes(totalBreakMinutes)}
              />

              <SummaryRow
                label="Regular time"
                value={formatMinutes(attendance.regularMinutes)}
              />

              <SummaryRow
                label="Overtime"
                value={
                  attendance.overtimeMinutes > 0
                    ? `+${formatMinutes(attendance.overtimeMinutes)}`
                    : "—"
                }
                valueClassName="text-emerald-600 dark:text-emerald-400"
              />

              <SummaryRow
                label="Shortfall"
                value={
                  attendance.shortfallMinutes > 0
                    ? formatMinutes(attendance.shortfallMinutes)
                    : "—"
                }
                last
              />
            </div>
          </section>

          {/* Finalized */}

          {attendance.isFinalized && attendance.finalizedAt && (
            <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                <ShieldCheckIcon className="size-4" />
              </div>

              <div>
                <p className="text-sm font-medium">Attendance finalized</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Finalized on {formatDate(attendance.finalizedAt)} at{" "}
                  {formatTime(attendance.finalizedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p
        className={`mt-1 text-base font-semibold ${
          highlight ? "text-green-700 dark:text-green-400" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
  last = false,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        !last ? "border-b" : ""
      }`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>

      <span className={`text-sm font-medium ${valueClassName ?? ""}`}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  time,
  description,
  workSummary,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;

  title: string;

  time: string;

  description: string;

  workSummary?: string | null;
}) {
  return (
    <div className="relative">
      <div className="absolute -left-9.5 top-0 flex size-6 items-center justify-center rounded-full border bg-background">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium">{title}</p>

          <span className="text-xs text-muted-foreground">{time}</span>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>

        {workSummary && (
          <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Work summary
            </p>

            <div className="mt-1">
              <WorkSummaryContent content={workSummary} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
