import {
  Search, ListChecks, MapPin, GitCompare, Landmark,
  Scale, Handshake, ClipboardCheck, Key,
} from 'lucide-react-native';

export interface Stage {
  label: string;
  icon: typeof Search;
  status: 'done' | 'active' | 'pending';
  alonTask: string;
}

export const STAGES: Stage[] = [
  { label: 'Search', icon: Search, status: 'active', alonTask: 'Scanning 12L+ listings by RERA & trust' },
  { label: 'Shortlist', icon: ListChecks, status: 'pending', alonTask: 'Curates top 5, checks conflicts' },
  { label: 'Site Visits', icon: MapPin, status: 'pending', alonTask: 'Books visits, number hidden' },
  { label: 'Compare', icon: GitCompare, status: 'pending', alonTask: 'Match scores, ALON\'s Pick & market data' },
  { label: 'Finance', icon: Landmark, status: 'pending', alonTask: 'Plan your loan · EMI calculator · Eligibility check' },
  { label: 'Negotiate', icon: Handshake, status: 'pending', alonTask: 'Pick a property · Market data · Negotiation checklist' },
  { label: 'Legal', icon: Scale, status: 'pending', alonTask: 'Agreement analysis · Risk detection · Affordability check' },
  { label: 'Deal Closure', icon: ClipboardCheck, status: 'pending', alonTask: 'Timeline tracking, reminders & documentation' },
  { label: 'Possession', icon: Key, status: 'pending', alonTask: 'Key dates, reminders & handover checklist' },
];
