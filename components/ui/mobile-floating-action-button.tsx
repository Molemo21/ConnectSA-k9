"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Plus, Search, Briefcase, Users } from "lucide-react"

interface MobileFloatingActionButtonProps {
  userRole: "CLIENT" | "PROVIDER" | "ADMIN"
  className?: string
}

export function MobileFloatingActionButton({ userRole, className }: MobileFloatingActionButtonProps) {
  const pathname = usePathname()

  const getFloatingAction = () => {
    switch (userRole) {
      case "CLIENT":
        // Don't show floating action button for clients
        return null
      
      case "PROVIDER":
        return {
          href: "/provider/bookings",
          icon: Briefcase,
          label: "Manage Jobs",
          isActive: pathname.startsWith("/provider") && pathname.includes("booking")
        }
      
      case "ADMIN":
        return {
          href: "/admin/users",
          icon: Users,
          label: "Manage Users",
          isActive: pathname.startsWith("/admin") && pathname.includes("user")
        }
      
      default:
        return null
    }
  }

  const floatingAction = getFloatingAction()
  
  if (!floatingAction) return null

  const Icon = floatingAction.icon

  return (
    <Link
      href={floatingAction.href}
      className={cn(
        "fixed bottom-20 right-4 z-50", // Position above bottom nav
        "flex items-center justify-center",
        "w-14 h-14 rounded-full shadow-lg",
        "transition-all duration-300 hover:scale-105",
        "sm:hidden", // Only show on mobile
        floatingAction.isActive
          ? "bg-blue-600 text-white shadow-blue-600/25"
          : "bg-blue-600 text-white hover:bg-blue-700",
        className
      )}
      title={floatingAction.label}
    >
      <Icon className="w-6 h-6" />
    </Link>
  )
}
