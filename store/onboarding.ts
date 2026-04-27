import { create } from 'zustand';
import { GoalType, PersonaType, PERSONA_DEFAULTS } from '../constants/personas';
import { UserProperty } from '../constants/properties';

/**
 * A completed (or in-progress) legal analysis for a specific property.
 * Keyed in the store by `propertyId` so a user can analyze agreements for
 * multiple properties independently.
 */
export interface LegalAnalysisRecord {
  propertyId: string;
  docName: string;
  uploadedAt: number;
}

/**
 * An "external" property — one the user brought to Legal Analysis from
 * outside ALON (not in their shortlist, not in Negotiate). Carries the
 * minimum metadata Legal + Deal Closure need to display and reason about
 * the property.
 */
export interface ExternalProperty {
  id: string;             // `ext-${timestamp}` — generated locally
  name: string;           // required — project name
  location: string;       // required — "Area, City"
  price?: string;         // optional display string, e.g. "₹1.35 Cr"
  propertyType?: string;  // optional — "Apartment" | "Villa" | "Plot" | "Office"
  builderName?: string;   // optional — e.g. "Godrej Properties", "Kumar Properties"
}

// ─── Possession ────────────────────────────────────────────────────
// Everything after handover: snag inspection, document vault, and the
// handover-day micro-checklist. Keyed per-property — same pattern as
// legalAnalyses. Phase 2 will add utility transfers, society formation,
// and warranty tracking; the shape here is intentionally lean for now.

export type SnagCategory =
  | 'structural' | 'flooring' | 'walls' | 'doors-windows'
  | 'electrical' | 'plumbing' | 'kitchen' | 'balconies' | 'common';

export type SnagStatus = 'unchecked' | 'ok' | 'defect' | 'na';
export type SnagSeverity = 'critical' | 'major' | 'minor';

export interface SnagFinding {
  // Composite key across (propertyId, roomId, subCategoryId, checkItemId)
  // — stored as a flat map so lookups stay O(1) and updates don't clobber
  // sibling findings. Legacy v1 records (category-first, no rooms) still
  // carry `category`; v2 records add `roomId` + `subCategoryId`.
  category: SnagCategory;
  /** v2: the room this finding belongs to (e.g. 'master-bedroom'). */
  roomId?: string;
  /** v2: sub-category group within the room (e.g. 'walls', 'plumbing'). */
  subCategoryId?: string;
  checkItemId: string;
  status: SnagStatus;
  severity?: SnagSeverity;
  photoCount: number;  // prototype: count only, no actual file storage
  notes: string;
  updatedAt: number;
}

export type PossessionDocStatus = 'pending' | 'received' | 'na';

export type PossessionDocKey =
  | 'oc' | 'cc' | 'possessionLetter' | 'finalReceipt'
  | 'saleDeed' | 'indexII' | 'form7A' | 'shareCertificate'
  | 'fireNoc' | 'liftNoc' | 'drawings' | 'warrantyCards';

/**
 * A possession record. One per property. `findings` is keyed by
 * `{category}:{checkItemId}` so we can update individual checks
 * without rebuilding the whole tree.
 */
/**
 * A single share event — the user exported the snag report and marked
 * the date (for builder follow-up tracking). We store an array of these
 * so the paper trail survives multiple rounds of "emailed builder →
 * builder silent → emailed again" that's typical in Indian handover
 * disputes.
 */
export interface SnagReportShare {
  /** ISO date of the share (YYYY-MM-DD). */
  sharedAt: string;
  /** Snapshot of defect count at share time — so follow-ups can see
   *  what was on the table that day even if the user logs more later. */
  defectCount: number;
  /** Optional: short note the user can attach (e.g. "after site visit"). */
  note?: string;
}

