"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { acceptOrganizationInvitation } from "@/server/organization/acceptOrganizationInvitation";
import { AcceptInvitationProps } from "@/types/organization/invitation";

const AcceptInvitation = ({ invitationId, organizationName }: AcceptInvitationProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const displayOrganizationName = organizationName || "the organization";

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      const result = await acceptOrganizationInvitation({
        invitationId,
      });

      if (!result.success) {
        // User must log in before accepting the invitation
        if (result.code === "UNAUTHORIZED") {
          const callbackUrl = `/invite/${invitationId}`;

          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);

          return;
        }

        // Organization has reached its employee limit
        if (result.code === "LIMIT_REACHED") {
          toast.error("Employee limit reached", {
            description: result.error,
          });

          return;
        }

        // Invitation is invalid / expired / already used
        if (result.code === "INVALID_INVITATION") {
          toast.error("Invalid invitation", {
            description: result.error || "This invitation is no longer valid.",
          });

          return;
        }

        // Organization could not be found
        if (result.code === "ORGANIZATION_NOT_FOUND") {
          toast.error("Organization not found", {
            description:
              result.error ||
              "The organization associated with this invitation could not be found.",
          });

          return;
        }

        // Fallback
        toast.error("Unable to accept invitation", {
          description:
            result.error || "Something went wrong. Please try again.",
        });

        return;
      }

      toast.success("Invitation accepted", {
        description:
          result.message || "You have successfully joined the organization.",
      });

      setRedirecting(true);
      router.push(`/org/${result.data.organizationSlug}`);
    } catch (error) {
      console.error("[AcceptInvite] error:", error);

      toast.error("Something went wrong", {
        description: "Please try again.",
      });
      setRedirecting(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {redirecting ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-4">
          <Spinner className="size-5 md:size-8" />

          <p className="text-sm md:text-base text-muted-foreground">
            Opening your organization...
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Join {displayOrganizationName}
            </h1>

            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              You&apos;ve been invited to join {displayOrganizationName} on
              StaffZeno.
            </p>
          </div>

          {/* Accept button */}
          <Button
            type="button"
            className="w-full"
            disabled={isLoading}
            onClick={onSubmit}
          >
            {isLoading ? (
              <>
                <Spinner className="size-4" />
                Accepting...
              </>
            ) : (
              "Accept invitation"
            )}
          </Button>

          {/* Additional notice */}
          <div className="space-y-1 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary hover:underline"
            >
              Already a part of {displayOrganizationName}?
            </Link>

            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Accepting this invitation will add you to{" "}
              {displayOrganizationName} and give you access to its workspace.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AcceptInvitation;
