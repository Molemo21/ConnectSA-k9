import { useState, useMemo } from 'react';
import { Search, Filter, X, CheckCircle } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { Service } from '@/types/services';

interface ServiceSelectorProps {
  services: Service[];
  selectedServices: string[];
  onServiceToggle: (serviceId: string) => void;
  maxSelections?: number;
  className?: string;
  disabled?: boolean;
}

export function ServiceSelector({
  services,
  selectedServices,
  onServiceToggle,
  maxSelections = 10,
  className,
  disabled = false
}: ServiceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter services based on search
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [services, searchTerm]);

  const handleServiceToggle = (serviceId: string) => {
    if (disabled) return;
    
    if (selectedServices.includes(serviceId)) {
      onServiceToggle(serviceId);
    } else if (selectedServices.length < maxSelections) {
      onServiceToggle(serviceId);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Services List */}
      <div className="space-y-2">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={cn(
              "p-4 rounded-lg border transition-all cursor-pointer",
              selectedServices.includes(service.id)
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && handleServiceToggle(service.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-500">{service.description}</p>
                )}
              </div>
              {service.basePrice && (
                <Badge variant="outline">R{service.basePrice}</Badge>
              )}
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No services found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
