import type { SnagCategory, PossessionDocKey } from '../store/onboarding';

/**
 * Pune-specific snag inspection template. Each category has a short
 * icon+label summary, a set of concrete check items, and a "gotcha" —
 * a Pune-builder-specific warning that elevates the check from a
 * generic list to something a seasoned buyer would actually look for.
 *
 * Content is curated (not exhaustive) — the goal is a 45-min walkthrough
 * covering the defects that cost Pune buyers the most post-handover.
 */

export interface SnagCheckItem {
  id: string;
  label: string;
  /** Short explanation / how to test. */
  hint: string;
}

export interface SnagCategoryDef {
  key: SnagCategory;
  label: string;
  /** Lucide icon name, resolved in the rendering component. */
  icon: string;
  /** One-liner shown on the category list card. */
  summary: string;
  /** Pune-specific common-pitfall callout. */
  gotcha: string;
  checks: SnagCheckItem[];
}

export const SNAG_CATEGORIES: SnagCategoryDef[] = [
  {
    key: 'structural',
    label: 'Structural',
    icon: 'building',
    summary: 'Cracks, seepage, slab integrity',
    gotcha:
      'Pune monsoon exposes waterproofing the hard way. Inspect corners, balcony slabs, and terrace joints — cracks you can fit a pencil tip into are not hairline.',
    checks: [
      { id: 'wall-cracks',     label: 'Wall cracks',               hint: 'Hairline is normal. Anything wider than 1mm needs builder attention.' },
      { id: 'ceiling-integrity', label: 'Ceiling drops or bulges', hint: 'Inspect centre of each room from multiple angles.' },
      { id: 'seepage-marks',   label: 'Seepage / dampness',        hint: 'Check corners, window edges, and walls shared with bathrooms.' },
      { id: 'balcony-slab',    label: 'Balcony slab waterproofing', hint: 'Pour a bucket of water — check for leaks one floor below if accessible.' },
      { id: 'exterior-walls',  label: 'Exterior wall condition',   hint: 'Look for exposed rebar, poor finish, or paint failure from balcony view.' },
    ],
  },
  {
    key: 'flooring',
    label: 'Flooring',
    icon: 'layout-grid',
    summary: 'Level, grout, brand match',
    gotcha:
      '~30% of Pune handovers have tile spec substitution. Check the batch code on a spare tile and match it to brochure — "Italian marble" often turns into local vitrified.',
    checks: [
      { id: 'level',           label: 'Tile level',                hint: 'No dip or hump. Use a spirit level or a marble to roll across the room.' },
      { id: 'hollow-tiles',    label: 'No hollow tiles',           hint: 'Tap with a coin — hollow sound means loose grout underneath.' },
      { id: 'brand-match',     label: 'Tile brand matches brochure', hint: 'Ask builder for a spare tile; verify batch code + brand against spec sheet.' },
      { id: 'grout-quality',   label: 'Grout colour consistency',  hint: 'Uniform colour, no visible gaps or staining.' },
      { id: 'chipped-edges',   label: 'No chipped / scratched tiles', hint: 'Inspect edges near walls, doorways, and high-traffic spots.' },
      { id: 'skirting',        label: 'Skirting alignment',        hint: 'Skirting should sit flush with tile edge — no gaps.' },
    ],
  },
  {
    key: 'walls',
    label: 'Walls & Gypsum',
    icon: 'paintbrush',
    summary: 'Gypsum, paint, finish',
    gotcha:
      'POP / gypsum cracks love to appear in Pune\'s first monsoon. Press firmly along cornice joints — any crumbling indicates poor prep under the finish.',
    checks: [
      { id: 'gypsum-uniform',  label: 'Gypsum / POP finish uniform', hint: 'No visible joints or patches in ceiling panels.' },
      { id: 'cornice-cracks',  label: 'Cornice joints — no cracks', hint: 'Common failure point; check where ceiling meets wall.' },
      { id: 'paint-uniform',   label: 'Paint uniform',             hint: 'No drips, roller lines, or patchy coverage. Check in daylight.' },
      { id: 'putty-smooth',    label: 'Smooth putty under paint',  hint: 'Run hand along wall — any bumps show through paint over time.' },
      { id: 'switch-plates',   label: 'Switch plates flush',       hint: 'Plates should sit flat against wall, no gaps at edges.' },
    ],
  },
  {
    key: 'doors-windows',
    label: 'Doors & Windows',
    icon: 'door-open',
    summary: 'Alignment, locks, seals',
    gotcha:
      'Builders often skip mosquito meshes and cheap out on sliding window tracks. Budget to replace both within year 1 if quality is shaky — test the glide before accepting.',
    checks: [
      { id: 'door-alignment',  label: 'Doors swing and latch smoothly', hint: 'No friction, no forcing. Test every door in every room.' },
      { id: 'hinges',          label: 'Hinges tight, no squeak',   hint: 'Open and close 3–4 times. Squeak = lubrication missing or wrong hinge.' },
      { id: 'locks',           label: 'Locks function smoothly',   hint: 'Test main door, internal doors, and any additional bolts.' },
      { id: 'window-seals',    label: 'Window rubber seals intact', hint: 'Rubber gasket around frame — tears or gaps let in water and noise.' },
      { id: 'mosquito-mesh',   label: 'Mosquito mesh installed',   hint: 'All windows, including kitchen. Often "forgotten" at handover.' },
      { id: 'sliding-glide',   label: 'Sliding tracks glide',      hint: 'Slide full length in both directions — no binding or wobble.' },
    ],
  },
  {
    key: 'electrical',
    label: 'Electrical',
    icon: 'zap',
    summary: 'Switches, outlets, load',
    gotcha:
      'Record your meter reading at handover with a timestamped photo — this is your baseline when you transfer MSEDCL connection to your name. Builder will claim higher readings otherwise.',
    checks: [
      { id: 'all-switches',    label: 'Every switch tested',       hint: 'Go room-by-room; mark any that don\'t respond.' },
      { id: 'all-outlets',     label: 'Every outlet live',         hint: 'Carry a phone charger; test each outlet for voltage.' },
      { id: 'ac-points',       label: 'AC / TV / internet points match plan', hint: 'Count and verify locations against brochure plan.' },
      { id: 'mcb-labeled',     label: 'MCB panel labeled',         hint: 'Each breaker should have a clear label (kitchen, living, master, etc.).' },
      { id: 'earthing-tested', label: 'Earthing tested',           hint: 'Use a socket tester or ask builder\'s electrician to demo.' },
      { id: 'meter-reading',   label: 'Meter reading photographed', hint: 'Electricity + water. Timestamp the photos; keep for utility transfer.' },
    ],
  },
  {
    key: 'plumbing',
    label: 'Plumbing & Bathrooms',
    icon: 'droplet',
    summary: 'Pressure, leaks, drainage',
    gotcha:
      'CP fittings brand substitution is common — builders swap Jaquar/Hindware for lookalikes. Check brand logos on every tap and flush; write it in the snag report.',
    checks: [
      { id: 'water-pressure',  label: 'Water pressure uniform',    hint: 'Open taps full-flow for 30 sec; pressure should match across bathrooms.' },
      { id: 'cp-brand',        label: 'CP fittings brand matches spec', hint: 'Jaquar / Hindware / Kohler — check logos on taps and flush.' },
      { id: 'no-leaks',        label: 'No leaks at connections',   hint: 'Tissue-paper test around wall-tap joins and under the sink.' },
      { id: 'floor-drain',     label: 'Floor drain trap drains',   hint: 'Pour a mug of water — should drain in under 60 seconds.' },
      { id: 'exhaust-fans',    label: 'Exhaust fans operational',  hint: 'Bathroom and kitchen. Switch them all on and off.' },
      { id: 'dual-flush',      label: 'Dual flush works both modes', hint: 'Half and full flush both functional.' },
    ],
  },
  {
    key: 'kitchen',
    label: 'Kitchen',
    icon: 'chef-hat',
    summary: 'Modular units, appliances',
    gotcha:
      'Modular kitchens are where promised-vs-delivered mismatches hit hardest. Verify brand + finish on cabinetry, chimney capacity, soft-close hinges — all against brochure.',
    checks: [
      { id: 'modular-spec',    label: 'Modular kitchen spec matches brochure', hint: 'Brand, finish, hardware — compare against spec sheet line-by-line.' },
      { id: 'chimney',         label: 'Chimney make + capacity',   hint: 'Switch it on; note brand and CFM rating against what was promised.' },
      { id: 'hob-working',     label: 'Hob working, gas connected', hint: 'Gas pipeline pressure test — all burners should light within 2 seconds.' },
      { id: 'sink-drainage',   label: 'Sink drainage',             hint: 'Fill sink to brim and drain; no standing water after 30 sec.' },
      { id: 'countertop-level', label: 'Countertop level',         hint: 'Use a 3-foot spirit level; no dips near joins.' },
      { id: 'soft-close',      label: 'Soft-close hinges (if promised)', hint: 'Cabinet doors should close slowly on their own after release.' },
    ],
  },
  {
    key: 'balconies',
    label: 'Balconies & Terrace',
    icon: 'sun',
    summary: 'Railings, drainage, waterproofing',
    gotcha:
      'Railing height must be ≥ 1m per Maharashtra building code — measure with a ruler, not an estimate. Test balcony waterproofing with a bucket before monsoon catches you.',
    checks: [
      { id: 'railing-height',  label: 'Railing height ≥ 1m',       hint: 'Measure from floor to top of railing. Below 1m is a safety violation.' },
      { id: 'waterproofing',   label: 'Balcony waterproofing',     hint: 'Pour a full bucket of water, check for leaks on floor below.' },
      { id: 'drainage-slope',  label: 'Drainage slope works',      hint: 'Water should flow to outlet; no pooling anywhere on the floor.' },
      { id: 'balcony-tiles',   label: 'Floor tile quality',        hint: 'Same quality as interior or as promised — often downgraded at balcony.' },
      { id: 'covered-balcony', label: 'Ceiling cover (if covered)', hint: 'No exposed wiring, no water-entry points at ceiling edge.' },
    ],
  },
  {
    key: 'common',
    label: 'Common Areas',
    icon: 'building-2',
    summary: 'Lifts, parking, amenities',
    gotcha:
      'Parking allotment mismatch (covered promised, open delivered) is a top Pune grievance. Re-read your agreement parking clause and walk to your allotted slot to confirm.',
    checks: [
      { id: 'lifts',           label: 'Lifts operational',         hint: 'Test all lifts. Capacity sticker visible inside cabin.' },
      { id: 'parking-match',   label: 'Parking allotted per agreement', hint: 'Confirm covered vs open, slot number, and distance to building entry.' },
      { id: 'fire-safety',     label: 'Fire safety equipment',     hint: 'Extinguishers on each floor. Check expiry / pressure.' },
      { id: 'staircase-lit',   label: 'Staircase well-lit',        hint: 'Emergency lights working — test by switching off floor light.' },
      { id: 'amenities-ready', label: 'Amenities functional',      hint: 'Pool, gym, clubhouse — walk them, not just the brochure.' },
      { id: 'fire-noc',        label: 'Fire NOC (> 15m buildings)', hint: 'Mandatory; ask builder for a copy for your file.' },
    ],
  },
];

