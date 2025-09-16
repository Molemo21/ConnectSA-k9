"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Mail, Phone, MapPin, Clock, Globe } from "lucide-react"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="bg-gray-900 border-gray-700 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-gray-900 z-10">
            <CardTitle className="text-xl sm:text-2xl font-bold text-white">Contact Us</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Address */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">Address</h3>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                      49 Leeds Street<br />
                      Cnr Leeds & Creister Street<br />
                      Mthatha, Eastern Cape<br />
                      5099, South Africa
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">Phone</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">+27 78 128 3697</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">Email</h3>
                    <p className="text-gray-300 text-xs sm:text-sm">support@proliinkconnect.co.za</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="border-t border-gray-700 pt-4 sm:pt-6">
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Business Hours</h3>
                  <div className="space-y-1 text-xs sm:text-sm text-gray-300">
                    <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                    <p>Saturday: 9:00 AM - 4:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="border-t border-gray-700 pt-4 sm:pt-6">
              <div className="flex items-start space-x-3">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">Follow Us</h3>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <a 
                      href="https://facebook.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
                    >
                      Facebook
                    </a>
                    <a 
                      href="https://twitter.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
                    >
                      Twitter
                    </a>
                    <a 
                      href="https://instagram.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
                    >
                      Instagram
                    </a>
                    <a 
                      href="https://www.linkedin.com/company/proliink-connect-sa" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => window.open('mailto:support@proliinkconnect.co.za', '_blank')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button
                onClick={() => window.open('tel:+27781283697', '_blank')}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-sm sm:text-base"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
