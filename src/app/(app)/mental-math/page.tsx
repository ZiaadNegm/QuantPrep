"use client";

import Link from "next/link";
import { LivingPixels } from "@/components/living-pixels";

export default function MentalMathPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <div className="flex flex-col md:flex-row gap-12 w-full max-w-4xl justify-center items-center">
        <Link
          href="/mental-math/practice"
          className="group relative w-full max-w-[320px] aspect-square bg-[#1a1a1a] border border-[rgba(64,64,64,0.3)] hover:border-[rgba(255,255,255,0.5)] rounded-xl transition-all duration-500 overflow-hidden flex flex-col items-center justify-center"
        >
          <div className="absolute inset-0 card-bg-pattern opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          <LivingPixels />
          <span className="relative z-10 text-sm font-semibold uppercase tracking-[0.25em] text-[#c6c6c6] group-hover:text-white transition-colors duration-500">
            Practice
          </span>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-t from-white to-transparent" />
        </Link>

        <Link
          href="/mental-math/test"
          className="group relative w-full max-w-[320px] aspect-square bg-[#1a1a1a] border border-[rgba(64,64,64,0.3)] hover:border-[rgba(255,255,255,0.5)] rounded-xl transition-all duration-500 overflow-hidden flex flex-col items-center justify-center"
        >
          <div className="absolute inset-0 card-bg-pattern opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          <LivingPixels />
          <span className="relative z-10 text-sm font-semibold uppercase tracking-[0.25em] text-[#c6c6c6] group-hover:text-white transition-colors duration-500">
            Test
          </span>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-t from-white to-transparent" />
        </Link>
      </div>
    </div>
  );
}
