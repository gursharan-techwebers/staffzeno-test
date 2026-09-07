"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
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

import CreateOrganizationDialog from "@/components/organization/create-organization-dialog";

const OnboardingChoice = () => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [organizationDialogOpen, setOrganizationDialogOpen] = useState(false);

  const handleCreateOrganization = () => {
    setConfirmationOpen(true);
  };

  const handleConfirmOwner = () => {
    setConfirmationOpen(false);
    setOrganizationDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to StaffZeno!
          </h1>

          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Let&apos;s get your workspace set up.
          </p>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleCreateOrganization}
        >
          Create first organization
        </Button>

        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Joining an existing company?
          </p>

          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Ask your company owner or administrator to invite you to their
            organization.
          </p>
        </div>
      </div>

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you setting up your own company?
            </AlertDialogTitle>

            <AlertDialogDescription>
              Creating an organization is for company owners or administrators
              setting up StaffZeno for their team.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1">
              No, I&apos;m not
            </AlertDialogCancel>

            <AlertDialogAction className="flex-1" onClick={handleConfirmOwner}>
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateOrganizationDialog
        open={organizationDialogOpen}
        onOpenChange={setOrganizationDialogOpen}
      />
    </>
  );
};

export default OnboardingChoice;
