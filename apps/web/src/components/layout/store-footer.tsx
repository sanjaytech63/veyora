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
    toast.success("Subscribed to Veyora Haute Couture Previews", {
      description:
        "You will receive exclusive invitations to upcoming festive drops and seasonal edits.",
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
              Contemporary Indian couture and modern ready-to-wear. Crafted from handwoven Chanderi
              silks, pure mulmul cotton, and heritage Banarasi brocades.
            </p>

            {/* Haute Couture Newsletter */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Atelier Gazette &amp; Private Drop Invites
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
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl px-4 text-xs h-9 font-semibold"
                >
                  <span>Join</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </form>
            </div>
          </div>

          {/* Quick Links Column 1: Fashion Categories */}
          <div className="lg:col-span-2 lg:col-start-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Fashion Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-foreground transition-colors">
                  Shop All Garments
                </Link>
              </li>
              <li>
                <Link href="/category/kurtis" className="hover:text-foreground transition-colors">
                  Kurtis &amp; Kurti Sets
                </Link>
              </li>
              <li>
                <Link
                  href="/category/ethnic-wear"
                  className="hover:text-foreground transition-colors"
                >
                  Festive Lehengas &amp; Ghagras
                </Link>
              </li>
              <li>
                <Link href="/category/sarees" className="hover:text-foreground transition-colors">
                  Banarasi &amp; Silk Sarees
                </Link>
              </li>
              <li>
                <Link href="/category/co-ords" className="hover:text-foreground transition-colors">
                  Linen Co-ords &amp; Loungewear
                </Link>
              </li>
              <li>
                <Link
                  href="/category/accessories"
                  className="hover:text-foreground transition-colors"
                >
                  Embroidered Dupattas
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 2: Client Services */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Client Concierge
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link href="/wishlist" className="hover:text-foreground transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-foreground transition-colors">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="hover:text-foreground transition-colors">
                  Express Checkout
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="hover:text-foreground transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/collections" className="hover:text-foreground transition-colors">
                  Curated Collections
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/80">Complimentary Size &amp; Fit Guide</span>
              </li>
            </ul>
          </div>

          {/* Platform Console Column */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Brand Operations
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <a
                  href="http://localhost:3001"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Atelier Merchant Portal</span>
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
                  <span>Service Telemetry</span>
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
            &copy; {new Date().getFullYear()} {SERVICES.NAME} Fashion Atelier. Contemporary Indian
            Couture &amp; Modern Apparel.
          </p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Artisan Ethics Certified</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
