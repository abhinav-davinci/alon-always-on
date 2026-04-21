import { SHORTLIST_PROPERTIES } from '../constants/properties';
import type { OnboardingState } from '../store/onboarding';

/**
 * A property ready to display/use inside Legal Analysis or Deal Closure.
 * Resolved from one of three sources: ALON shortlist, user-added property,
 * or an "external" property the user typed in specifically for Legal.
 *
 * Always use this shape at component boundaries — it hides the source
 * differences (field names differ across pools: `area` vs `location`,
 * `image` vs `images[0]`, etc.).
 */
export interface ResolvedLegalProperty {
  id: string;
  name: string;
  location: string;       // e.g. "Baner, Pune"
  price?: string;         // display string, e.g. "₹1.35 Cr"
  image?: string;
  source: 'shortlist' | 'user' | 'external';
}

/**
 * Look up a property by id across all three pools. Returns null if not
 * found — callers must handle the "no property selected" state.
 */
export function resolveLegalProperty(
  state: Pick<OnboardingState, 'userProperties' | 'externalProperties'>,
  propertyId: string | null,
): ResolvedLegalProperty | null {
  if (!propertyId) return null;

  const liked = SHORTLIST_PROPERTIES.find((p) => p.id === propertyId);
  if (liked) {
    return {
      id: liked.id,
      name: liked.name,
      location: liked.area,
      price: liked.price,
      image: liked.image,
      source: 'shortlist',
    };
  }

  const user = state.userProperties.find((p) => p.id === propertyId);
  if (user) {
    return {
      id: user.id,
      name: user.name,
      location: user.area,
      price: user.price,
      image: user.images?.[0],
      source: 'user',
    };
  }

  const ext = state.externalProperties[propertyId];
  if (ext) {
    return {
      id: ext.id,
      name: ext.name,
      location: ext.location,
      price: ext.price,
      image: undefined,
      source: 'external',
    };
  }

  return null;
}

/**
 * Pick a sensible default when the user lands on Legal without having
 * touched the selector yet. Preference order:
 *   1. Property locked in Negotiate (matches the classic flow).
 *   2. First shortlisted property (user has liked something).
 *   3. First user-added property.
 *   4. null (empty state — selector prompts user to choose).
 */
export function defaultLegalPropertyId(
  state: Pick<
    OnboardingState,
    'negotiatePropertyId' | 'likedPropertyIds' | 'userProperties'
  >,
): string | null {
  if (state.negotiatePropertyId) return state.negotiatePropertyId;
  if (state.likedPropertyIds.length > 0) return state.likedPropertyIds[0];
  if (state.userProperties.length > 0) return state.userProperties[0].id;
  return null;
}
