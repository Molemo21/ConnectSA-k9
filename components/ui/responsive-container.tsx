"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: boolean
}

export function ResponsiveContainer({ 
  children, 
  className, 
  size = 'lg',
  padding = 'md',
  maxWidth = true 
}: ResponsiveContainerProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-3 sm:px-4',
    md: 'px-4 sm:px-6',
    lg: 'px-4 sm:px-8',
    xl: 'px-4 sm:px-12'
  }

  return (
    <div className={cn(
      'w-full mx-auto',
      maxWidth && sizeClasses[size],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = 1,
  gap = 'md',
  responsive = true 
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6',
    xl: 'gap-6 sm:gap-8'
  }

  const gridCols = responsive ? {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  } : {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }

  return (
    <div className={cn(
      'grid',
      gridCols[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveFlexProps {
  children: React.ReactNode
  className?: string
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  responsive?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  wrap?: boolean
}

export function ResponsiveFlex({ 
  children, 
  className, 
  direction = 'col',
  responsive = true,
  align = 'start',
  justify = 'start',
  gap = 'md',
  wrap = false
}: ResponsiveFlexProps) {
  const directionClasses = responsive ? {
    row: 'flex-col sm:flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-col-reverse sm:flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  } : {
    row: 'flex-row',
    col: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'col-reverse': 'flex-col-reverse'
  }

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  }

  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6',
    xl: 'gap-6 sm:gap-8'
  }

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      alignClasses[align],
      justifyClasses[justify],
      gapClasses[gap],
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveSectionProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'xl'
  background?: 'none' | 'light' | 'dark' | 'gradient'
  fullHeight?: boolean
}

export function ResponsiveSection({ 
  children, 
  className, 
  padding = 'lg',
  background = 'none',
  fullHeight = false
}: ResponsiveSectionProps) {
  const paddingClasses = {
    sm: 'py-6 sm:py-8',
    md: 'py-8 sm:py-12',
    lg: 'py-12 sm:py-16 lg:py-20',
    xl: 'py-16 sm:py-20 lg:py-24'
  }

  const backgroundClasses = {
    none: '',
    light: 'bg-gray-50',
    dark: 'bg-gray-900 text-white',
    gradient: 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
  }

  return (
    <section className={cn(
      paddingClasses[padding],
      backgroundClasses[background],
      fullHeight && 'min-h-screen',
      className
    )}>
      {children}
    </section>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
  align?: 'left' | 'center' | 'right' | 'justify'
  color?: 'default' | 'muted' | 'primary' | 'secondary' | 'accent' | 'destructive'
  responsive?: boolean
}

export function ResponsiveText({ 
  children, 
  className, 
  variant = 'p',
  size = 'base',
  weight = 'normal',
  align = 'left',
  color = 'default',
  responsive = true
}: ResponsiveTextProps) {
  const Component = variant

  const sizeClasses = responsive ? {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl',
    '4xl': 'text-4xl sm:text-5xl',
    '5xl': 'text-5xl sm:text-6xl',
    '6xl': 'text-6xl sm:text-7xl'
  } : {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  }

  const colorClasses = {
    default: 'text-gray-900',
    muted: 'text-gray-600',
    primary: 'text-blue-600',
    secondary: 'text-purple-600',
    accent: 'text-green-600',
    destructive: 'text-red-600'
  }

  return (
    <Component className={cn(
      sizeClasses[size],
      weightClasses[weight],
      alignClasses[align],
      colorClasses[color],
      'leading-tight',
      className
    )}>
      {children}
    </Component>
  )
}

interface ResponsiveButtonProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  responsive?: boolean
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function ResponsiveButton({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  responsive = true,
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button'
}: ResponsiveButtonProps) {
  const sizeClasses = responsive ? {
    sm: 'h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm',
    md: 'h-9 sm:h-10 px-3 sm:px-4 text-sm sm:text-base',
    lg: 'h-10 sm:h-11 px-4 sm:px-6 text-base sm:text-lg'
  } : {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-4 text-base',
    lg: 'h-11 px-6 text-lg'
  }

  const variantClasses = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-700',
    link: 'text-blue-600 hover:text-blue-700 underline',
    destructive: 'bg-red-600 hover:bg-red-700 text-white'
  }

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
