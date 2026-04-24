/**
 * Room-first snag inspection templates (v2).
 *
 * The category-first layout in `constants/possession.ts` is the technician's
 * mental model (Structural / Electrical / Plumbing…). This file re-organises
 * the same checks around the buyer's mental model: rooms of their home. A
 * user walking through their flat sees "Master Bedroom" as one unit, with
 * wall, floor, door, and electrical checks grouped together inside it.
 *
 * Rooms are generated deterministically from a {PropertyConfig}: type,
 * BHK, and a handful of extras. Two buyers with the same config get the
 * same room list. The template preserves category info on each check
 * (`subCategory` + `category`) so the builder-facing export can flip back
 * to a trade-grouped view for free.
 *
 * Walking path: the rooms appear in the natural order a resident would
 * walk them starting from the entrance door. Numbered on the UI to teach
 * the habit ("1. Entrance → 2. Living → 3. Kitchen...").
 */

import type { SnagCategory } from '../store/onboarding';

// ═══════════════════════════════════════════════════════════════════
// Config model — the wizard answers map to these fields
// ═══════════════════════════════════════════════════════════════════

export type PropertyType = 'apartment' | 'row-house' | 'penthouse';
export type BHK = '1BHK' | '2BHK' | '3BHK' | '4BHK+';

/** Which room a balcony is attached to. Drives its semantic name. */
export type BalconyAttachment =
  | 'living'
  | 'master'
  | 'bedroom-2'
  | 'bedroom-3'
  | 'bedroom-4'
  | 'kitchen';

export interface PropertyConfig {
  type: PropertyType;
  bhk: BHK;
  extras: {
    study: boolean;
    pujaRoom: boolean;
    servantRoom: boolean;
    utility: boolean;
    powderRoom: boolean;
    /** Ordered list of balconies. Generated with smart defaults by the
     *  wizard; user can adjust. */
    balconies: BalconyAttachment[];
  };
  /** Optional user overrides: custom names or N/A toggles per room. */
  roomOverrides?: Record<string, { name?: string; applicable?: boolean }>;
}

// ═══════════════════════════════════════════════════════════════════
// Check atoms — reusable building blocks, grouped by sub-category.
// A room is a composition of sub-categories; each sub-category pulls
// from these atoms (sometimes lightly adjusted per room).
// ═══════════════════════════════════════════════════════════════════

export interface CheckAtom {
  id: string;
  label: string;
  hint: string;
}

/** Generic check atoms. A single atom may appear inside many rooms —
 *  the {roomId, checkId} composite key keeps findings unique. */

const WALLS_CEILING: CheckAtom[] = [
  { id: 'paint-uniform', label: 'Paint finish is uniform', hint: 'No drips, roller lines, or patchy coverage. Inspect in daylight.' },
  { id: 'no-cracks', label: 'No cracks or bubbles', hint: 'Hairline cracks OK; wider than 1mm needs attention.' },
  { id: 'ceiling-finish', label: 'Ceiling finish is smooth', hint: 'No gypsum joint lines, stains, or sagging patches.' },
  { id: 'corners-neat', label: 'Corners are neat', hint: 'Check wall-to-wall and wall-to-ceiling joins for clean edges.' },
];

const FLOOR_GENERIC: CheckAtom[] = [
  { id: 'tiles-level', label: 'Tiles are level', hint: 'No dips or humps. Roll a marble across the floor to test.' },
  { id: 'no-hollow', label: 'No hollow tiles', hint: 'Tap with a coin — a hollow sound means loose grout underneath.' },
  { id: 'grout-uniform', label: 'Grout lines are even', hint: 'Consistent width, clean colour, no cracks or stains.' },
  { id: 'no-chipped', label: 'No chipped or scratched tiles', hint: 'Inspect edges near walls, doorways, and high-traffic spots.' },
  { id: 'skirting-flush', label: 'Skirting sits flush', hint: 'No gaps between skirting and tile edge.' },
];

