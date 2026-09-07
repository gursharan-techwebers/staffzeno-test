"use client";

import { Button } from "../ui/button";
import { continueWithGoogle } from "@/lib/continueWithGoogle";
import { toast } from "sonner";
import { Google } from "./Google";
import { useState } from "react";
import { Spinner } from "../ui/spinner";

const ContinueWithGoogle = ({ title }: { title: string }) => {
  const [isLoading, setIsLoading] = useState(false);

  const onGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await continueWithGoogle();

      if (!result.success) {
        toast.error("Error", {
          description:
            result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      toast.success("Success", {
        description: result.message || "Redirecting to Google...",
      });
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Error", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      className="mb-2"
      disabled={isLoading}
      onClick={onGoogleLogin}
    >
      {isLoading ? (
        <Spinner className="size-5" />
      ) : (
        <>
          <Google className="mr-1" />
          {title}
        </>
      )}
    </Button>
  );
};

export default ContinueWithGoogle;
