"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOtpSchema, VerifyOtpInput } from "@veyora/validators";
import { authApi } from "@/lib/api/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/api-client";
import { KeyRound, LoaderCircle, RefreshCw } from "lucide-react";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const { setAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  const form = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: emailParam,
      otp: "",
      type: "EMAIL_VERIFICATION",
    },
  });

  React.useEffect(() => {
    if (emailParam) {
      form.setValue("email", emailParam);
    }
  }, [emailParam, form]);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function onSubmit(values: VerifyOtpInput) {
    setIsSubmitting(true);
    try {
      const response = await authApi.verifyEmail(values);
      setAuth(response.user, response.accessToken);
      toast.success("Email verified successfully!", {
        description: `Welcome to Veyora, ${response.user.firstName}!`,
      });
      router.push("/");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error("Verification Failed", {
          description: err.message,
        });
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    const email = form.getValues("email");
    if (!email) {
      toast.error("Please enter your email address to resend the code.");
      return;
    }

    setIsResending(true);
    try {
      await authApi.resendOtp({ email, type: "EMAIL_VERIFICATION" });
      toast.success("Verification code resent!", {
        description: "Please check your inbox for the new 6-digit code.",
      });
      setResendCooldown(60);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error("Could not resend code", {
          description: err.message,
        });
      } else {
        toast.error("Failed to resend code.");
      }
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit verification code sent to your email address
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        disabled={isSubmitting || Boolean(emailParam)}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6-Digit Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        maxLength={6}
                        className="text-center tracking-widest text-lg font-mono"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign in"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendOtp}
              disabled={isResending || resendCooldown > 0}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Sending code...
                </>
              ) : resendCooldown > 0 ? (
                `Resend code in ${resendCooldown}s`
              ) : (
                "Didn't receive code? Resend"
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 border-t pt-4 text-center text-sm text-muted-foreground">
          <div>
            Need to change your account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Back to Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <React.Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center">Loading...</div>}>
      <VerifyOtpForm />
    </React.Suspense>
  );
}
