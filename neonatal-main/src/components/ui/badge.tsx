import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary dark:border-[rgba(0,255,231,0.3)] dark:bg-[rgba(0,255,231,0.1)] dark:text-[#00ffe7] dark:shadow-[0_0_8px_rgba(0,255,231,0.2)]",
        secondary:
          "border-accent-foreground/15 bg-accent text-accent-foreground dark:border-[rgba(191,0,255,0.3)] dark:bg-[rgba(191,0,255,0.1)] dark:text-[#bf00ff] dark:shadow-[0_0_8px_rgba(191,0,255,0.2)]",
        destructive:
          "border-status-critical/20 bg-status-critical-bg text-status-critical dark:border-[rgba(255,0,60,0.3)] dark:bg-[rgba(255,0,60,0.1)] dark:text-[#ff003c] dark:shadow-[0_0_8px_rgba(255,0,60,0.2)]",
        outline:
          "border-border bg-background text-foreground dark:border-[rgba(0,255,231,0.2)] dark:bg-[rgba(255,255,255,0.03)] dark:text-[rgba(255,255,255,0.72)]",
        normal:
          "border-status-normal/20 bg-status-normal-bg text-status-normal dark:border-[rgba(0,255,136,0.3)] dark:bg-[rgba(0,255,136,0.1)] dark:text-[#00ff88] dark:shadow-[0_0_8px_rgba(0,255,136,0.2)] font-medium",
        warning:
          "border-status-warning/20 bg-status-warning-bg text-status-warning dark:border-[rgba(255,170,0,0.45)] dark:bg-[rgba(255,170,0,0.16)] dark:text-[#ffb300] dark:shadow-[0_0_12px_rgba(255,170,0,0.24)] font-medium",
        critical:
          "border-status-critical/20 bg-status-critical-bg text-status-critical dark:border-[rgba(255,64,96,0.45)] dark:bg-[rgba(255,0,60,0.16)] dark:text-[#ff4060] dark:shadow-[0_0_12px_rgba(255,0,60,0.26)] font-medium animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
