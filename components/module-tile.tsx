"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleTileProps {
  title: string;
  href?: string;
  isActive?: boolean;
  isLocked?: boolean;
}

export function ModuleTile({
  title,
  href = "#",
  isActive = false,
  isLocked = false,
}: ModuleTileProps) {
  const content = (
    <div
      className={cn(
        "group relative flex aspect-square w-full flex-col items-center justify-center rounded-lg p-6 transition-all duration-200",
        isActive
          ? "border-2 border-dashed border-foreground-muted bg-background-card hover:scale-[1.02] hover:bg-background-hover cursor-pointer"
          : "border border-border bg-background-elevated cursor-not-allowed"
      )}
    >
      {isLocked ? (
        <Lock
          className="h-6 w-6 text-foreground-muted/50"
          strokeWidth={1.5}
        />
      ) : (
        <span
          className={cn(
            "text-center text-sm font-medium transition-colors",
            isActive
              ? "text-foreground group-hover:text-foreground-bright"
              : "text-foreground-muted"
          )}
        >
          {title}
        </span>
      )}
    </div>
  );

  if (isActive && href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
