"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";

import { LogOut } from "lucide-react";

import { workSummarySchema } from "@/validators/organization/attendance/attendance";

import { WorkSummaryEditor } from "./WorkSummaryEditor";
import { MAX_WORK_SUMMARY_LENGTH } from "@/constants/attendance";

type PunchOutSummaryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (workSummary: string) => void;
  isPending?: boolean;
};

function getPlainTextLength(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim().length;
}

export function PunchOutSummaryDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: PunchOutSummaryDialogProps) {
  const [workSummary, setWorkSummary] = useState("");

  const validation = workSummarySchema.safeParse(workSummary);

  const isValid = validation.success;

  const plainTextLength = getPlainTextLength(workSummary);

  const handleConfirm = () => {
    if (!validation.success || isPending) {
      return;
    }

    onConfirm(validation.data);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) {
      return;
    }

    onOpenChange(nextOpen);

    if (!nextOpen) {
      setWorkSummary("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-2xl!">
        <AlertDialogHeader>
          <AlertDialogTitle>Before you punch out</AlertDialogTitle>

          <AlertDialogDescription>
            Please provide a brief summary of what you worked on during this
            session.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Separator />

        <FieldGroup>
          <Field>
            <FieldLabel>What did you work on?</FieldLabel>

            <WorkSummaryEditor
              value={workSummary}
              onChange={setWorkSummary}
              disabled={isPending}
              placeholder="Example: Updated the client website, fixed the contact form issue, and completed the SEO changes requested by the client."
            />

            <div className="flex items-start justify-between gap-4 text-xs text-muted-foreground">
              <span className={!isValid ? "text-destructive" : ""}>
                {!isValid
                  ? validation.error.issues[0]?.message
                  : "Summary looks good"}
              </span>

              <span className="shrink-0">
                {plainTextLength}/{MAX_WORK_SUMMARY_LENGTH}
              </span>
            </div>
          </Field>
        </FieldGroup>

        <AlertDialogFooter className="mt-2 flex-row gap-2">
          <AlertDialogCancel
            type="button"
            className="mt-0 flex-1"
            disabled={isPending}
          >
            Cancel
          </AlertDialogCancel>

          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={!isValid || isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <Spinner className="size-5" />
                Punching out...
              </>
            ) : (
              <>
                <LogOut className="mr-0.5 size-4" />
                Punch out
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
