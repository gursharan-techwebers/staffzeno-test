"use client";

import * as React from "react";
import {
  CalendarDays,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/dashboardPageHeader";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type {
  WorkingDay,
  WorkingSaturday,
} from "@/validators/organization/settings/attendance";

import { getCalendarNonWorkingDates } from "@/lib/calendar/workingDays";

import AddHolidayDialog from "./AddHolidayDialog";
import DeleteHolidayDialog from "./DeleteHolidayDialog";

import { OrganizationHoliday } from "@/types/organization/holiday";
import EditHolidayDialog from "./EditHolidayDialog";

type CalendarContentProps = {
  holidays: OrganizationHoliday[];
  canManageHolidays: boolean;
  attendanceSettings: {
    officeStartTime: string;
    officeEndTime: string;
    gracePeriod: number;
    workingDays: WorkingDay[];
    workingSaturdays: WorkingSaturday[];
  };
};

const formatHolidayListDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const formatMonth = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(new Date(date));
};

const formatDay = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(new Date(date));
};

const CalendarContent = ({
  holidays: initialHolidays,
  canManageHolidays,
  attendanceSettings,
}: CalendarContentProps) => {
  const [holidays, setHolidays] =
    React.useState<OrganizationHoliday[]>(initialHolidays);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date(),
  );

  const [addHolidayDialogOpen, setAddHolidayDialogOpen] = React.useState(false);

  const [editingHoliday, setEditingHoliday] =
    React.useState<OrganizationHoliday | null>(null);

  const [deletingHoliday, setDeletingHoliday] =
    React.useState<OrganizationHoliday | null>(null);

  /*
   * Keep local state synchronized with server data.
   */
  React.useEffect(() => {
    setHolidays(initialHolidays);
  }, [initialHolidays]);

  /*
   * Holiday dates.
   */
  const holidayDates = React.useMemo(
    () => holidays.map((holiday) => new Date(holiday.date)),
    [holidays],
  );

  /*
   * Non-working dates based on organization settings.
   */
  const nonWorkingDates = React.useMemo(
    () =>
      getCalendarNonWorkingDates({
        workingDays: attendanceSettings.workingDays,
        workingSaturdays: attendanceSettings.workingSaturdays,
      }),
    [attendanceSettings.workingDays, attendanceSettings.workingSaturdays],
  );

  /*
   * Add holiday.
   */
  const handleHolidayAdded = (holiday: OrganizationHoliday) => {
    setHolidays((current) => {
      const alreadyExists = current.some((item) => item.id === holiday.id);

      if (alreadyExists) {
        return current;
      }

      return [...current, holiday].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    });
  };

  /*
   * Update holiday.
   */
  const handleHolidayUpdated = (updatedHoliday: OrganizationHoliday) => {
    setHolidays((current) =>
      current
        .map((holiday) =>
          holiday.id === updatedHoliday.id ? updatedHoliday : holiday,
        )
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
    );

    setSelectedDate(new Date(updatedHoliday.date));

    setEditingHoliday(null);
  };

  /*
   * Delete holiday.
   */
  const handleHolidayDeleted = (holidayId: string) => {
    setHolidays((current) =>
      current.filter((holiday) => holiday.id !== holidayId),
    );

    setDeletingHoliday(null);
  };

  /*
   * Select calendar date.
   */
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  /*
   * Select holiday from list.
   */
  const handleHolidayClick = (holiday: OrganizationHoliday) => {
    setSelectedDate(new Date(holiday.date));
  };

  return (
    <>
      <DashboardPageHeader
        title="Calendar"
        description="Track employee attendance, leaves, and holidays in one place."
        {...(canManageHolidays
          ? {
              actionIcon: <Plus className="size-4" />,
              actionLabel: "Add holiday",
              onAction: () => setAddHolidayDialogOpen(true),
            }
          : {})}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Calendar */}
        <div className="min-h-0 overflow-hidden rounded-xl border">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={{
              holiday: holidayDates,
              nonWorkingDay: nonWorkingDates,
            }}
            className="h-full w-full"
          />
        </div>

        {/* Holidays */}
        <div className="min-h-0 overflow-hidden rounded-xl border">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />

              <h3 className="text-sm font-semibold">Organization holidays</h3>

              <span className="text-xs text-muted-foreground">
                ({holidays.length})
              </span>
            </div>
          </div>

          {holidays.length === 0 ? (
            <div className="flex h-full min-h-32 items-center justify-center px-5 py-6 text-center">
              <div>
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                  <CalendarDays className="size-5 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">No holidays yet</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Organization holidays will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="divide-y">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                  >
                    {/* Date */}
                    <button
                      type="button"
                      onClick={() => handleHolidayClick(holiday)}
                      className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Select ${formatHolidayListDate(
                        holiday.date,
                      )}`}
                    >
                      <span className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                        {formatMonth(holiday.date)}
                      </span>

                      <span className="mt-1 text-base font-semibold leading-none">
                        {formatDay(holiday.date)}
                      </span>
                    </button>

                    {/* Information */}
                    <button
                      type="button"
                      onClick={() => handleHolidayClick(holiday)}
                      className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <p className="truncate text-sm font-medium">
                        {holiday.name}
                      </p>

                      {holiday.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {holiday.description}
                        </p>
                      )}
                    </button>

                    {/* Actions */}
                    {canManageHolidays && (
                      <div className="shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            >
                              <MoreHorizontal className="size-4" />

                              <span className="sr-only">
                                Open {holiday.name} actions
                              </span>
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingHoliday(holiday)}
                            >
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeletingHoliday(holiday)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add */}
      {canManageHolidays && (
        <AddHolidayDialog
          open={addHolidayDialogOpen}
          onOpenChange={setAddHolidayDialogOpen}
          selectedDate={selectedDate}
          onHolidayAdded={handleHolidayAdded}
        />
      )}

      {/* Edit */}
      {canManageHolidays && editingHoliday && (
        <EditHolidayDialog
          open={!!editingHoliday}
          onOpenChange={(open) => {
            if (!open) {
              setEditingHoliday(null);
            }
          }}
          holiday={editingHoliday}
          onHolidayUpdated={handleHolidayUpdated}
        />
      )}

      {/* Delete */}
      {canManageHolidays && (
        <DeleteHolidayDialog
          open={!!deletingHoliday}
          holiday={deletingHoliday}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingHoliday(null);
            }
          }}
          onHolidayDeleted={handleHolidayDeleted}
        />
      )}
    </>
  );
};

export default CalendarContent;
