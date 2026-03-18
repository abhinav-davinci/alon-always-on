export type PersonaType = 'first' | 'upgrade' | 'invest';

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
};
