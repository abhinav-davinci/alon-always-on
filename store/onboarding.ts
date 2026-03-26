import { create } from 'zustand';
import { PersonaType, PERSONA_DEFAULTS } from '../constants/personas';
import { UserProperty } from '../constants/properties';

export interface OnboardingState {
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
  notifyVia: string[];
  likedPropertyIds: string[];
  scheduledVisits: Array<{ propertyId: string; propertyName: string; date: string; time: string }>;
  userProperties: UserProperty[];
  chatExpanded: boolean;
  activeStage: string;

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
  toggleNotifyVia: (channel: string) => void;
  toggleLikedProperty: (id: string) => void;
  addScheduledVisit: (visit: { propertyId: string; propertyName: string; date: string; time: string }) => void;
  addUserProperty: (property: UserProperty) => void;
  removeUserProperty: (id: string) => void;
  setChatExpanded: (val: boolean) => void;
  setActiveStage: (stage: string) => void;
  reset: () => void;
}

const initialState = {
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
  notifyVia: ['push'] as string[],
  likedPropertyIds: [] as string[],
  scheduledVisits: [] as Array<{ propertyId: string; propertyName: string; date: string; time: string }>,
  userProperties: [] as UserProperty[],
  chatExpanded: false,
  activeStage: 'Search',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

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
  setChatExpanded: (chatExpanded) => set({ chatExpanded }),
  setActiveStage: (activeStage) => set({ activeStage }),
  reset: () => set(initialState),
}));
