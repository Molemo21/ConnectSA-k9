import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoadingButton as EnhancedButton } from "@/components/ui/enhanced-loading-button"
import { LoadingLink } from "@/components/ui/loading-link"
import { SafeUserMenu } from "@/components/ui/safe-user-menu"
import { LanguageSwitcher } from "./language-switcher"
import { Mail, Phone, MapPin, Clock, Globe } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useLanguage } from "@/contexts/LanguageContext"

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
  userStats?: {
    totalBookings?: number
    pendingBookings?: number
    completedBookings?: number
    rating?: number
  }
  // Loading states
  servicesLoading?: boolean
  signInLoading?: boolean
  onServicesClick?: () => void
  onSignInClick?: () => void
}

export function BrandHeader({ 
  showAuth = true, 
  showUserMenu = false, 
  className = "", 
  user = null, 
  userStats,
  servicesLoading = false,
  signInLoading = false,
  onServicesClick,
  onSignInClick
}: BrandHeaderProps) {
  const { t } = useLanguage()
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isContactAnimating, setIsContactAnimating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Memoize userStats to prevent infinite re-renders in UserMenu
  const memoizedUserStats = useMemo(() => userStats, [userStats?.totalBookings, userStats?.pendingBookings, userStats?.completedBookings, userStats?.rating])

  const handleExploreClick = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    if (isExploreOpen) {
      // Closing animation
      setIsExploreOpen(false)
      setTimeout(() => setIsAnimating(false), 300)
    } else {
      // Opening animation
      setIsExploreOpen(true)
      setTimeout(() => setIsAnimating(false), 100)
    }
  }

  const handleContactClick = () => {
    if (isContactAnimating) return
    
    setIsContactAnimating(true)
    if (isContactOpen) {
      // Closing animation
      setIsContactOpen(false)
      setTimeout(() => setIsContactAnimating(false), 300)
    } else {
      // Opening animation
      setIsContactOpen(true)
      setTimeout(() => setIsContactAnimating(false), 100)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isExploreOpen) {
          setIsAnimating(true)
          setIsExploreOpen(false)
          setTimeout(() => setIsAnimating(false), 300)
        }
      }
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        if (isContactOpen) {
          setIsContactAnimating(true)
          setIsContactOpen(false)
          setTimeout(() => setIsContactAnimating(false), 300)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExploreOpen, isContactOpen])

  return (
    <>
      <header className={`border-b border-gray-800/30 bg-transparent backdrop-blur-sm sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Brand - Mobile First */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <img 
              src="/handshake.png" 
              alt="ProLiink Connect Logo" 
              className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
            />
            <div className="flex flex-col">
              <span className="text-base xs:text-lg sm:text-xl font-bold text-white leading-tight">ProL<span className="text-blue-400">ii</span>nk</span>
              <span className="text-xs text-gray-300 leading-tight hidden xs:block">Connect</span>
            </div>
          </Link>

          {/* Navigation - Desktop Only */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <LoadingLink 
              href="/services"
              className="text-gray-200 hover:text-blue-400 transition-all duration-200 font-medium text-sm lg:text-base focus:outline-none hover:scale-105"
              loading={servicesLoading}
              loadingText="Loading..."
              onClick={onServicesClick}
            >
              {t('nav.services')}
            </LoadingLink>
          </nav>

          {/* Auth/User Menu - Mobile First */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher - Desktop Only */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            
            {/* User Menu - Show for authenticated users on all devices */}
            {user ? (
              <SafeUserMenu user={user} userStats={memoizedUserStats} />
            ) : showAuth ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Contact Button with Popup - Desktop Only */}
                <div className="relative hidden md:block" ref={contactRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleContactClick}
                    className={`text-gray-200 hover:text-blue-400 hover:bg-white/10 p-1.5 sm:p-2 ${
                      isContactAnimating ? 'scale-105' : 'scale-100'
                    }`}
                    style={{
                      transform: isContactAnimating ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                  
                  {/* Contact Popup */}
                  <div 
                    className={`absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-xl py-3 overflow-hidden z-50 ${
                      isContactOpen 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                    } transition-all duration-300 ease-out`}
                    style={{
                      transform: isContactOpen ? 'translateY(0)' : 'translateY(-8px)',
                      transition: 'opacity 0.3s ease-out, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    <div className="px-4 py-2">
                      <h3 className="font-semibold text-gray-900 text-sm mb-3">Contact Us</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="text-xs text-gray-600">
                            <div className="font-medium">Address</div>
                            <div>49 Leeds Street, Mthatha, EC 5099</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <div className="text-xs text-gray-600">
                            <div className="font-medium">Phone</div>
                            <div>+27 78 128 3697</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          <div className="text-xs text-gray-600">
                            <div className="font-medium">Email</div>
                            <div>support@proliinkconnect.co.za</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          <div className="text-xs text-gray-600">
                            <div className="font-medium">Hours</div>
                            <div>Mon-Fri: 8AM-6PM</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <EnhancedButton 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-xs sm:text-sm lg:text-base text-white px-3 sm:px-4 py-1.5 sm:py-2"
                  href="/login"
                  loading={signInLoading}
                  loadingText="Signing In..."
                  onClick={onSignInClick}
                >
                  {t('nav.signIn')}
                </EnhancedButton>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </header>
    </>
  )
}