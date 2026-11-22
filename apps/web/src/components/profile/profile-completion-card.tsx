"use client";

import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileCompletionDto } from "@veyora/types";

interface ProfileCompletionCardProps {
  completion?: ProfileCompletionDto;
}

export function ProfileCompletionCard({ completion }: ProfileCompletionCardProps) {
  if (!completion) return null;

  const percentage = completion.percentage;

  return (
    <Card className="rounded-2xl border-border/80 shadow-xs bg-linear-to-br from-card to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold tracking-tight">Profile Completion</CardTitle>
          </div>
          <span className="text-xs font-extrabold text-primary tabular-nums">{percentage}%</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Completion items checklist */}
        <div className="space-y-2 pt-1">
          {completion.items.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                {item.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={item.isCompleted ? "text-foreground font-medium" : ""}>
                  {item.label}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                +{item.weight}%
              </span>
            </div>
          ))}
        </div>

        {percentage === 100 ? (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium text-center pt-1">
            Excellent! Your profile is fully complete.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            Complete the remaining items to receive personalized couture recommendations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
