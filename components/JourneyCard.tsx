import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

const ITEM_HEIGHT = 42;
const VISIBLE_COUNT = 3;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const CENTER_OFFSET = ITEM_HEIGHT; // 1 item padding — minimal whitespace

interface Stage {
  num: number;
  label: string;
  yourTask: string;
  alonTask: string;
  status: 'done' | 'active' | 'pending';
  alonDetail: string;
  yourDetail: string;
  ctaLabel: string;
  ctaInfo: string;
}

const STAGES: Stage[] = [
  { num: 1, label: 'Search', yourTask: 'Set criteria', alonTask: 'Scanning', status: 'active',
    alonDetail: 'Scanning 12L+ listings by RERA & trust score',
    yourDetail: 'Set criteria & areas — done',
    ctaLabel: 'Shortlist now →',
    ctaInfo: 'We found 5 matches based on your preferences. Shortlist to proceed.' },
  { num: 2, label: 'Shortlist', yourTask: 'Pick favorites', alonTask: 'Curating', status: 'pending',
    alonDetail: 'Checks conflicts, RERA & curates top 5',
    yourDetail: 'Pick favorites or check your own property',
    ctaLabel: 'Check a property →',
    ctaInfo: 'ALON checks RERA records, court disputes & builder history to protect your investment.' },
  { num: 3, label: 'Site Visits', yourTask: 'Share slots', alonTask: 'Booking', status: 'pending',
    alonDetail: 'Books visits, number hidden + checklist',
    yourDetail: 'Share your available time slots',
    ctaLabel: 'Schedule a visit →',
    ctaInfo: 'Share your availability and ALON will book visits for you.' },
  { num: 4, label: 'Compare', yourTask: 'Your call', alonTask: 'Analyzing', status: 'pending',
    alonDetail: 'Side-by-side with real transaction data',
    yourDetail: 'Make the final call — always yours',
    ctaLabel: 'Compare properties →',
    ctaInfo: 'ALON will build a side-by-side comparison for your shortlist.' },
  { num: 5, label: 'Finance', yourTask: 'Share docs', alonTask: 'Best rates', status: 'pending',
    alonDetail: 'Compares loans from 10+ banks',
    yourDetail: 'Share income details for pre-approval',
    ctaLabel: 'Check loan options →',
    ctaInfo: 'Get pre-approved with the best rates from 10+ banks.' },
  { num: 6, label: 'Legal', yourTask: 'Upload draft', alonTask: 'Verifying', status: 'pending',
    alonDetail: 'Flags risky clauses, verifies RERA',
    yourDetail: 'Upload the draft agreement',
    ctaLabel: 'Start legal check →',
    ctaInfo: 'Upload your agreement and ALON will flag any concerns.' },
  { num: 7, label: 'Negotiate', yourTask: 'Use data', alonTask: 'Leverage', status: 'pending',
    alonDetail: 'Finds leverage from comparable sales',
    yourDetail: "Negotiate using ALON's insights",
    ctaLabel: 'Get negotiation data →',
    ctaInfo: 'ALON will prepare market data to strengthen your position.' },
  { num: 8, label: 'Possession', yourTask: 'Collect keys', alonTask: 'Checklist', status: 'pending',
    alonDetail: 'Complete checklist — docs to transfers',
    yourDetail: 'Inspect, accept & collect your keys',
    ctaLabel: 'View possession checklist →',
    ctaInfo: 'Everything you need to check before collecting your keys.' },
];