const DOORS_WINDOWS_GENERIC: CheckAtom[] = [
  { id: 'door-closes-flush', label: 'Door closes flush', hint: 'No friction, no gaps when shut. Test each door 2–3 times.' },
  { id: 'hinges-smooth', label: 'Hinges are smooth, no squeak', hint: 'Open and close slowly. Squeak = missing lube or wrong hinge.' },
  { id: 'lock-works', label: 'Lock works smoothly', hint: 'Turn the key both ways; latch should engage cleanly.' },
  { id: 'window-glide', label: 'Window sliders glide', hint: 'Slide full length both directions; no binding.' },
  { id: 'mosquito-mesh', label: 'Mosquito mesh is intact', hint: 'Often "forgotten" at handover. Check every window.' },
  { id: 'window-seal', label: 'Window rubber seal is intact', hint: 'Rubber gasket around the frame — tears let in water and noise.' },
];

const ELECTRICAL_BEDROOM: CheckAtom[] = [
  { id: 'all-switches', label: 'Every switch works', hint: 'Test lights and fans independently. Mark any that don\'t respond.' },
  { id: 'all-sockets', label: 'Every socket is live', hint: 'Carry a phone charger; test each socket.' },
  { id: 'switch-plates-flush', label: 'Switch plates sit flush', hint: 'No gaps between plate and wall.' },
  { id: 'fan-hook-centered', label: 'Fan hook is centered', hint: 'Check ceiling for the hook position; should be in the middle.' },
  { id: 'ac-point', label: 'AC point works (if promised)', hint: 'Test the AC point; verify placement matches plan.' },
  { id: 'tv-point', label: 'TV / data point present (if promised)', hint: 'Count and verify against brochure.' },
];

const ELECTRICAL_LIVING: CheckAtom[] = [
  { id: 'all-switches', label: 'Every switch works', hint: 'Test lights, fans, and any dimmer independently.' },
  { id: 'all-sockets', label: 'Every socket is live', hint: 'Carry a phone charger; test each socket.' },
  { id: 'switch-plates-flush', label: 'Switch plates sit flush', hint: 'No gaps between plate and wall.' },
  { id: 'fan-point', label: 'Fan point works', hint: 'Regulator present and functional.' },
  { id: 'ac-point', label: 'AC point works (if promised)', hint: 'Test and verify placement matches plan.' },
  { id: 'tv-point', label: 'TV & internet points present', hint: 'Count against the brochure; note wall position.' },
];

const ELECTRICAL_ENTRANCE: CheckAtom[] = [
  { id: 'entry-light', label: 'Entry light works', hint: 'Switch on and off; check bulb brightness.' },
  { id: 'bell', label: 'Doorbell works', hint: 'Chime audible inside the flat.' },
  { id: 'mcb-labeled', label: 'MCB panel is labeled', hint: 'Each breaker should have a clear room label.' },
  { id: 'meter-reading', label: 'Meter reading is photographed', hint: 'Electricity + water. Timestamp the photos for utility transfer.' },
];

const BATHROOM_PLUMBING: CheckAtom[] = [
  { id: 'water-pressure', label: 'Water pressure is good', hint: 'Open taps full; flow should be strong and steady.' },
  { id: 'hot-water', label: 'Hot water works', hint: 'Geyser heats within 5 min; no lukewarm flow.' },
  { id: 'cp-brand', label: 'CP fittings brand matches spec', hint: 'Jaquar / Hindware / Kohler — check logos on taps and flush.' },
  { id: 'no-leaks', label: 'No leaks at connections', hint: 'Tissue-paper test under the basin and around wall joins.' },
  { id: 'floor-drain', label: 'Floor drains quickly', hint: 'Pour a mug of water — should drain in under 60 sec.' },
  { id: 'dual-flush', label: 'Dual flush works both modes', hint: 'Half and full flush both functional.' },
];