export interface PossessionRecord {
  propertyId: string;
  expectedHandoverDate: string | null;  // ISO date
  actualHandoverDate: string | null;
  findings: Record<string, SnagFinding>;
  documents: Record<string, PossessionDocStatus>;  // key: PossessionDocKey
  handoverChecklist: Record<string, boolean>;      // key: handover item id
  /**
   * Snag-inspection v2 configuration. When present, the snag flow uses
   * the room-first layout derived from this config. Stored on the
   * possession record (not the property) because the config describes
   * the *inspection*, and this keeps it available for any property
   * source — shortlist, user-added, or external. Canonical type lives
   * in `constants/rooms.ts`.
   */
  snagConfig?: import('../constants/rooms').PropertyConfig;
  /** v2: Builder-share history — each entry is a timestamped "I shared
   *  the report on date X" record. Appended whenever the user ticks
   *  "Record today as shared" on the report preview. */
  snagReportShares?: SnagReportShare[];
  /** Has the user seen the "Welcome home" celebration overlay for
   *  this property? Flips true once the modal is dismissed; used so
   *  the overlay only fires once per property when all three sections
   *  hit 100% for the first time. */
  hasSeenWelcomeHome?: boolean;
}

export interface OnboardingState {
  goal: GoalType | null;
  persona: PersonaType | null;
  locations: string[];
  propertySize: string[];
  propertyType: string;
  budget: { min: number; max: number };
  purpose: string;
  timeline: string;
  userName: string;
  userPhone: string;
  isVerified: boolean;
  briefText: string;
  needsLoan: boolean;
  numberOfPeople: string;
  chargeableArea: string;
  notifyVia: string[];
  likedPropertyIds: string[];
  comparePropertyIds: string[];
  scheduledVisits: Array<{ propertyId: string; propertyName: string; date: string; time: string }>;
  userProperties: UserProperty[];
  cibilScore: number | null;
  cibilSkipped: boolean;
  monthlyIncome: number;
  existingEMIs: number;
  chatExpanded: boolean;
  activeStage: string;
  negotiatePropertyId: string | null;
  negotiateDataRequests: Array<{
    id: string;
    type: 'index2' | 'custom';
    text: string;
    status: 'pending' | 'fulfilled';
    propertyId: string;
    timestamp: number;
  }>;

  // Legal Analysis — per-property, not global. A record exists iff an
  // analysis has been completed for that property. `activeLegalPropertyId`
  // tracks which property the Legal / Deal Closure / Possession screens
  // are currently working on.
  legalAnalyses: Record<string, LegalAnalysisRecord>;
  externalProperties: Record<string, ExternalProperty>;
  activeLegalPropertyId: string | null;

  // Possession — per-property. A record exists iff the user has started
  // any possession activity (snag check, doc received, handover item).
  possessions: Record<string, PossessionRecord>;

  setCibilScore: (score: number | null) => void;
  setCibilSkipped: (val: boolean) => void;
  setMonthlyIncome: (val: number) => void;
  setExistingEMIs: (val: number) => void;
  setGoal: (goal: GoalType) => void;
  setPersona: (persona: PersonaType) => void;
  setLocations: (locations: string[]) => void;
  setPropertySize: (sizes: string[]) => void;
  setPropertyType: (type: string) => void;
  setBudget: (budget: { min: number; max: number }) => void;
  setPurpose: (purpose: string) => void;
  setTimeline: (timeline: string) => void;
  setUserName: (name: string) => void;
  setUserPhone: (phone: string) => void;
  setIsVerified: (verified: boolean) => void;
  setBriefText: (text: string) => void;
  setNeedsLoan: (val: boolean) => void;
  setNumberOfPeople: (val: string) => void;
  setChargeableArea: (val: string) => void;
  toggleNotifyVia: (channel: string) => void;
  toggleLikedProperty: (id: string) => void;
  toggleCompareProperty: (id: string) => void;
  setComparePropertyIds: (ids: string[]) => void;
  clearCompareProperties: () => void;
  addScheduledVisit: (visit: { propertyId: string; propertyName: string; date: string; time: string }) => void;
  removeScheduledVisit: (propertyId: string) => void;
  addUserProperty: (property: UserProperty) => void;
  removeUserProperty: (id: string) => void;
  setChatExpanded: (val: boolean) => void;
  setActiveStage: (stage: string) => void;
  setNegotiatePropertyId: (id: string | null) => void;
  addNegotiateDataRequest: (req: { type: 'index2' | 'custom'; text: string; propertyId: string }) => void;