// Flat lookup map for category detail screens.
export const SNAG_CATEGORY_MAP: Record<SnagCategory, SnagCategoryDef> =
  SNAG_CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = cat;
    return acc;
  }, {} as Record<SnagCategory, SnagCategoryDef>);

// ─── Possession documents ──────────────────────────────────────────

export interface PossessionDocDef {
  key: PossessionDocKey;
  label: string;
  source: string;       // who issues it
  whyItMatters: string; // buyer's perspective
  redFlag?: string;     // severity-raising note if missing when it shouldn't be
}

export const POSSESSION_DOCUMENTS: PossessionDocDef[] = [
  {
    key: 'oc',
    label: 'Occupation Certificate (OC)',
    source: 'PMC / PCMC',
    whyItMatters: 'Legal authority to occupy the flat. Non-negotiable.',
    redFlag:
      "Don't accept keys without OC — possession without one is legally weak, and transfers later become messy.",
  },
  {
    key: 'cc',
    label: 'Completion Certificate (CC)',
    source: 'PMC / PCMC',
    whyItMatters: 'Post-construction sign-off from the municipal authority. Often issued alongside OC.',
  },
  {
    key: 'possessionLetter',
    label: 'Possession Letter',
    source: 'Builder',
    whyItMatters: 'Formal handover document. Required for utility name-changes and property tax.',
  },
  {
    key: 'finalReceipt',
    label: 'Final Payment Receipt',
    source: 'Builder',
    whyItMatters: 'Proof all dues are cleared. Fight back if builder claims extra fees later.',
  },
  {
    key: 'saleDeed',
    label: 'Sale Deed (registered)',
    source: 'Sub-registrar',
    whyItMatters: 'Ownership proof. Already done in Deal Closure — just archive the original safely.',
  },
  {
    key: 'indexII',
    label: 'Index II',
    source: 'Sub-registrar',
    whyItMatters: 'Registration record. Needed for home loan closure, resale, and mutation.',
  },
  {
    key: 'form7A',
    label: 'Form 7A',
    source: 'PMC / PCMC',
    whyItMatters: 'Property record entry. Initiates tax and municipal trail in your name.',
  },
  {
    key: 'shareCertificate',
    label: 'Share Certificate',
    source: 'Housing Society',
    whyItMatters: 'Ownership in the co-op society. Issued after society formation (within 4 months of 51% sold, per MOFA).',
  },
  {
    key: 'fireNoc',
    label: 'Fire NOC',
    source: 'Fire department',
    whyItMatters: 'Mandatory for buildings over 15m. Request a copy for your file — matters for resale and safety audits.',
  },
  {
    key: 'liftNoc',
    label: 'Lift NOC',
    source: 'Lift inspector (PWD)',
    whyItMatters: 'Safety certification for building lifts. Builder should have it; keep a copy.',
  },
  {
    key: 'drawings',
    label: 'Electrical & plumbing drawings',
    source: 'Builder',
    whyItMatters: 'Essential for future repairs and renovations. Ask in digital format.',
  },
  {
    key: 'warrantyCards',
    label: 'Warranty cards',
    source: 'Builder / vendors',
    whyItMatters: '5-year structural defect warranty (RERA), plus waterproofing and appliance warranties. Note start date = your possession date.',
  },
];