const BATHROOM_FIXTURES: CheckAtom[] = [
  { id: 'toilet-level', label: 'Toilet is level, no rocking', hint: 'Should sit firm. Any movement = loose mounting.' },
  { id: 'basin-firm', label: 'Basin is firm', hint: 'Push gently — no give; no gaps at wall mount.' },
  { id: 'mirror-fixed', label: 'Mirror is mounted securely', hint: 'No gaps between mirror and wall.' },
  { id: 'towel-hook', label: 'Towel hooks installed', hint: 'Per spec sheet; count and check placement.' },
  { id: 'shower-area-tiles', label: 'Shower-area tiles are tight', hint: 'Grout intact, no hollow tiles where water hits.' },
];

const BATHROOM_ELECTRICAL: CheckAtom[] = [
  { id: 'geyser-point', label: 'Geyser point works', hint: 'Separate switch, close to geyser; tested with the unit.' },
  { id: 'exhaust-fan', label: 'Exhaust fan runs', hint: 'Switch on; should be audible and move air.' },
  { id: 'shaver-socket', label: 'Shaver / hair-dryer socket (if promised)', hint: 'Typically near the basin.' },
  { id: 'bathroom-light', label: 'Lights work on all switches', hint: 'Main light + any task lighting near basin.' },
];

const KITCHEN_WORKSURFACES: CheckAtom[] = [
  { id: 'countertop-level', label: 'Countertop is level', hint: 'Use a 3-foot spirit level; no dips near joins.' },
  { id: 'countertop-material', label: 'Countertop material matches spec', hint: 'Granite / marble / quartz — verify against brochure.' },
  { id: 'modular-spec', label: 'Modular units match spec', hint: 'Brand, finish, hardware — compare line by line.' },
  { id: 'soft-close', label: 'Soft-close hinges work (if promised)', hint: 'Cabinet doors should close slowly on their own.' },
  { id: 'drawer-runners', label: 'Drawer runners are smooth', hint: 'Slide in/out fully; no binding or jitter.' },
  { id: 'backsplash-grout', label: 'Backsplash tiles and grout are clean', hint: 'No chipped edges, no grout stains.' },
];

const KITCHEN_APPLIANCES: CheckAtom[] = [
  { id: 'hob-works', label: 'Hob / gas pipeline works', hint: 'All burners light within 2 sec; flame is blue.' },
  { id: 'chimney-works', label: 'Chimney works, spec matches', hint: 'Note brand and CFM rating against what was promised.' },
  { id: 'sink-drainage', label: 'Sink drains quickly', hint: 'Fill to brim; should empty in under 30 sec, no standing water.' },
  { id: 'sink-tap', label: 'Sink tap is firm, no leaks', hint: 'No wobble at base; no drip around the neck.' },
  { id: 'appliance-points', label: 'All appliance points present', hint: 'Fridge, microwave, RO — count against spec sheet.' },
];

const BALCONY_CHECKS: CheckAtom[] = [
  { id: 'railing-height', label: 'Railing height ≥ 1m', hint: 'Measure with a ruler, not an estimate. Below 1m = safety violation.' },
  { id: 'railing-grip', label: 'Railing is firm, no wobble', hint: 'Shake gently; should feel solid.' },
  { id: 'waterproofing', label: 'Waterproofing test passes', hint: 'Pour a full bucket — check floor below (if accessible) for leaks.' },
  { id: 'drainage-slope', label: 'Drainage slope works', hint: 'Water should flow to outlet; no pooling on the floor.' },
  { id: 'balcony-tiles', label: 'Floor tile quality matches spec', hint: 'Often downgraded at balcony. Compare against interior tiles.' },
  { id: 'ceiling-cover', label: 'Ceiling is clean (if covered)', hint: 'No exposed wiring, no water-entry points at the edge.' },
  { id: 'balcony-light', label: 'Balcony light works', hint: 'Switch on, verify brightness.' },
];

const UTILITY_CHECKS: CheckAtom[] = [
  { id: 'washer-inlet', label: 'Washing-machine inlet works', hint: 'Open the tap; water flows at expected pressure.' },
  { id: 'washer-outlet', label: 'Drainage outlet works', hint: 'Should accept a hose freely; no backflow.' },
  { id: 'washer-socket', label: 'Washer socket is live', hint: 'Test with a charger or ask the builder\'s electrician.' },
  { id: 'utility-floor', label: 'Floor slopes to drain', hint: 'Pour a mug of water — should run to the drain, not pool.' },
  { id: 'utility-ventilation', label: 'Ventilation works', hint: 'Exhaust fan and / or window mesh present and functional.' },
];

