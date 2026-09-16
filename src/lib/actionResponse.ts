export const ACTION_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS];

export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "INVALID_INVITATION"
  | "ORGANIZATION_NOT_FOUND"
  | "LIMIT_REACHED"
  | "FEATURE_NOT_AVAILABLE"
  | "CONFLICT"
  | "UNKNOWN_ERROR"
  | "INVALID_CREDENTIALS"
  | "NOT_FOUND"
  | "TEAM_NOT_FOUND"
  | "TEAM_REQUIRED"
  | "ORGANIZATION_MISMATCH"
  | "TEAM_MEMBERSHIP_FAILED"
  | "ALREADY_MEMBER"
  | "EMAIL_MISMATCH"
  | "INVITATION_EXPIRED"
  | "INVITATION_NOT_PENDING"
  | "LEAVE_OVERLAP"
  | "SELF_APPROVAL_NOT_ALLOWED"
  | "ORGANIZATION_ADMIN_NOT_FOUND"
  | "TEAM_ADMIN_NOT_FOUND"
  | "TEAM_SELECTION_REQUIRED"
  | "INVALID_DURATION"
  | "SHORT_LEAVE_LIMIT_EXCEEDED"
  | "INVALID_SHORT_LEAVE_TIME"
  | "INVALID_HALF_DAY_DATE"
  | "INVALID_SHORT_LEAVE_DATE"
  | "SHORT_LEAVE_TIME_REQUIRED"
  | "HALF_DAY_PERIOD_REQUIRED"
  | "INVALID_DATE_RANGE"
  | "INVALID_DATE"
  | "LEAVE_SETTINGS_REQUIRED"
  | "INVALID_LEAVE_TYPE"
  | "OWNER_CANNOT_REQUEST_LEAVE"
  | "MEMBERSHIP_REQUIRED"
  | "TEAM_ADMIN_MEMBERSHIP_NOT_FOUND"
  | "APPROVER_NOT_FOUND"
  | "NON_WORKING_DAY"
  | "ATTENDANCE_SETTINGS_REQUIRED"
  | "OWNER_ADMIN_REQUIRED"
  | "LEAVE_NOT_FOUND"
  | "LEAVE_NOT_CANCELLABLE"
  | "INVALID_TEAM"
  | "LEAVE_UPDATE_FAILED"
  | "INVALID_LEAVE_STATUS"
  | "MEMBER_NOT_FOUND"
  | "INVALID_APPROVER"
  | "OWNER_LEAVE_NOT_SUPPORTED"
  | "LEAVE_ALREADY_PROCESSED"
  | "APPROVAL_ALREADY_PROCESSED"
  | "ADMIN_REQUIRED"
  | "OWNER_REQUIRED"
  | "NOT_ASSIGNED_APPROVER"
  | "MEMBERSHIP_NOT_FOUND"
  | "LEAVE_DATE_ALREADY_EXISTS"
  | "ROLE_UNCHANGED"
  | "BAD_REQUEST";

export type ActionSuccess<T> = {
  success: true;
  status: 200 | 201;
  data: T;
  message?: string;
};

export type ActionFailure = {
  success: false;
  status: Exclude<ActionStatus, 200 | 201>;
  code: ActionErrorCode;
  error: string;
  fieldErrors?: Record<string, string[]>;
  message?: string;
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function actionResponse<T>(
  status: 200 | 201,
  data: T,
  message?: string,
): ActionSuccess<T>;

export function actionResponse(
  status: Exclude<ActionStatus, 200 | 201>,
  error: string,
  code: ActionErrorCode,
  fieldErrors?: Record<string, string[]>,
): ActionFailure;

export function actionResponse<T>(
  status: ActionStatus,
  dataOrError: T | string,
  messageOrCode?: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  if (status === 200 || status === 201) {
    return {
      success: true,
      status,
      data: dataOrError as T,
      ...(messageOrCode ? { message: messageOrCode } : {}),
    };
  }

  return {
    success: false,
    status,
    code: messageOrCode as ActionErrorCode,
    error: dataOrError as string,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}
