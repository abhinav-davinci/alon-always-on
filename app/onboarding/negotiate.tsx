import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Handshake,
  CheckCircle2,
  Sparkles,
  MapPin,
  UserPlus,
  Info,
  ChevronRight,
  Download,
  FileText,
  Send,
  Clock,
  MessageSquare,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { SHORTLIST_PROPERTIES, Property, UserProperty } from '../../constants/properties';
import { useHaptics } from '../../hooks/useHaptics';
import { getRecommended } from '../../utils/compareScore';

const index2SampleImg = require('../../assets/index2/index2-sample.png');
const index2Img = require('../../assets/index2/index2.png');

// ── Demo data for negotiate workspace (mirrors property-detail) ──
const PROPERTY_DETAILS: Record<string, {
  priceHistory: { period: string; price: string; change: string }[];
  pricePerSqFt: string;
}> = {
  'godrej-hillside': {
    pricePerSqFt: '₹9,310',
    priceHistory: [
      { period: '6 mo ago', price: '₹1.28 Cr', change: '+5.5%' },
      { period: '1 yr ago', price: '₹1.15 Cr', change: '+17.4%' },
      { period: 'Launch', price: '₹95 L', change: '+42.1%' },
    ],
  },
  'pride-world-city': {
    pricePerSqFt: '₹8,940',
    priceHistory: [
      { period: '6 mo ago', price: '₹1.12 Cr', change: '+5.4%' },
      { period: '1 yr ago', price: '₹1.02 Cr', change: '+15.7%' },
      { period: 'Launch', price: '₹78 L', change: '+51.3%' },
    ],
  },
  'kolte-patil-24k': {
    pricePerSqFt: '₹9,330',
    priceHistory: [
      { period: '6 mo ago', price: '₹93 L', change: '+5.4%' },
      { period: '1 yr ago', price: '₹85 L', change: '+15.3%' },
      { period: 'Launch', price: '₹72 L', change: '+36.1%' },
    ],
  },
  'sobha-dream-acres': {
    pricePerSqFt: '₹8,898',
    priceHistory: [
      { period: '6 mo ago', price: '₹98 L', change: '+7.1%' },
      { period: '1 yr ago', price: '₹88 L', change: '+19.3%' },
      { period: 'Launch', price: '₹74 L', change: '+41.9%' },
    ],
  },
  'panchshil-towers': {
    pricePerSqFt: '₹9,340',
    priceHistory: [
      { period: '6 mo ago', price: '₹1.35 Cr', change: '+5.2%' },
      { period: '1 yr ago', price: '₹1.22 Cr', change: '+16.4%' },
      { period: 'Launch', price: '₹1.05 Cr', change: '+35.2%' },
    ],
  },
};

