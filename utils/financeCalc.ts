/**
 * Finance calculation utilities — pure functions, no side effects.
 * All monetary values in INR (paise-free — we deal in lakhs/crores).
 */

import {
  BASE_RATE,
  STAMP_DUTY_RATE,
  REGISTRATION_FEE_RATE,
  GST_UNDER_CONSTRUCTION,
  GST_AFFORDABLE_THRESHOLD,
  GST_AFFORDABLE_RATE,
  LEGAL_FEE_ESTIMATE,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  getCibilBracket,
  DEFAULT_CIBIL,
  EMPLOYMENT_MULTIPLIERS,
  EmploymentType,
} from '../constants/financeData';

// ── EMI Calculation ──
// Standard reducing balance formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
export function calculateEMI(principal: number, annualRate: number, tenureYears: number): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  const r = annualRate / 100 / 12; // monthly rate
  const n = tenureYears * 12;       // total months
  if (r === 0) return Math.round(principal / n);
  const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
}

// ── Interest rate based on CIBIL ──
export function getInterestRate(cibilScore: number | null): number {
  const score = cibilScore ?? DEFAULT_CIBIL;
  const bracket = getCibilBracket(score);
  return BASE_RATE + bracket.rateAddon;
}

// ── Loan amount from property price ──
export function getLoanAmount(propertyPrice: number, downPaymentPercent: number = DEFAULT_DOWN_PAYMENT_PERCENT): number {
  return Math.round(propertyPrice * (1 - downPaymentPercent / 100));
}

// ── Total Acquisition Cost Breakdown ──
export interface AcquisitionCost {
  propertyPrice: number;
  stampDuty: number;
  registrationFee: number;
  gst: number;
  legalFees: number;
  totalCost: number;
  overPropertyPrice: number; // how much more than listed price
}

export function calculateAcquisitionCost(
  propertyPrice: number,
  isUnderConstruction: boolean = false,
): AcquisitionCost {
  const stampDuty = Math.round(propertyPrice * STAMP_DUTY_RATE);
  const registrationFee = Math.round(propertyPrice * REGISTRATION_FEE_RATE);

  let gst = 0;
  if (isUnderConstruction) {
    gst = propertyPrice <= GST_AFFORDABLE_THRESHOLD
      ? Math.round(propertyPrice * GST_AFFORDABLE_RATE)
      : Math.round(propertyPrice * GST_UNDER_CONSTRUCTION);
  }

  const legalFees = LEGAL_FEE_ESTIMATE;
  const totalCost = propertyPrice + stampDuty + registrationFee + gst + legalFees;
  const overPropertyPrice = totalCost - propertyPrice;

  return { propertyPrice, stampDuty, registrationFee, gst, legalFees, totalCost, overPropertyPrice };
}

// ── Loan Eligibility ──
export interface EligibilityResult {
  maxLoanAmount: number;
  maxEMI: number;
  maxPropertyPrice: number;   // loan + down payment
  interestRate: number;
  cibilBracketLabel: string;
  cibilColor: string;
  approvalLikelihood: string;
  tenureYears: number;
}

export function calculateEligibility(
  monthlyIncome: number,
  existingEMIs: number,
  cibilScore: number | null,
  employmentType: EmploymentType = 'salaried',
  tenureYears: number = 20,
): EligibilityResult {
  const score = cibilScore ?? DEFAULT_CIBIL;
  const bracket = getCibilBracket(score);
  const rate = BASE_RATE + bracket.rateAddon;

  // Available income for new EMI = (income × FOIR limit) - existing EMIs
  const employmentFactor = EMPLOYMENT_MULTIPLIERS[employmentType];
  const effectiveIncome = monthlyIncome * employmentFactor;
  const maxEMI = Math.max(0, Math.round(effectiveIncome * bracket.foirLimit - existingEMIs));

  // Reverse-calculate max loan from max EMI
  const r = rate / 100 / 12;
  const n = tenureYears * 12;
  let maxLoanAmount = 0;
  if (r > 0 && maxEMI > 0) {
    maxLoanAmount = Math.round(maxEMI * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
  }

  // Max property price = loan + 20% down payment equivalent
  const maxPropertyPrice = Math.round(maxLoanAmount / (1 - DEFAULT_DOWN_PAYMENT_PERCENT / 100));

  return {
    maxLoanAmount,
    maxEMI,
    maxPropertyPrice,
    interestRate: rate,
    cibilBracketLabel: bracket.label,
    cibilColor: bracket.color,
    approvalLikelihood: bracket.approvalLikelihood,
    tenureYears,
  };
}

// ── Format helpers ──
// For large amounts (property prices, loan amounts): ₹1.35 Cr, ₹80 L
export function formatINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

// For monthly amounts (EMI, income): always full number ₹87,400
export function formatEMI(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatINRShort(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)}L`;
  return `₹${Math.round(amount / 1000)}K`;
}
