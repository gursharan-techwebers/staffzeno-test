"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type LeaveView = "manage-leave" | "my-leave";

type LeaveViewSelectorProps = {
  value: LeaveView;
  onValueChange: (value: LeaveView) => void;
};

const LeaveViewSelector = ({
  value,
  onValueChange,
}: LeaveViewSelectorProps) => {
  return (
    <Select
      value={value}
      onValueChange={(value) => onValueChange(value as LeaveView)}
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="manage-leave">Manage Leave</SelectItem>
        <SelectItem value="my-leave">My Leave</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LeaveViewSelector;
