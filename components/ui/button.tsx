import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border px-6 py-3 text-[15px] font-medium transition-[transform,background-color] duration-300 active:translate-y-px disabled:opacity-70",
  { variants: { variant: {
      solid: "border-transparent bg-orange text-charcoal-deep hover:bg-orange-hover",
      // The body is light, so these are the only pair. The dark counterparts
      // (gold-pale text on a gold border) were deleted with the body flip:
      // gold-pale is 1.37:1 on chalk and had nowhere left to render. A button
      // that must sit on a dark band overrides the colours at the call site —
      // components/home/hero-slides.tsx is the one place that does, and it
      // overrides all four, hover included.
      ghost: "border-gold-dark bg-transparent text-gold-dark hover:border-charcoal-deep hover:text-charcoal-deep",
      // Quieter than ghost: a charcoal edge rather than a gold one, so a
      // secondary action does not compete with what it sits beside.
      outline: "border-charcoal/60 bg-transparent text-charcoal-deep hover:border-charcoal-deep",
    } }, defaultVariants: { variant: "solid" } }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />;
});
Button.displayName = "Button";
