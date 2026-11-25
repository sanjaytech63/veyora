import { Container } from "@/components/ui/container";
import { FooterBrand } from "./FooterBrand";
import { FooterNewsletter } from "./FooterNewsletter";
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
    <footer className={cn("border-t border-border/80 bg-card text-foreground", className)}>
      <Container size="xl" className="py-10 sm:py-12 md:py-16">
        {showTrustSection && (
          <div className="border-b border-border/70 pb-10 sm:pb-12">
            <FooterTrustSection />
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 pt-10 sm:pt-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5 space-y-8">
            <FooterBrand />
            <FooterNewsletter />
          </div>

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
