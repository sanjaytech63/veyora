import * as React from "react";
import { Instagram, Youtube, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterSocialLinksProps {
  className?: string;
}

export function FooterSocialLinks({ className }: FooterSocialLinksProps) {
  const socials = [
    {
      name: "Instagram",
      href: "https://instagram.com",
      icon: Instagram,
      label: "Follow Veyora on Instagram",
    },
    {
      name: "YouTube",
      href: "https://youtube.com",
      icon: Youtube,
      label: "Watch Veyora fashion drops on YouTube",
    },
    {
      name: "X (Twitter)",
      href: "https://twitter.com",
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
