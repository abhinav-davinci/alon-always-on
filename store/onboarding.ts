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
  // tracks which property the Legal / Deal Closure screens are currently
  // working on.
  legalAnalyses: Record<string, LegalAnalysisRecord>;
  externalProperties: Record<string, ExternalProperty>;
  activeLegalPropertyId: string | null;

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
