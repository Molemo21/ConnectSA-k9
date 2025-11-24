"use client"

import { LoadingButton as EnhancedButton } from './enhanced-loading-button'
import { useButtonNavigation } from '@/hooks/use-button-navigation'
import { ButtonProps } from './button'

interface NavigationButtonProps extends Omit<ButtonProps, 'onClick' | 'href'> {
  href: string
  buttonId?: string
  loadingText?: string
  children: React.ReactNode
  onClick?: () => void // Optional additional onClick handler
  replace?: boolean // Use router.replace instead of push
}

/**
 * NavigationButton - A button component with built-in navigation and loading states
 * 
 * This component automatically handles:
 * - Navigation state management
 * - Loading states
 * - Double-click prevention
 * - Accessibility attributes
 * 
 * @example
 * <NavigationButton 
 *   href="/dashboard" 
 *   buttonId="dashboardBtn"
 *   variant="default"
 * >
 *   Go to Dashboard
 * </NavigationButton>
 */
export function NavigationButton({
  href,
  buttonId,
  loadingText = "Loading...",
  children,
  onClick,
  replace = false,
  ...buttonProps
}: NavigationButtonProps) {
  const { handleNavigation, buttonLoading } = useButtonNavigation()
  const isLoading = buttonId ? buttonLoading === buttonId : false

  const handleClick = async () => {
    // Call optional onClick handler first
    onClick?.()
    
    // Then handle navigation
    await handleNavigation(href, buttonId)
  }

  return (
    <EnhancedButton
      {...buttonProps}
      onClick={handleClick}
      loading={isLoading}
      loadingText={loadingText}
      href={replace ? undefined : href} // Only pass href if not replacing
    >
      {children}
    </EnhancedButton>
  )
}


