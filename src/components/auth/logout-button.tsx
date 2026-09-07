"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutUser } from "@/server/auth/logout";

export function LogutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

  const onSubmit = async () => {
    try {
      setIsLoggingOut(true);
      const result = await logoutUser();

      if (!result.success) {
        toast.error("Logout Failed", {
          description:
            result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      toast.success("Logout Success", {
        description: result.message || "Logout Successfully",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout Failed", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={"destructive"}
      type="button"
      disabled={isLoggingOut}
      onClick={onSubmit}
    >
      {isLoggingOut ? <Spinner className="size-5" /> : "Logout"}
    </Button>
  );
}
