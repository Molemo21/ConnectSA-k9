import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, LogOut, Settings, Bell } from "lucide-react"

interface BrandHeaderProps {
  showAuth?: boolean
  showUserMenu?: boolean
  className?: string
  user?: {
    name?: string | null
    email?: string | null
  } | null
}

export function BrandHeader({ showAuth = true, showUserMenu = false, className = "", user = null }: BrandHeaderProps) {
  return (
    <header className={`border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">ProLiink Connect</span>
            <span className="text-xs text-gray-500">Trusted Services</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#services" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Services
          </Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            How it Works
          </Link>
          <Link href="/provider/onboarding" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
            Become a Provider
          </Link>
        </nav>

        {/* Auth/User Menu */}
        <div className="flex items-center space-x-3">
          {showUserMenu && user ? (
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user.name || user.email}
                </span>
              </div>
              <form action="/api/auth/logout" method="POST">
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </div>
          ) : showAuth ? (
            <div className="flex items-center space-x-3">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
} 