const ENTRANCE_DOOR: CheckAtom[] = [
  { id: 'main-door-quality', label: 'Main door is solid', hint: 'Tap — dull thud = hollow-core (cheap). Solid wood has a higher pitch.' },
  { id: 'main-door-finish', label: 'Finish matches spec', hint: 'Veneer / laminate brand as promised; check for scratches.' },
  { id: 'peephole', label: 'Peephole is clear', hint: 'Look through; should give wide-angle view of the corridor.' },
  { id: 'latch-chain', label: 'Latch & safety chain work', hint: 'Internal chain slides cleanly; door latches without force.' },
  { id: 'door-frame', label: 'Door frame is firm', hint: 'No visible gaps between frame and wall; no cracks in plaster.' },
  { id: 'weather-seal', label: 'Weather seal is intact', hint: 'Rubber strip around the frame — should sit firmly.' },
];

// ═══════════════════════════════════════════════════════════════════
// Sub-category definition. A room is a list of sub-categories, and
// each sub-category is a named group of check atoms. This double-
// grouping keeps the UI clean (rooms at top, check groups within) and
// preserves the trade-view export for builders.
// ═══════════════════════════════════════════════════════════════════

export interface SubCategoryDef {
  id: string;
  label: string;
  category: SnagCategory;   // for the trade-view export
  checks: CheckAtom[];
}

// Sub-categories per room archetype. Rooms refer to these by composition.

const SUB_WALLS_CEILING: SubCategoryDef = {
  id: 'walls', label: 'Walls & Ceiling', category: 'walls', checks: WALLS_CEILING,
};
const SUB_FLOOR: SubCategoryDef = {
  id: 'floor', label: 'Floor', category: 'flooring', checks: FLOOR_GENERIC,
};
const SUB_DOORS_WINDOWS: SubCategoryDef = {
  id: 'doors-windows', label: 'Doors & Windows', category: 'doors-windows', checks: DOORS_WINDOWS_GENERIC,
};
const SUB_ELECTRICAL_BEDROOM: SubCategoryDef = {
  id: 'electrical', label: 'Electrical', category: 'electrical', checks: ELECTRICAL_BEDROOM,
};
const SUB_ELECTRICAL_LIVING: SubCategoryDef = {
  id: 'electrical', label: 'Electrical', category: 'electrical', checks: ELECTRICAL_LIVING,
};
const SUB_ELECTRICAL_ENTRANCE: SubCategoryDef = {
  id: 'electrical', label: 'Electrical & Safety', category: 'electrical', checks: ELECTRICAL_ENTRANCE,
};
const SUB_BATH_PLUMBING: SubCategoryDef = {
  id: 'plumbing', label: 'Plumbing', category: 'plumbing', checks: BATHROOM_PLUMBING,
};
const SUB_BATH_FIXTURES: SubCategoryDef = {
  id: 'fixtures', label: 'Fixtures', category: 'plumbing', checks: BATHROOM_FIXTURES,
};
const SUB_BATH_ELECTRICAL: SubCategoryDef = {
  id: 'electrical', label: 'Electrical', category: 'electrical', checks: BATHROOM_ELECTRICAL,
};
const SUB_KITCHEN_WORK: SubCategoryDef = {
  id: 'worksurfaces', label: 'Counters & Cabinets', category: 'kitchen', checks: KITCHEN_WORKSURFACES,
};
const SUB_KITCHEN_APPL: SubCategoryDef = {
  id: 'appliances', label: 'Appliances & Sink', category: 'kitchen', checks: KITCHEN_APPLIANCES,
};
const SUB_BALCONY: SubCategoryDef = {
  id: 'balcony', label: 'Surfaces & Drainage', category: 'balconies', checks: BALCONY_CHECKS,
};
const SUB_UTILITY: SubCategoryDef = {
  id: 'utility', label: 'Plumbing & Electrical', category: 'plumbing', checks: UTILITY_CHECKS,
};
const SUB_ENTRANCE_DOOR: SubCategoryDef = {
  id: 'main-door', label: 'Main Door', category: 'doors-windows', checks: ENTRANCE_DOOR,
};

