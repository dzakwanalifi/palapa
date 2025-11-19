import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-2xl border border-white/20 bg-white/80 backdrop-blur-md shadow-sm text-slate-950",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

export { Card }