  // Legal Analysis actions
  setActiveLegalProperty: (id: string | null) => void;
  setLegalAnalysisForProperty: (rec: { propertyId: string; docName: string }) => void;
  clearLegalAnalysisForProperty: (propertyId: string) => void;
  addExternalProperty: (ext: Omit<ExternalProperty, 'id'>) => string;
  /**
   * Patch an existing external property — used when the AI has parsed the
   * uploaded agreement and extracted better property details than the
   * placeholder we created when the user first chose "Analyze a different
   * property."
   */
  updateExternalProperty: (id: string, patch: Partial<Omit<ExternalProperty, 'id'>>) => void;

  // Possession actions — each lazily creates the property's possession
  // record if one doesn't already exist, so callers don't need to
  // initialize it up-front.
  setPossessionHandoverDate: (
    propertyId: string,
    which: 'expected' | 'actual',
    date: string | null,
  ) => void;
  updateSnagFinding: (
    propertyId: string,
    category: SnagCategory,
    checkItemId: string,
    patch: Partial<Omit<SnagFinding, 'category' | 'checkItemId' | 'updatedAt'>>,
  ) => void;
  /**
   * v2 variant — rooms-first. `roomId` + `subCategoryId` are part of
   * the composite key, so the same check atom reused across rooms stays
   * distinct. `category` is derived from the sub-category at the call
   * site so we keep a single consistent legacy field for the trade-view
   * export.
   */
  updateSnagFindingV2: (
    propertyId: string,
    roomId: string,
    subCategoryId: string,
    category: SnagCategory,
    checkItemId: string,
    patch: Partial<Omit<SnagFinding, 'category' | 'roomId' | 'subCategoryId' | 'checkItemId' | 'updatedAt'>>,
  ) => void;
  /** Persist the snag-inspection wizard's answers on the property. */
  setSnagConfig: (
    propertyId: string,
    config: import('../constants/rooms').PropertyConfig,
  ) => void;
  /** Append a builder-share event to the property's possession record. */
  addSnagReportShare: (propertyId: string, share: SnagReportShare) => void;
  /** Mark the Welcome Home overlay as seen for a property — called
   *  when the user dismisses the celebration so it doesn't replay on
   *  every subsequent visit. */
  markWelcomeHomeSeen: (propertyId: string) => void;
  setPossessionDocument: (
    propertyId: string,
    docKey: PossessionDocKey,
    status: PossessionDocStatus,
  ) => void;
  toggleHandoverCheckItem: (propertyId: string, itemId: string) => void;

  reset: () => void;
}

