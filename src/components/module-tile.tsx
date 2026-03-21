"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { LivingPixels } from "@/components/living-pixels";

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
        "group relative flex h-40 w-full flex-col items-center justify-center rounded-xl overflow-hidden transition-all duration-300",
        isActive
          ? "border border-[#a3a3a3] bg-[#1a1a1a] hover:bg-[#222] cursor-pointer glow-effect"
          : "border border-[rgba(64,64,64,0.5)] bg-[#1a1a1a] hover:bg-[#222] cursor-default"
      )}
    >
      <div className={cn("absolute inset-0 card-bg-pattern transition-opacity", isActive ? "opacity-30 group-hover:opacity-50" : "opacity-20")} />
      <LivingPixels count={isActive ? 12 : 6} className={isActive ? undefined : "opacity-50"} />
      {isLocked ? (
        <Lock
          className="relative z-10 h-8 w-8 text-[#737373]"
          strokeWidth={1.5}
        />
      ) : (
        <span className="relative z-10 text-xl font-semibold tracking-wide text-white">
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
