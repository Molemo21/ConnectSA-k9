"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, Calendar, Clock, Star, MapPin, Plus, Home, Wrench, Paintbrush, Zap, Car, Scissors, 
  TrendingUp, DollarSign, CheckCircle, AlertCircle, BarChart3, RefreshCw, AlertTriangle, 
  Loader2, Menu, X, Bell, Settings, User, LogOut, ChevronLeft, ChevronRight, Activity,
  CreditCard, BookOpen, MessageSquare, Shield, HelpCircle, PanelLeftClose, PanelLeftOpen,
  ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { EnhancedBookingCard } from "@/components/dashboard/enhanced-booking-card"
import { showToast, handleApiError } from "@/lib/toast"
import { LoadingCard } from "@/components/ui/loading-spinner"
import { useBookingData } from "@/hooks/use-booking-data"

// This is the backup of the old dashboard content
// The new version with timeline is in dashboard-content.tsx