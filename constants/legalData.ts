/**
 * Legal Analysis — prototype data layer.
 *
 * Phase 1 has no real parser, so the "analysis" for any uploaded agreement
 * is pre-baked. With the multi-agreement switcher, a user can analyze many
 * agreements and toggle between them, so a single hardcoded result would
 * make every agreement look identical and break the "respective analysis"
 * promise. To fix that, we keep a small pool of `AnalysisVariant`s and map
 * each property deterministically (by a stable hash of its id) onto one.
 *
 * Same property id → same variant every time, so switching back and forth
 * is consistent. Different agreements get visibly different risk counts,
 * "At a glance" values, and benchmarks.
 *
 * When the real upload/parse pipeline lands, `getAnalysisVariant` is the
 * single seam to replace — swap the deterministic pick for the parsed
 * result keyed by property id.
 */

export interface RiskFinding {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  quote: string;
  explanation: string;
  action: string;
}

export interface BenchmarkItem {
  label: string;
  yours: string;
  market: string;
  severity: 'concern' | 'neutral' | 'favorable';
  deltaText: string;
  why?: string;
}

/** The "At a glance" summary block — varies per agreement. */
export interface GlanceData {
  possession: string;
  possessionWarning?: string;
  paymentPlan: string;
  maintenance: string;
  maintenanceWarning?: string;
  rera: string;
}

export interface AnalysisVariant {
  glance: GlanceData;
  risks: RiskFinding[];
  benchmarks: BenchmarkItem[];
}