function WheelRow({ stage, index, scrollY }: { stage: Stage; index: number; scrollY: any }) {
  const animStyle = useAnimatedStyle(() => {
    const center = scrollY.value;
    const itemCenter = index * ITEM_HEIGHT;
    const distance = (center - itemCenter) / ITEM_HEIGHT;

    const rotateX = interpolate(distance, [-2, -1, 0, 1, 2], [50, 24, 0, -24, -50], Extrapolation.CLAMP);
    const scale = interpolate(Math.abs(distance), [0, 1, 2], [1, 0.95, 0.88], Extrapolation.CLAMP);
    const opacity = interpolate(Math.abs(distance), [0, 1, 2], [1, 0.4, 0.08], Extrapolation.CLAMP);
    const translateY = interpolate(distance, [-2, -1, 0, 1, 2], [-6, -3, 0, 3, 6], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ perspective: 800 }, { rotateX: `${rotateX}deg` }, { scale }, { translateY }],
    };
  });

  return (
    <Animated.View style={[styles.wheelRow, animStyle]}>
      <Text style={styles.sideTextLeft} numberOfLines={1}>{stage.yourTask}</Text>
      <View style={styles.centerCol}>
        <Text style={styles.centerText}>{stage.label}</Text>
        {stage.status === 'active' && (
          <View style={styles.currentTag}>
            <Text style={styles.currentTagText}>Current</Text>
          </View>
        )}
      </View>
      <Text style={styles.sideTextRight} numberOfLines={1}>{stage.alonTask}</Text>
    </Animated.View>
  );
}

