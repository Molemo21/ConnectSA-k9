export const mainCategories = {
  BEAUTY_AND_WELLNESS: {
    name: "Beauty & Wellness",
    icon: "✨",
    description: "Professional beauty and personal care services",
  },
  HOME_SERVICES: {
    name: "Home Services",
    icon: "🏠",
    description: "Expert home maintenance and improvement services",
  },
  TECHNICAL_SERVICES: {
    name: "Technical Services",
    icon: "💻",
    description: "Professional IT and security solutions",
  },
} as const;

export const serviceCategories = {
  // Beauty & Wellness
  HAIR_SERVICES: {
    name: "Hair Services",
    icon: "✂️",
    mainCategory: "BEAUTY_AND_WELLNESS",
    description: "Professional hair care and styling",
    services: [
      {
        name: "Haircut & Trim",
        description: "Professional haircut service for all hair types",
        basePrice: 250,
        duration: 60,
        features: ["Consultation", "Wash", "Cut", "Style"],
      },
      {
        name: "Blow Dry & Styling",
        description: "Professional blow dry and styling service",
        basePrice: 300,
        duration: 90,
        features: ["Wash", "Blow dry", "Styling", "Heat protection"],
      },
      {
        name: "Hair Coloring",
        description: "Professional hair coloring service",
        basePrice: 600,
        duration: 120,
        features: ["Consultation", "Color application", "Processing", "Style"],
      },
      // Add other hair services...
    ],
  },
  NAILS: {
    name: "Nail Services",
    icon: "💅",
    mainCategory: "BEAUTY_AND_WELLNESS",
    description: "Professional nail care and treatments",
    services: [
      {
        name: "Manicure",
        description: "Professional manicure service",
        basePrice: 200,
        duration: 45,
        features: ["Soak", "Shape", "Cuticle care", "Polish"],
      },
      // Add other nail services...
    ],
  },
  
  // Home Services
  RESIDENTIAL_CLEANING: {
    name: "Residential Cleaning",
    icon: "🧹",
    mainCategory: "HOME_SERVICES",
    description: "Professional home cleaning services",
    services: [
      {
        name: "Standard Home Cleaning",
        description: "Regular home cleaning service",
        basePrice: 400,
        duration: 180,
        features: [
          "Dusting",
          "Vacuuming",
          "Mopping",
          "Bathroom cleaning",
          "Kitchen cleaning",
        ],
      },
      // Add other cleaning services...
    ],
  },
  // Add other categories...
} as const;

export type MainCategory = keyof typeof mainCategories;
export type ServiceCategory = keyof typeof serviceCategories;

export function getMainCategoryDetails(category: MainCategory) {
  return mainCategories[category];
}

export function getCategoriesForMain(mainCategory: MainCategory) {
  return Object.entries(serviceCategories)
    .filter(([_, category]) => category.mainCategory === mainCategory)
    .map(([id, category]) => ({
      id,
      ...category,
    }));
}

export function getServicesForCategory(category: ServiceCategory) {
  return serviceCategories[category].services;
}

export function getAllServices() {
  return Object.entries(serviceCategories).flatMap(([category, { services }]) =>
    services.map(service => ({
      ...service,
      category,
    }))
  );
}