// ───────────────────────────────────────────────────────────────────
// Variant 0 — high-risk profile (2 high · 3 medium · 4 low).
// This is the original Phase-1 pre-baked content (Kumar Pebble Bay demo).
// ───────────────────────────────────────────────────────────────────
const VARIANT_HIGH: AnalysisVariant = {
  glance: {
    possession: 'Dec 2026',
    possessionWarning: 'No delay penalty clause',
    paymentPlan: '10 construction-linked stages · 20% upfront',
    maintenance: '₹4.50/sq.ft',
    maintenanceWarning: '28% above Baner average',
    rera: 'P52100012345',
  },
  risks: [
    // HIGH (2)
    {
      id: 'no-possession-penalty',
      severity: 'high',
      title: 'No possession delay penalty clause',
      quote: '"In the event of delay in possession, the Promoter shall not be liable for any compensation..."',
      explanation: 'The agreement lacks a clear penalty clause if the builder delays possession beyond the promised date. RERA mandates a minimum interest payout at MCLR+2% for delays — this is missing.',
      action: 'Demand a clause stating ₹X per sq.ft per month of delay, or interest at MCLR+2% on amounts paid.',
    },
    {
      id: 'one-sided-cancellation',
      severity: 'high',
      title: 'One-sided cancellation terms',
      quote: '"In case of cancellation by the Allottee, 10% of the total consideration shall be forfeited by the Promoter..."',
      explanation: 'You lose 10% if you cancel, but the builder faces no equivalent penalty for their default or delay. This is an unfair trade practice under the Consumer Protection Act.',
      action: 'Negotiate reciprocal terms: 10% penalty only after construction milestones; builder pays equal penalty on delay.',
    },
    // MEDIUM (3)
    {
      id: 'maintenance-above-avg',
      severity: 'medium',
      title: 'Maintenance above area average',
      quote: '"Monthly maintenance charges shall be ₹4.50 per sq.ft..."',
      explanation: 'Baner area average is ₹3.50/sq.ft. You are paying 28% above market rate. Over 5 years on a 1,450 sq.ft flat, this adds up to ₹87,000 in excess maintenance.',
      action: 'Ask for a breakdown of maintenance costs. Push to negotiate down to ₹3.75-4.00/sq.ft.',
    },
    {
      id: 'club-membership',
      severity: 'medium',
      title: 'Club membership not disclosed at booking',
      quote: '"A one-time club membership fee of ₹2,50,000 is payable at the time of possession..."',
      explanation: 'This charge was not mentioned at the booking stage. MahaRERA disclosure norms require all charges to be stated upfront.',
      action: 'Ask for a written waiver of this fee or reduction by 50%. Many builders waive it during negotiation.',
    },
    {
      id: 'common-area-ambiguous',
      severity: 'medium',
      title: 'Common-area definition is ambiguous',
      quote: '"Common areas include such areas as the Promoter may designate..."',
      explanation: 'The clause gives the builder unilateral discretion to designate common areas, which can reduce your usable carpet area post-possession.',
      action: 'Insist on a specific, itemized list of common areas with sq.ft allocations in an annexure.',
    },
    // LOW (4)
    {
      id: 'arbitration',
      severity: 'low',
      title: 'Standard arbitration clause',
      quote: '"Any disputes shall be resolved by arbitration in Pune..."',
      explanation: 'Standard clause, aligned with MahaRERA requirements. Nothing to worry about.',
      action: 'No action needed.',
    },
    {
      id: 'jurisdiction',
      severity: 'low',
      title: 'Default jurisdiction clause',
      quote: '"Courts in Pune shall have exclusive jurisdiction..."',
      explanation: 'Standard and fair — disputes can be filed in Pune where the property is located.',
      action: 'No action needed.',
    },
    {
      id: 'missing-disclosure',
      severity: 'low',
      title: 'Non-mandatory MahaRERA disclosure missing',
      quote: '(Page 7: promoter financial disclosure section incomplete)',
      explanation: 'The optional promoter financial disclosure is incomplete. Not legally required, but reduces transparency.',
      action: 'Request the builder share their 3-year financial statement if you want extra assurance.',
    },
    {
      id: 'formatting',
      severity: 'low',
      title: 'Minor formatting inconsistencies',
      quote: '(Various pages: numbering, font inconsistencies)',
      explanation: 'Minor typos and inconsistent formatting. No legal impact.',
      action: 'No action needed.',
    },
  ],
  benchmarks: [
    {
      label: 'Maintenance',
      yours: '₹4.50/sq.ft',
      market: '₹3.50/sq.ft',
      severity: 'concern',
      deltaText: '+28% above',
      why: 'Adds ~₹87K over 5 years on a 1,450 sq.ft flat',
    },
    {
      label: 'Possession buffer',
      yours: '8 months',
      market: '3–6 months',
      severity: 'concern',
      deltaText: 'Builder has buffer',
      why: 'Extra months let the builder delay without penalty',
    },
    {
      label: 'Floor rise',
      yours: '₹75/sq.ft',
      market: '₹50–100/sq.ft',
      severity: 'neutral',
      deltaText: 'Within range',
    },
    {
      label: 'GST',
      yours: '5% on under-construction',
      market: 'Standard',
      severity: 'neutral',
      deltaText: 'As per law',
    },
    {
      label: 'Cancellation penalty',
      yours: '10% (buyer only)',
      market: 'Reciprocal preferred',
      severity: 'concern',
      deltaText: 'One-sided',
      why: 'You forfeit 10%, builder owes nothing on delay',
    },
  ],
};

