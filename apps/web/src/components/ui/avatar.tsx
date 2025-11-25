import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  email?: string
  size?: "sm" | "md" | "lg"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, email, size = "md", ...props }, ref) => {
    const getInitials = () => {
      if (name) {
        return name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      }
      if (email) {
        return email[0].toUpperCase()
      }
      return "U"
    }

    const sizeClasses = {
      sm: "w-6 h-6 text-xs",
      md: "w-8 h-8 text-sm",
      lg: "w-10 h-10 text-base"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {getInitials()}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }

