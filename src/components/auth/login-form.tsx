import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginInput, loginSchema } from "@/validators/auth/auth";
import { loginUser } from "@/server/auth/login";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ContinueWithGoogle from "../shared/ContinueWithGoogle";
import { authClient } from "@/lib/auth-client";
import { Badge } from "../ui/badge";
import { useEffect, useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      const result = await loginUser(values);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            const message = messages?.[0];

            if (message) {
              setError(field as keyof LoginInput, {
                type: "server",
                message,
              });
            }
          }
        }

        if (result.error === "Email not verified") {
          setTimeout(() => {
            router.push("/verify");
          }, 1500);
        }

        toast.error("Login Failed", {
          description:
            result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      toast.success("Login Success", {
        description: result.message || "Login Successfully",
      });
      reset();
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login Failed", {
        description: "Something went wrong. Please try again.",
      });
    }
  };

  const [lastMethod, setLastMethod] = useState<"google" | "email" | null>(null);

  useEffect(() => {
    const method = authClient.getLastUsedLoginMethod();

    if (method === "google" || method === "email") {
      setLastMethod(method);
    }
  }, []);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center mb-2">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              className="bg-background"
              {...register("email")}
            />
            {lastMethod === "email" && (
              <Badge className="absolute -top-2 right-2 w-max!">
                Last used
              </Badge>
            )}
          </div>
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>

        <div className="relative">
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="bg-background"
              {...register("password")}
            />
            {errors.password && (
              <FieldError>{errors.password.message}</FieldError>
            )}
          </Field>

          <Link
            href="/forgot-password"
            className="absolute right-0 top-1 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            Forgot Password?
          </Link>
        </div>

        <Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="size-5" /> : "Login"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field className="relative">
          <ContinueWithGoogle title="Login with Google" />
          {lastMethod === "google" && (
            <Badge className="absolute -top-2 right-2 w-max!">Last used</Badge>
          )}
          <FieldDescription className="px-6 text-center">
            Don&apos;t have an account? <Link href="/signup">Sign up</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