// ───────────────────────────────────────────────────────────────────
// Variant 1 — moderate profile (1 high · 2 medium · 3 low).
// ───────────────────────────────────────────────────────────────────
const VARIANT_MODERATE: AnalysisVariant = {
  glance: {
    possession: 'Jun 2025',
    paymentPlan: '8 milestone-linked stages · 15% upfront',
    maintenance: '₹3.80/sq.ft',
    maintenanceWarning: '9% above area average',
    rera: 'P52100099887',
  },
  risks: [
    // HIGH (1)
    {
      id: 'escalation-uncapped',
      severity: 'high',
      title: 'Price escalation clause without a cap',
      quote: '"The Promoter reserves the right to revise the consideration on account of increase in construction costs..."',
      explanation: 'The agreement lets the builder raise the price for "cost increases" with no upper limit and no objective trigger. Under RERA the agreed consideration is meant to be fixed once booked.',
      action: 'Strike this clause or cap any escalation at a fixed percentage tied to a published cost index, with your written consent required.',
    },
    // MEDIUM (2)
    {
      id: 'maintenance-slightly-above',
      severity: 'medium',
      title: 'Maintenance slightly above average',
      quote: '"Monthly maintenance charges shall be ₹3.80 per sq.ft..."',
      explanation: 'The area average is ₹3.50/sq.ft. You are ~9% above market — modest, but worth confirming what it covers.',
      action: 'Ask for an itemized maintenance breakdown and push toward ₹3.50/sq.ft.',
    },
    {
      id: 'parking-not-allotted',
      severity: 'medium',
      title: 'Parking not explicitly allotted',
      quote: '"Parking, if any, shall be allotted at the sole discretion of the Promoter..."',
      explanation: 'A covered parking slot is not specifically assigned to your unit. This is a common source of post-possession disputes.',
      action: 'Get the specific parking slot number written into the agreement or an annexure.',
    },
    // LOW (3)
    {
      id: 'arbitration-m',
      severity: 'low',
      title: 'Standard arbitration clause',
      quote: '"Any disputes shall be resolved by arbitration in Pune..."',
      explanation: 'Standard clause, aligned with MahaRERA requirements.',
      action: 'No action needed.',
    },
    {
      id: 'jurisdiction-m',
      severity: 'low',
      title: 'Default jurisdiction clause',
      quote: '"Courts in Pune shall have exclusive jurisdiction..."',
      explanation: 'Standard and fair — disputes can be filed in Pune where the property is located.',
      action: 'No action needed.',
    },
    {
      id: 'formatting-m',
      severity: 'low',
      title: 'Minor formatting inconsistencies',
      quote: '(Various pages: numbering, font inconsistencies)',
      explanation: 'Minor typos and inconsistent formatting. No legal impact.',
      action: 'No action needed.',
    },
  ],
  benchmarks: [
    {
      label: 'Maintenance',
      yours: '₹3.80/sq.ft',
      market: '₹3.50/sq.ft',
      severity: 'concern',
      deltaText: '+9% above',
      why: 'Modest premium — confirm what it covers',
    },
    {
      label: 'Possession buffer',
      yours: '4 months',
      market: '3–6 months',
      severity: 'neutral',
      deltaText: 'Within range',
    },
    {
      label: 'Floor rise',
      yours: '₹60/sq.ft',
      market: '₹50–100/sq.ft',
      severity: 'neutral',
      deltaText: 'Within range',
    },
    {
      label: 'GST',
      yours: '5% on under-construction',
      market: 'Standard',
      severity: 'neutral',
      deltaText: 'As per law',
    },
    {
      label: 'Cancellation penalty',
      yours: '5% (reciprocal)',
      market: 'Reciprocal preferred',
      severity: 'favorable',
      deltaText: 'Balanced',
      why: 'Both sides carry an equal penalty — fair',
    },
  ],
};

