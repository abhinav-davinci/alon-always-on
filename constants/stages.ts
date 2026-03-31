import {
  Search, ListChecks, MapPin, GitCompare, Landmark,
  Scale, Handshake, Key,
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
  { label: 'Compare', icon: GitCompare, status: 'pending', alonTask: 'Side-by-side real transaction data' },
  { label: 'Finance', icon: Landmark, status: 'pending', alonTask: 'Best rates from 10+ banks' },
  { label: 'Legal', icon: Scale, status: 'pending', alonTask: 'Verify builder reputation & flag risky clauses' },
  { label: 'Negotiate', icon: Handshake, status: 'pending', alonTask: 'Index 2 + negotiation checklist' },
  { label: 'Possession', icon: Key, status: 'pending', alonTask: 'Key dates, reminders & handover checklist' },
];
