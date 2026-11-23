"use client";

import * as React from "react";
import { Container } from "@/components/ui/container";
import { FooterBrand } from "./FooterBrand";
import { FooterNewsletter } from "./FooterNewsletter";
import { FooterSocialLinks } from "./FooterSocialLinks";
import { FooterTrustSection } from "./FooterTrustSection";
import { FooterLinks } from "./FooterLinks";
import { FooterBottom } from "./FooterBottom";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
  showTrustSection?: boolean;
}

export function Footer({ className, showTrustSection = true }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border/80 bg-card/60 backdrop-blur-sm text-foreground",
        className
      )}
    >
      <Container size="xl" className="py-12 md:py-16 space-y-12">
        {showTrustSection && <FooterTrustSection />}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-start">
          {/* Brand, Gazette Newsletter & Socials */}
          <div className="lg:col-span-5 space-y-6">
            <FooterBrand />
            <FooterNewsletter />
            <div className="pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                Connect With Atelier
              </span>
              <FooterSocialLinks />
            </div>
          </div>

          {/* Department and Concierge Links */}
          <div className="lg:col-span-7">
            <FooterLinks />
          </div>
        </div>

        {/* Legal & Copyright */}
        <FooterBottom />
      </Container>
    </footer>
  );
}
