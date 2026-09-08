"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  Clock3Icon,
  KeyRoundIcon,
  LaptopIcon,
  LogOutIcon,
  MonitorIcon,
  SmartphoneIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { revokeUserSession } from "@/server/user/revokeUserSession";
import { revokeOtherUserSessions } from "@/server/user/revokeOtherUserSessions";
import { revokeAllUserSessions } from "@/server/user/revokeAllUserSessions";

import type { SecuritySession } from "@/types/auth/session";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type SecuritySettingsProps = {
  lastPasswordChangedAt: Date | null;
  sessions: SecuritySession[];
  hasPassword: boolean;
};

const getDeviceIcon = (userAgent: string | null) => {
  if (!userAgent) {
    return <MonitorIcon className="size-5" />;
  }

  const ua = userAgent.toLowerCase();

  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("android")) {
    return <SmartphoneIcon className="size-5" />;
  }

  if (
    ua.includes("windows") ||
    ua.includes("macintosh") ||
    ua.includes("linux")
  ) {
    return <LaptopIcon className="size-5" />;
  }

  return <MonitorIcon className="size-5" />;
};

const getDeviceName = (userAgent: string | null) => {
  if (!userAgent) {
    return "Unknown device";
  }

  const ua = userAgent.toLowerCase();

  if (ua.includes("iphone")) {
    return "iPhone";
  }

  if (ua.includes("ipad")) {
    return "iPad";
  }

  if (ua.includes("android")) {
    return "Android device";
  }

  if (ua.includes("windows")) {
    return "Windows";
  }

  if (ua.includes("macintosh")) {
    return "Mac";
  }

  if (ua.includes("linux")) {
    return "Linux";
  }

  return "Unknown device";
};

const getBrowserName = (userAgent: string | null) => {
  if (!userAgent) {
    return null;
  }

  const ua = userAgent.toLowerCase();

  if (ua.includes("edg/")) {
    return "Microsoft Edge";
  }

  if (ua.includes("opr/") || ua.includes("opera")) {
    return "Opera";
  }

  if (ua.includes("chrome/") && !ua.includes("edg/")) {
    return "Chrome";
  }

  if (ua.includes("firefox/")) {
    return "Firefox";
  }

  if (ua.includes("safari/") && !ua.includes("chrome/")) {
    return "Safari";
  }

  return null;
};

