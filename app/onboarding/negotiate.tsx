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
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
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

  // Requests for the current property only
  const propertyRequests = useMemo(
    () => negotiateDataRequests.filter((r) => r.propertyId === property.id),
    [negotiateDataRequests, property.id]
  );
  const hasIndex2Request = propertyRequests.some((r) => r.type === 'index2');
  const index2Request = propertyRequests.find((r) => r.type === 'index2');
  const customRequests = propertyRequests.filter((r) => r.type === 'custom');

  const requestIndex2 = useCallback(() => {
    if (hasIndex2Request) return;
    haptics.medium();
    addNegotiateDataRequest({
      type: 'index2',
      text: `Index II for ${property.area}`,
      propertyId: property.id,
    });
  }, [hasIndex2Request, property]);

  const submitCustomRequest = useCallback(() => {
    const text = customRequestText.trim();
    if (!text) return;
    haptics.medium();
    addNegotiateDataRequest({
      type: 'custom',
      text,
      propertyId: property.id,
    });
    setCustomRequestText('');
  }, [customRequestText, property]);

  const scrollToInput = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: requestInputY.current - 80, animated: true });
    }, 300);
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[
        styles.workspaceContent,
        { paddingBottom: insetBottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Selected property pinned header */}
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
          <Text style={styles.pinnedName} numberOfLines={1}>
            {property.name}
          </Text>
          <Text style={styles.pinnedMeta} numberOfLines={1}>
            {property.area} · {property.price}
          </Text>
        </View>
        <TouchableOpacity onPress={onChangeProperty} style={styles.changeBtn} activeOpacity={0.7}>
          <Text style={styles.changeBtnText}>Change</Text>
          <ChevronRight size={12} color={Colors.terra500} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>

      {/* Placeholder "building your case" card */}
      <Animated.View
        entering={FadeInDown.delay(150).duration(300)}
        style={styles.placeholderCard}
      >
        <View style={styles.placeholderIconWrap}>
          <Handshake size={28} color={Colors.terra500} strokeWidth={1.8} />
        </View>
        <TypewriterText
          text="ALON is building your case"
          style={styles.placeholderHeadline}
          speed={35}
          delay={400}
        />
        <TypewriterText
          text="Market data, comparable sales from the last 6 months, and a negotiation checklist are on the way."
          style={styles.placeholderBody}
          speed={18}
          delay={1400}
        />
        <View style={styles.placeholderBullets}>
          <PlaceholderBullet text="Fair-price benchmark against recent Pune transactions" />
          <PlaceholderBullet text="Comparable builder-buyer deals in the same micro-market" />
          <PlaceholderBullet text="Negotiation checklist tailored to this property" />
        </View>
      </Animated.View>

      {/* ── Index II download card ── */}
      <Animated.View entering={FadeInDown.delay(250).duration(300)}>
        <View style={styles.toolSection}>
          <Text style={styles.toolSectionLabel}>NEGOTIATION TOOLS</Text>

          <TouchableOpacity
            style={[styles.toolCard, hasIndex2Request && styles.toolCardRequested]}
            onPress={requestIndex2}
            activeOpacity={hasIndex2Request ? 1 : 0.7}
          >
            <View style={[styles.toolIconWrap, hasIndex2Request && styles.toolIconWrapRequested]}>
              {hasIndex2Request ? (
                <Clock size={18} color={Colors.terra500} strokeWidth={1.8} />
              ) : (
                <Download size={18} color={Colors.terra500} strokeWidth={1.8} />
              )}
            </View>
            <View style={styles.toolCardContent}>
              <Text style={styles.toolCardTitle}>
                {hasIndex2Request ? 'Index II requested' : 'Download Index II'}
              </Text>
              <Text style={styles.toolCardSub}>
                {hasIndex2Request
                  ? `For ${property.area}. We'll notify you when it's ready.`
                  : `Registered transaction data for ${property.area} from the Sub-Registrar's office — the strongest proof of market price.`}
              </Text>
              {hasIndex2Request && index2Request && (
                <View style={styles.statusBadge}>
                  <PulsingDot fulfilled={index2Request.status === 'fulfilled'} />
                  <Text style={[styles.statusText, index2Request.status === 'fulfilled' && styles.statusTextFulfilled]}>
                    {index2Request.status === 'pending' ? 'Being prepared' : 'Ready to view'}
                  </Text>
                </View>
              )}
            </View>
            {!hasIndex2Request && (
              <ChevronRight size={16} color={Colors.terra400} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Request custom data ── */}
      <Animated.View entering={FadeInDown.delay(350).duration(300)}>
        <View
          style={styles.requestSection}
          onLayout={(e) => { requestInputY.current = e.nativeEvent.layout.y; }}
        >
          <View style={styles.requestHeader}>
            <MessageSquare size={14} color={Colors.terra500} strokeWidth={1.8} />
            <Text style={styles.requestSectionTitle}>Request specific data</Text>
          </View>
          <Text style={styles.requestSub}>
            Need something specific? Describe what data would help your negotiation — our team
            will prepare it and notify you when it's ready.
          </Text>

          <View style={styles.requestInputRow}>
            <TextInput
              style={styles.requestInput}
              placeholder="e.g. comparable 3BHK sales in Baner last 6 months"
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
              <Send size={16} color={Colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Submitted requests */}
          {customRequests.length > 0 && (
            <View style={styles.requestList}>
              <Text style={styles.requestListLabel}>YOUR REQUESTS</Text>
              {customRequests.map((req) => (
                <View key={req.id} style={styles.requestItem}>
                  <FileText size={14} color={Colors.terra400} strokeWidth={1.8} />
                  <View style={styles.requestItemContent}>
                    <Text style={styles.requestItemText} numberOfLines={2}>
                      {req.text}
                    </Text>
                    <View style={styles.statusBadge}>
                      <PulsingDot fulfilled={req.status === 'fulfilled'} />
                      <Text style={[styles.statusText, req.status === 'fulfilled' && styles.statusTextFulfilled]}>
                        {req.status === 'pending' ? 'Being prepared' : 'Ready to view'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Notification info */}
              <View style={styles.notifyInfo}>
                <Info size={11} color={Colors.warm400} strokeWidth={1.8} />
                <Text style={styles.notifyInfoText}>
                  You'll be notified when your requested data is available
                </Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Info size={12} color={Colors.warm400} strokeWidth={1.5} />
        <Text style={styles.disclaimerText}>
          Negotiation data is AI-assisted and informational only. Final price depends on the
          builder, market conditions, and your own discretion.
        </Text>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PlaceholderBullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
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

// ── Typewriter text — reveals text character by character ──
function TypewriterText({
  text,
  style,
  speed = 25,
  delay = 0,
}: {
  text: string;
  style?: any;
  speed?: number;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let idx = 0;
    setDisplayed('');
    const startTimeout = setTimeout(() => {
      const interval = setInterval(() => {
        idx++;
        setDisplayed(text.slice(0, idx));
        if (idx >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [text, speed, delay]);

  const showCursor = displayed.length < text.length;
  return (
    <Text style={style}>
      {displayed}
      {showCursor && <Text style={{ opacity: 0.4 }}>|</Text>}
    </Text>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
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

  placeholderCard: {
    marginHorizontal: Spacing.xxl,
    marginTop: 16,
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
    alignItems: 'center',
  },
  placeholderIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.terra50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  placeholderHeadline: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  placeholderBody: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  placeholderBullets: {
    width: '100%',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.terra400,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  // ── Tool section (Index II + requests) ──
  toolSection: {
    marginHorizontal: Spacing.xxl,
    marginTop: 20,
  },
  toolSectionLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
  },
  toolCardRequested: {
    borderColor: Colors.terra200,
    backgroundColor: Colors.terra50,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.terra50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconWrapRequested: {
    backgroundColor: Colors.white,
  },
  toolCardContent: {
    flex: 1,
  },
  toolCardTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  toolCardSub: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
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
