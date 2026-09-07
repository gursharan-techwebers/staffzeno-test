export const PLANS = {
  free: {
    name: "Free",
    monthlyPrice: 0,

    limits: {
      organizations: 1,
      employeesPerOrganization: 5,
      teams: 3,
    },

    features: {
      attendance: true,
      punchInOut: true,
      workingHours: true,
      leave: true,
      calendar: true,
      employeeManagement: true,
      invitations: true,
      payroll: false,
      reports: "none",
      advancedPermissions: false,
    },
  },

  growth: {
    name: "Growth",
    monthlyPrice: 29,

    limits: {
      organizations: 1,
      employeesPerOrganization: 25,
      teams: "unlimited",
    },

    features: {
      attendance: true,
      punchInOut: true,
      workingHours: true,
      leave: true,
      calendar: true,
      employeeManagement: true,
      invitations: true,
      payroll: false,
      reports: "basic",
      advancedPermissions: false,
    },
  },

  business: {
    name: "Business",
    monthlyPrice: 49,

    limits: {
      organizations: 3,
      employeesPerOrganization: 100,
      teams: "unlimited",
    },

    features: {
      attendance: true,
      punchInOut: true,
      workingHours: true,
      leave: true,
      calendar: true,
      employeeManagement: true,
      invitations: true,
      payroll: true,
      reports: "advanced",
      advancedPermissions: true,
    },
  },
} as const;

export type PlanName = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanName];
