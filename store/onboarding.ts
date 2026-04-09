import { create } from 'zustand';
import { GoalType, PersonaType, PERSONA_DEFAULTS } from '../constants/personas';
import { UserProperty } from '../constants/properties';

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
  addUserProperty: (property: UserProperty) => void;
  removeUserProperty: (id: string) => void;
  setChatExpanded: (val: boolean) => void;
  setActiveStage: (stage: string) => void;
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
    set((state) => ({
      likedPropertyIds: state.likedPropertyIds.includes(id)
        ? state.likedPropertyIds.filter((pid) => pid !== id)
        : [...state.likedPropertyIds, id],
    })),
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
  addUserProperty: (property) =>
    set((state) => ({ userProperties: [...state.userProperties, property] })),
  removeUserProperty: (id) =>
    set((state) => ({ userProperties: state.userProperties.filter((p) => p.id !== id) })),
  setCibilScore: (cibilScore) => set({ cibilScore }),
  setCibilSkipped: (cibilSkipped) => set({ cibilSkipped }),
  setMonthlyIncome: (monthlyIncome) => set({ monthlyIncome }),
  setExistingEMIs: (existingEMIs) => set({ existingEMIs }),
  setChatExpanded: (chatExpanded) => set({ chatExpanded }),
  setActiveStage: (activeStage) => set({ activeStage }),
  reset: () => set(initialState),
}));
