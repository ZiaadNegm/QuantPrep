import { cn } from "@/lib/utils";

interface StatBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  progressPercent?: number;
  className?: string;
}

export function StatBlock({ label, value, subtext, progressPercent, className }: StatBlockProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3] mb-1">
        {label}
      </span>
      <div className="text-3xl font-bold text-white flex items-baseline gap-1">
        {value}
        {subtext && (
          <span className="text-sm font-normal text-[#a3a3a3]">{subtext}</span>
        )}
      </div>
      {progressPercent != null && (
        <div className="mt-2 w-full bg-[#171717] rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#d4d4d4] h-1.5 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
}
