"use client"

import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-800/50 py-8 sm:py-12 bg-gradient-to-b from-black to-gray-900">
      <div className="container px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div>
            <h3 className="text-base sm:text-lg font-bold">
              <span className="flex flex-col">
                <span>ProL<span className="text-blue-400">ii</span>nk</span>
                <span>Co<span className="text-blue-400">nn</span>ect</span>
              </span>
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-400">
              The smart way to link professionals and clients across South Africa.
            </p>
            <Image 
              src="/handshake.png" 
              alt="Handshake" 
              width={40} 
              height={40} 
              className="mt-3 sm:mt-4 h-8 sm:h-10 w-auto opacity-80 hover:opacity-100 transition-opacity" 
            />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="mt-2 space-y-1.5 sm:space-y-2">
              <li>
                <Link 
                  href="/services" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link 
                  href="/book-service" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Book Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/become-provider" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Become Provider
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Services */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Popular Services</h3>
            <ul className="mt-2 space-y-1.5 sm:space-y-2">
              <li>
                <Link 
                  href="/services?category=Home Services" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Home Services
                </Link>
              </li>
              <li>
                <Link 
                  href="/services?category=Beauty" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Beauty & Wellness
                </Link>
              </li>
              <li>
                <Link 
                  href="/services?category=Technology" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  IT Support
                </Link>
              </li>
              <li>
                <Link 
                  href="/services?category=Automotive" 
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Automotive
                </Link>
              </li>
              <li>
                <Link 
                  href="/services" 
                  className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  View All Services →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-4">Contact Us</h3>
            <address className="mt-2 not-italic text-xs sm:text-sm text-gray-400">
              <p>49 Leeds Street</p>
              <p>Cnr Leeds & Creister street</p>
              <p>Mthatha, Eastern Cape</p>
              <p>5099</p>
              <p className="mt-2">
                <span className="block">Email: <a href="mailto:support@proliinkconnect.co.za" className="text-blue-400 hover:text-blue-300">support@proliinkconnect.co.za</a></span>
                <span className="block">Phone: <a href="tel:+27689476401" className="text-blue-400 hover:text-blue-300">+27 68 947 6401</a></span>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 sm:mt-8 border-t border-gray-800/50 pt-6 sm:pt-8 text-center">
          {/* Social Media Links */}
          <div className="flex justify-center gap-4 sm:gap-6 mb-3 sm:mb-4">
            <Link 
              href="https://facebook.com" 
              className="text-gray-400 hover:text-blue-500 transition-all duration-300 hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <Link 
              href="https://twitter.com" 
              className="text-gray-400 hover:text-blue-400 transition-all duration-300 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <Link 
              href="https://instagram.com" 
              className="text-gray-400 hover:text-pink-500 transition-all duration-300 hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <Link 
              href="https://www.linkedin.com/company/proliink-connect-sa" 
              className="text-gray-400 hover:text-blue-600 transition-all duration-300 hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
          </div>

          {/* Legal Links */}
          <div className="flex justify-center flex-wrap gap-4 sm:gap-6 mb-3 sm:mb-4">
            <Link 
              href="/privacy" 
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/contact" 
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-xs sm:text-sm text-gray-400">
            © 2024 ProLiink Connect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}


