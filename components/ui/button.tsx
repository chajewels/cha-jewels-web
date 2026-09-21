import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border px-6 py-3 text-[15px] font-medium transition-[transform,background-color] duration-300 active:translate-y-px disabled:opacity-70",
  { variants: { variant: {
      solid: "border-transparent bg-orange text-charcoal-deep hover:bg-orange-hover",
      ghost: "border-gold bg-transparent text-gold-pale hover:border-gold-pale",
      // Quieter than ghost: the same approved gold border, but chalk text, so
      // a secondary action does not compete with the gold-pale headings it
      // sits beside. Both tokens are already in the contrast table.
      outline: "border-gold bg-transparent text-chalk hover:border-gold-pale hover:text-gold-pale",
      // The light-surface counterparts of the two above. They are separate
      // variants rather than a change to `ghost` / `outline` because both
      // surfaces exist at once until Group E: gold-pale is the readable gold
      // on charcoal and fails on white, gold-dark is the reverse. Group E
      // decides whether the dark pair survives as `-dark` variants or goes.
      // Nothing renders these yet.
      "ghost-light": "border-gold-dark text-gold-dark hover:border-charcoal-deep hover:text-charcoal-deep",
      "outline-light": "border-charcoal/60 text-charcoal-deep hover:border-charcoal-deep",
    } }, defaultVariants: { variant: "solid" } }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />;
});
Button.displayName = "Button";
