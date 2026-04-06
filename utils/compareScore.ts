import { Property, SHORTLIST_PROPERTIES } from '../constants/properties';

/*
  Compare Score — computes how well a property matches user preferences.

  Weights:
    Budget fit     25%  — is price within user's min-max range?
    Location match 20%  — is property in user's preferred locations?
    Size match     15%  — does BHK match user's propertySize?
    Builder trust  15%  — builderScore / 5
    No conflicts   10%  — hasConflict penalty
    RERA compliant 10%  — has RERA tag
    Value for money 5%  — price/sqft vs area average
*/

interface UserPreferences {
  budget: { min: number; max: number };
  locations: string[];
  propertySize: string[]; // e.g. ['3 BHK', '2 BHK']
}

export interface MatchBreakdown {
  budgetFit: number;
  locationMatch: number;
  sizeMatch: number;
  builderTrust: number;
  noConflicts: number;
  reraCompliant: number;
  valueForMoney: number;
}

export interface MatchResult {
  score: number; // 0-100
  breakdown: MatchBreakdown;
  pros: string[];
  cons: string[];
  reason: string;
}

// --- Price parsing ---
export function parsePriceToNumber(price: string): number {
  const cleaned = price.replace(/[₹,\s]/g, '');
  if (cleaned.includes('Cr')) return parseFloat(cleaned) * 10000000;
  if (cleaned.includes('L')) return parseFloat(cleaned) * 100000;
  return parseFloat(cleaned) || 0;
}

// --- Size parsing ---
export function parseSizeToSqft(size: string): number {
  const match = size.match(/([\d,]+)\s*sq\.?ft/i);
  if (match) return parseInt(match[1].replace(/,/g, ''), 10);
  return 0;
}

export function parseBHK(size: string): string {
  const match = size.match(/(\d+)\s*BHK/i);
  return match ? `${match[1]} BHK` : '';
}

// --- Price per sqft ---
export function computePricePerSqft(price: string, size: string): number {
  const p = parsePriceToNumber(price);
  const s = parseSizeToSqft(size);
  return s > 0 ? Math.round(p / s) : 0;
}

// --- Area average price/sqft (Pune market data, curated) ---
const AREA_AVG_PRICE_PER_SQFT: Record<string, number> = {
  'Baner': 9800,
  'Balewadi': 9200,
  'Wakad': 7800,
  'Hinjewadi': 7500,
  'Kharadi': 8600,
  'Hadapsar': 7200,
  'Viman Nagar': 9500,
  'Koregaon Park': 12000,
  'Aundh': 9600,
  'Pashan': 8800,
};

function getAreaFromProperty(area: string): string {
  // Extract first part before comma: "Baner, Pune" → "Baner"
  return area.split(',')[0].trim();
}

function getAreaAvg(area: string): number {
  const areaName = getAreaFromProperty(area);
  return AREA_AVG_PRICE_PER_SQFT[areaName] || 8500; // default Pune avg
}

// --- YoY appreciation data (curated) ---
const APPRECIATION_YOY: Record<string, number> = {
  'godrej-hillside': 12,
  'pride-world-city': 15.7,
  'kolte-patil-24k': 8.5,
  'sobha-dream-acres': 10.2,
  'panchshil-towers': 11.8,
};

export function getAppreciationYoY(id: string): number {
  return APPRECIATION_YOY[id] || 10;
}

