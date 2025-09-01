import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/ui/user-menu"
import { MobileNavigation } from "./mobile-navigation.tsx"

interface BrandHeaderProps {
  showAuth?: boolean
  showUserMenu?: boolean
  className?: string
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
    avatar?: string | null
  } | null
}

export function BrandHeader({ showAuth = true, showUserMenu = false, className = "", user = null }: BrandHeaderProps) {
  return (
    <header className={`border-b border-gray-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Brand - Mobile Optimized */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <img 
              src="/handshake.png" 
              alt="ProLiink Connect Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
            />
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold text-white leading-tight">ProLiink Connect</span>
              <span className="text-xs text-gray-300 leading-tight hidden xs:block">Trusted Services</span>
            </div>
          </Link>

          {/* Navigation - Desktop Only */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link href="#services" className="text-gray-200 hover:text-blue-400 transition-colors font-medium text-sm lg:text-base">
              Services
            </Link>
            <Link href="#how-it-works" className="text-gray-200 hover:text-blue-400 transition-colors font-medium text-sm lg:text-base">
              How it Works
            </Link>
            <Link href="/provider/onboarding" className="text-gray-200 hover:text-blue-400 transition-colors font-medium text-sm lg:text-base">
              Become a Provider
            </Link>
          </nav>

          {/* Auth/User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {showUserMenu && user ? (
              <UserMenu user={user} />
            ) : showAuth ? (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" asChild className="text-sm lg:text-base text-gray-200 hover:text-white">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm lg:text-base text-white">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            ) : null}
          </div>

          {/* Mobile Navigation */}
          <MobileNavigation 
            user={user} 
            showAuth={showAuth} 
            showUserMenu={showUserMenu} 
          />
        </div>
      </div>
    </header>
  )
}