const initialState = {
  goal: null as GoalType | null,
  persona: null as PersonaType | null,
  locations: [] as string[],
  propertySize: [] as string[],
  propertyType: 'Apartment',
  budget: { min: 5000000, max: 12000000 },
  purpose: '',
  timeline: '',
  userName: '',
  userPhone: '',
  isVerified: false,
  briefText: '',
  needsLoan: false,
  numberOfPeople: '5–10',
  chargeableArea: '500–1000 sqft',
  notifyVia: ['push'] as string[],
  likedPropertyIds: [] as string[],
  comparePropertyIds: [] as string[],
  scheduledVisits: [] as Array<{ propertyId: string; propertyName: string; date: string; time: string }>,
  userProperties: [] as UserProperty[],
  cibilScore: null as number | null,
  cibilSkipped: false,
  monthlyIncome: 0,
  existingEMIs: 0,
  chatExpanded: false,
  activeStage: 'Search',
  negotiatePropertyId: null as string | null,
  negotiateDataRequests: [] as Array<{
    id: string;
    type: 'index2' | 'custom';
    text: string;
    status: 'pending' | 'fulfilled';
    propertyId: string;
    timestamp: number;
  }>,
  legalAnalyses: {} as Record<string, LegalAnalysisRecord>,
  externalProperties: {} as Record<string, ExternalProperty>,
  activeLegalPropertyId: null as string | null,
  possessions: {} as Record<string, PossessionRecord>,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setGoal: (goal) => set({ goal }),
  setPersona: (persona) => {
    const defaults = PERSONA_DEFAULTS[persona];
    set({
      persona,
      locations: [defaults.location],
      propertySize: defaults.propertySize,
      propertyType: defaults.propertyType,
      budget: defaults.budget,
      purpose: defaults.purpose,
      timeline: defaults.timeline,
    });
  },

  setLocations: (locations) => set({ locations }),
  setPropertySize: (propertySize) => set({ propertySize }),
  setPropertyType: (propertyType) => set({ propertyType }),
  setBudget: (budget) => set({ budget }),
  setPurpose: (purpose) => set({ purpose }),
  setTimeline: (timeline) => set({ timeline }),
  setUserName: (userName) => set({ userName }),
  setUserPhone: (userPhone) => set({ userPhone }),
  setIsVerified: (isVerified) => set({ isVerified }),
  setBriefText: (briefText) => set({ briefText }),
  setNeedsLoan: (needsLoan) => set({ needsLoan }),
  setNumberOfPeople: (numberOfPeople) => set({ numberOfPeople }),
  setChargeableArea: (chargeableArea) => set({ chargeableArea }),
  toggleNotifyVia: (channel) =>
    set((state) => ({
      notifyVia: state.notifyVia.includes(channel)
        ? state.notifyVia.filter((c) => c !== channel)
        : [...state.notifyVia, channel],
    })),
  toggleLikedProperty: (id) =>
    set((state) => {
      const isUnliking = state.likedPropertyIds.includes(id);
      const nextLiked = isUnliking
        ? state.likedPropertyIds.filter((pid) => pid !== id)
        : [...state.likedPropertyIds, id];
      // If the unliked property was the one selected for negotiation, clear it
      const nextNegotiateId =
        isUnliking && state.negotiatePropertyId === id
          ? null
          : state.negotiatePropertyId;
      return { likedPropertyIds: nextLiked, negotiatePropertyId: nextNegotiateId };
    }),
  toggleCompareProperty: (id) =>
    set((state) => ({
      comparePropertyIds: state.comparePropertyIds.includes(id)
        ? state.comparePropertyIds.filter((pid) => pid !== id)
        : state.comparePropertyIds.length < 3
          ? [...state.comparePropertyIds, id]
          : state.comparePropertyIds, // max 3 — no-op if at limit
    })),
  setComparePropertyIds: (ids) => set({ comparePropertyIds: ids.slice(0, 3) }),
  clearCompareProperties: () => set({ comparePropertyIds: [] }),
  addScheduledVisit: (visit) =>
    set((state) => ({
      scheduledVisits: [
        ...state.scheduledVisits.filter((v) => v.propertyId !== visit.propertyId),
        visit,
      ],
    })),
  removeScheduledVisit: (propertyId) =>
    set((state) => ({
      scheduledVisits: state.scheduledVisits.filter((v) => v.propertyId !== propertyId),
    })),
  addUserProperty: (property) =>
    set((state) => ({ userProperties: [...state.userProperties, property] })),
  removeUserProperty: (id) =>
    set((state) => ({
      userProperties: state.userProperties.filter((p) => p.id !== id),
      negotiatePropertyId: state.negotiatePropertyId === id ? null : state.negotiatePropertyId,
    })),
  setCibilScore: (cibilScore) => set({ cibilScore }),
  setCibilSkipped: (cibilSkipped) => set({ cibilSkipped }),
  setMonthlyIncome: (monthlyIncome) => set({ monthlyIncome }),
  setExistingEMIs: (existingEMIs) => set({ existingEMIs }),
  setChatExpanded: (chatExpanded) => set({ chatExpanded }),
  setActiveStage: (activeStage) => set({ activeStage }),
  setNegotiatePropertyId: (negotiatePropertyId) => set({ negotiatePropertyId }),
  addNegotiateDataRequest: (req) =>
    set((state) => ({
      negotiateDataRequests: [
        ...state.negotiateDataRequests,
        {
          id: `req-${Date.now()}`,
          type: req.type,
          text: req.text,
          status: 'pending' as const,
          propertyId: req.propertyId,
          timestamp: Date.now(),
        },
      ],
    })),

  setActiveLegalProperty: (id) => set({ activeLegalPropertyId: id }),

  setLegalAnalysisForProperty: ({ propertyId, docName }) =>
    set((state) => ({
      legalAnalyses: {
        ...state.legalAnalyses,
        [propertyId]: { propertyId, docName, uploadedAt: Date.now() },
      },
    })),

  clearLegalAnalysisForProperty: (propertyId) =>
    set((state) => {
      if (!state.legalAnalyses[propertyId]) return state;
      const next = { ...state.legalAnalyses };
      delete next[propertyId];
      return { legalAnalyses: next };
    }),

  addExternalProperty: (ext) => {
    const id = `ext-${Date.now()}`;
    set((state) => ({
      externalProperties: {
        ...state.externalProperties,
        [id]: { id, ...ext },
      },
    }));
    return id;
  },

  updateExternalProperty: (id, patch) =>
    set((state) => {
      const existing = state.externalProperties[id];
      if (!existing) return state;
      return {
        externalProperties: {
          ...state.externalProperties,
          [id]: { ...existing, ...patch },
        },
      };
    }),

  // ── Possession actions ───────────────────────────────────────────

  setPossessionHandoverDate: (propertyId, which, date) =>
    set((state) => {
      const existing = state.possessions[propertyId] ?? blankPossessionRecord(propertyId);
      return {
        possessions: {
          ...state.possessions,
          [propertyId]: {
            ...existing,
            ...(which === 'expected' ? { expectedHandoverDate: date } : { actualHandoverDate: date }),
          },
        },
      };
    }),

  updateSnagFinding: (propertyId, category, checkItemId, patch) =>
    set((state) => {
      const existing = state.possessions[propertyId] ?? blankPossessionRecord(propertyId);
      const key = `${category}:${checkItemId}`;
      const prev = existing.findings[key];
      const next: SnagFinding = {
        category,
        checkItemId,
        status: prev?.status ?? 'unchecked',
        severity: prev?.severity,
        photoCount: prev?.photoCount ?? 0,
        notes: prev?.notes ?? '',
        ...patch,
        updatedAt: Date.now(),
      };
      return {
        possessions: {
          ...state.possessions,
          [propertyId]: {
            ...existing,
            findings: { ...existing.findings, [key]: next },
          },
        },
      };
    }),

  updateSnagFindingV2: (propertyId, roomId, subCategoryId, category, checkItemId, patch) =>
    set((state) => {
      const existing = state.possessions[propertyId] ?? blankPossessionRecord(propertyId);
      const key = `${roomId}:${subCategoryId}:${checkItemId}`;
      const prev = existing.findings[key];
      const next: SnagFinding = {
        category,
        roomId,
        subCategoryId,
        checkItemId,
        status: prev?.status ?? 'unchecked',
        severity: prev?.severity,
        photoCount: prev?.photoCount ?? 0,
        notes: prev?.notes ?? '',
        ...patch,
        updatedAt: Date.now(),
      };
      return {
        possessions: {
          ...state.possessions,
          [propertyId]: {
            ...existing,
            findings: { ...existing.findings, [key]: next },
          },
        },
      };
    }),

  setSnagConfig: (propertyId, config) =>
    set((state) => {
      const existing = state.possessions[propertyId] ?? blankPossessionRecord(propertyId);
      return {
        possessions: {
          ...state.possessions,
          [propertyId]: { ...existing, snagConfig: config },
        },
      };
    }),

  markWelcomeHomeSeen: (propertyId) =>
    set((state) => {
      const existing = state.possessions[propertyId] ?? blankPossessionRecord(propertyId);
      return {
        possessions: {
          ...state.possessions,
          [propertyId]: { ...existing, hasSeenWelcomeHome: true },
        },
      };
    }),

  addSnagReportShare: (propertyId, share) =>
    set((state) => {
      const existing = state.possessions[propertyId] ?? blankPossessionRecord(propertyId);
      const prior = existing.snagReportShares ?? [];
      return {
        possessions: {
          ...state.possessions,
          [propertyId]: { ...existing, snagReportShares: [...prior, share] },
        },
      };
    }),

  setPossessionDocument: (propertyId, docKey, status) =>
    set((state) => {
      const existing = state.possessions[propertyId] ?? blankPossessionRecord(propertyId);
      return {
        possessions: {
          ...state.possessions,
          [propertyId]: {
            ...existing,
            documents: { ...existing.documents, [docKey]: status },
          },
        },
      };
    }),

  toggleHandoverCheckItem: (propertyId, itemId) =>
    set((state) => {
      const existing = state.possessions[propertyId] ?? blankPossessionRecord(propertyId);
      const prev = existing.handoverChecklist[itemId] ?? false;
      return {
        possessions: {
          ...state.possessions,
          [propertyId]: {
            ...existing,
            handoverChecklist: { ...existing.handoverChecklist, [itemId]: !prev },
          },
        },
      };
    }),

  reset: () => set(initialState),
}));

