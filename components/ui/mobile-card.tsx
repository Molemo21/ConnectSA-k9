"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface MobileCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  shadow?: 'sm' | 'md' | 'lg'
  rounded?: 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
  hover?: boolean
}

export function MobileCard({ 
  children, 
  className,
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  border = true,
  hover = false
}: MobileCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl'
  }

  return (
    <Card className={cn(
      'bg-white',
      paddingClasses[padding],
      shadowClasses[shadow],
      roundedClasses[rounded],
      border && 'border border-gray-200',
      hover && 'hover:shadow-lg transition-shadow duration-200',
      className
    )}>
      {children}
    </Card>
  )
}

interface MobileCardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function MobileCardHeader({ 
  title, 
  subtitle, 
  action, 
  className 
}: MobileCardHeaderProps) {
  return (
    <CardHeader className={cn('pb-3 sm:pb-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {title}
          </CardTitle>
          {subtitle && (
            <CardDescription className="text-sm sm:text-base text-gray-600 mt-1">
              {subtitle}
            </CardDescription>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 ml-3">
            {action}
          </div>
        )}
      </div>
    </CardHeader>
  )
}

interface MobileCardContentProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function MobileCardContent({ 
  children, 
  className,
  padding = 'md'
}: MobileCardContentProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  return (
    <CardContent className={cn(
      paddingClasses[padding],
      className
    )}>
      {children}
    </CardContent>
  )
}

// Service card component for mobile
interface MobileServiceCardProps {
  title: string
  description: string
  price?: string
  rating?: number
  reviews?: number
  image?: string
  category?: string
  provider?: string
  onClick?: () => void
  className?: string
}

export function MobileServiceCard({
  title,
  description,
  price,
  rating,
  reviews,
  image,
  category,
  provider,
  onClick,
  className
}: MobileServiceCardProps) {
  return (
    <MobileCard 
      className={cn(
        'cursor-pointer',
        onClick && 'hover:shadow-lg transition-all duration-200 hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
      padding="sm"
    >
      <div className="flex space-x-3">
        {/* Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg overflow-hidden">
            {image ? (
              <img 
                src={image} 
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {title.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {title}
              </h3>
              {category && (
                <p className="text-xs text-blue-600 font-medium mt-1">
                  {category}
                </p>
              )}
              {provider && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  by {provider}
                </p>
              )}
            </div>
            {price && (
              <div className="flex-shrink-0 ml-2">
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {price}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">
            {description}
          </p>

          {/* Rating and reviews */}
          {(rating || reviews) && (
            <div className="flex items-center space-x-2 mt-2">
              {rating && (
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs text-gray-600">{rating}</span>
                </div>
              )}
              {reviews && (
                <span className="text-xs text-gray-500">
                  ({reviews} reviews)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileCard>
  )
}

// Booking card component for mobile
interface MobileBookingCardProps {
  id: string
  service: string
  provider: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  price?: string
  image?: string
  onClick?: () => void
  className?: string
}

export function MobileBookingCard({
  id,
  service,
  provider,
  date,
  time,
  status,
  price,
  image,
  onClick,
  className
}: MobileBookingCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled'
  }

  return (
    <MobileCard 
      className={cn(
        'cursor-pointer',
        onClick && 'hover:shadow-lg transition-all duration-200',
        className
      )}
      onClick={onClick}
      padding="sm"
    >
      <div className="flex space-x-3">
        {/* Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg overflow-hidden">
            {image ? (
              <img 
                src={image} 
                alt={service}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {service.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {service}
              </h3>
              <p className="text-xs text-gray-500 mt-1 truncate">
                with {provider}
              </p>
            </div>
            <div className="flex-shrink-0 ml-2">
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                statusColors[status]
              )}>
                {statusLabels[status]}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-3 text-xs text-gray-600">
              <span>{date}</span>
              <span>•</span>
              <span>{time}</span>
            </div>
            {price && (
              <span className="text-sm font-semibold text-gray-900">
                {price}
              </span>
            )}
          </div>
        </div>
      </div>
    </MobileCard>
  )
}

// Stats card component for mobile
interface MobileStatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function MobileStatsCard({
  title,
  value,
  change,
  icon: Icon,
  className
}: MobileStatsCardProps) {
  return (
    <MobileCard className={cn('text-center', className)} padding="sm">
      <div className="flex flex-col items-center space-y-2">
        {Icon && (
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
        )}
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">
            {value}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {title}
          </p>
        </div>
        {change && (
          <div className={cn(
            'flex items-center space-x-1 text-xs font-medium',
            change.type === 'increase' ? 'text-green-600' : 'text-red-600'
          )}>
            <span>
              {change.type === 'increase' ? '↗' : '↘'}
            </span>
            <span>{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>
    </MobileCard>
  )
}
