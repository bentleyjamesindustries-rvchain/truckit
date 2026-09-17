import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export const buttonVariants = cva(
  "cta-press inline-flex items-center justify-center gap-2 font-semibold select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  {
    variants: {
      variant: {
        accent: "bg-accent text-accent-fg shadow-sm hover:brightness-[0.97] rounded-[var(--radius-lg)]",
        primary: "bg-primary text-primary-fg shadow-sm hover:brightness-110 rounded-[var(--radius-lg)]",
        outline: "border border-border bg-surface text-fg hover:bg-wash rounded-[var(--radius-lg)]",
        ghost: "text-fg hover:bg-wash rounded-[var(--radius-lg)]",
        live: "bg-live text-live-fg shadow-sm rounded-[var(--radius-lg)]",
      },
      size: {
        md: "h-12 px-5 text-sm",
        sm: "h-11 px-3.5 text-sm",
        lg: "h-14 px-6 text-base",
        pill: "h-9 px-3.5 text-sm rounded-full",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
