export type GoalType = 'buy' | 'rent';
export type PersonaType = 'first' | 'upgrade' | 'invest' | 'rent_new' | 'rent_change' | 'rent_sublease';

export interface PersonaDefaults {
  location: string;
  propertySize: string[];
  propertyType: string;
  budget: { min: number; max: number };
  purpose: string;
  timeline: string;
}

export const PERSONA_INTENTS: Record<
  PersonaType,
  { icon: string; title: string; subtitle: string }
> = {
  first: {
    icon: '🏠',
    title: 'Buying my first home',
    subtitle: 'Need a little guidance along the way',
  },
  upgrade: {
    icon: '⬆️',
    title: 'Upgrading to something bigger',
    subtitle: 'I know what I want, need the right match',
  },
  invest: {
    icon: '📈',
    title: 'Looking for an investment',
    subtitle: 'ROI, rental yield, capital appreciation',
  },
  rent_new: {
    icon: '🏢',
    title: 'First office or upgrading',
    subtitle: 'Finding the right space for your team',
  },
  rent_change: {
    icon: '🔄',
    title: 'Changing office space',
    subtitle: 'Relocating or resizing your current setup',
  },
  rent_sublease: {
    icon: '📋',
    title: 'Sub-leasing',
    subtitle: 'Lease out unused office space',
  },
};

export const PERSONA_DEFAULTS: Record<PersonaType, PersonaDefaults> = {
  first: {
    location: 'West Pune',
    propertySize: ['2 BHK', '3 BHK'],
    propertyType: 'Apartment',
    budget: { min: 8000000, max: 12000000 },
    purpose: 'Self use',
    timeline: 'Ready to move',
  },
  upgrade: {
    location: 'Baner-Balewadi',
    propertySize: ['3 BHK'],
    propertyType: 'Apartment',
    budget: { min: 12000000, max: 18000000 },
    purpose: 'Self use',
    timeline: 'Flexible',
  },
  invest: {
    location: 'Hinjewadi-Wakad',
    propertySize: ['2 BHK'],
    propertyType: 'Apartment',
    budget: { min: 5000000, max: 9000000 },
    purpose: 'Investment',
    timeline: 'New launch',
  },
  rent_new: {
    location: 'Baner-Balewadi',
    propertySize: ['500–1000 sqft'],
    propertyType: 'Office',
    budget: { min: 25000, max: 60000 },
    purpose: 'Office',
    timeline: 'Immediate',
  },
  rent_change: {
    location: 'Kharadi-Viman Nagar',
    propertySize: ['1000–2000 sqft'],
    propertyType: 'Office',
    budget: { min: 50000, max: 120000 },
    purpose: 'Office',
    timeline: 'Flexible',
  },
  rent_sublease: {
    location: 'Hinjewadi-Wakad',
    propertySize: ['500–1500 sqft'],
    propertyType: 'Office',
    budget: { min: 30000, max: 80000 },
    purpose: 'Sub-lease',
    timeline: 'Flexible',
  },
};

export const PERSONA_PROFILE_ROWS: Record<
  PersonaType,
  { icon: string; label: string; value: string }[]
> = {
  first: [
    { icon: '📍', label: 'Location', value: 'West Pune' },
    { icon: '🏠', label: 'Type', value: 'Apartment' },
    { icon: '📐', label: 'Size', value: '2-3 BHK' },
    { icon: '💰', label: 'Budget', value: '₹80L – ₹1.2Cr' },
    { icon: '🎯', label: 'Purpose', value: 'Self use · Ready possession' },
  ],
  upgrade: [
    { icon: '📍', label: 'Location', value: 'Baner-Balewadi' },
    { icon: '🏠', label: 'Type', value: 'Apartment' },
    { icon: '📐', label: 'Size', value: '3 BHK' },
    { icon: '💰', label: 'Budget', value: '₹1.2Cr – ₹1.8Cr' },
    { icon: '🎯', label: 'Purpose', value: 'Self use · Flexible timeline' },
  ],
  invest: [
    { icon: '📍', label: 'Location', value: 'Hinjewadi-Wakad' },
    { icon: '🏠', label: 'Type', value: 'Apartment' },
    { icon: '📐', label: 'Size', value: '2 BHK' },
    { icon: '💰', label: 'Budget', value: '₹50L – ₹90L' },
    { icon: '🎯', label: 'Purpose', value: 'Investment · New launch' },
  ],
  rent_new: [
    { icon: '📍', label: 'Location', value: 'Baner-Balewadi' },
    { icon: '🏢', label: 'Type', value: 'Office' },
    { icon: '📐', label: 'Size', value: '500–1000 sqft' },
    { icon: '💰', label: 'Rent', value: '₹25K – ₹60K/mo' },
    { icon: '🎯', label: 'Purpose', value: 'Office · Immediate' },
  ],
  rent_change: [
    { icon: '📍', label: 'Location', value: 'Kharadi-Viman Nagar' },
    { icon: '🏢', label: 'Type', value: 'Office' },
    { icon: '📐', label: 'Size', value: '1000–2000 sqft' },
    { icon: '💰', label: 'Rent', value: '₹50K – ₹1.2L/mo' },
    { icon: '🎯', label: 'Purpose', value: 'Office · Flexible' },
  ],
  rent_sublease: [
    { icon: '📍', label: 'Location', value: 'Hinjewadi-Wakad' },
    { icon: '🏢', label: 'Type', value: 'Office' },
    { icon: '📐', label: 'Size', value: '500–1500 sqft' },
    { icon: '💰', label: 'Rent', value: '₹30K – ₹80K/mo' },
    { icon: '🎯', label: 'Purpose', value: 'Sub-lease · Flexible' },
  ],
};
