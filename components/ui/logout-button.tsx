"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useLogout } from "@/hooks/use-logout"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export function LogoutButton({ 
  variant = "outline", 
  size = "sm", 
  className = "",
  showIcon = true,
  children = "Logout"
}: LogoutButtonProps) {
  const { logout, isLoggingOut } = useLogout()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={logout}
      disabled={isLoggingOut}
      className={className}
    >
      {showIcon && <LogOut className="w-4 h-4 mr-2" />}
      {isLoggingOut ? "Logging out..." : children}
    </Button>
  )
} 