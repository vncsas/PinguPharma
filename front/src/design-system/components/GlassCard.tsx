import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padded = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("card", padded && "p-5", className)}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

export const GlassCard = Card;
