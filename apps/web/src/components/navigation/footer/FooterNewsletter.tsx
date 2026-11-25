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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = newsletterSchema.safeParse({ email, consent });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "Invalid email address");
      return;
    }

    setStatus("loading");

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
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Atelier Gazette &amp; Private Drop Invites
        </h4>
        <p className="text-xs text-muted-foreground">
          Receive exclusive previews of seasonal silhouettes, festive drops, and private atelier
          sales.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2 max-w-sm">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            disabled={status === "loading"}
            className={cn(
              "rounded-xl text-xs h-9 bg-background",
              errorMessage && "border-destructive focus-visible:ring-destructive"
            )}
            aria-label="Email address for atelier newsletter"
            required
          />
          <Button
            type="submit"
            size="sm"
            disabled={status === "loading"}
            className="rounded-xl px-4 text-xs h-9 font-semibold shrink-0 gap-1.5"
          >
            {status === "loading" ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <>
                <span>Join</span>
                <ArrowRight className="h-3 w-3" />
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
          <span>I agree to receive occasional newsletter and private preview emails.</span>
        </label>

        {errorMessage && (
          <p className="text-[11px] text-destructive font-medium pl-1">{errorMessage}</p>
        )}
      </form>
    </div>
  );
}