const AREA_TRENDS: Record<string, {
  avgPriceSqFt: string; yoyGrowth: string; activeListings: number;
  demandLevel: string; insight: string;
}> = {
  'Baner': {
    avgPriceSqFt: '₹9,800', yoyGrowth: '12.3%', activeListings: 340,
    demandLevel: 'High',
    insight: 'Baner has seen consistent 12%+ annual growth driven by IT corridor expansion and proximity to Hinjewadi. Premium segment (₹1Cr+) is particularly strong.',
  },
  'Balewadi': {
    avgPriceSqFt: '₹9,200', yoyGrowth: '15.7%', activeListings: 210,
    demandLevel: 'Very High',
    insight: 'Balewadi is one of Pune\'s fastest-growing micro-markets. Sports infrastructure and IT proximity are key demand drivers. Ready-to-move inventory is scarce.',
  },
  'Wakad': {
    avgPriceSqFt: '₹8,400', yoyGrowth: '10.8%', activeListings: 420,
    demandLevel: 'Moderate',
    insight: 'Wakad offers competitive pricing compared to Baner/Balewadi with good connectivity. Higher inventory means more negotiation room for buyers.',
  },
  'Hinjewadi': {
    avgPriceSqFt: '₹8,100', yoyGrowth: '14.2%', activeListings: 380,
    demandLevel: 'High',
    insight: 'Direct IT hub location drives strong rental demand. New metro line announcement has boosted capital appreciation. Supply is increasing with new launches.',
  },
  'Kharadi': {
    avgPriceSqFt: '₹9,500', yoyGrowth: '11.5%', activeListings: 260,
    demandLevel: 'High',
    insight: 'Kharadi\'s EON IT Park proximity and Pune airport access make it a premium east-Pune market. Price growth is steady at 11-12% annually.',
  },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Index II mock available documents ──
interface Index2SubDoc {
  id: string;
  title: string;
  type: string;
  monthYear: string;
}

interface Index2Doc {
  id: string;
  label: string;
  description: string;
  tag?: string;
  subDocs?: Index2SubDoc[];
}

function getAvailableIndex2(area: string, propertyName: string): Index2Doc[] {
  const areaName = area.split(',')[0].trim();
  const now = new Date();
  const fromDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear() - 1}`;
  const toDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  const projectSubDocs: Index2SubDoc[] = [];
  for (let m = 0; m < 8; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    projectSubDocs.push({
      id: `proj-${m}`,
      title: `${propertyName} — ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      type: 'Sale Deed',
      monthYear: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  return [
    {
      id: `${areaName.toLowerCase()}-latest`,
      label: `Index II — Latest`,
      description: `Most recent registered transactions near ${propertyName} — ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
      tag: 'Recent',
    },
    {
      id: `${areaName.toLowerCase()}-project`,
      label: `Index II — Project Data`,
      description: `All registered transactions for ${propertyName} and the same building/society`,
      subDocs: projectSubDocs,
    },
    {
      id: `${areaName.toLowerCase()}-area`,
      label: `Index II — ${areaName} (1 year)`,
      description: `All transactions in ${areaName} from ${fromDate} to ${toDate}`,
    },
  ];
}

// ── Index II HTML renderer (bypasses file:// issues in Expo Go; production will use S3 URLs) ──
function buildIndex2Html(docTitle: string, areaName: string): string {
  const now = new Date();
  const rows = [
    ['15/03/2026', 'Flat 1204, Wing A', 'Sale', '₹1.32 Cr', '1,420 sq.ft', '₹9,296/sq.ft'],
    ['28/02/2026', 'Flat 803, Wing B', 'Sale', '₹1.18 Cr', '1,310 sq.ft', '₹9,007/sq.ft'],
    ['14/02/2026', 'Flat 1502, Wing A', 'Sale', '₹1.41 Cr', '1,450 sq.ft', '₹9,724/sq.ft'],
    ['03/01/2026', 'Flat 601, Wing C', 'Sale', '₹98.5 L', '1,050 sq.ft', '₹9,381/sq.ft'],
    ['18/12/2025', 'Flat 904, Wing A', 'Sale', '₹1.28 Cr', '1,380 sq.ft', '₹9,275/sq.ft'],
    ['25/11/2025', 'Flat 702, Wing B', 'Resale', '₹1.15 Cr', '1,320 sq.ft', '₹8,712/sq.ft'],
    ['09/11/2025', 'Flat 1101, Wing A', 'Sale', '₹1.35 Cr', '1,450 sq.ft', '₹9,310/sq.ft'],
    ['22/10/2025', 'Flat 405, Wing C', 'Sale', '₹92 L', '1,050 sq.ft', '₹8,762/sq.ft'],
    ['15/09/2025', 'Flat 1303, Wing B', 'Resale', '₹1.22 Cr', '1,310 sq.ft', '₹9,313/sq.ft'],
    ['01/08/2025', 'Flat 506, Wing A', 'Sale', '₹1.25 Cr', '1,380 sq.ft', '₹9,058/sq.ft'],
  ];
  const tableRows = rows.map((r, i) =>
    '<tr style="background:' + (i % 2 === 0 ? '#faf8f4' : '#fff') + '">' +
    '<td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td>' +
    '<td style="font-weight:600;color:#B8451E">' + r[3] + '</td>' +
    '<td>' + r[4] + '</td><td>' + r[5] + '</td></tr>'
  ).join('');

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3">' +
    '<style>*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:-apple-system,system-ui,sans-serif;background:#F5F0E8;padding:16px;color:#0D1F4A}' +
    '.page{background:#fff;border-radius:8px;padding:20px 16px;border:1px solid #E0D8CC;box-shadow:0 2px 8px rgba(0,0,0,0.05)}' +
    '.header{text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #0D1F4A}' +
    '.header h1{font-size:15px;font-weight:700;letter-spacing:0.5px;margin-bottom:4px}' +
    '.header h2{font-size:11px;font-weight:500;color:#5C554A}' +
    '.header .sub{font-size:9px;color:#A89E8E;margin-top:4px}' +
    '.meta{display:flex;justify-content:space-between;font-size:9px;color:#A89E8E;margin-bottom:12px;padding:0 2px}' +
    'table{width:100%;border-collapse:collapse;font-size:10px}' +
    'th{text-align:left;padding:8px 6px;background:#0D1F4A;color:#fff;font-weight:600;font-size:9px;letter-spacing:0.3px}' +
    'td{padding:7px 6px;border-bottom:1px solid #E0D8CC;font-size:10px;vertical-align:top}' +
    '.footer{margin-top:16px;padding-top:10px;border-top:1px solid #E0D8CC;font-size:8px;color:#A89E8E;text-align:center;line-height:1.4}' +
    '.stamp{display:inline-block;border:1.5px solid #D95F2B;color:#D95F2B;font-size:8px;font-weight:700;padding:2px 6px;border-radius:3px;margin-top:6px;letter-spacing:0.5px}' +
    '</style></head><body>' +
    '<div class="page">' +
    '<div class="header"><h1>INDEX II \u2014 ' + areaName + ' Sub-Registrar Office</h1>' +
    '<h2>' + docTitle + '</h2>' +
    '<div class="sub">Government of Maharashtra \u00b7 Department of Registration & Stamps</div></div>' +
    '<div class="meta"><span>Document No: IGR/' + areaName.toUpperCase() + '/2026/' + Math.floor(Math.random() * 9000 + 1000) + '</span>' +
    '<span>Generated: ' + now.getDate().toString().padStart(2, '0') + '/' + (now.getMonth() + 1).toString().padStart(2, '0') + '/' + now.getFullYear() + '</span></div>' +
    '<table><thead><tr><th>Date</th><th>Unit</th><th>Type</th><th>Amount</th><th>Area</th><th>Rate</th></tr></thead>' +
    '<tbody>' + tableRows + '</tbody></table>' +
    '<div class="footer">This is a computer-generated document from the Sub-Registrar office, ' + areaName + ', Pune.<br/>' +
    'Data sourced from registered sale deeds. For verification, contact the office directly.<br/>' +
    '<span class="stamp">VERIFIED COPY</span></div></div></body></html>';
}

// ── Negotiation checklist ──
interface ChecklistItem { id: string; text: string; tier: 'price' | 'hidden' | 'contract' | 'specific' }

function buildChecklist(property: { id: string; name: string; area: string; price: string }): ChecklistItem[] {
  const items: ChecklistItem[] = [
    // Tier 1: Price negotiation
    { id: 'verify-index', tier: 'price', text: 'Verify quoted price against Index II registered transactions in the area' },
    { id: 'itemized-cost', tier: 'price', text: 'Ask for itemized cost breakdown: base price, floor rise, PLC, amenity charges, GST' },
    { id: 'compare-resale', tier: 'price', text: 'Compare with resale prices in the same society — often 10-15% lower than new launch' },
    { id: 'carpet-area', tier: 'price', text: 'Confirm price is on carpet area (RERA mandate), not super built-up' },
    // Tier 2: Hidden charges
    { id: 'club-membership', tier: 'hidden', text: 'Push for waiver on club membership fee (typically ₹2-5L, often negotiable)' },
    { id: 'parking', tier: 'hidden', text: 'Negotiate car parking charges — covered vs open, should not exceed ₹3-5L' },
    { id: 'maintenance', tier: 'hidden', text: 'Check if maintenance deposit is one-time or monthly, and the per sq.ft rate' },
    { id: 'stamp-duty', tier: 'hidden', text: 'Verify stamp duty calculation base: agreement value vs ready reckoner rate' },
    // Tier 3: Contractual leverage
    { id: 'possession-penalty', tier: 'contract', text: 'Request possession delay penalty clause (₹X per sq.ft per month of delay)' },
    { id: 'payment-plan', tier: 'contract', text: 'Ask about payment plan: CLP (construction-linked) vs TLP (time-linked) — CLP gives you leverage' },
    { id: 'cancellation', tier: 'contract', text: 'Negotiate cancellation/refund terms — push for 6-month refund window' },
    { id: 'specification', tier: 'contract', text: 'Ask for specification upgrades: modular kitchen, flooring grade, bathroom fittings' },
  ];
  return items;
}

// ── Unified candidate shape (Property + UserProperty normalized) ──
interface Candidate {
  id: string;
  name: string;
  area: string;
  price: string;
  size: string;
  image?: string;
  isUserAdded: boolean;
}

function toCandidate(p: Property): Candidate {
  return {
    id: p.id,
    name: p.name,
    area: p.area,
    price: p.price,
    size: p.size,
    image: p.image,
    isUserAdded: false,
  };
}
function userPropToCandidate(p: UserProperty): Candidate {
  return {
    id: p.id,
    name: p.name,
    area: p.area,
    price: p.price,
    size: p.size,
    image: p.images?.[0],
    isUserAdded: true,
  };
}

// ── Smart ranking + pre-selection ──
interface RankResult {
  sorted: Candidate[];
  preselectedId: string | null;
  /** Reason for the preselection — drives the helper text */
  preselectReason: 'alon-pick' | 'visited' | 'only-one' | 'first' | null;
  /** Map of property id → set of context chips */
  chipsById: Record<string, Array<'alon-pick' | 'visited' | 'by-you'>>;
}

function rankCandidates(
  pool: Candidate[],
  visitIds: string[],
  recommendedId: string | null
): RankResult {
  if (pool.length === 0) {
    return { sorted: [], preselectedId: null, preselectReason: null, chipsById: {} };
  }

  // Build chips
  const chipsById: Record<string, Array<'alon-pick' | 'visited' | 'by-you'>> = {};
  for (const p of pool) {
    const chips: Array<'alon-pick' | 'visited' | 'by-you'> = [];
    if (recommendedId && p.id === recommendedId) chips.push('alon-pick');
    if (visitIds.includes(p.id)) chips.push('visited');
    if (p.isUserAdded) chips.push('by-you');
    chipsById[p.id] = chips;
  }

  // Priority chain for pre-selection
  let preselectedId: string | null = null;
  let preselectReason: RankResult['preselectReason'] = null;

  if (recommendedId && pool.some((p) => p.id === recommendedId)) {
    preselectedId = recommendedId;
    preselectReason = 'alon-pick';
  } else if (visitIds.length > 0) {
    // Most recent visit (last element in scheduledVisits)
    const lastVisitId = visitIds[visitIds.length - 1];
    if (pool.some((p) => p.id === lastVisitId)) {
      preselectedId = lastVisitId;
      preselectReason = 'visited';
    }
  }
  if (!preselectedId && pool.length === 1) {
    preselectedId = pool[0].id;
    preselectReason = 'only-one';
  }
  if (!preselectedId) {
    preselectedId = pool[0].id;
    preselectReason = 'first';
  }

  // Sort: pre-selected first, then visited, then rest
  const sorted = [...pool].sort((a, b) => {
    if (a.id === preselectedId) return -1;
    if (b.id === preselectedId) return 1;
    const aVisited = visitIds.includes(a.id);
    const bVisited = visitIds.includes(b.id);
    if (aVisited && !bVisited) return -1;
    if (!aVisited && bVisited) return 1;
    return 0;
  });

  return { sorted, preselectedId, preselectReason, chipsById };
}

export default function NegotiateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const {
    likedPropertyIds,
    userProperties,
    scheduledVisits,
    comparePropertyIds,
    budget,
    locations,
    propertySize,
    negotiatePropertyId,
    setNegotiatePropertyId,
  } = useOnboardingStore();

  // Build candidate pool — liked shortlist + user-added
  const pool = useMemo<Candidate[]>(() => {
    const liked = SHORTLIST_PROPERTIES
      .filter((p) => likedPropertyIds.includes(p.id))
      .map(toCandidate);
    const userAdded = userProperties.map(userPropToCandidate);
    return [...liked, ...userAdded];
  }, [likedPropertyIds, userProperties]);

  // Hard guard — redirect if there's nothing to negotiate on
  useEffect(() => {
    if (pool.length === 0) {
      router.replace({ pathname: '/onboarding/shortlist', params: { nudge: 'negotiate' } });
    }
  }, [pool.length]);

  // Compute ALON's Pick from compared set
  const recommendedId = useMemo(() => {
    if (comparePropertyIds.length < 2) return null;
    const result = getRecommended(comparePropertyIds, { budget, locations, propertySize });
    return result?.id || null;
  }, [comparePropertyIds, budget, locations, propertySize]);

  // Rank + pre-select
  const ranking = useMemo(
    () => rankCandidates(pool, scheduledVisits.map((v) => v.propertyId), recommendedId),
    [pool, scheduledVisits, recommendedId]
  );

  // Local picker state — seeded from ranking on first render
  const [pickedId, setPickedId] = useState<string | null>(ranking.preselectedId);
  useEffect(() => {
    // Re-seed when ranking changes (e.g., after entering the screen fresh)
    if (!pickedId && ranking.preselectedId) {
      setPickedId(ranking.preselectedId);
    }
  }, [ranking.preselectedId]);

  // Currently confirmed property for workspace mode
  const confirmed = useMemo(
    () => pool.find((p) => p.id === negotiatePropertyId) || null,
    [pool, negotiatePropertyId]
  );

  const onConfirm = () => {
    if (!pickedId) return;
    haptics.success();
    setNegotiatePropertyId(pickedId);
  };

  const onChangeProperty = () => {
    haptics.light();
    setNegotiatePropertyId(null);
    setPickedId(ranking.preselectedId);
  };

  // Don't render anything while the guard redirect is processing
  if (pool.length === 0) {
    return <View style={[styles.container, { paddingTop: insets.top }]} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Handshake size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Negotiate</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {confirmed ? (
        <NegotiateWorkspace
          property={confirmed}
          onChangeProperty={onChangeProperty}
          insetBottom={insets.bottom}
        />
      ) : (
        <NegotiatePicker
          ranking={ranking}
          pickedId={pickedId}
          onPick={(id) => {
            haptics.selection();
            setPickedId(id);
          }}
          onConfirm={onConfirm}
          insetBottom={insets.bottom}
        />
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// PICKER
// ═══════════════════════════════════════════════════════════════
interface PickerProps {
  ranking: RankResult;
  pickedId: string | null;
  onPick: (id: string) => void;
  onConfirm: () => void;
  insetBottom: number;
}

function NegotiatePicker({ ranking, pickedId, onPick, onConfirm, insetBottom }: PickerProps) {
  const { sorted, preselectReason, chipsById } = ranking;
  const picked = sorted.find((p) => p.id === pickedId);

  const helperText = useMemo(() => {
    if (!picked) return 'Pick a property to continue';
    const chips = chipsById[picked.id] || [];
    if (chips.includes('alon-pick')) {
      return "ALON's Pick — highest match score across your comparison";
    }
    if (chips.includes('visited')) {
      return `You visited ${picked.name} — ready to negotiate?`;
    }
    if (preselectReason === 'only-one' && sorted.length === 1) {
      return 'Your only shortlisted property — let\'s negotiate on it';
    }
    return `Ready to negotiate on ${picked.name}?`;
  }, [picked, chipsById, preselectReason, sorted.length]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.pickerContent,
          { paddingBottom: insetBottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro section */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.introSection}>
          <Text style={styles.sectionLabel}>PICK ONE TO NEGOTIATE</Text>
          <Text style={styles.introSubtitle}>
            Negotiation works on one property at a time. ALON will build your case with market
            data, comparable sales, and a checklist.
          </Text>
        </Animated.View>

        {/* Property cards */}
        <View style={styles.cardList}>
          {sorted.map((p, i) => {
            const isPicked = pickedId === p.id;
            const chips = chipsById[p.id] || [];
            return (
              <Animated.View
                key={p.id}
                entering={FadeInDown.delay(i * 60).duration(280)}
              >
                <Pressable
                  onPress={() => onPick(p.id)}
                  style={[styles.card, isPicked && styles.cardPicked]}
                >
                  {p.image ? (
                    <Image source={{ uri: p.image }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                      <Text style={styles.cardImageInitial}>{p.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      {isPicked && (
                        <CheckCircle2 size={18} color={Colors.terra500} strokeWidth={2.5} />
                      )}
                    </View>
                    <View style={styles.cardLocationRow}>
                      <MapPin size={10} color={Colors.textTertiary} strokeWidth={1.8} />
                      <Text style={styles.cardLocation} numberOfLines={1}>
                        {p.area}
                      </Text>
                    </View>
                    <Text style={styles.cardPrice}>{p.price}</Text>
                    <Text style={styles.cardSize} numberOfLines={1}>
                      {p.size}
                    </Text>
                    {/* Chips */}
                    {chips.length > 0 && (
                      <View style={styles.chipRow}>
                        {chips.map((chip) => (
                          <ContextChip key={chip} kind={chip} />
                        ))}
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky confirm bar */}
      <View style={[styles.confirmBar, { paddingBottom: Math.max(insetBottom, 12) }]}>
        <Text style={styles.helperText} numberOfLines={2}>
          {helperText}
        </Text>
        <TouchableOpacity
          style={[styles.confirmBtn, !pickedId && styles.confirmBtnDisabled]}
          onPress={onConfirm}
          disabled={!pickedId}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Start Negotiating</Text>
          <ChevronRight size={16} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Context chip ──
function ContextChip({ kind }: { kind: 'alon-pick' | 'visited' | 'by-you' }) {
  if (kind === 'alon-pick') {
    return (
      <View style={[styles.chip, styles.chipAlonPick]}>
        <Sparkles size={9} color={Colors.terra600} strokeWidth={2.5} />
        <Text style={[styles.chipText, styles.chipAlonPickText]}>ALON's Pick</Text>
      </View>
    );
  }
  if (kind === 'visited') {
    return (
      <View style={[styles.chip, styles.chipVisited]}>
        <MapPin size={9} color="#0D9488" strokeWidth={2.5} />
        <Text style={[styles.chipText, styles.chipVisitedText]}>You visited</Text>
      </View>
    );
  }
  return (
    <View style={[styles.chip, styles.chipByYou]}>
      <UserPlus size={9} color={Colors.warm600} strokeWidth={2.5} />
      <Text style={[styles.chipText, styles.chipByYouText]}>By you</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// WORKSPACE
// ═══════════════════════════════════════════════════════════════
interface WorkspaceProps {
  property: Candidate;
  onChangeProperty: () => void;
  insetBottom: number;
}

function NegotiateWorkspace({ property, onChangeProperty, insetBottom }: WorkspaceProps) {
  const haptics = useHaptics();
  const { negotiateDataRequests, addNegotiateDataRequest } = useOnboardingStore();
  const [customRequestText, setCustomRequestText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const requestInputY = useRef(0);
  const [checklistExpanded, setChecklistExpanded] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Index2Doc | null>(null);
  const [previewSubIdx, setPreviewSubIdx] = useState(0);
  const [showSubList, setShowSubList] = useState(false);

  // Lookup property details + area trends
  const details = PROPERTY_DETAILS[property.id];
  const areaName = property.area.split(',')[0].trim();
  const areaTrends = AREA_TRENDS[areaName];
  const availableIndex2 = useMemo(() => getAvailableIndex2(property.area, property.name), [property.area, property.name]);
  const checklist = useMemo(() => buildChecklist(property), [property.id]);

  // Requests for the current property only
  const propertyRequests = useMemo(
    () => negotiateDataRequests.filter((r) => r.propertyId === property.id),
    [negotiateDataRequests, property.id]
  );
  const customRequests = propertyRequests.filter((r) => r.type === 'custom');

  const submitCustomRequest = useCallback(() => {
    const text = customRequestText.trim();
    if (!text) return;
    haptics.medium();
    addNegotiateDataRequest({ type: 'custom', text, propertyId: property.id });
    setCustomRequestText('');
  }, [customRequestText, property]);

  const scrollToInput = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: requestInputY.current - 80, animated: true });
    }, 300);
  }, []);

  const totalChecklist = checklist.length;

  return (
    <>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[styles.workspaceContent, { paddingBottom: insetBottom + 24 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Property header ── */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.pinnedProperty}>
        {property.image ? (
          <Image source={{ uri: property.image }} style={styles.pinnedImage} />
        ) : (
          <View style={[styles.pinnedImage, styles.cardImagePlaceholder]}>
            <Text style={styles.cardImageInitial}>{property.name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.pinnedInfo}>
          <Text style={styles.pinnedLabel}>NEGOTIATING ON</Text>
          <Text style={styles.pinnedName} numberOfLines={1}>{property.name}</Text>
          <Text style={styles.pinnedMeta} numberOfLines={1}>{property.area} · {property.price}</Text>
        </View>
        <TouchableOpacity onPress={onChangeProperty} style={styles.changeBtn} activeOpacity={0.7}>
          <Text style={styles.changeBtnText}>Change</Text>
          <ChevronRight size={12} color={Colors.terra500} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>

      {/* ═══ PRICE INTELLIGENCE ═══ */}
      {details && (
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Text style={[styles.wsLabel, styles.wsLabelStandalone]}>PRICE INTELLIGENCE</Text>

          {/* Fair price range */}
          <View style={styles.fairPriceCard}>
            <View style={styles.fairPriceHeader}>
              <TrendingUp size={14} color={Colors.terra500} strokeWidth={2} />
              <Text style={styles.fairPriceTitle}>Fair Price Range</Text>
            </View>
            <Text style={styles.fairPriceRange}>
              {details.priceHistory[2]?.price || '—'} — {property.price}
            </Text>
            <Text style={styles.fairPriceSub}>
              Your property at {property.price} · {details.pricePerSqFt}/sq.ft
            </Text>

            {/* Price history rows */}
            <View style={styles.priceHistoryWrap}>
              {details.priceHistory.map((ph, i) => (
                <View key={ph.period} style={[styles.phRow, i > 0 && styles.phRowBorder]}>
                  <Text style={styles.phPeriod}>{ph.period}</Text>
                  <Text style={styles.phPrice}>{ph.price}</Text>
                  <View style={styles.phChangeBadge}>
                    <TrendingUp size={10} color="#16A34A" strokeWidth={2} />
                    <Text style={styles.phChangeText}>{ph.change}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* ═══ AREA TRENDS ═══ */}
      {areaTrends && (
        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Text style={[styles.wsLabel, styles.wsLabelStandalone]}>AREA TRENDS — {areaName.toUpperCase()}</Text>
          <View style={styles.areaTrendsCard}>
            <View style={styles.areaStatsRow}>
              <View style={styles.areaStat}>
                <Text style={styles.areaStatValue}>{areaTrends.avgPriceSqFt}</Text>
                <Text style={styles.areaStatLabel}>Avg/sq.ft</Text>
              </View>
              <View style={styles.areaStatDivider} />
              <View style={styles.areaStat}>
                <Text style={styles.areaStatValue}>{areaTrends.yoyGrowth}</Text>
                <Text style={styles.areaStatLabel}>YoY growth</Text>
              </View>
              <View style={styles.areaStatDivider} />
              <View style={styles.areaStat}>
                <Text style={styles.areaStatValue}>{areaTrends.activeListings}</Text>
                <Text style={styles.areaStatLabel}>Active listings</Text>
              </View>
              <View style={styles.areaStatDivider} />
              <View style={styles.areaStat}>
                <Text style={[styles.areaStatValue, { color: '#16A34A' }]}>{areaTrends.demandLevel}</Text>
                <Text style={styles.areaStatLabel}>Demand</Text>
              </View>
            </View>
            <View style={styles.areaInsightWrap}>
              <BarChart3 size={12} color={Colors.terra400} strokeWidth={1.8} />
              <Text style={styles.areaInsightText}>{areaTrends.insight}</Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* ═══ INDEX II DATA ═══ */}
      <Animated.View entering={FadeInDown.delay(400).duration(300)}>
        <View style={styles.checklistHeader}>
          <Text style={styles.wsLabel}>INDEX II DATA</Text>
          <Text style={styles.checklistProgress}>{availableIndex2.length} available</Text>
        </View>
        <View style={styles.index2Card}>
          {availableIndex2.map((doc, i) => {
            const hasSubDocs = doc.subDocs && doc.subDocs.length > 0;
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.index2Row, i > 0 && styles.index2RowBorder]}
                onPress={() => {
                  haptics.light();
                  setPreviewDoc(doc);
                  setPreviewSubIdx(0);
                  setShowSubList(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.index2IconWrap}>
                  <FileText size={14} color={Colors.terra500} strokeWidth={1.8} />
                </View>
                <View style={styles.index2Info}>
                  <View style={styles.index2LabelRow}>
                    <Text style={styles.index2Label}>{doc.label}</Text>
                    {doc.tag && (
                      <View style={styles.index2Tag}>
                        <Text style={styles.index2TagText}>{doc.tag}</Text>
                      </View>
                    )}
                    {hasSubDocs && (
                      <View style={styles.index2CountBadge}>
                        <Text style={styles.index2CountText}>{doc.subDocs!.length} docs</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.index2Desc}>{doc.description}</Text>
                </View>
                <Eye size={14} color={Colors.warm400} strokeWidth={1.8} />
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* ═══ REQUEST CUSTOM DATA ═══ */}
      <Animated.View entering={FadeInDown.delay(500).duration(300)}>
        <View
          style={styles.requestSection}
          onLayout={(e) => { requestInputY.current = e.nativeEvent.layout.y; }}
        >
          <View style={styles.requestHeader}>
            <MessageSquare size={14} color={Colors.terra500} strokeWidth={1.8} />
            <Text style={styles.requestSectionTitle}>Request specific data</Text>
          </View>
          <Text style={styles.requestSub}>
            Request market data, comparable sales, builder agreements, or any document that strengthens your negotiation.
          </Text>
          <View style={styles.requestInputRow}>
            <TextInput
              style={styles.requestInput}
              placeholder="e.g. sample builder agreement, comparable 3BHK sales in Baner"
              placeholderTextColor={Colors.warm300}
              value={customRequestText}
              onChangeText={setCustomRequestText}
              onFocus={scrollToInput}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              style={[styles.requestSendBtn, !customRequestText.trim() && styles.requestSendBtnDisabled]}
              onPress={submitCustomRequest}
              disabled={!customRequestText.trim()}
              activeOpacity={0.85}
            >
              <ChevronRight size={18} color={Colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          {customRequests.length > 0 && (
            <View style={styles.requestList}>
              <Text style={styles.requestListLabel}>YOUR REQUESTS</Text>
              {customRequests.map((req) => (
                <View key={req.id} style={styles.requestItem}>
                  <FileText size={14} color={Colors.terra400} strokeWidth={1.8} />
                  <View style={styles.requestItemContent}>
                    <Text style={styles.requestItemText} numberOfLines={2}>{req.text}</Text>
                    <View style={styles.statusBadge}>
                      <PulsingDot fulfilled={req.status === 'fulfilled'} />
                      <Text style={[styles.statusText, req.status === 'fulfilled' && styles.statusTextFulfilled]}>
                        {req.status === 'pending' ? 'Being prepared' : 'Ready to view'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={styles.notifyInfo}>
                <Info size={11} color={Colors.warm400} strokeWidth={1.8} />
                <Text style={styles.notifyInfoText}>You will be notified when your requested data is available</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* ═══ NEGOTIATION CHECKLIST ═══ */}
      <Animated.View entering={FadeInDown.delay(600).duration(300)}>
        <View style={styles.checklistHeader}>
          <Text style={styles.wsLabel}>NEGOTIATION CHECKLIST</Text>
          <Text style={styles.checklistProgress}>{totalChecklist} points</Text>
        </View>
        <View style={styles.checklistCard}>
          {(checklistExpanded ? checklist : checklist.slice(0, 3)).map((item, i) => (
            <View key={item.id} style={[styles.checklistRow, i > 0 && styles.checklistRowBorder]}>
              <View style={styles.checklistBullet} />
              <Text style={styles.checklistText}>{item.text}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.checklistToggle}
            onPress={() => { haptics.light(); setChecklistExpanded(!checklistExpanded); }}
            activeOpacity={0.7}
          >
            <Text style={styles.checklistToggleText}>
              {checklistExpanded ? 'Show less' : `See all ${totalChecklist} points`}
            </Text>
            {checklistExpanded ? (
              <ChevronUp size={14} color={Colors.terra500} strokeWidth={2} />
            ) : (
              <ChevronDown size={14} color={Colors.terra500} strokeWidth={2} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checklistDownloadBtn}
            onPress={() => {
              haptics.medium();
              Alert.alert('Coming soon', 'PDF download of your negotiation checklist will be available in the next update.', [{ text: 'OK' }]);
            }}
            activeOpacity={0.85}
          >
            <Download size={13} color={Colors.terra500} strokeWidth={2} />
            <Text style={styles.checklistDownloadText}>Download as PDF</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Info size={12} color={Colors.terra500} strokeWidth={1.5} />
        <Text style={styles.disclaimerText}>
          Negotiation data is AI-assisted and informational only. Final price depends on the
          builder, market conditions, and your own discretion.
        </Text>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>

    {/* ═══ INDEX II PREVIEW BOTTOM SHEET ═══ */}
    {previewDoc && (
      <Modal visible transparent animationType="slide" statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setPreviewDoc(null)}>
          <View style={previewStyles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[previewStyles.sheet, { paddingBottom: Math.max(insetBottom, 16) }]}>
                {/* Handle + header */}
                <View style={previewStyles.handle} />
                <View style={previewStyles.header}>
                  <View style={{ flex: 1 }}>
                    <Text style={previewStyles.headerTitle} numberOfLines={1}>
                      {previewDoc.subDocs && previewDoc.subDocs.length > 0
                        ? previewDoc.subDocs[previewSubIdx]?.title || previewDoc.label
                        : previewDoc.label}
                    </Text>
                    <Text style={previewStyles.headerSub}>
                      {previewDoc.subDocs && previewDoc.subDocs.length > 0
                        ? `${previewDoc.subDocs[previewSubIdx]?.type || 'Document'} · ${previewDoc.subDocs[previewSubIdx]?.monthYear || ''}`
                        : previewDoc.description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={previewStyles.downloadIcon}
                    onPress={() => { haptics.medium(); Alert.alert('Downloading', 'Your document will be saved to Downloads.'); }}
                    activeOpacity={0.7}
                  >
                    <Download size={18} color={Colors.terra500} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={previewStyles.closeIcon}
                    onPress={() => setPreviewDoc(null)}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={Colors.textTertiary} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                {/* Document preview — image placeholder (production will use S3 PDF URLs via WebView) */}
                <ScrollView
                  style={previewStyles.pdfArea}
                  contentContainerStyle={previewStyles.pdfContent}
                  showsVerticalScrollIndicator
                  bounces
                >
                  <Image
                    source={previewDoc.id.includes('latest') ? index2SampleImg : index2Img}
                    style={previewStyles.pdfImage}
                    resizeMode="contain"
                  />
                </ScrollView>

                {/* Floating "See N more" — only for docs with sub-documents */}
                {previewDoc.subDocs && previewDoc.subDocs.length > 1 && !showSubList && (
                  <TouchableOpacity
                    style={previewStyles.seeMoreBtn}
                    onPress={() => { haptics.light(); setShowSubList(true); }}
                    activeOpacity={0.85}
                  >
                    <FileText size={13} color={Colors.white} strokeWidth={2} />
                    <Text style={previewStyles.seeMoreText}>
                      See {previewDoc.subDocs.length - 1} more documents
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Sub-document list (shown when "See more" is tapped) */}
                {showSubList && previewDoc.subDocs && (
                  <View style={previewStyles.subList}>
                    <View style={previewStyles.subListHeader}>
                      <Text style={previewStyles.subListTitle}>
                        {previewDoc.label} ({previewDoc.subDocs.length})
                      </Text>
                      <TouchableOpacity onPress={() => setShowSubList(false)}>
                        <Text style={previewStyles.subListClose}>Hide</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={previewStyles.subListScroll} showsVerticalScrollIndicator={false}>
                      {previewDoc.subDocs.map((sub, si) => {
                        const isActive = previewSubIdx === si;
                        return (
                          <TouchableOpacity
                            key={sub.id}
                            style={[previewStyles.subItem, isActive && previewStyles.subItemActive]}
                            onPress={() => {
                              haptics.selection();
                              setPreviewSubIdx(si);
                              setShowSubList(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <FileText size={13} color={isActive ? Colors.terra500 : Colors.warm400} strokeWidth={1.8} />
                            <View style={{ flex: 1 }}>
                              <Text style={[previewStyles.subItemTitle, isActive && previewStyles.subItemTitleActive]} numberOfLines={1}>
                                {sub.title}
                              </Text>
                              <Text style={previewStyles.subItemMeta}>{sub.type} · {sub.monthYear}</Text>
                            </View>
                            {isActive && <CheckCircle2 size={14} color={Colors.terra500} strokeWidth={2} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    )}
    </>
  );
}

// ── Pulsing status dot for "Being prepared" ──
function PulsingDot({ fulfilled }: { fulfilled?: boolean }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!fulfilled) {
      pulse.value = withRepeat(
        withTiming(0.25, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [fulfilled]);
  const animStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        styles.statusDot,
        fulfilled && styles.statusDotFulfilled,
        !fulfilled && animStyle,
      ]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const SH = Dimensions.get('window').height;

// ── Preview bottom sheet styles ──
const previewStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SH * 0.82,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, alignSelf: 'center',
    marginTop: 10, marginBottom: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.xxl, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  headerTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 15, color: Colors.textPrimary,
  },
  headerSub: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary, marginTop: 2,
  },
  downloadIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200,
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm100,
    alignItems: 'center', justifyContent: 'center',
  },
  pdfArea: {
    flex: 1, backgroundColor: Colors.cream,
    borderTopWidth: 1, borderTopColor: Colors.warm100,
  },
  pdfContent: {
    padding: 12,
  },
  pdfImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 0.707,
    backgroundColor: Colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  // Floating "See N more" button
  seeMoreBtn: {
    position: 'absolute', bottom: 80, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.navy800, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10,
    elevation: 6,
  },
  seeMoreText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.white,
  },
  // Sub-document list overlay
  subList: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderTopWidth: 1, borderColor: Colors.warm200,
    maxHeight: SH * 0.4,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 8,
  },
  subListHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xxl, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  subListTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary,
  },
  subListClose: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.terra500,
  },
  subListScroll: { paddingHorizontal: Spacing.xxl },
  subItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  subItemActive: { backgroundColor: Colors.terra50, marginHorizontal: -Spacing.xxl, paddingHorizontal: Spacing.xxl },
  subItemTitle: {
    fontFamily: 'DMSans-Medium', fontSize: 13, color: Colors.textPrimary,
  },
  subItemTitleActive: { color: Colors.terra600 },
  subItemMeta: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary, marginTop: 1,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },

  // ── Picker ──
  pickerContent: { paddingTop: Spacing.xl, paddingBottom: Spacing.xl },
  introSection: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  cardList: { paddingHorizontal: Spacing.xxl, gap: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardPicked: {
    borderColor: Colors.terra500,
    backgroundColor: Colors.terra50,
  },
  cardImage: {
    width: 104,
    height: 132,
    backgroundColor: Colors.warm100,
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageInitial: {
    fontSize: 32,
    fontFamily: 'DMSerifDisplay',
    color: Colors.terra500,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  cardLocation: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
  },
  cardPrice: {
    fontSize: 16,
    fontFamily: 'DMSans-Bold',
    color: Colors.terra600,
    marginTop: 6,
  },
  cardSize: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginTop: 1,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 9,
    fontFamily: 'DMSans-SemiBold',
    letterSpacing: 0.2,
  },
  chipAlonPick: {
    backgroundColor: Colors.terra100,
    borderWidth: 1,
    borderColor: Colors.terra200,
  },
  chipAlonPickText: { color: Colors.terra600 },
  chipVisited: {
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  chipVisitedText: { color: '#0D9488' },
  chipByYou: {
    backgroundColor: Colors.warm100,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  chipByYouText: { color: Colors.warm600 },

  // Sticky confirm bar
  confirmBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
    gap: 10,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.terra500,
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmBtnDisabled: {
    backgroundColor: Colors.warm200,
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.white,
  },

  // ── Workspace ──
  workspaceContent: { paddingTop: Spacing.lg },
  pinnedProperty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: Spacing.xxl,
    padding: 12,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  pinnedImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.warm100,
  },
  pinnedInfo: { flex: 1, gap: 1 },
  pinnedLabel: {
    fontSize: 9,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  pinnedName: {
    fontSize: 15,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  pinnedMeta: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.terra200,
  },
  changeBtnText: {
    fontSize: 11,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.terra500,
  },

  // ── Credibility pill ──
  credibilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginHorizontal: Spacing.xxl,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.terra50,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.terra200,
    alignSelf: 'center',
  },
  credibilityText: {
    fontSize: 10,
    fontFamily: 'DMSans-Medium',
    color: Colors.terra600,
  },

  // ── Workspace section label ──
  wsLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 10,
  },
  wsLabelStandalone: {
    marginHorizontal: Spacing.xxl,
  },

  // ── Fair price card ──
  fairPriceCard: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },
  fairPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    paddingBottom: 8,
  },
  fairPriceTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  fairPriceRange: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: Colors.terra600,
    paddingHorizontal: 12,
  },
  fairPriceSub: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textTertiary,
    paddingHorizontal: 12,
    paddingBottom: 10,
    marginTop: 2,
  },
  priceHistoryWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  phRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  phRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  phPeriod: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  phPrice: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
    marginRight: 10,
  },
  phChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  phChangeText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    color: '#166534',
  },

  // ── Area trends ──
  areaTrendsCard: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },
  areaStatsRow: {
    flexDirection: 'row',
    padding: 12,
  },
  areaStat: {
    flex: 1,
    alignItems: 'center',
  },
  areaStatValue: {
    fontFamily: 'DMSans-Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  areaStatLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  areaStatDivider: {
    width: 1,
    backgroundColor: Colors.warm200,
    marginVertical: 2,
  },
  areaInsightWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.warm200,
    backgroundColor: Colors.white,
  },
  areaInsightText: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },

  // ── Negotiation checklist ──
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.xxl,
    marginTop: 20,
    marginBottom: 6,
  },
  checklistProgress: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    color: Colors.terra500,
  },
  checklistCard: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  checklistRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  checklistBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.terra400,
    marginTop: 6,
  },
  checklistText: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  checklistDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
    backgroundColor: Colors.terra50,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  checklistDownloadText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: Colors.terra500,
  },
  checklistToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 11,
    backgroundColor: Colors.warm50,
  },
  checklistToggleText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: Colors.terra500,
  },

  // ── Index II multi-select ──
  index2Card: {
    marginHorizontal: Spacing.xxl,
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  index2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  index2IconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200,
    alignItems: 'center', justifyContent: 'center',
  },
  index2CountBadge: {
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  index2CountText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.terra600,
  },
  index2RowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  index2Info: {
    flex: 1,
    gap: 2,
  },
  index2LabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  index2Label: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  index2Tag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  index2TagText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 9,
    color: '#166534',
  },
  index2Desc: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 15,
  },

  // ── Status badge ──
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.ember,
  },
  statusDotFulfilled: {
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.ember,
  },
  statusTextFulfilled: {
    color: '#22C55E',
  },

  // ── Request section ──
  requestSection: {
    marginHorizontal: Spacing.xxl,
    marginTop: 20,
    padding: 16,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  requestSectionTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  requestSub: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  requestInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  requestInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 88,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warm200,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  requestSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.terra500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestSendBtnDisabled: {
    backgroundColor: Colors.warm200,
  },

  // ── Submitted requests list ──
  requestList: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.warm200,
    gap: 10,
  },
  requestListLabel: {
    fontSize: 9,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warm100,
  },
  requestItemContent: {
    flex: 1,
  },
  requestItemText: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
    lineHeight: 17,
  },
  notifyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  notifyInfoText: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.warm400,
    fontStyle: 'italic',
  },

  disclaimer: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: Spacing.xxl,
    marginTop: 16,
    padding: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    lineHeight: 14,
  },
});
