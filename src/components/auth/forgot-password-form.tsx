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
  ForgotPasswordInput,
  forgotPasswordSchema,
} from "@/validators/auth/auth";
import { toast } from "sonner";
import { requestPasswordReset } from "@/server/auth/forgotPassword";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      const result = await requestPasswordReset(values.email);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof ForgotPasswordInput, {
                type: "server",
                message,
              });
            }
          }
        }

        toast.error("Request Failed", {
          description:
            result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      toast.success("Request Success", {
        description:
          result.message ||
          "If an account exists, we've sent a password reset link to your email.",
      });
      reset();
    } catch (error) {
      console.error("Request error:", error);
      toast.error("Request Failed", {
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
          <h1 className="text-2xl font-bold">Forgot Password</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to receive a password reset link
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            className="bg-background"
            {...register("email")}
          />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>
        <Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="size-5" /> : "Send Reset Link"}
          </Button>
        </Field>
        <Field>
          <FieldDescription className="px-6 text-center">
            Remember your password? <Link href="/login">Login</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
