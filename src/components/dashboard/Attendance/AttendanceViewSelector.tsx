"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AttendanceView =
  | "manage-attendance"
  | "my-attendance";

type AttendanceViewSelectorProps = {
  value: AttendanceView;
  onValueChange: (value: AttendanceView) => void;
};

const AttendanceViewSelector = ({
  value,
  onValueChange,
}: AttendanceViewSelectorProps) => {
  return (
    <Select
      value={value}
      onValueChange={(value) =>
        onValueChange(value as AttendanceView)
      }
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="manage-attendance">
          Manage Attendance
        </SelectItem>

        <SelectItem value="my-attendance">
          My Attendance
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default AttendanceViewSelector;