"use client"

import { useState, ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, Banknote, CheckCircle2 } from "lucide-react"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: string
  description: string | ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "warning" | "success"
  loadingText?: string
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loadingText = "Processing..."
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Confirmation error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: AlertTriangle,
          iconColor: "text-red-600",
          buttonColor: "bg-red-600 hover:bg-red-700",
          borderColor: "border-red-200"
        }
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-yellow-600",
          buttonColor: "bg-yellow-600 hover:bg-yellow-700",
          borderColor: "border-yellow-200"
        }
      case "success":
        return {
          icon: Banknote,
          iconColor: "text-green-600",
          buttonColor: "bg-green-600 hover:bg-green-700",
          borderColor: "border-green-200"
        }
      default:
        return {
          icon: CheckCircle2,
          iconColor: "text-blue-600",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
          borderColor: "border-blue-200"
        }
    }
  }

  const styles = getVariantStyles()
  const IconComponent = styles.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <IconComponent className={cn("w-5 h-5", styles.iconColor)} />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription asChild className="pt-2">
            <div className="text-gray-300">
              {description}
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn("flex-1 text-white", styles.buttonColor)}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {loadingText}
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
} 