// --- Match score computation ---
export function computeMatchScore(
  property: Property,
  preferences: UserPreferences
): MatchResult {
  const priceNum = parsePriceToNumber(property.price);
  const bhk = parseBHK(property.size);
  const pricePerSqft = computePricePerSqft(property.price, property.size);
  const areaAvg = getAreaAvg(property.area);
  const areaName = getAreaFromProperty(property.area);

  // 1. Budget fit (25%) — 100 if within range, scales down if outside
  let budgetFit = 100;
  if (priceNum < preferences.budget.min) {
    budgetFit = Math.max(0, 100 - ((preferences.budget.min - priceNum) / preferences.budget.min) * 200);
  } else if (priceNum > preferences.budget.max) {
    budgetFit = Math.max(0, 100 - ((priceNum - preferences.budget.max) / preferences.budget.max) * 200);
  }

  // 2. Location match (20%) — 100 if in preferred locations
  const locationMatch = preferences.locations.length === 0
    ? 70 // no preference set = neutral
    : preferences.locations.some((loc) => areaName.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(areaName.toLowerCase()))
      ? 100
      : 20;

  // 3. Size match (15%) — 100 if BHK matches preference
  const sizeMatch = preferences.propertySize.length === 0
    ? 70
    : preferences.propertySize.includes(bhk)
      ? 100
      : 30;

  // 4. Builder trust (15%)
  const builderTrust = (property.builderScore / 5) * 100;

  // 5. No conflicts (10%)
  const noConflicts = property.hasConflict ? 0 : 100;

  // 6. RERA compliant (10%)
  const reraCompliant = property.rera ? 100 : 0;

  // 7. Value for money (5%) — lower price/sqft vs area avg = better
  const valueForMoney = areaAvg > 0
    ? Math.min(100, Math.max(0, (1 - (pricePerSqft - areaAvg) / areaAvg) * 100))
    : 50;

  const breakdown: MatchBreakdown = {
    budgetFit,
    locationMatch,
    sizeMatch,
    builderTrust,
    noConflicts,
    reraCompliant,
    valueForMoney,
  };

  const score = Math.round(
    budgetFit * 0.25 +
    locationMatch * 0.20 +
    sizeMatch * 0.15 +
    builderTrust * 0.15 +
    noConflicts * 0.10 +
    reraCompliant * 0.10 +
    valueForMoney * 0.05
  );

  // Generate pros and cons
  const pros: string[] = [];
  const cons: string[] = [];

  if (builderTrust >= 84) pros.push(`Top builder score (${property.builderScore}/5)`);
  if (budgetFit >= 90) pros.push('Within your budget');
  if (locationMatch >= 100) pros.push(`In your preferred area — ${areaName}`);
  if (!property.hasConflict && property.rera) pros.push('RERA verified, no conflicts');
  if (pricePerSqft < areaAvg) pros.push(`Below area avg (₹${pricePerSqft.toLocaleString()}/sqft vs ₹${areaAvg.toLocaleString()})`);
  const yoy = getAppreciationYoY(property.id);
  if (yoy >= 12) pros.push(`Strong appreciation (${yoy}% YoY)`);

  if (property.hasConflict) cons.push(property.conflictType || 'Has unresolved conflicts');
  if (budgetFit < 50) cons.push('Outside your budget range');
  if (locationMatch < 50) cons.push('Not in your preferred locations');
  if (pricePerSqft > areaAvg * 1.1) cons.push(`Above area avg price (₹${pricePerSqft.toLocaleString()}/sqft)`);

  // Build reason
  const topPro = pros[0] || 'Solid overall match';
  const reason = `${topPro}. Match score: ${score}%.`;

  return { score, breakdown, pros: pros.slice(0, 3), cons: cons.slice(0, 2), reason };
}

// --- Get recommended property ---
export function getRecommended(
  propertyIds: string[],
  preferences: UserPreferences
): { id: string; score: number; reason: string } | null {
  if (propertyIds.length === 0) return null;

  const properties = propertyIds
    .map((id) => SHORTLIST_PROPERTIES.find((p) => p.id === id))
    .filter(Boolean) as Property[];

  if (properties.length === 0) return null;

  let best = { id: '', score: 0, reason: '' };
  for (const p of properties) {
    const result = computeMatchScore(p, preferences);
    if (result.score > best.score) {
      best = { id: p.id, score: result.score, reason: result.reason };
    }
  }

  return best;
}

// --- Determine best value in a row for highlighting ---
export function getBestIndex(
  values: number[],
  higherIsBetter: boolean = true
): number {
  if (values.length === 0) return -1;
  let bestIdx = 0;
  for (let i = 1; i < values.length; i++) {
    if (higherIsBetter ? values[i] > values[bestIdx] : values[i] < values[bestIdx]) {
      bestIdx = i;
    }
  }
  return bestIdx;
}

// --- Build comparison row data ---
export interface CompareRow {
  label: string;
  values: string[];
  numericValues?: number[];
  higherIsBetter?: boolean;
  bestIndex: number;
}

export interface CompareGroup {
  title: string;
  rows: CompareRow[];
}

