"use client";

import { MoreHorizontalIcon, Settings2Icon, UserXIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import UserNameAndTitle from "@/components/shared/dashboard/UserNameAndTitle";
import { UserProfile } from "../UserProfile";

import type {
  Attendance,
  ManageAttendance,
} from "@/types/organization/attendance";
import { formatDate } from "@/lib/utils/date";
import { getAttendanceStatusConfig } from "@/lib/utils/status";

import { getAttendanceDetails } from "@/server/attendance/getAttendanceDetails";
import { AttendanceDetails } from "./AttendanceDetailsContent";
import { AttendanceDetailsDialog } from "./AttendanceDetailsDialog";
import { ManageAttendanceDialog } from "./ManageAttendanceDialog";

type AttendanceDetailsData = Awaited<ReturnType<typeof getAttendanceDetails>>;

type AttendanceTableProps =
  | {
      attendance: Attendance[];
      view: "my";
      onAttendanceSaved?: never;
    }
  | {
      attendance: ManageAttendance[];
      view: "manage";
      onAttendanceSaved?: (attendance: AttendanceDetailsData) => void;
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

const isToday = (value: string | Date) => {
  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export function AttendanceTable({
  attendance,
  view,
  onAttendanceSaved,
}: AttendanceTableProps) {
  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceDetails | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [manageAttendance, setManageAttendance] = useState<
    Attendance | ManageAttendance | null
  >(null);

  const [manageOpen, setManageOpen] = useState(false);

  const isManageView = view === "manage";

  const handleAttendanceClick = async (
    record: Attendance | ManageAttendance,
  ) => {
    // Open immediately and show skeleton
    setSelectedAttendance(null);
    setDetailsLoading(true);
    setDetailsOpen(true);

    try {
      const details = await getAttendanceDetails(record.id);

      setSelectedAttendance(details);
    } catch (error) {
      console.error("Failed to load attendance details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleManageAttendance = (record: Attendance | ManageAttendance) => {
    setManageAttendance(record);
    setManageOpen(true);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-background shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {isManageView && (
                <TableHead className="font-medium">Employee</TableHead>
              )}

              <TableHead className="font-medium">Date</TableHead>

              <TableHead className="font-medium">Status</TableHead>

              <TableHead className="font-medium">Required</TableHead>

              <TableHead className="font-medium">Worked</TableHead>

              <TableHead className="font-medium">Overtime</TableHead>

              <TableHead className="font-medium">Shortfall</TableHead>

              {isManageView && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>

          <TableBody>
            {attendance.map((record) => {
              const status = getAttendanceStatusConfig(record.status);
              const StatusIcon = status.icon;

              const hasCompletedRequired =
                record.requiredMinutes <= record.workedMinutes;

              const isAttendanceToday = isToday(record.date);

              return (
                <TableRow
                  key={record.id}
                  className="cursor-pointer transition-colors hover:bg-muted/30 h-14"
                  onClick={() => handleAttendanceClick(record)}
                >
                  {isManageView && "member" in record && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div onClick={(event) => event.stopPropagation()}>
                          <UserProfile
                            user={record.member.user}
                            title={record.member.title}
                          />
                        </div>

                        <UserNameAndTitle
                          name={record.member.user.name}
                          title={
                            record.member.title || record.member.user.email
                          }
                        />
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="text-muted-foreground">
                    {formatDate(record.date)}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`gap-1.5 font-medium ${status.className}`}
                    >
                      <StatusIcon className="size-3.5" />
                      {status.label}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {formatMinutes(record.requiredMinutes)}
                  </TableCell>

                  <TableCell
                    className={`relative font-medium ${
                      hasCompletedRequired ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {formatMinutes(record.workedMinutes)}
                  </TableCell>

                  <TableCell>
                    {record.overtimeMinutes > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                      >
                        +{formatMinutes(record.overtimeMinutes)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {record.shortfallMinutes > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400"
                      >
                        {formatMinutes(record.shortfallMinutes)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {isManageView && !isAttendanceToday && (
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontalIcon className="size-4" />

                            <span className="sr-only">
                              Open attendance actions
                            </span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleManageAttendance(record)}
                          >
                            <Settings2Icon className="size-4" />
                            <span>Manage</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AttendanceDetailsDialog
        attendance={selectedAttendance}
        loading={detailsLoading}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <ManageAttendanceDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        attendanceId={manageAttendance?.id ?? null}
        onSaved={onAttendanceSaved}
      />
    </>
  );
}
