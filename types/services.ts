export interface ServiceData {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  features: string[];
  duration: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  services: ServiceData[];
}