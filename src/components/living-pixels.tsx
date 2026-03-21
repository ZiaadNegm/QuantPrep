import { cn } from "@/lib/utils";

interface LivingPixelsProps {
  count?: number;
  className?: string;
}

export function LivingPixels({ count = 12, className }: LivingPixelsProps) {
  return (
    <div className={cn("living-pixels", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="pixel animate-pixel-flicker" />
      ))}
    </div>
  );
}
