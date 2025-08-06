import { toast } from "@/hooks/use-toast"

export const showToast = {
  success: (message: string, title?: string) => {
    toast({
      title: title || "Success",
      description: message,
      variant: "default",
    })
  },

  error: (message: string, title?: string) => {
    toast({
      title: title || "Error",
      description: message,
      variant: "destructive",
    })
  },

  warning: (message: string, title?: string) => {
    toast({
      title: title || "Warning",
      description: message,
      variant: "default",
    })
  },

  info: (message: string, title?: string) => {
    toast({
      title: title || "Info",
      description: message,
    })
  },

  loading: (message: string, title?: string) => {
    toast({
      title: title || "Loading",
      description: message,
    })
  }
}

export const handleApiError = async (response: Response, defaultMessage = "Something went wrong") => {
  try {
    const data = await response.json()
    const message = data.error || data.message || defaultMessage
    showToast.error(message)
    return message
  } catch {
    showToast.error(defaultMessage)
    return defaultMessage
  }
}

export const handleApiSuccess = (data: any, defaultMessage = "Operation completed successfully") => {
  const message = data.message || defaultMessage
  showToast.success(message)
  return message
} 