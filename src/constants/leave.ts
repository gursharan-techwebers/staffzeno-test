export const LEAVE_TYPES = {
  sick: {
    id: "sick",
    name: "Sick Leave",
  },

  casual: {
    id: "casual",
    name: "Casual Leave",
  },

  emergency: {
    id: "emergency",
    name: "Emergency Leave",
  },

  vacation: {
    id: "vacation",
    name: "Vacation Leave",
  },

  personal: {
    id: "personal",
    name: "Personal Leave",
  },

  bereavement: {
    id: "bereavement",
    name: "Bereavement Leave",
  },

  maternity: {
    id: "maternity",
    name: "Maternity Leave",
  },

  paternity: {
    id: "paternity",
    name: "Paternity Leave",
  },
} as const;

export const ACTIVE_LEAVE_TYPES = Object.values(LEAVE_TYPES);

export type LeaveTypeId = (typeof LEAVE_TYPES)[keyof typeof LEAVE_TYPES]["id"];
