"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { SERVICES } from "@veyora/config";
import { toast } from "sonner";

export function StoreFooter() {
  const [email, setEmail] = React.useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Subscribed to Veyora Atelier Gazette", {
      description: "You will receive preview invitations to upcoming releases.",
    });
    setEmail("");
  };

  return (
    <footer className="border-t border-border/80 bg-card/60 backdrop-blur-sm text-foreground">
      <Container size="xl" className="py-16 md:py-20 space-y-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="font-extrabold tracking-tight">{SERVICES.NAME}</span>
            </Link>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Minimalist, precision-engineered hardware and bespoke carry. Crafted from aircraft-grade aluminum, virgin merino, and planar acoustics.
            </p>

            {/* Atelier Gazette Newsletter */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Atelier Gazette &amp; Early Releases
              </span>
              <form onSubmit={handleSubscribe} className="flex max-w-sm gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl text-xs h-9 bg-background"
                  required
                />
                <Button type="submit" size="sm" className="rounded-xl px-4 text-xs h-9">
                  <span>Join</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </form>
            </div>
          </div>

          {/* Quick Links Column 1 */}
          <div className="lg:col-span-2 lg:col-start-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Catalog &amp; Series
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-foreground transition-colors">
                  Shop All Releases
                </Link>
              </li>
              <li>
                <Link href="/category/audio" className="hover:text-foreground transition-colors">
                  Acoustic Audio
                </Link>
              </li>
              <li>
                <Link href="/category/workspace" className="hover:text-foreground transition-colors">
                  Workspace Systems
                </Link>
              </li>
              <li>
                <Link href="/category/power" className="hover:text-foreground transition-colors">
                  Power &amp; Charging
                </Link>
              </li>
              <li>
                <Link href="/category/carry" className="hover:text-foreground transition-colors">
                  Bespoke Carry
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 2 */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Client Services
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/wishlist" className="hover:text-foreground transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-foreground transition-colors">
                  Review Shopping Bag
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-foreground transition-colors">
                  Express Checkout
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/80">Complimentary 30-Day Returns</span>
              </li>
              <li>
                <span className="text-muted-foreground/80">2-Year Atelier Warranty</span>
              </li>
            </ul>
          </div>

          {/* Platform Console Column */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Platform &amp; Infrastructure
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Atelier Admin Console</span>
                  <span className="text-[10px] font-mono">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:4000/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <span>API Telemetry Status</span>
                  <span className="text-[10px] font-mono">↗</span>
                </a>
              </li>
              <li className="pt-2 text-[11px] text-muted-foreground/70">
                100% Carbon-Neutral Insured Worldwide Express Logistics
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 pt-8 flex flex-col md:flex-row items-center justify-between text-[11px] text-muted-foreground gap-4">
          <p>
            &copy; {new Date().getFullYear()} {SERVICES.NAME} Atelier. Precision Instruments for Modern Living.
          </p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Carbon Neutral Certified</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
