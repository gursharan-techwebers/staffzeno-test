"use client";

import { useMemo, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { deleteOrganization } from "@/server/organization/deleteOrganization";

type DangerSettingsProps = {
  organization: {
    id: string;
    name: string;
  };
};

const DELETE_CONFIRMATION_TEXT = "delete the organization";

const DangerSettings = ({ organization }: DangerSettingsProps) => {
  const [open, setOpen] = useState(false);

  const [organizationName, setOrganizationName] = useState("");

  const [confirmationText, setConfirmationText] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  // --------------------------------------------------
  // Check confirmation
  // --------------------------------------------------

  const canDelete = useMemo(() => {
    return (
      organizationName === organization.name &&
      confirmationText === DELETE_CONFIRMATION_TEXT
    );
  }, [organization.name, organizationName, confirmationText]);

  // --------------------------------------------------
  // Reset confirmation fields
  // --------------------------------------------------

  const resetConfirmation = () => {
    setOrganizationName("");
    setConfirmationText("");
  };

  // --------------------------------------------------
  // Dialog open change
  // --------------------------------------------------

  const handleOpenChange = (value: boolean) => {
    if (isDeleting) {
      return;
    }

    setOpen(value);

    if (!value) {
      resetConfirmation();
    }
  };

  // --------------------------------------------------
  // Delete organization
  // --------------------------------------------------

  const handleDeleteOrganization = async () => {
    if (!canDelete || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);

      const result = await deleteOrganization();

      if (!result.success) {
        toast.error("Unable to delete organization", {
          description: result.error,
        });

        return;
      }

      toast.success("Organization deleted", {
        description:
          result.message || "The organization has been permanently deleted.",
      });

      // --------------------------------------------------
      // Redirect after successful deletion
      // --------------------------------------------------

      window.location.href = "/login";
    } catch (error) {
      console.error("[DangerSettings] delete organization error:", error);

      toast.error("Unable to delete organization", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* --------------------------------------------------
          Danger Zone
      -------------------------------------------------- */}

      <div className="space-y-6">
        {/* Header */}

        <div>
          <div className="flex items-center gap-2">
            <TriangleAlertIcon className="size-4 text-destructive" />

            <h3 className="text-base font-semibold text-destructive">
              Danger Zone
            </h3>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete your organization and all of its associated data.
          </p>
        </div>

        {/* Delete organization */}

        <div className="rounded-lg border border-destructive/30 p-5">
          <div className="space-y-2">
            <h4 className="font-medium">Delete organization</h4>

            <p className="text-sm text-muted-foreground">
              Once you delete your organization, there is no way to recover it.
              This action will permanently remove the organization and its
              associated data.
            </p>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setOpen(true)}
            >
              <TriangleAlertIcon className="size-4" />
              Delete organization
            </Button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------
          Delete confirmation dialog
      -------------------------------------------------- */}

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlertIcon className="size-5" />
              Delete organization
            </AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {organization.name}
              </span>{" "}
              and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Separator />

          <FieldGroup className="-space-y-3">
            {/* Organization name */}

            <Field>
              <FieldLabel htmlFor="delete-organization-name">
                Organization name
              </FieldLabel>

              <Input
                id="delete-organization-name"
                type="text"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder={organization.name}
                disabled={isDeleting}
                autoComplete="off"
              />

              <FieldDescription>
                Type{" "}
                <span className="font-medium text-foreground">
                  {organization.name}
                </span>{" "}
                to confirm.
              </FieldDescription>
            </Field>

            {/* Confirmation phrase */}

            <Field>
              <FieldLabel htmlFor="delete-organization-confirmation">
                Confirmation
              </FieldLabel>

              <Input
                id="delete-organization-confirmation"
                type="text"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                placeholder={DELETE_CONFIRMATION_TEXT}
                disabled={isDeleting}
                autoComplete="off"
              />

              <FieldDescription>
                Type{" "}
                <span className="font-medium text-foreground">
                  {DELETE_CONFIRMATION_TEXT}
                </span>{" "}
                to confirm deletion.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <AlertDialogFooter className="mt-2 flex-row gap-2">
            <AlertDialogCancel
              type="button"
              className="mt-0 flex-1"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>

            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              disabled={!canDelete || isDeleting}
              onClick={handleDeleteOrganization}
            >
              {isDeleting ? (
                <>
                  <Spinner className="size-5" />
                  Deleting...
                </>
              ) : (
                <>
                  <TriangleAlertIcon className="size-4" />
                  Delete organization
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DangerSettings;
