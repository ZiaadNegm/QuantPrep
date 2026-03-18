"use client";

import Link from "next/link";

export default function MentalMathPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <div className="grid w-full max-w-3xl grid-cols-2 gap-8">
        <Link
          href="/mental-math/practice"
          className="flex aspect-[5/3] items-center justify-center rounded-lg border-2 border-dashed border-foreground-muted bg-background-card transition-all duration-200 hover:scale-[1.02] hover:bg-background-hover"
        >
          <span className="font-mono text-3xl font-bold text-foreground-bright sm:text-4xl">
            Practice
          </span>
        </Link>

        <Link
          href="/mental-math/test"
          className="flex aspect-[5/3] items-center justify-center rounded-lg border-2 border-dashed border-foreground-muted bg-background-card transition-all duration-200 hover:scale-[1.02] hover:bg-background-hover"
        >
          <span className="font-mono text-3xl font-bold text-foreground-bright sm:text-4xl">
            Test
          </span>
        </Link>
      </div>
    </div>
  );
}
