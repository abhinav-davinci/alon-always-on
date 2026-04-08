export interface Property {
  id: string;
  name: string;
  area: string;
  price: string;
  size: string;
  image: string;
  tags: string[];
  isNew: boolean;
  rera: string;
  builderScore: number;
  hasConflict: boolean;
  conflictType?: string;
  alonVerdict?: string;
}

export interface UserProperty {
  id: string;
  name: string;
  area: string;
  price: string;
  size: string;
  bhk: string;
  propertyType: string;
  images: string[];
  source: 'manual' | 'voice' | 'screenshot';
  extractedFrom?: string;
  addedAt: number;
  rera?: string;
  builderName?: string;
}

export const SHORTLIST_PROPERTIES: Property[] = [
  {
    id: 'godrej-hillside',
    name: 'Godrej Hillside',
    area: 'Baner, Pune',
    price: '₹1.35 Cr',
    size: '3 BHK · 1,450 sq.ft',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
    tags: ['RERA ✓', 'Premium'],
    isNew: true,
    rera: 'P52100012345',
    builderScore: 4.5,
    hasConflict: false,
    alonVerdict: '12% annual appreciation — top pick in Baner',
  },
  {
    id: 'pride-world-city',
    name: 'Pride World City',
    area: 'Balewadi, Pune',
    price: '₹1.18 Cr',
    size: '3 BHK · 1,320 sq.ft',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=250&fit=crop',
    tags: ['RERA ✓', 'Ready'],
    isNew: true,
    rera: 'P52100067890',
    builderScore: 4.2,
    hasConflict: false,
    alonVerdict: '15.7% YoY growth — ready to move in',
  },
  {
    id: 'kolte-patil-24k',
    name: 'Kolte Patil 24K',
    area: 'Wakad, Pune',
    price: '₹98 L',
    size: '2 BHK · 1,050 sq.ft',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=250&fit=crop',
    tags: ['RERA ✓'],
    isNew: false,
    rera: 'P52100034567',
    builderScore: 4.0,
    hasConflict: true,
    conflictType: 'Pending land title clarification',
    alonVerdict: 'Best value per sq.ft — title issue pending',
  },
  {
    id: 'sobha-dream-acres',
    name: 'Sobha Dream Acres',
    area: 'Hinjewadi, Pune',
    price: '₹1.05 Cr',
    size: '2 BHK · 1,180 sq.ft',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop',
    tags: ['RERA ✓', 'New Launch'],
    isNew: true,
    rera: 'P52100045678',
    builderScore: 4.3,
    hasConflict: false,
    alonVerdict: 'IT hub proximity — strong rental yield',
  },
  {
    id: 'panchshil-towers',
    name: 'Panchshil Towers',
    area: 'Kharadi, Pune',
    price: '₹1.42 Cr',
    size: '3 BHK · 1,520 sq.ft',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=250&fit=crop',
    tags: ['RERA ✓', 'Premium'],
    isNew: false,
    rera: 'P52100056789',
    builderScore: 4.6,
    hasConflict: false,
    alonVerdict: 'Highest builder trust score — 4.6/5',
  },
];
