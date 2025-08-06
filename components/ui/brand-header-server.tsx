import { getCurrentUser } from "@/lib/auth"
import { BrandHeader } from "./brand-header"

interface BrandHeaderServerProps {
  showAuth?: boolean
  showUserMenu?: boolean
  className?: string
}

export async function BrandHeaderServer({ 
  showAuth = true, 
  showUserMenu = false, 
  className = "" 
}: BrandHeaderServerProps) {
  let user = null
  
  try {
    user = await getCurrentUser()
  } catch (error) {
    // User not authenticated, continue with null user
    console.log("User not authenticated")
  }

  return (
    <BrandHeader 
      showAuth={showAuth} 
      showUserMenu={showUserMenu} 
      className={className}
      user={user}
    />
  )
} 