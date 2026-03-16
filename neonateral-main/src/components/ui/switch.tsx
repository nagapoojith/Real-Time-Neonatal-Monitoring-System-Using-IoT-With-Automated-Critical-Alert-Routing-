import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200 data-[state=checked]:border-status-normal/80 data-[state=checked]:bg-status-normal data-[state=unchecked]:border-slate-400/70 data-[state=unchecked]:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 dark:data-[state=unchecked]:border-slate-500/80 dark:data-[state=unchecked]:bg-slate-600",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full border border-slate-300 bg-white shadow-md ring-0 transition-transform duration-200 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0 dark:border-slate-200 dark:bg-slate-100",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
