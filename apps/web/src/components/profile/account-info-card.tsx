import { ShieldCheck, Calendar, Mail, UserCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserProfileDto } from "@veyora/types";

interface AccountInfoCardProps {
  profile: UserProfileDto;
}

export function AccountInfoCard({ profile }: AccountInfoCardProps) {
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recent";

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight">Account Overview</CardTitle>
          <Badge
            variant="outline"
            className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          >
            {profile.isActive ? "Active Account" : "Suspended"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Email Verification
          </span>
          {profile.isEmailVerified ? (
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Unverified
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between py-1 border-b border-border/40">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5" />
            Account Role
          </span>
          <span className="font-semibold text-foreground capitalize">{profile.role} Patron</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Patron Since
          </span>
          <span className="font-medium text-foreground">{memberSince}</span>
        </div>
      </CardContent>
    </Card>
  );
}
