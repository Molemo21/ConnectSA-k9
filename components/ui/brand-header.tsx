import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/ui/user-menu";

interface BrandHeaderProps {
  showAuth?: boolean;
  showUserMenu?: boolean;
  className?: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    avatar?: string | null;
  } | null;
}

export function BrandHeader({ showAuth = true, showUserMenu = false, className = "", user = null }: BrandHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <header className={`border-b border-gray-800 bg-black/95 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Brand: logo and text as one clickable home button, smaller text */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 bg-transparent">
            <img src="/handshake.png" alt="Handshake Logo" className="w-8 h-8 object-cover rounded-xl" />
          </div>
          <span className="text-lg font-bold text-white break-words whitespace-pre-line max-w-[80px]">ProLiink
Connect</span>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 items-center justify-center">
          {/* Desktop Explore button - centered */}
          <div className="hidden md:block">
            <Button
              className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors font-semibold"
              onClick={() => setDrawerOpen(!drawerOpen)}
            >
              Explore
            </Button>
            {drawerOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-gray-900 shadow-xl rounded-xl p-6 flex flex-col space-y-4 z-[9999] border border-gray-800" onMouseLeave={() => setDrawerOpen(false)}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold text-white">Explore</span>
                  <Button className="bg-transparent text-white hover:bg-white/10 p-2" onClick={() => setDrawerOpen(false)}>
                    ×
                  </Button>
                </div>
                <Link href="/services" className="block text-white hover:text-blue-400 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                  Services
                </Link>
                <Link href="#how-it-works" className="block text-white hover:text-blue-400 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                  How it Works
                </Link>
                <Link href="/about" className="block text-white hover:text-blue-400 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                  About Us
                </Link>
                <Link href="/contact" className="block text-white hover:text-blue-400 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                  Contact Us
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Auth/User Menu and Mobile Menu Button */}
        <div className="flex items-center space-x-3">
          {/* Desktop Auth Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {showUserMenu && user ? (
              <UserMenu user={user} />
            ) : showAuth ? (
              <>
                <Button variant="ghost" asChild className="text-gray-300 hover:text-white">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button - now aligned to the right */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Remove the duplicate Auth Menu section */}
        <div className="hidden md:flex items-center space-x-3">
          {showUserMenu && user ? (
            <UserMenu user={user} />
          ) : showAuth ? (
            <>
              <Button variant="ghost" asChild className="text-gray-300 hover:text-white">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed right-0 top-0 h-full w-64 bg-gray-900 shadow-xl p-6 transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-white">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                className="text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
            <div className="flex flex-col space-y-4">
              <Link href="/services" className="text-white hover:text-blue-400 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                Services
              </Link>
              <Link href="#how-it-works" className="text-white hover:text-blue-400 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                How it Works
              </Link>
              <Link href="/about" className="text-white hover:text-blue-400 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                About Us
              </Link>
              <Link href="/contact" className="text-white hover:text-blue-400 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors font-medium">
                Contact Us
              </Link>
              {showAuth && !user && (
                <div className="pt-4 space-y-3">
                  <Button variant="ghost" asChild className="w-full justify-center text-gray-300 hover:text-white">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}