// ───────────────────────────────────────────────────────────────────
// Pure selector helpers — consume `useOnboardingStore.getState()` or
// the selected slice from a component. Prefer these over re-deriving
// the same logic inline, so gating rules stay consistent across chat,
// stage strip, pinned content, and the Legal/Deal-Closure screens.
// ───────────────────────────────────────────────────────────────────

/** Has the given property been analyzed? */
export function isPropertyAnalyzed(
  state: Pick<OnboardingState, 'legalAnalyses'>,
  propertyId: string | null,
): boolean {
  if (!propertyId) return false;
  return Boolean(state.legalAnalyses[propertyId]);
}

/** Has ANY property been analyzed? Used for broad stage-level gates. */
export function hasAnyLegalAnalysis(
  state: Pick<OnboardingState, 'legalAnalyses'>,
): boolean {
  return Object.keys(state.legalAnalyses).length > 0;
}

// ─── Possession helpers ────────────────────────────────────────────

/**
 * Initial shape for a property's possession record. Pulled out so the
 * per-action handlers can lazy-initialize without repeating the shape.
 */
function blankPossessionRecord(propertyId: string): PossessionRecord {
  return {
    propertyId,
    expectedHandoverDate: null,
    actualHandoverDate: null,
    findings: {},
    documents: {},
    handoverChecklist: {},
  };
}