// ═══════════════════════════════════════════════════════════════════
// Room archetypes — the "shape" of each room. The generation function
// below produces instances of these, ordered along the walking path.
// ═══════════════════════════════════════════════════════════════════

export interface RoomDef {
  id: string;                 // unique within a property's inspection
  label: string;              // default display name; user can override
  icon: string;               // lucide icon name, resolved at render time
  watchOut: string;           // room-specific tip shown at top of detail
  subCategories: SubCategoryDef[];
}

// Helpers that stamp a room with its ID + label, reusing the subcat mix.

function entranceRoom(): RoomDef {
  return {
    id: 'entrance',
    label: 'Entrance & Foyer',
    icon: 'door-open',
    watchOut:
      'Main door quality is where builders cut corners quietly. Tap the door — a hollow thud means hollow-core, not the solid wood your agreement likely promised.',
    subCategories: [SUB_ENTRANCE_DOOR, SUB_FLOOR, SUB_ELECTRICAL_ENTRANCE],
  };
}

function livingDiningRoom(): RoomDef {
  return {
    id: 'living-dining',
    label: 'Living & Dining',
    icon: 'sofa',
    watchOut:
      'This is the largest surface in the flat — small finish defects multiply here. Check walls in raking light (torch at a grazing angle) to catch putty and paint issues invisible head-on.',
    subCategories: [SUB_WALLS_CEILING, SUB_FLOOR, SUB_DOORS_WINDOWS, SUB_ELECTRICAL_LIVING],
  };
}

function kitchenRoom(): RoomDef {
  return {
    id: 'kitchen',
    label: 'Kitchen',
    icon: 'chef-hat',
    watchOut:
      'Modular kitchens are where brochure-vs-delivered gaps hit hardest. Verify every chimney, hob, and cabinet hardware against the brochure — substitutions are the norm.',
    subCategories: [SUB_WALLS_CEILING, SUB_FLOOR, SUB_KITCHEN_WORK, SUB_KITCHEN_APPL],
  };
}

function utilityRoom(): RoomDef {
  return {
    id: 'utility',
    label: 'Utility',
    icon: 'wrench',
    watchOut:
      'Utility areas are often the last thing finished — and the first thing to leak. Make sure the washing-machine inlet/outlet and floor slope are tested with actual water, not just visual inspection.',
    subCategories: [SUB_WALLS_CEILING, SUB_UTILITY],
  };
}

function pujaRoom(): RoomDef {
  return {
    id: 'puja-room',
    label: 'Puja Room',
    icon: 'sparkles',
    watchOut:
      'Puja rooms often have premium finishes (marble flooring, wooden ceiling) promised in the brochure. Don\'t let these get swapped for standard finishes — inspect material grade carefully.',
    subCategories: [SUB_WALLS_CEILING, SUB_FLOOR, SUB_ELECTRICAL_BEDROOM],
  };
}

function studyRoom(): RoomDef {
  return {
    id: 'study',
    label: 'Study',
    icon: 'book-open',
    watchOut:
      'Study rooms usually have extra data/power points. Count them against the brochure — under-delivery on data points is common.',
    subCategories: [SUB_WALLS_CEILING, SUB_FLOOR, SUB_DOORS_WINDOWS, SUB_ELECTRICAL_BEDROOM],
  };
}

function servantRoom(): RoomDef {
  return {
    id: 'servant-room',
    label: 'Servant Room',
    icon: 'user',
    watchOut:
      'Don\'t skip this one. Servant rooms get the lowest-quality finishes but are still part of your carpet area — check walls, floor, and ventilation just like any other room.',
    subCategories: [SUB_WALLS_CEILING, SUB_FLOOR, SUB_DOORS_WINDOWS, SUB_ELECTRICAL_BEDROOM],
  };
}

