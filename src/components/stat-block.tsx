import { cn } from "@/lib/utils";

interface StatBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
}

export function StatBlock({ label, value, subtext, className }: StatBlockProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs uppercase tracking-wider text-foreground-muted">
        {label}
      </span>
      <span className="font-mono text-xl font-medium text-foreground-bright">
        {value}
      </span>
      {subtext && (
        <span className="text-xs text-foreground-muted">{subtext}</span>
      )}
    </div>
  );
}