/**
 * Has the user started any possession activity for this property? True
 * if they've set a handover date, logged any finding, received any doc,
 * or ticked any handover-day item.
 */
export function hasPossessionStarted(
  state: Pick<OnboardingState, 'possessions'>,
  propertyId: string | null,
): boolean {
  if (!propertyId) return false;
  const rec = state.possessions[propertyId];
  if (!rec) return false;
  return Boolean(
    rec.expectedHandoverDate ||
    rec.actualHandoverDate ||
    Object.keys(rec.findings).length > 0 ||
    Object.keys(rec.documents).length > 0 ||
    Object.keys(rec.handoverChecklist).length > 0,
  );
}

/** Counts defects across all categories for a property. */
export function countSnagDefects(
  state: Pick<OnboardingState, 'possessions'>,
  propertyId: string | null,
): { total: number; critical: number; major: number; minor: number } {
  const zero = { total: 0, critical: 0, major: 0, minor: 0 };
  if (!propertyId) return zero;
  const rec = state.possessions[propertyId];
  if (!rec) return zero;
  const defects = Object.values(rec.findings).filter((f) => f.status === 'defect');
  return {
    total: defects.length,
    critical: defects.filter((d) => d.severity === 'critical').length,
    major: defects.filter((d) => d.severity === 'major').length,
    minor: defects.filter((d) => d.severity === 'minor').length,
  };
}