// ───────────────────────────────────────────────────────────────────
// Variant 2 — clean profile (0 high · 1 medium · 4 low).
// ───────────────────────────────────────────────────────────────────
const VARIANT_CLEAN: AnalysisVariant = {
  glance: {
    possession: 'Ready to move',
    paymentPlan: 'Full payment on registration',
    maintenance: '₹3.40/sq.ft',
    rera: 'P52100045612',
  },
  risks: [
    // MEDIUM (1)
    {
      id: 'club-fee-c',
      severity: 'medium',
      title: 'Club membership fee due at possession',
      quote: '"A one-time club membership fee of ₹1,50,000 is payable at the time of possession..."',
      explanation: 'The fee is disclosed in the agreement (good), but it falls due as a lump sum at possession. Budget for it so it is not a surprise.',
      action: 'Confirm the fee is final and ask whether it can be folded into the payment schedule.',
    },
    // LOW (4)
    {
      id: 'possession-penalty-c',
      severity: 'low',
      title: 'Possession delay penalty present',
      quote: '"In the event of delay, the Promoter shall pay interest at MCLR+2% per annum on amounts paid..."',
      explanation: 'A RERA-compliant delay penalty is in place. This protects you well.',
      action: 'No action needed.',
    },
    {
      id: 'arbitration-c',
      severity: 'low',
      title: 'Standard arbitration clause',
      quote: '"Any disputes shall be resolved by arbitration in Pune..."',
      explanation: 'Standard clause, aligned with MahaRERA requirements.',
      action: 'No action needed.',
    },
    {
      id: 'jurisdiction-c',
      severity: 'low',
      title: 'Default jurisdiction clause',
      quote: '"Courts in Pune shall have exclusive jurisdiction..."',
      explanation: 'Standard and fair — disputes can be filed in Pune where the property is located.',
      action: 'No action needed.',
    },
    {
      id: 'formatting-c',
      severity: 'low',
      title: 'Minor formatting inconsistencies',
      quote: '(Various pages: numbering, font inconsistencies)',
      explanation: 'Minor typos and inconsistent formatting. No legal impact.',
      action: 'No action needed.',
    },
  ],
  benchmarks: [
    {
      label: 'Maintenance',
      yours: '₹3.40/sq.ft',
      market: '₹3.50/sq.ft',
      severity: 'favorable',
      deltaText: 'Below market',
      why: 'Slightly under the area average',
    },
    {
      label: 'Possession buffer',
      yours: 'Ready to move',
      market: '3–6 months',
      severity: 'favorable',
      deltaText: 'No wait',
    },
    {
      label: 'Floor rise',
      yours: '₹55/sq.ft',
      market: '₹50–100/sq.ft',
      severity: 'neutral',
      deltaText: 'Within range',
    },
    {
      label: 'GST',
      yours: 'Nil (ready property)',
      market: 'Standard',
      severity: 'favorable',
      deltaText: 'No GST',
      why: 'Completed properties attract no GST',
    },
    {
      label: 'Cancellation penalty',
      yours: '5% (reciprocal)',
      market: 'Reciprocal preferred',
      severity: 'favorable',
      deltaText: 'Balanced',
    },
  ],
};

export const LEGAL_ANALYSIS_VARIANTS: AnalysisVariant[] = [
  VARIANT_HIGH,
  VARIANT_MODERATE,
  VARIANT_CLEAN,
];

// Mock parser output for the prototype. In production the parsed property
// metadata comes from the upload pipeline — we just want plausible
// Pune-market values so the UI downstream (AT A GLANCE, affordability,
// benchmarks) has realistic context. Cycled per-extraction so users
// running the flow multiple times don't see identical rows.
export const MOCK_EXTRACTED_PROPERTIES = [
  { name: 'Kumar Pebble Bay',    location: 'Kalyani Nagar, Pune', price: '₹1.68 Cr', propertyType: 'Apartment' },
  { name: 'Lodha Belmondo',      location: 'Pirangut, Pune',      price: '₹95 L',    propertyType: 'Villa' },
  { name: 'Mahindra Antheia',    location: 'Pimpri, Pune',        price: '₹1.42 Cr', propertyType: 'Apartment' },
  { name: 'Kolte-Patil iTowers', location: 'Hinjewadi, Pune',     price: '₹1.15 Cr', propertyType: 'Apartment' },
  { name: 'Rohan Abhilasha',     location: 'Wagholi, Pune',       price: '₹85 L',    propertyType: 'Apartment' },
];

/** Stable, order-independent hash of a property id → non-negative int. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Deterministically pick an analysis variant for a property. Same id always
 * resolves to the same variant, so toggling between agreements is stable.
 */
export function getAnalysisVariant(propertyId: string): AnalysisVariant {
  return LEGAL_ANALYSIS_VARIANTS[hashId(propertyId) % LEGAL_ANALYSIS_VARIANTS.length];
}

/** Risk counts by severity for a property's analysis — used by the switcher. */
export function riskCountsForProperty(propertyId: string): {
  high: number;
  medium: number;
  low: number;
} {
  const v = getAnalysisVariant(propertyId);
  return {
    high: v.risks.filter((r) => r.severity === 'high').length,
    medium: v.risks.filter((r) => r.severity === 'medium').length,
    low: v.risks.filter((r) => r.severity === 'low').length,
  };
}
