import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
