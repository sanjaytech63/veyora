import * as React from "react";
import { Instagram, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

interface FooterSocialLinksProps {
  className?: string;
}

export function FooterSocialLinks({ className }: FooterSocialLinksProps) {
  const socials = [
    {
      name: "Instagram",
      href: siteConfig.links.instagram,
      icon: Instagram,
      label: "Follow Veyora on Instagram",
    },
    {
      name: "X (Twitter)",
      href: siteConfig.links.twitter,
      icon: Twitter,
      label: "Follow Veyora on X",
    },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {socials.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.label}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-primary transition-colors"
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
    </div>
  );
}