function powderRoomDef(): RoomDef {
  return {
    id: 'powder-room',
    label: 'Powder Room',
    icon: 'droplet',
    watchOut:
      'Even a small powder room deserves the plumbing checks. No shower area, but everything else — basin, toilet, tiles, exhaust — matters.',
    subCategories: [SUB_WALLS_CEILING, SUB_BATH_PLUMBING, SUB_BATH_FIXTURES, SUB_BATH_ELECTRICAL],
  };
}

function bedroomRoom(id: string, label: string): RoomDef {
  return {
    id,
    label,
    icon: id === 'master-bedroom' ? 'bed-double' : 'bed',
    watchOut:
      label.toLowerCase().includes('master')
        ? 'Master bedrooms usually have the most promised features (wardrobe, AC, TV point, bedside switches). Check each one against the brochure — don\'t accept missing ones as "coming later."'
        : 'Secondary bedrooms are where spec gets trimmed silently. Count switches, sockets, and data points against the brochure.',
    subCategories: [SUB_WALLS_CEILING, SUB_FLOOR, SUB_DOORS_WINDOWS, SUB_ELECTRICAL_BEDROOM],
  };
}

function bathroomRoom(id: string, label: string): RoomDef {
  return {
    id,
    label,
    icon: 'shower-head',
    watchOut:
      'Bathrooms are where waterproofing fails first. Run the shower for 2 min, flush the toilet, fill the basin — then look for any water escaping onto the floor edge or outside the room.',
    subCategories: [SUB_WALLS_CEILING, SUB_FLOOR, SUB_BATH_PLUMBING, SUB_BATH_FIXTURES, SUB_BATH_ELECTRICAL],
  };
}

function balconyRoom(attachment: BalconyAttachment): RoomDef {
  const label = balconyLabel(attachment);
  return {
    id: `balcony-${attachment}`,
    label,
    icon: 'sun',
    watchOut:
      'Railing height and floor slope are the two safety issues. Measure railing from floor to top — below 1m is a code violation. Pour a bucket of water to verify slope before monsoon.',
    subCategories: [SUB_BALCONY],
  };
}

function terraceRoom(): RoomDef {
  return {
    id: 'terrace',
    label: 'Terrace',
    icon: 'sun',
    watchOut:
      'Terrace waterproofing is the single most expensive defect to fix after handover. Test it with a full bucket of water; check for leaks one floor below.',
    subCategories: [SUB_BALCONY, SUB_WALLS_CEILING],
  };
}

function balconyLabel(attachment: BalconyAttachment): string {
  switch (attachment) {
    case 'living': return 'Living Balcony';
    case 'master': return 'Master Balcony';
    case 'bedroom-2': return 'Bedroom 2 Balcony';
    case 'bedroom-3': return 'Bedroom 3 Balcony';
    case 'bedroom-4': return 'Bedroom 4 Balcony';
    case 'kitchen': return 'Kitchen Balcony';
  }
}

// ═══════════════════════════════════════════════════════════════════
// Room generation — given a PropertyConfig, produce an ordered room
// list along the natural walking path. Pure function; deterministic.
// ═══════════════════════════════════════════════════════════════════

