import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResetPasswordInput,
  resetPasswordSchema,
} from "@/validators/auth/auth";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { resetPassword } from "@/server/auth/resetPassword";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
  });

  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const onSubmit = async (values: ResetPasswordInput) => {
    if (!token) {
      toast.error("Reset failed", {
        description: "This password reset link is invalid or has expired.",
      });

      return;
    }

    try {
      const result = await resetPassword({
        ...values,
        token,
      });

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof ResetPasswordInput, {
                type: "server",
                message,
              });
            }
          }
        }

        toast.error("Password Reset Failed", {
          description:
            result.error || "Could not reset your password. Please try again.",
        });

        return;
      }

      toast.success("Password Reset Successful", {
        description:
          result.message || "Your password has been reset successfully.",
      });

      reset();

      router.push("/login");
    } catch (error) {
      console.error("Password reset error:", error);

      toast.error("Password Reset Failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center mb-2">
          <h1 className="text-2xl font-bold">Create a new password</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter a new password to secure your account again
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className="bg-background pr-10"
              {...register("password")}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-0.5 text-muted-foreground hover:text-foreground"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff className="size-4" strokeWidth={1.7} />
              ) : (
                <Eye className="size-4" strokeWidth={1.7} />
              )}
            </Button>
          </div>
          {errors.password && (
            <FieldError>{errors.password.message}</FieldError>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className="bg-background"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <FieldError>{errors.confirmPassword.message}</FieldError>
          )}
        </Field>

        <Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="size-5" /> : "Reset Password"}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="px-6 text-center">
            Don&apos;t want to reset your password?{" "}
            <Link href="/login">Login</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