// Flat lookup for detail views.
export const POSSESSION_DOCUMENT_MAP: Record<PossessionDocKey, PossessionDocDef> =
  POSSESSION_DOCUMENTS.reduce((acc, d) => {
    acc[d.key] = d;
    return acc;
  }, {} as Record<PossessionDocKey, PossessionDocDef>);

// ─── Handover day checklist ────────────────────────────────────────

export interface HandoverItem {
  id: string;
  label: string;
  hint: string;
}

export const HANDOVER_CHECKLIST: HandoverItem[] = [
  { id: 'keys',           label: 'Keys received',               hint: 'Main door, society door, mailbox, parking.' },
  { id: 'oc-copy',        label: 'OC copy in hand',             hint: 'Physical or digital — must have before accepting keys.' },
  { id: 'possession-ltr', label: 'Possession Letter signed',    hint: 'Builder and you both sign. Date should be today.' },
  { id: 'final-receipt',  label: 'Final payment receipt',       hint: 'Written confirmation that all dues are cleared.' },
  { id: 'joint-measure',  label: 'Carpet area joint measurement', hint: 'Measure against agreement. Variance > 3% is negotiable per RERA.' },
  { id: 'meter-reading',  label: 'Meter readings noted',        hint: 'Electricity + water. Photograph with timestamp.' },
  { id: 'snag-signoff',   label: 'Snag rectification sign-off', hint: 'All critical + major findings resolved or documented with timeline.' },
  { id: 'warranty-note',  label: 'Warranty start date noted',   hint: 'Possession date = start of 5-year structural warranty per RERA.' },
];