export function buildComparisonData(
  propertyIds: string[],
  preferences: UserPreferences
): { groups: CompareGroup[]; recommendedId: string | null } {
  const properties = propertyIds
    .map((id) => SHORTLIST_PROPERTIES.find((p) => p.id === id))
    .filter(Boolean) as Property[];

  if (properties.length === 0) return { groups: [], recommendedId: null };

  const prices = properties.map((p) => parsePriceToNumber(p.price));
  const sqfts = properties.map((p) => parseSizeToSqft(p.size));
  const ppsf = properties.map((p) => computePricePerSqft(p.price, p.size));
  const scores = properties.map((p) => computeMatchScore(p, preferences));
  const yoys = properties.map((p) => getAppreciationYoY(p.id));
  const areaAvgs = properties.map((p) => getAreaAvg(p.area));

  const groups: CompareGroup[] = [
    {
      title: 'Overview',
      rows: [
        {
          label: 'Price',
          values: properties.map((p) => p.price),
          numericValues: prices,
          higherIsBetter: false,
          bestIndex: getBestIndex(prices, false),
        },
        {
          label: 'Price / sq.ft',
          values: ppsf.map((v) => `₹${v.toLocaleString()}`),
          numericValues: ppsf,
          higherIsBetter: false,
          bestIndex: getBestIndex(ppsf, false),
        },
        {
          label: 'Size',
          values: sqfts.map((v) => `${v.toLocaleString()} sq.ft`),
          numericValues: sqfts,
          higherIsBetter: true,
          bestIndex: getBestIndex(sqfts, true),
        },
        {
          label: 'Config',
          values: properties.map((p) => parseBHK(p.size)),
          bestIndex: -1,
        },
        {
          label: 'Location',
          values: properties.map((p) => getAreaFromProperty(p.area)),
          bestIndex: -1,
        },
      ],
    },
    {
      title: 'Trust & Safety',
      rows: [
        {
          label: 'RERA',
          values: properties.map((p) => p.rera ? '✓ Verified' : '✗ Not found'),
          bestIndex: -1,
        },
        {
          label: 'Builder Score',
          values: properties.map((p) => `${p.builderScore} / 5`),
          numericValues: properties.map((p) => p.builderScore),
          higherIsBetter: true,
          bestIndex: getBestIndex(properties.map((p) => p.builderScore), true),
        },
        {
          label: 'Conflicts',
          values: properties.map((p) => p.hasConflict ? `⚠ ${p.conflictType || 'Flagged'}` : '✓ None'),
          bestIndex: -1,
        },
      ],
    },
    {
      title: 'Market Value',
      rows: [
        {
          label: 'vs Area Avg',
          values: ppsf.map((v, i) => {
            const diff = Math.round(((v - areaAvgs[i]) / areaAvgs[i]) * 100);
            return diff > 0 ? `+${diff}% above` : `${diff}% below`;
          }),
          numericValues: ppsf.map((v, i) => ((v - areaAvgs[i]) / areaAvgs[i]) * 100),
          higherIsBetter: false,
          bestIndex: getBestIndex(ppsf.map((v, i) => ((v - areaAvgs[i]) / areaAvgs[i]) * 100), false),
        },
        {
          label: 'YoY Growth',
          values: yoys.map((v) => `${v}%`),
          numericValues: yoys,
          higherIsBetter: true,
          bestIndex: getBestIndex(yoys, true),
        },
        {
          label: 'ALON Verdict',
          values: properties.map((p) => p.alonVerdict || '—'),
          bestIndex: -1,
        },
      ],
    },
    {
      title: 'ALON\'s Analysis',
      rows: [
        {
          label: 'Match Score',
          values: scores.map((s) => `${s.score}%`),
          numericValues: scores.map((s) => s.score),
          higherIsBetter: true,
          bestIndex: getBestIndex(scores.map((s) => s.score), true),
        },
        {
          label: 'Top Pro',
          values: scores.map((s) => s.pros[0] || '—'),
          bestIndex: -1,
        },
        {
          label: 'Concern',
          values: scores.map((s) => s.cons[0] || 'None'),
          bestIndex: -1,
        },
      ],
    },
  ];

  const recommended = getRecommended(propertyIds, preferences);

  return { groups, recommendedId: recommended?.id || null };
}