const SecuritySettings = ({
  lastPasswordChangedAt,
  sessions,
  hasPassword,
}: SecuritySettingsProps) => {
  const router = useRouter();

  // --------------------------------------------------
  // State
  // --------------------------------------------------

  const [sessionToRevoke, setSessionToRevoke] =
    useState<SecuritySession | null>(null);

  const [showRevokeOtherDialog, setShowRevokeOtherDialog] = useState(false);

  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const [actionId, setActionId] = useState<string | null>(null);

  const [isRevokingSession, setIsRevokingSession] = useState(false);

  const [isRevokingOtherSessions, setIsRevokingOtherSessions] = useState(false);

  const [isRevokingAllSessions, setIsRevokingAllSessions] = useState(false);

  // --------------------------------------------------
  // Change password
  // --------------------------------------------------

  const handleChangePassword = () => {
    router.push("/change-password");
  };

  // --------------------------------------------------
  // Revoke single session
  // --------------------------------------------------

  const handleRevokeSession = async (sessionId: string) => {
    if (actionId) {
      return;
    }

    setActionId(sessionId);

    try {
      const result = await revokeUserSession(sessionId);

      if (!result.success) {
        toast.error("Unable to revoke session", {
          description: result.error,
        });

        return;
      }

      toast.success("Session revoked", {
        description: result.message || "The selected session has been revoked.",
      });

      setSessionToRevoke(null);

      router.refresh();
    } catch (error) {
      console.error("[SecuritySettings] revoke session error:", error);

      toast.error("Unable to revoke session", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setActionId(null);
    }
  };

  // --------------------------------------------------
  // Revoke other sessions
  // --------------------------------------------------

  const handleRevokeOtherSessions = async () => {
    if (isRevokingOtherSessions) {
      return;
    }

    setIsRevokingOtherSessions(true);

    try {
      const result = await revokeOtherUserSessions();

      if (!result.success) {
        toast.error("Unable to revoke sessions", {
          description: result.error,
        });

        return;
      }

      toast.success("Sessions revoked", {
        description: result.message || "All other sessions have been revoked.",
      });

      setShowRevokeOtherDialog(false);

      router.refresh();
    } catch (error) {
      console.error("[SecuritySettings] revoke other sessions error:", error);

      toast.error("Unable to revoke sessions", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsRevokingOtherSessions(false);
    }
  };

  // --------------------------------------------------
  // Revoke all sessions
  // --------------------------------------------------

  const handleRevokeAllSessions = async () => {
    if (isRevokingAllSessions) {
      return;
    }

    setIsRevokingAllSessions(true);

    try {
      const result = await revokeAllUserSessions();

      if (!result.success) {
        toast.error("Unable to revoke sessions", {
          description: result.error,
        });

        return;
      }

      setShowRevokeAllDialog(false);

      toast.success("All sessions revoked", {
        description: result.message || "All sessions have been revoked.",
      });

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[SecuritySettings] revoke all sessions error:", error);

      toast.error("Unable to revoke sessions", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsRevokingAllSessions(false);
    }
  };

  const hasOtherSessions = sessions.some((session) => !session.isCurrent);

  return (
    <>
      <div className="max-w-xl space-y-8">
        {/* Password */}

        {hasPassword && (
          <section className="space-y-4">
            <div>
              <h3 className="text-base font-semibold">Password</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage your password and keep your account secure.
              </p>
            </div>

            <div className="mt-6 rounded-lg border">
              {/* Change password */}

              <div className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <KeyRoundIcon className="size-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium">Password</p>

                    <p className="text-sm text-muted-foreground">
                      Change your current password.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="link"
                  onClick={handleChangePassword}
                >
                  Change password
                </Button>
              </div>

              <Separator />

              {/* Last changed */}

              <div className="flex items-center gap-3 p-4">
                <Clock3Icon className="size-4 shrink-0 text-muted-foreground" />

                <div className="min-w-0">
                  <p className="text-sm font-medium">Last password change</p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {lastPasswordChangedAt
                      ? `${formatDate(lastPasswordChangedAt)}`
                      : "Password has not been changed yet."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Active Sessions */}

        <section className="space-y-4">
          {/* Header */}

          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold">Active sessions</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Review the devices currently signed in to your account.
              </p>
            </div>

            {hasOtherSessions && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  isRevokingOtherSessions || !!actionId || isRevokingAllSessions
                }
                onClick={() => setShowRevokeOtherDialog(true)}
              >
                {isRevokingOtherSessions ? (
                  <>
                    <Spinner className="size-5" />
                    Revoking...
                  </>
                ) : (
                  "Revoke other sessions"
                )}
              </Button>
            )}
          </div>

          {/* Sessions */}

          <div className="rounded-lg border">
            {sessions.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">
                  No active sessions found.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {sessions.map((session) => {
                  const browser = getBrowserName(session.userAgent);
                  const device = getDeviceName(session.userAgent);

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                          {getDeviceIcon(session.userAgent)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{device}</p>

                            {session.isCurrent && (
                              <Badge
                                variant={"outline"}
                                className="text-primary text-xs"
                              >
                                <CheckCircle2Icon/>
                                Current
                              </Badge>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            {browser && <span>{browser}</span>}

                            {session.ipAddress && (
                              <span>{session.ipAddress}</span>
                            )}

                            <span>
                              Last active - {formatDate(session.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Revoke individual session */}

                      {!session.isCurrent && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={
                            !!actionId ||
                            isRevokingOtherSessions ||
                            isRevokingAllSessions
                          }
                          onClick={() => setSessionToRevoke(session)}
                        >
                          {actionId === session.id ? (
                            <>
                              <Spinner className="size-5" />
                              Revoking...
                            </>
                          ) : (
                            <>
                              <LogOutIcon className="size-5" />
                              Revoke
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revoke all */}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={
                isRevokingAllSessions || isRevokingOtherSessions || !!actionId
              }
              onClick={() => setShowRevokeAllDialog(true)}
            >
              {isRevokingAllSessions ? (
                <>
                  <Spinner className="size-5" />
                  Revoking...
                </>
              ) : (
                "Revoke all sessions"
              )}
            </Button>
          </div>
        </section>
      </div>

      {/* --------------------------------------------------
          Revoke single session confirmation
          -------------------------------------------------- */}

      <AlertDialog
        open={!!sessionToRevoke}
        onOpenChange={(open) => {
          if (!open && !actionId) {
            setSessionToRevoke(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke session?</AlertDialogTitle>

            <AlertDialogDescription>
              This will sign out the selected device from your account. You will
              need to sign in again on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Separator />

          {sessionToRevoke && (
            <div className="rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  {getDeviceIcon(sessionToRevoke.userAgent)}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {getDeviceName(sessionToRevoke.userAgent)}
                  </p>

                  <p className="truncate text-sm text-muted-foreground">
                    {getBrowserName(sessionToRevoke.userAgent) ||
                      "Unknown browser"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="mt-2 flex-row gap-2">
            <AlertDialogCancel
              disabled={!!actionId}
              className="mt-0 flex-1"
              onClick={() => setSessionToRevoke(null)}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              className="flex-1"
              disabled={!!actionId}
              onClick={async () => {
                if (!sessionToRevoke) {
                  return;
                }

                await handleRevokeSession(sessionToRevoke.id);
              }}
            >
              {actionId === sessionToRevoke?.id ? (
                <>
                  <Spinner className="size-5" />
                  Revoking...
                </>
              ) : (
                "Revoke"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --------------------------------------------------
          Revoke other sessions confirmation
          -------------------------------------------------- */}

      <AlertDialog
        open={showRevokeOtherDialog}
        onOpenChange={(open) => {
          if (!open && !isRevokingOtherSessions) {
            setShowRevokeOtherDialog(false);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke other sessions?</AlertDialogTitle>

            <AlertDialogDescription>
              This will sign you out of all other devices. Your current session
              will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Separator />

          <div className="rounded-lg">
            <p className="text-sm text-muted-foreground">
              {sessions.filter((session) => !session.isCurrent).length} other{" "}
              {sessions.filter((session) => !session.isCurrent).length === 1
                ? "session"
                : "sessions"}{" "}
              will be revoked.
            </p>
          </div>

          <AlertDialogFooter className="mt-2 flex-row gap-2">
            <AlertDialogCancel
              disabled={isRevokingOtherSessions}
              className="mt-0 flex-1"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              className="flex-1"
              disabled={isRevokingOtherSessions}
              onClick={handleRevokeOtherSessions}
            >
              {isRevokingOtherSessions ? (
                <>
                  <Spinner className="size-5" />
                  Revoking...
                </>
              ) : (
                "Revoke sessions"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --------------------------------------------------
          Revoke all sessions confirmation
          -------------------------------------------------- */}

      <AlertDialog
        open={showRevokeAllDialog}
        onOpenChange={(open) => {
          if (!open && !isRevokingAllSessions) {
            setShowRevokeAllDialog(false);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke all sessions?</AlertDialogTitle>

            <AlertDialogDescription>
              This will sign you out of every device, including your current
              session. You will need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Separator />

          <div className="rounded-lg">
            <p className="text-sm text-muted-foreground">
              All {sessions.length}{" "}
              {sessions.length === 1 ? "session" : "sessions"} will be revoked.
            </p>
          </div>

          <AlertDialogFooter className="mt-2 flex-row gap-2">
            <AlertDialogCancel
              disabled={isRevokingAllSessions}
              className="mt-0 flex-1"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              className="flex-1"
              disabled={isRevokingAllSessions}
              onClick={handleRevokeAllSessions}
            >
              {isRevokingAllSessions ? (
                <>
                  <Spinner className="size-5" />
                  Revoking...
                </>
              ) : (
                "Revoke all"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SecuritySettings;
