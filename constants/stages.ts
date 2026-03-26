import {
  Search, ListChecks, MapPin, GitCompare, Landmark,
  Scale, Handshake, Key,
} from 'lucide-react-native';

export interface Stage {
  num: number;
  label: string;
  icon: typeof Search;
  status: 'done' | 'active' | 'pending';
  alonTask: string;
}

export const STAGES: Stage[] = [
  { num: 1, label: 'Search', icon: Search, status: 'active', alonTask: 'Scanning 12L+ listings by RERA & trust' },
  { num: 2, label: 'Shortlist', icon: ListChecks, status: 'pending', alonTask: 'Curates top 5, checks conflicts' },
  { num: 3, label: 'Site Visits', icon: MapPin, status: 'pending', alonTask: 'Books visits, number hidden' },
  { num: 4, label: 'Compare', icon: GitCompare, status: 'pending', alonTask: 'Side-by-side real transaction data' },
  { num: 5, label: 'Finance', icon: Landmark, status: 'pending', alonTask: 'Best rates from 10+ banks' },
  { num: 6, label: 'Legal', icon: Scale, status: 'pending', alonTask: 'Flags risky clauses, verifies RERA' },
  { num: 7, label: 'Negotiate', icon: Handshake, status: 'pending', alonTask: 'Market leverage from sales data' },
  { num: 8, label: 'Possession', icon: Key, status: 'pending', alonTask: 'Full checklist — docs to transfers' },
];
