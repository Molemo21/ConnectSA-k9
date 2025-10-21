'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  Edit3, 
  Save, 
  X, 
  Copy, 
  Trash2, 
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CatalogueItem {
  id: string;
  title: string;
  shortDesc: string;
  longDesc: string;
  price: number;
  durationMins: number;
  isActive: boolean;
  service: {
    id: string;
    name: string;
  };
}

interface BulkEditInterfaceProps {
  providerId: string;
  onSave?: () => void;
}

export function BulkEditInterface({ providerId, onSave }: BulkEditInterfaceProps) {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkChanges, setBulkChanges] = useState({
    priceMultiplier: 1,
    durationMultiplier: 1,
    addSuffix: '',
    removePrefix: '',
    updateDescription: false,
    newDescription: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [providerId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/provider/catalogue?providerId=${providerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch catalogue items');
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load catalogue items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const applyBulkChanges = () => {
    const updatedItems = items.map(item => {
      if (!selectedItems.has(item.id)) return item;

      let updatedItem = { ...item };

      // Apply price multiplier
      if (bulkChanges.priceMultiplier !== 1) {
        updatedItem.price = Math.round(item.price * bulkChanges.priceMultiplier);
      }

      // Apply duration multiplier
      if (bulkChanges.durationMultiplier !== 1) {
        updatedItem.durationMins = Math.round(item.durationMins * bulkChanges.durationMultiplier);
      }

      // Apply title changes
      if (bulkChanges.removePrefix) {
        updatedItem.title = item.title.replace(new RegExp(`^${bulkChanges.removePrefix}\\s*`), '');
      }
      if (bulkChanges.addSuffix) {
        updatedItem.title = `${item.title} ${bulkChanges.addSuffix}`;
      }

      // Apply description changes
      if (bulkChanges.updateDescription && bulkChanges.newDescription) {
        updatedItem.shortDesc = bulkChanges.newDescription;
      }

      return updatedItem;
    });

    setItems(updatedItems);
    setBulkEditMode(false);
    setSelectedItems(new Set());
    
    toast({
      title: 'Changes Applied',
      description: `Updated ${selectedItems.size} items with bulk changes`,
    });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/provider/catalogue/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            shortDesc: item.shortDesc,
            longDesc: item.longDesc,
            price: item.price,
            durationMins: item.durationMins,
            isActive: item.isActive
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      toast({
        title: 'Success',
        description: 'All changes saved successfully',
      });

      onSave?.();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const duplicateItem = (item: CatalogueItem) => {
    const newItem = {
      ...item,
      id: `temp_${Date.now()}`,
      title: `${item.title} (Copy)`,
      isActive: false
    };
    setItems([...items, newItem]);
  };

  const deleteItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading catalogue items...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Bulk Edit Packages</span>
              <Badge variant="secondary">{items.length} items</Badge>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setBulkEditMode(!bulkEditMode)}
                disabled={selectedItems.size === 0}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Bulk Edit ({selectedItems.size})
              </Button>
              <Button onClick={saveChanges} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Bulk Edit Panel */}
      {bulkEditMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Bulk Edit Mode</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedItems.size} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceMultiplier">Price Multiplier</Label>
                <Select
                  value={bulkChanges.priceMultiplier.toString()}
                  onValueChange={(value) => setBulkChanges(prev => ({ ...prev, priceMultiplier: parseFloat(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.8">0.8x (20% discount)</SelectItem>
                    <SelectItem value="0.9">0.9x (10% discount)</SelectItem>
                    <SelectItem value="1.0">1.0x (no change)</SelectItem>
                    <SelectItem value="1.1">1.1x (10% increase)</SelectItem>
                    <SelectItem value="1.2">1.2x (20% increase)</SelectItem>
                    <SelectItem value="1.3">1.3x (30% increase)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="durationMultiplier">Duration Multiplier</Label>
                <Select
                  value={bulkChanges.durationMultiplier.toString()}
                  onValueChange={(value) => setBulkChanges(prev => ({ ...prev, durationMultiplier: parseFloat(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x (half time)</SelectItem>
                    <SelectItem value="0.75">0.75x (25% less)</SelectItem>
                    <SelectItem value="1.0">1.0x (no change)</SelectItem>
                    <SelectItem value="1.25">1.25x (25% more)</SelectItem>
                    <SelectItem value="1.5">1.5x (50% more)</SelectItem>
                    <SelectItem value="2.0">2.0x (double time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="removePrefix">Remove Prefix</Label>
                <Input
                  id="removePrefix"
                  placeholder="e.g., 'Essential', 'Professional'"
                  value={bulkChanges.removePrefix}
                  onChange={(e) => setBulkChanges(prev => ({ ...prev, removePrefix: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="addSuffix">Add Suffix</Label>
                <Input
                  id="addSuffix"
                  placeholder="e.g., 'Package', 'Service'"
                  value={bulkChanges.addSuffix}
                  onChange={(e) => setBulkChanges(prev => ({ ...prev, addSuffix: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateDescription"
                checked={bulkChanges.updateDescription}
                onCheckedChange={(checked) => setBulkChanges(prev => ({ ...prev, updateDescription: !!checked }))}
              />
              <Label htmlFor="updateDescription">Update descriptions</Label>
            </div>

            {bulkChanges.updateDescription && (
              <div>
                <Label htmlFor="newDescription">New Description</Label>
                <Textarea
                  id="newDescription"
                  placeholder="Enter new description for all selected items"
                  value={bulkChanges.newDescription}
                  onChange={(e) => setBulkChanges(prev => ({ ...prev, newDescription: e.target.value }))}
                />
              </div>
            )}

            <div className="flex space-x-2">
              <Button onClick={applyBulkChanges}>
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
              <Button variant="outline" onClick={() => setBulkEditMode(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={selectedItems.size === items.length && items.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Service</th>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Price</th>
                  <th className="px-4 py-3 text-left font-medium">Duration</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{item.service.name}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500">{item.shortDesc}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-bold text-green-400">R</span>
                        <span className="font-semibold">{item.price}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{item.durationMins}m</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateItem(item)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

