"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import type { Leave, ManageLeave } from "@/types/organization/leave";

import { DashboardPageHeader } from "../dashboardPageHeader";
import LeaveViewSelector, { type LeaveView } from "./LeaveViewSelector";
import ManageLeaves from "./ManageLeaves";
import MyLeaves from "./MyLeaves";
import { LEAVE_VIEW_STORAGE_KEY } from "@/constants/organization";

type LeaveContentProps = {
  myLeaves: Leave[];
  manageableLeaves: ManageLeave[];
  canManageLeave: boolean;
  canApplyForLeave: boolean;
};

const isValidLeaveView = (value: string | null): value is LeaveView => {
  return value === "manage-leave" || value === "my-leave";
};

const LeaveContent = ({
  myLeaves,
  manageableLeaves,
  canManageLeave,
  canApplyForLeave,
}: LeaveContentProps) => {
  const defaultView: LeaveView = canManageLeave ? "manage-leave" : "my-leave";

  const canSwitchViews = canManageLeave && canApplyForLeave;

  const [activeView, setActiveView] = useState<LeaveView>(defaultView);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [hasRestoredView, setHasRestoredView] = useState(false);

  // Restore the user's last selected view.
  useEffect(() => {
    const storedView = localStorage.getItem(LEAVE_VIEW_STORAGE_KEY);

    if (canSwitchViews && isValidLeaveView(storedView)) {
      setActiveView(storedView);
    } else {
      // If switching is not allowed or there is no valid stored value,
      // use the permission-based default.
      setActiveView(defaultView);

      localStorage.setItem(LEAVE_VIEW_STORAGE_KEY, defaultView);
    }

    setHasRestoredView(true);
  }, [canSwitchViews, defaultView]);

  const handleViewChange = (view: LeaveView) => {
    setActiveView(view);
    localStorage.setItem(LEAVE_VIEW_STORAGE_KEY, view);
  };

  // Prevent rendering the wrong view for a moment while localStorage
  // is being restored.
  if (!hasRestoredView) {
    return null;
  }

  return (
    <div className="space-y-6 md:space-y-2">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          {activeView === "manage-leave" ? (
            <DashboardPageHeader
              title="Manage Leave"
              description="Review and manage employee leave requests."
            />
          ) : (
            <DashboardPageHeader
              title="My Leave"
              description="View your leave requests and their current status."
              {...(myLeaves.length > 0
                ? {
                    actionIcon: <Plus className="size-4" />,
                    actionLabel: "Apply leave",
                    onAction: () => setLeaveDialogOpen(true),
                  }
                : {})}
            />
          )}
        </div>

        {canSwitchViews && (
          <div className="shrink-0">
            <LeaveViewSelector
              value={activeView}
              onValueChange={handleViewChange}
            />
          </div>
        )}
      </div>

      {activeView === "manage-leave" && canManageLeave && (
        <ManageLeaves leaves={manageableLeaves} />
      )}

      {activeView === "my-leave" && canApplyForLeave && (
        <MyLeaves
          leaves={myLeaves}
          leaveDialogOpen={leaveDialogOpen}
          onLeaveDialogOpenChange={setLeaveDialogOpen}
        />
      )}
    </div>
  );
};

export default LeaveContent;
