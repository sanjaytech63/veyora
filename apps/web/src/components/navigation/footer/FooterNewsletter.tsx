"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, LoaderCircle, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { newsletterApi } from "@/lib/api/newsletter-api";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";

const newsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  consent: z.literal(true),
});

export function FooterNewsletter({ className }: { className?: string }) {
  const [email, setEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const inFlightRef = React.useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlightRef.current) return;
    setErrorMessage(null);

    const validation = newsletterSchema.safeParse({ email, consent });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "Invalid email address");
      return;
    }

    setStatus("loading");
    inFlightRef.current = true;

    try {
      const result = await newsletterApi.subscribe({
        email: validation.data.email,
        consent: true,
      });
      if (notifyApiSuccess(result)) {
        setStatus("success");
        setEmail("");
        setConsent(false);
      } else {
        setStatus("idle");
      }
    } catch (error) {
      setStatus("error");
      notifyApiError(error, "Could not complete subscription. Please try again.");
    } finally {
      inFlightRef.current = false;
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1.5">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          A little more style in your inbox.
        </h2>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Receive new arrivals and curated collection updates from Veyora.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-3">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email address
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="footer-newsletter-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            disabled={status === "loading"}
            className={cn(
              "h-11 rounded-md bg-background text-sm",
              errorMessage && "border-destructive focus-visible:ring-destructive"
            )}
            aria-describedby={errorMessage ? "footer-newsletter-error" : undefined}
            aria-invalid={Boolean(errorMessage)}
            required
          />
          <Button
            type="submit"
            disabled={status === "loading"}
            className="h-11 shrink-0 gap-2 rounded-md px-5 text-sm font-semibold"
          >
            {status === "loading" ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : status === "success" ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <>
                <span>Subscribe</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
        <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              if (errorMessage) setErrorMessage(null);
            }}
            disabled={status === "loading"}
            className="mt-0.5 h-3.5 w-3.5 rounded border-border"
          />
          <span>I agree to receive Veyora newsletter emails.</span>
        </label>

        {errorMessage && (
          <p
            id="footer-newsletter-error"
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errorMessage}
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {status === "success" ? "Subscription request received." : ""}
        </p>
      </form>
    </div>
  );
}
