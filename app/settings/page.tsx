"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BrandHeaderClient } from "@/components/ui/brand-header-client"
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav"
import { useAuth } from "@/hooks/use-auth"
import { 
  Settings, 
  Save,
  User,
  Bell,
  Shield,
  Globe,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  Camera,
  ArrowLeft
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Profile Settings
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: ""
  })
  
  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingReminders: true,
    marketingEmails: false
  })
  
  // Security
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Preferences
  const [preferences, setPreferences] = useState({
    language: "en",
    theme: "dark"
  })
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || ""
      })
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  const handleProfileUpdate = async () => {
    if (!user) return
    
    setSaving("profile")
    setLoading(true)
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        setSaved(true)
        toast({
          title: "Success",
          description: "Profile updated successfully",
          variant: "default"
        })
        setTimeout(() => setSaved(false), 3000)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setSaving(null)
    }
  }

  const handleNotificationsUpdate = async () => {
    setSaving("notifications")
    setLoading(true)
    
    try {
      // TODO: Implement API endpoint for notification preferences
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setSaved(true)
      toast({
        title: "Success",
        description: "Notification preferences updated",
        variant: "default"
      })
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Notifications update error:", error)
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setSaving(null)
    }
  }

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      })
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive"
      })
      return
    }
    
    setSaving("password")
    setLoading(true)
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      
      if (response.ok) {
        setSaved(true)
        toast({
          title: "Success",
          description: "Password updated successfully",
          variant: "default"
        })
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        setTimeout(() => setSaved(false), 3000)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || "Failed to update password",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Password update error:", error)
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setSaving(null)
    }
  }

  const handlePreferencesUpdate = async () => {
    setSaving("preferences")
    setLoading(true)
    
    try {
      // TODO: Implement API endpoint for preferences
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      setSaved(true)
      toast({
        title: "Success",
        description: "Preferences updated",
        variant: "default"
      })
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Preferences update error:", error)
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setSaving(null)
    }
  }

  const getInitials = () => {
    if (profileData.name) {
      return profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (profileData.email) {
      return profileData.email[0].toUpperCase()
    }
    return "U"
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <BrandHeaderClient showUserMenu={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-black/50 border border-blue-400/20 rounded-xl p-1 mb-6">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-gray-300"
            >
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-gray-300"
            >
              <Bell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-gray-300"
            >
              <Shield className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-gray-300"
            >
              <Globe className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-black/95 border border-blue-400/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-400/10 to-purple-500/10 border-b border-blue-400/20">
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-400" />
                  Profile Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <Avatar className="h-24 w-24 ring-2 ring-blue-400/30">
                    <AvatarImage src={profileData.avatar} alt={profileData.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 w-full">
                    <Button
                      variant="outline"
                      className="bg-gray-800/50 border-gray-700/50 text-gray-200 hover:bg-blue-500/30 hover:border-blue-300 hover:text-blue-50"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Change Avatar
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max size 2MB</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-blue-400"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-blue-400"
                      placeholder="Enter your email"
                      disabled
                    />
                    <p className="text-xs text-gray-400">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-blue-400"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-700/50">
                  {saved && saving === "profile" && (
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Profile updated successfully
                    </div>
                  )}
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={loading && saving === "profile"}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {loading && saving === "profile" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-black/95 border border-blue-400/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-400/10 to-purple-500/10 border-b border-blue-400/20">
                <CardTitle className="text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-blue-400" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <Label className="text-gray-200 font-medium">Email Notifications</Label>
                        <p className="text-sm text-gray-400">Receive notifications via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-blue-400" />
                      <div>
                        <Label className="text-gray-200 font-medium">SMS Notifications</Label>
                        <p className="text-sm text-gray-400">Receive notifications via SMS</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, smsNotifications: checked })
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-blue-400" />
                      <div>
                        <Label className="text-gray-200 font-medium">Push Notifications</Label>
                        <p className="text-sm text-gray-400">Receive push notifications in browser</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, pushNotifications: checked })
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-blue-400" />
                      <div>
                        <Label className="text-gray-200 font-medium">Booking Reminders</Label>
                        <p className="text-sm text-gray-400">Get reminders for upcoming bookings</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.bookingReminders}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, bookingReminders: checked })
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <Label className="text-gray-200 font-medium">Marketing Emails</Label>
                        <p className="text-sm text-gray-400">Receive promotional emails and updates</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, marketingEmails: checked })
                      }
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-700/50">
                  {saved && saving === "notifications" && (
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Preferences updated
                    </div>
                  )}
                  <Button
                    onClick={handleNotificationsUpdate}
                    disabled={loading && saving === "notifications"}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {loading && saving === "notifications" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-6">
            <Card className="bg-black/95 border border-blue-400/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-400/10 to-purple-500/10 border-b border-blue-400/20">
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-400" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-gray-300">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-blue-400 pr-10"
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-blue-400 pr-10"
                        placeholder="Enter new password (min 8 characters)"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-blue-400 pr-10"
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-200">Password Requirements</p>
                      <ul className="text-xs text-gray-400 mt-2 space-y-1 list-disc list-inside">
                        <li>At least 8 characters long</li>
                        <li>Contains uppercase and lowercase letters</li>
                        <li>Contains at least one number</li>
                        <li>Contains at least one special character</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-700/50">
                  {saved && saving === "password" && (
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Password updated
                    </div>
                  )}
                  <Button
                    onClick={handlePasswordUpdate}
                    disabled={loading && saving === "password"}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {loading && saving === "password" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-6">
            <Card className="bg-black/95 border border-blue-400/20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-400/10 to-purple-500/10 border-b border-blue-400/20">
                <CardTitle className="text-white flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-400" />
                  Preferences
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize your app experience
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-gray-300">Language</Label>
                    <select
                      id="language"
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                    >
                      <option value="en" className="bg-gray-800">English</option>
                      <option value="af" className="bg-gray-800">Afrikaans</option>
                      <option value="zu" className="bg-gray-800">Zulu</option>
                      <option value="xh" className="bg-gray-800">Xhosa</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme" className="text-gray-300">Theme</Label>
                    <select
                      id="theme"
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                    >
                      <option value="dark" className="bg-gray-800">Dark</option>
                      <option value="light" className="bg-gray-800">Light</option>
                      <option value="system" className="bg-gray-800">System</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-700/50">
                  {saved && saving === "preferences" && (
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Preferences updated
                    </div>
                  )}
                  <Button
                    onClick={handlePreferencesUpdate}
                    disabled={loading && saving === "preferences"}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    {loading && saving === "preferences" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav userRole={user?.role || "CLIENT"} />
    </div>
  )
}

