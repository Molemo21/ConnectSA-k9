'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X, Save, Package, Image, Clock, FileText, Sparkles } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
}

interface CatalogueItem {
  id: string;
  title: string;
  shortDesc: string;
  longDesc?: string;
  price: number;
  currency: string;
  durationMins: number;
  images: string[];
  serviceId: string;
}

interface CatalogueItemFormProps {
  item?: CatalogueItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CatalogueItemForm({ item, onSuccess, onCancel }: CatalogueItemFormProps) {
  const [formData, setFormData] = useState({
    serviceId: '',
    title: '',
    shortDesc: '',
    longDesc: '',
    price: 0,
    currency: 'ZAR',
    durationMins: 60,
    images: [] as string[]
  });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    if (item) {
      setFormData({
        serviceId: item.serviceId,
        title: item.title,
        shortDesc: item.shortDesc,
        longDesc: item.longDesc || '',
        price: item.price,
        currency: item.currency,
        durationMins: item.durationMins,
        images: item.images
      });
    }
  }, [item]);

  const fetchServices = async () => {
    try {
      console.log("🔍 Fetching provider's selected services for catalogue creation...");
      const response = await fetch('/api/provider/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        console.log(`✅ Loaded ${data.length} selected services for catalogue creation`);
      } else {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch provider services:', error);
      toast({
        title: "Error",
        description: "Failed to load your selected services",
        variant: "destructive"
      });
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = item ? `/api/provider/catalogue/${item.id}` : '/api/provider/catalogue';
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: item ? "Catalogue item updated" : "Catalogue item created"
        });
        onSuccess();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save catalogue item');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save catalogue item",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const generatePackageTitle = () => {
    const service = services.find(s => s.id === formData.serviceId);
    if (!service) return;

    const templates = [
      `Professional ${service.name}`,
      `Complete ${service.name} Service`,
      `Premium ${service.name} Package`,
      `Expert ${service.name} Solution`,
      `Full ${service.name} Service`
    ];
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    setFormData(prev => ({ ...prev, title: randomTemplate }));
  };

  const generateDescription = () => {
    const service = services.find(s => s.id === formData.serviceId);
    if (!service) return;

    const shortTemplates = [
      `Professional ${service.name.toLowerCase()} service with quality guaranteed`,
      `Expert ${service.name.toLowerCase()} delivered with care and precision`,
      `Reliable ${service.name.toLowerCase()} service you can trust`,
      `Quality ${service.name.toLowerCase()} at competitive rates`
    ];

    const longTemplates = [
      `Our professional ${service.name.toLowerCase()} service includes all essential tasks using industry-standard equipment and techniques. We ensure the highest quality results for your specific needs.`,
      `This comprehensive ${service.name.toLowerCase()} package delivers expert results with professional-grade tools and methods. Our experienced team guarantees quality workmanship.`,
      `Professional ${service.name.toLowerCase()} solution that combines expertise with modern techniques. We provide reliable, high-quality results tailored to your requirements.`
    ];

    const randomShort = shortTemplates[Math.floor(Math.random() * shortTemplates.length)];
    const randomLong = longTemplates[Math.floor(Math.random() * longTemplates.length)];
    
    setFormData(prev => ({ 
      ...prev, 
      shortDesc: randomShort,
      longDesc: randomLong
    }));
  };

  if (loadingServices) {
    return (
      <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading your selected services...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 backdrop-blur-sm border-gray-300/20">
      <CardHeader className="border-b border-gray-300/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-400/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">
                {item ? 'Edit Service Package' : 'Create Service Package'}
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {item ? 'Update your package details' : 'Add a new service package to your catalogue'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="serviceId" className="text-white font-medium">Service *</Label>
            <Select
              value={formData.serviceId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
            >
              <SelectTrigger className="bg-black/60 border-gray-300/20 text-white focus:ring-blue-400/50 focus:border-blue-400/50">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 border-gray-300/20">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id} className="text-white hover:bg-gray-700/50">
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Package Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-white font-medium">Package Title *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePackageTitle}
                className="border-blue-300/20 text-blue-300 hover:bg-blue-700/50 text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Professional House Cleaning Service"
              className="bg-black/60 border-gray-300/20 text-white placeholder-gray-400 focus:ring-blue-400/50 focus:border-blue-400/50"
              required
            />
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shortDesc" className="text-white font-medium">Short Description *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateDescription}
                  className="border-blue-300/20 text-blue-300 hover:bg-blue-700/50 text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generate
                </Button>
              </div>
              <Textarea
                id="shortDesc"
                value={formData.shortDesc}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDesc: e.target.value }))}
                placeholder="Brief description of the service package"
                rows={3}
                className="bg-black/60 border-gray-300/20 text-white placeholder-gray-400 focus:ring-blue-400/50 focus:border-blue-400/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longDesc" className="text-white font-medium">Detailed Description</Label>
              <Textarea
                id="longDesc"
                value={formData.longDesc}
                onChange={(e) => setFormData(prev => ({ ...prev, longDesc: e.target.value }))}
                placeholder="Detailed description of what's included"
                rows={3}
                className="bg-black/60 border-gray-300/20 text-white placeholder-gray-400 focus:ring-blue-400/50 focus:border-blue-400/50"
              />
            </div>
          </div>

          {/* Pricing and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-white font-medium flex items-center gap-2">
                <span className="text-sm font-bold text-green-400">R</span>
                Price *
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="0"
                min="1"
                className="bg-black/60 border-gray-300/20 text-white placeholder-gray-400 focus:ring-blue-400/50 focus:border-blue-400/50"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-white font-medium">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="bg-black/60 border-gray-300/20 text-white focus:ring-blue-400/50 focus:border-blue-400/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/80 border-gray-300/20">
                  <SelectItem value="ZAR" className="text-white hover:bg-gray-700/50">ZAR</SelectItem>
                  <SelectItem value="USD" className="text-white hover:bg-gray-700/50">USD</SelectItem>
                  <SelectItem value="EUR" className="text-white hover:bg-gray-700/50">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMins" className="text-white font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration (minutes) *
              </Label>
              <Input
                id="durationMins"
                type="number"
                value={formData.durationMins}
                onChange={(e) => setFormData(prev => ({ ...prev, durationMins: Number(e.target.value) }))}
                placeholder="60"
                min="15"
                max="480"
                className="bg-black/60 border-gray-300/20 text-white placeholder-gray-400 focus:ring-blue-400/50 focus:border-blue-400/50"
                required
              />
              <p className="text-xs text-gray-400">
                Minimum 15 minutes, maximum 8 hours
              </p>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <Label className="text-white font-medium flex items-center gap-2">
              <Image className="w-4 h-4" />
              Images (Optional)
            </Label>
            
            <div className="space-y-3">
              {formData.images.map((image, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-black/60 border border-gray-300/20 rounded-lg">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center">
                    <Image className="w-5 h-5 text-gray-400" />
                  </div>
                  <Input 
                    value={image} 
                    readOnly 
                    className="flex-1 bg-transparent border-none text-gray-300"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="border-red-300/20 text-red-300 hover:bg-red-700/50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addImageUrl}
                className="w-full border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
              >
                <Image className="w-4 h-4 mr-2" />
                Add Image URL
              </Button>
            </div>
            
            <p className="text-xs text-gray-400">
              Add up to 10 images to showcase your service. Images will be displayed in your package cards.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-300/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {item ? 'Update Package' : 'Create Package'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}