import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border px-6 py-3 text-[15px] font-medium transition-[transform,background-position] duration-300 active:translate-y-px disabled:opacity-70",
  { variants: { variant: {
      solid: "border-transparent bg-[linear-gradient(100deg,#8A6B12,#C9A227_45%,#E8D28A_75%,#C9A227)] bg-[length:200%_100%] text-ink hover:bg-[position:100%_0]",
      ghost: "border-gold bg-transparent text-gold-pale hover:border-gold-pale",
    } }, defaultVariants: { variant: "solid" } }
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />;
});
Button.displayName = "Button";