export default function JourneyCard() {
  const router = useRouter();
  const haptics = useHaptics();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [selected, setSelected] = useState(0);
  const scrollY = useSharedValue(0);
  const lastSnapped = useRef(0);

  const onTick = useCallback((index: number) => {
    if (index !== lastSnapped.current) {
      lastSnapped.current = index;
      haptics.light(); // Stronger than selection — mimics Apple's picker tick
    }
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      const index = Math.round(e.contentOffset.y / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(7, index));
      runOnJS(onTick)(clamped);
    },
  });

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    setSelected(Math.max(0, Math.min(7, index)));
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
    setSelected(i);
    haptics.selection();
  }, []);

  const stage = STAGES[selected];

  return (
    <View style={styles.outer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your property journey</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>{selected + 1} of 8</Text>
        </View>
      </View>

      <View style={styles.card}>
        {/* Column headers */}
        <View style={styles.colHeaders}>
          <Text style={styles.colHeaderLeft}>Your task</Text>
          <Text style={styles.colHeaderCenter}>Steps</Text>
          <Text style={styles.colHeaderRight}>ALON's task</Text>
        </View>

        {/* Wheel */}
        <View style={styles.wheelContainer}>
          <View style={styles.selectionRect} />

          {/* Fade top */}
          <View style={styles.fadeTop} pointerEvents="none">
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.85 }]} />
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.3 }]} />
          </View>
          {/* Fade bottom */}
          <View style={styles.fadeBottom} pointerEvents="none">
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.3 }]} />
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.85 }]} />
          </View>

          <Animated.ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={scrollHandler}
            onMomentumScrollEnd={handleMomentumEnd}
            scrollEventThrottle={16}
            style={{ height: WHEEL_HEIGHT }}
            contentContainerStyle={{ paddingTop: CENTER_OFFSET, paddingBottom: CENTER_OFFSET }}
          >
            {STAGES.map((s, i) => (
              <TouchableOpacity key={s.num} activeOpacity={0.8} onPress={() => scrollToIndex(i)}>
                <WheelRow stage={s} index={i} scrollY={scrollY} />
              </TouchableOpacity>
            ))}
          </Animated.ScrollView>
        </View>

        {/* Detail — side by side: YOU (left) | ALON (right) — matches wheel column order */}
        <Animated.View key={stage.num} style={styles.detail} entering={FadeIn.duration(150)}>
          <View style={styles.detailColumns}>
            <View style={styles.detailCol}>
              <View style={styles.youPill}><Text style={styles.youPillText}>YOU</Text></View>
              <Text style={styles.detailText}>{stage.yourDetail}</Text>
            </View>
            <View style={styles.detailColDivider} />
            <View style={styles.detailCol}>
              <View style={styles.alonPill}><Text style={styles.alonPillText}>ALON</Text></View>
              <Text style={styles.detailText}>{stage.alonDetail}</Text>
            </View>
          </View>

          {/* Contextual CTA */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaInfo}>{stage.ctaInfo}</Text>

            {/* Shortlist step gets two CTAs */}
            {stage.num === 2 ? (
              <View style={styles.dualCta}>
                <TouchableOpacity
                  style={styles.ctaButtonSecondary}
                  activeOpacity={0.8}
                  onPress={() => { router.push('/onboarding/conflict-check'); haptics.light(); }}
                >
                  <Text style={styles.ctaButtonSecondaryText}>Check my property</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ctaButton}
                  activeOpacity={0.85}
                  onPress={() => { router.push('/onboarding/verified-list'); haptics.light(); }}
                >
                  <Text style={styles.ctaButtonText}>ALON's verified list</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.ctaButton}
                activeOpacity={0.85}
                onPress={() => haptics.light()}
              >
                <Text style={styles.ctaButtonText}>{stage.ctaLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  headerTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  counter: { backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  counterText: { fontSize: 11, fontFamily: 'DMSans-SemiBold', color: Colors.terra500 },

  card: { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.warm200, overflow: 'hidden' },

  // Column headers — aligned with wheel columns
  colHeaders: { flexDirection: 'row', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 },
  colHeaderLeft: { flex: 1, fontSize: 9, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  colHeaderCenter: { flex: 1, fontSize: 9, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  colHeaderRight: { flex: 1, fontSize: 9, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' },

  // Wheel
  wheelContainer: { position: 'relative', overflow: 'hidden' },
  selectionRect: { position: 'absolute', top: CENTER_OFFSET, left: 8, right: 8, height: ITEM_HEIGHT, backgroundColor: Colors.cream, borderRadius: 10, borderWidth: 1, borderColor: Colors.warm200, zIndex: 0 },

  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: CENTER_OFFSET, zIndex: 4 },
  fadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: CENTER_OFFSET, zIndex: 4 },
  fadeBand: { backgroundColor: '#fff' },

  // Wheel row
  wheelRow: { height: ITEM_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, zIndex: 1 },
  sideTextLeft: { flex: 1, fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
  sideTextRight: { flex: 1, fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary, textAlign: 'right' },
  centerCol: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  centerText: { fontSize: 16, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  currentTag: { backgroundColor: Colors.terra500, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  currentTagText: { fontSize: 8, fontFamily: 'DMSans-Bold', color: '#fff', letterSpacing: 0.3 },

  // Detail
  detail: { borderTopWidth: 1, borderTopColor: Colors.warm100, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12 },
  detailColumns: { flexDirection: 'row' as const },
  detailCol: { flex: 1, gap: 6 },
  detailColDivider: { width: 1, backgroundColor: Colors.warm100, marginHorizontal: 10 },
  alonPill: { backgroundColor: Colors.navy800, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' as const },
  alonPillText: { fontSize: 8, fontFamily: 'DMSans-Bold', color: Colors.activationGlow, letterSpacing: 0.4 },
  youPill: { backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' as const },
  youPillText: { fontSize: 8, fontFamily: 'DMSans-Bold', color: Colors.terra500, letterSpacing: 0.4 },
  detailText: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textSecondary, lineHeight: 16 },
  // CTA section
  ctaSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.warm100, paddingTop: 10 },
  ctaInfo: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, lineHeight: 17, marginBottom: 10, textAlign: 'center' },
  dualCta: { flexDirection: 'row' as const, gap: 8 },
  ctaButtonSecondary: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' as const, borderWidth: 1.5, borderColor: Colors.warm200, backgroundColor: Colors.white },
  ctaButtonSecondaryText: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  ctaButton: { flex: 1, backgroundColor: Colors.terra500, paddingVertical: 12, borderRadius: 10, alignItems: 'center' as const },
  ctaButtonText: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: '#fff' },
});
