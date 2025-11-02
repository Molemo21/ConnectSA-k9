import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ClientRoot } from "@/components/client-root"
import { ServiceWorkerRegistrar } from "@/components/system/ServiceWorkerRegistrar"
import { NotificationRealtimeToaster } from "@/components/system/NotificationRealtimeToaster"
import { PushNotificationPrompt } from "@/components/ui/push-notification-prompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Proliink Connect - Your Trusted Services Marketplace",
  description:
    "Connect with verified service providers across South Africa. Book trusted professionals for cleaning, plumbing, electrical work, and more.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientRoot>
          {children}
          <Toaster />
          <ServiceWorkerRegistrar />
          <NotificationRealtimeToaster />
          <PushNotificationPrompt />
        </ClientRoot>
      </body>
    </html>
  )
} 