import { getCurrentUser } from "@/lib/auth"
import { BrandHeader } from "./brand-header"

interface BrandHeaderServerProps {
  showAuth?: boolean
  showUserMenu?: boolean
  className?: string
}

export async function BrandHeaderServer({ showAuth = true, showUserMenu = false, className = "" }: BrandHeaderServerProps) {
  const user = showUserMenu ? await getCurrentUser() : null

  return (
    <BrandHeader 
      showAuth={showAuth} 
      showUserMenu={showUserMenu} 
      className={className}
      user={user}
    />
  )
} 