export const PUNE_LOCATIONS = [
  'West Pune',
  'Baner',
  'Balewadi',
  'Wakad',
  'Hinjewadi',
  'Kharadi',
  'Viman Nagar',
  'Hadapsar',
  'Magarpatta',
  'Koregaon Park',
  'Kalyani Nagar',
  'Aundh',
  'Pimple Saudagar',
  'PCMC',
  'Undri',
  'Wagholi',
  'Tathawade',
  'Bavdhan',
  'Pashan',
  'Sus Road',
];

export const PROPERTY_SIZES = [
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4 BHK+',
  'Studio',
  'Plot/Land',
];

export const PROPERTY_TYPES = {
  Residential: ['Apartment', 'Villa', 'Penthouse', 'Row House', 'Duplex'],
  Commercial: ['Office', 'Shop', 'Showroom', 'Coworking'],
  'Plots & Land': ['Residential Plot', 'Commercial Plot', 'Agricultural Land'],
};

export const PROPERTY_TYPE_FLAT = [
  'Apartment',
  'Villa',
  'Penthouse',
  'Row House',
  'Duplex',
  'Office',
  'Shop',
  'Showroom',
  'Coworking',
  'Residential Plot',
  'Commercial Plot',
];

export const PURPOSE_OPTIONS = [
  { id: 'self', label: 'Live in it', icon: '🏡' },
  { id: 'invest', label: 'Invest', icon: '📈' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'work', label: 'Work hub', icon: '💼' },
];

export const TIMELINE_OPTIONS = [
  'Ready to move',
  'Within 1 year',
  '1-2 years',
  'Under construction',
];

export const BUDGET_HINTS: Record<string, string> = {
  '50L-80L': 'In this range, you can find a 2BHK in Wakad or Wagholi',
  '80L-1.2Cr': 'In this range, you can find a 2BHK in Baner or 3BHK in Wakad',
  '1.2Cr-1.8Cr': 'In this range, you can find a 3BHK in Baner-Balewadi',
  '1.8Cr-2.5Cr': 'In this range, premium 3BHK options in Koregaon Park or Kalyani Nagar',
  '2.5Cr+': 'Luxury 4BHK+ options across prime Pune locations',
};

export function getBudgetHint(min: number, max: number): string {
  if (max <= 8000000) return BUDGET_HINTS['50L-80L'];
  if (max <= 12000000) return BUDGET_HINTS['80L-1.2Cr'];
  if (max <= 18000000) return BUDGET_HINTS['1.2Cr-1.8Cr'];
  if (max <= 25000000) return BUDGET_HINTS['1.8Cr-2.5Cr'];
  return BUDGET_HINTS['2.5Cr+'];
}

export function formatBudget(value: number): string {
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)}Cr`;
  }
  const lakhs = value / 100000;
  return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(0)}L`;
}