export function generateRooms(config: PropertyConfig): RoomDef[] {
  const rooms: RoomDef[] = [];
  const { bhk, type, extras } = config;
  const balconiesByAttachment = new Set(extras.balconies);

  // 1. Entrance
  rooms.push(entranceRoom());

  // 2. Living & Dining
  rooms.push(livingDiningRoom());
  if (balconiesByAttachment.has('living')) rooms.push(balconyRoom('living'));

  // 3. Kitchen + utility
  rooms.push(kitchenRoom());
  if (balconiesByAttachment.has('kitchen')) rooms.push(balconyRoom('kitchen'));
  if (extras.utility) rooms.push(utilityRoom());

  // 4. Special-purpose rooms
  if (extras.pujaRoom) rooms.push(pujaRoom());
  if (extras.study) rooms.push(studyRoom());

  // 5. Master bedroom + attached bathroom + master balcony
  rooms.push(bedroomRoom('master-bedroom', 'Master Bedroom'));
  rooms.push(bathroomRoom('master-bathroom', 'Master Bathroom'));
  if (balconiesByAttachment.has('master')) rooms.push(balconyRoom('master'));

  // 6. Additional bedrooms (per BHK)
  const bedroomCount = bhkBedroomCount(bhk);
  for (let i = 2; i <= bedroomCount; i++) {
    const bedId = `bedroom-${i}`;
    rooms.push(bedroomRoom(bedId, `Bedroom ${i}`));
    const attachment = (`bedroom-${i}` as BalconyAttachment);
    if (balconiesByAttachment.has(attachment)) rooms.push(balconyRoom(attachment));
  }

  // 7. Common bathroom(s). Auto-generate sensibly per BHK, user can
  //    remove via roomOverrides.applicable=false if the builder's layout
  //    is different. Typical Indian-builder layouts:
  //      1BHK → master-bathroom only (1 total)
  //      2BHK → master + 1 common (2 total)
  //      3BHK → master + 2 common (3 total)
  //      4BHK → master + 3 common (4 total)
  const commonCount = Math.max(0, bedroomCount - 1);
  for (let i = 1; i <= commonCount; i++) {
    const id = commonCount === 1 ? 'common-bathroom' : `common-bathroom-${i}`;
    const label = commonCount === 1 ? 'Common Bathroom' : `Common Bathroom ${i}`;
    rooms.push(bathroomRoom(id, label));
  }

  // 8. Powder room (extra half-bath)
  if (extras.powderRoom) rooms.push(powderRoomDef());

  // 9. Servant room (last stop — typically tucked near the utility)
  if (extras.servantRoom) rooms.push(servantRoom());

  // 10. Terrace — penthouse and row-house only
  if (type === 'penthouse' || type === 'row-house') rooms.push(terraceRoom());

  // Apply per-room overrides (name / N/A). applicable=false rooms stay
  // in the list so the user can see what they disabled; the UI filters
  // them from the active-progress counters.
  return rooms.map((r) => {
    const o = config.roomOverrides?.[r.id];
    if (!o) return r;
    return { ...r, label: o.name ?? r.label };
  });
}

function bhkBedroomCount(bhk: BHK): number {
  switch (bhk) {
    case '1BHK': return 1;
    case '2BHK': return 2;
    case '3BHK': return 3;
    case '4BHK+': return 4;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Utility — count total checks for a config (for progress math)
// ═══════════════════════════════════════════════════════════════════

export function countChecksInRoom(room: RoomDef): number {
  return room.subCategories.reduce((sum, sc) => sum + sc.checks.length, 0);
}

export function totalChecksForConfig(config: PropertyConfig): number {
  return generateRooms(config).reduce((sum, r) => sum + countChecksInRoom(r), 0);
}

// ═══════════════════════════════════════════════════════════════════
// Smart balcony defaults — wizard uses this to seed the extras.balconies
// list from a simple count. User can re-attach each balcony in the
// preview step if they want.
// ═══════════════════════════════════════════════════════════════════

export function defaultBalconies(count: number, bhk: BHK): BalconyAttachment[] {
  const priority: BalconyAttachment[] = ['living', 'master', 'bedroom-2', 'bedroom-3', 'bedroom-4'];
  const maxByBhk = bhkBedroomCount(bhk) + 1; // living + each bedroom possible
  return priority.slice(0, Math.min(count, maxByBhk));
}

// ═══════════════════════════════════════════════════════════════════
// Finding key — composite `{roomId}:{subCategoryId}:{checkItemId}`.
// Keeps findings unique across rooms even when check atoms are reused.
// ═══════════════════════════════════════════════════════════════════

export function findingKey(roomId: string, subCategoryId: string, checkItemId: string): string {
  return `${roomId}:${subCategoryId}:${checkItemId}`;
}
