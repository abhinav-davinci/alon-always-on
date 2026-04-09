/**
 * Finance data constants for ALON — Phase 1 (no backend needed).
 * All rates and rules curated for Maharashtra / Pune market.
 */

// ── CIBIL Score Brackets ──
export interface CibilBracket {
  label: string;
  min: number;
  max: number;
  rateAddon: number;   // added to base rate
  foirLimit: number;    // max Fixed Obligation to Income Ratio
  approvalLikelihood: string;
  color: string;
}

export const CIBIL_BRACKETS: CibilBracket[] = [
  { label: 'Excellent', min: 750, max: 900, rateAddon: 0, foirLimit: 0.55, approvalLikelihood: 'Very High', color: '#22C55E' },
  { label: 'Good', min: 700, max: 749, rateAddon: 0.25, foirLimit: 0.50, approvalLikelihood: 'High', color: '#84CC16' },
  { label: 'Fair', min: 650, max: 699, rateAddon: 0.75, foirLimit: 0.45, approvalLikelihood: 'Moderate', color: '#F59E0B' },
  { label: 'Poor', min: 550, max: 649, rateAddon: 1.5, foirLimit: 0.40, approvalLikelihood: 'Low', color: '#EF4444' },
  { label: 'Very Poor', min: 300, max: 549, rateAddon: 3, foirLimit: 0.35, approvalLikelihood: 'Very Low', color: '#DC2626' },
];

export const DEFAULT_CIBIL = 750; // assumption when user skips

export function getCibilBracket(score: number): CibilBracket {
  return CIBIL_BRACKETS.find(b => score >= b.min && score <= b.max) || CIBIL_BRACKETS[0];
}

// ── Interest Rate Data ──
export const BASE_RATE = 8.50; // current market base for 750+ CIBIL (% p.a.)
export const MAX_TENURE_YEARS = 30;
export const DEFAULT_TENURE = 20;
export const DEFAULT_DOWN_PAYMENT_PERCENT = 20; // banks typically need 20% down

// ── Maharashtra Stamp Duty & Registration ──
export const STAMP_DUTY_RATE = 0.05;     // 5% in Pune urban
export const REGISTRATION_FEE_RATE = 0.01; // 1%
export const GST_UNDER_CONSTRUCTION = 0.05; // 5% GST on under-construction (no ITC)
export const GST_AFFORDABLE_THRESHOLD = 4500000; // ₹45L — affordable housing GST 1%
export const GST_AFFORDABLE_RATE = 0.01;

// ── Legal & Miscellaneous Costs ──
export const LEGAL_FEE_ESTIMATE = 25000;      // typical lawyer fees
export const SOCIETY_TRANSFER_FEE = 25000;     // approx
export const BROKERAGE_RATE = 0.01;            // 1% if broker involved

// ── CIBIL Check Links ──
export const CIBIL_CHECK_LINKS = [
  { name: 'Paisabazaar', url: 'https://www.paisabazaar.com/cibil-score/' },
  { name: 'CRED', url: 'https://cred.club/cibil-score' },
  { name: 'OneScore', url: 'https://www.onescore.app/' },
];

// ── Employment Types (affects eligibility) ──
export type EmploymentType = 'salaried' | 'self-employed' | 'business';

export const EMPLOYMENT_MULTIPLIERS: Record<EmploymentType, number> = {
  'salaried': 1.0,       // standard
  'self-employed': 0.85,  // banks discount self-employed income
  'business': 0.80,       // even more conservative
};
