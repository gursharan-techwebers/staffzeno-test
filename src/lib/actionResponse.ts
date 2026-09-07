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
