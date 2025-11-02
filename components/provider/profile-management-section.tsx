"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Loader2, Plus, X, Eye, Package } from "lucide-react"
import Image from "next/image"
import { showToast } from "@/lib/toast"

interface ProfileManagementSectionProps {
  user: any
  dashboardState: any
  refreshData: () => void
}

export function ProfileManagementSection({ 
  user, 
  dashboardState, 
  refreshData 
}: ProfileManagementSectionProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [providerData, setProviderData] = useState<any>(null)
  const [catalogueItems, setCatalogueItems] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("info")
  const [editingItem, setEditingItem] = useState<any>(null)
  const [allImages, setAllImages] = useState<string[]>([])
  const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null)

  const [infoForm, setInfoForm] = useState({
    businessName: "",
    description: "",
    location: "",
    experience: 0,
    hourlyRate: 0
  })

  const [catalogueForm, setCatalogueForm] = useState({
    title: "",
    price: 0,
    currency: "ZAR",
    durationMins: 60,
    images: [] as string[],
    serviceId: ""
  })

  useEffect(() => {
    const fetchProviderData = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/provider/settings')
        if (response.ok) {
          const data = await response.json()
          setProviderData(data.provider)
          setInfoForm({
            businessName: data.provider?.businessName || "",
            description: data.provider?.description || "",
            location: data.provider?.location || "",
            experience: data.provider?.experience || 0,
            hourlyRate: data.provider?.hourlyRate || 0
          })
        }
      } catch (error) {
        console.error("Error fetching provider data:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchCatalogueItems = async () => {
      try {
        const response = await fetch('/api/provider/catalogue')
        if (response.ok) {
          const items = await response.json()
          setCatalogueItems(items)
        }
      } catch (error) {
        console.error("Error fetching catalogue items:", error)
      }
    }

    fetchProviderData()
    fetchCatalogueItems()
  }, [])

  useEffect(() => {
    const images: string[] = []
    if (providerData?.profileImages) {
      images.push(...providerData.profileImages.filter((img: string) => img))
    }
    catalogueItems.forEach((item: any) => {
      if (item.images) {
        images.push(...item.images.filter((img: string) => img))
      }
    })
    setAllImages([...new Set(images)])
  }, [providerData, catalogueItems])

  const handleSaveInfo = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/provider/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerData: {
            businessName: infoForm.businessName,
            description: infoForm.description,
            location: infoForm.location,
            experience: infoForm.experience,
            hourlyRate: infoForm.hourlyRate
          }
        })
      })
      if (response.ok) {
        showToast.success("Profile updated successfully")
        await refreshData()
      } else {
        showToast.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      showToast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCatalogueItem = async () => {
    if (!catalogueForm.title || catalogueForm.price <= 0 || catalogueForm.durationMins <= 0) {
      showToast.error("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      const url = editingItem ? `/api/provider/catalogue/${editingItem.id}` : '/api/provider/catalogue'
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: catalogueForm.title,
          price: catalogueForm.price,
          currency: catalogueForm.currency,
          durationMins: catalogueForm.durationMins,
          images: catalogueForm.images,
          serviceId: catalogueForm.serviceId || (catalogueItems[0]?.serviceId || ""),
          shortDesc: catalogueForm.title,
          longDesc: ""
        })
      })

      if (response.ok) {
        showToast.success(editingItem ? "Catalogue item updated" : "Catalogue item created")
        setEditingItem(null)
        setCatalogueForm({
          title: "",
          price: 0,
          currency: "ZAR",
          durationMins: 60,
          images: [],
          serviceId: ""
        })
        
        const itemsResponse = await fetch('/api/provider/catalogue')
        if (itemsResponse.ok) {
          const items = await itemsResponse.json()
          setCatalogueItems(items)
        }
      } else {
        showToast.error("Failed to save catalogue item")
      }
    } catch (error) {
      console.error("Error saving catalogue item:", error)
      showToast.error("Failed to save catalogue item")
    } finally {
      setSaving(false)
    }
  }

  const handleAddImage = () => {
    const url = prompt('Enter image URL:')
    if (url && url.trim()) {
      setCatalogueForm(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }))
    }
  }

  const handleRemoveImage = (index: number) => {
    setCatalogueForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
        <CardHeader>
          <CardTitle className="text-white">Profile Management</CardTitle>
          <CardDescription className="text-gray-300">
            Manage your provider information, catalogue items, and portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20">
              <TabsTrigger 
                value="info" 
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-white/70"
              >
                Info
              </TabsTrigger>
              <TabsTrigger 
                value="catalogue"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/70"
              >
                Catalogue
              </TabsTrigger>
              <TabsTrigger 
                value="work"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300 text-white/70"
              >
                My Work
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Business Name</label>
                  <input
                    type="text"
                    value={infoForm.businessName}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-2 block">Description</label>
                  <textarea
                    value={infoForm.description}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Describe your services..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/80 text-sm mb-2 block">Location</label>
                    <input
                      type="text"
                      value={infoForm.location}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City, Province"
                    />
                  </div>

                  <div>
                    <label className="text-white/80 text-sm mb-2 block">Experience (years)</label>
                    <input
                      type="number"
                      value={infoForm.experience}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-2 block">Hourly Rate (R)</label>
                  <input
                    type="number"
                    value={infoForm.hourlyRate}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <Button
                  onClick={handleSaveInfo}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="catalogue" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Package Title</label>
                  <input
                    type="text"
                    value={catalogueForm.title}
                    onChange={(e) => setCatalogueForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Professional Deep Cleaning"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-white/80 text-sm mb-2 block">Price (R)</label>
                    <input
                      type="number"
                      value={catalogueForm.price}
                      onChange={(e) => setCatalogueForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="text-white/80 text-sm mb-2 block">Duration (mins)</label>
                    <input
                      type="number"
                      value={catalogueForm.durationMins}
                      onChange={(e) => setCatalogueForm(prev => ({ ...prev, durationMins: parseInt(e.target.value) || 60 }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="60"
                      min="15"
                    />
                  </div>

                  <div>
                    <label className="text-white/80 text-sm mb-2 block">Currency</label>
                    <select
                      value={catalogueForm.currency}
                      onChange={(e) => setCatalogueForm(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="ZAR">ZAR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-2 block">Images</label>
                  <div className="space-y-2">
                    {catalogueForm.images.map((img, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={img}
                          readOnly
                          className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveImage(index)}
                          className="text-red-400 border-red-500/50 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={handleAddImage}
                      className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Image URL
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveCatalogueItem}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {editingItem ? "Update" : "Create"} Package
                      </>
                    )}
                  </Button>
                  {editingItem && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingItem(null)
                        setCatalogueForm({
                          title: "",
                          price: 0,
                          currency: "ZAR",
                          durationMins: 60,
                          images: [],
                          serviceId: ""
                        })
                      }}
                      className="border-white/20 text-white/70 hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {catalogueItems.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-white font-semibold">Existing Packages</h3>
                    {catalogueItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{item.title}</h4>
                          <p className="text-white/60 text-sm">
                            R{item.price} • {item.durationMins} mins
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item)
                              setCatalogueForm({
                                title: item.title,
                                price: item.price,
                                currency: item.currency || "ZAR",
                                durationMins: item.durationMins,
                                images: item.images || [],
                                serviceId: item.serviceId
                              })
                            }}
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="work" className="mt-6">
              {allImages.length > 0 ? (
                <>
                  <p className="text-white/60 text-sm mb-4">
                    All photos from your profile and catalogue items ({allImages.length} {allImages.length === 1 ? 'photo' : 'photos'})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-800 aspect-square"
                        onClick={() => setExpandedImageIndex(expandedImageIndex === index ? null : index)}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Work sample ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Lightbox */}
                  {expandedImageIndex !== null && (
                    <div
                      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
                      onClick={() => setExpandedImageIndex(null)}
                    >
                      <Image
                        src={allImages[expandedImageIndex]}
                        alt={`Work sample ${expandedImageIndex + 1}`}
                        width={1200}
                        height={800}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-white/40 mb-4" />
                  <p className="text-white/80 mb-2">No photos available</p>
                  <p className="text-white/60 text-sm">Add images to your catalogue items to showcase your work</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

