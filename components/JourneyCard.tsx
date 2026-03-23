import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Search,
  ListChecks,
  MapPin,
  GitCompare,
  Landmark,
  Scale,
  Handshake,
  Key,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const CENTER_OFFSET = ITEM_HEIGHT * 2; // padding to center first/last item

interface Stage {
  num: number;
  label: string;
  icon: typeof Search;
  status: 'done' | 'active' | 'pending';
  alonDoes: string;
  youDo: string;
}

const STAGES: Stage[] = [
  { num: 1, label: 'Search', icon: Search, status: 'active',
    alonDoes: 'Scanning 12L+ listings filtered by RERA, builder trust & price history',
    youDo: 'Set criteria & preferred areas — done' },
  { num: 2, label: 'Shortlist', icon: ListChecks, status: 'pending',
    alonDoes: 'Curates top 5 with price-vs-market comparison & track record',
    youDo: 'Pick your top 2-3 favorites' },
  { num: 3, label: 'Site Visits', icon: MapPin, status: 'pending',
    alonDoes: 'Books visits with your number hidden + inspection checklist',
    youDo: 'Share your available time slots' },
  { num: 4, label: 'Compare', icon: GitCompare, status: 'pending',
    alonDoes: 'Side-by-side view with real transaction data, not listed prices',
    youDo: 'Make the final call — always yours' },
  { num: 5, label: 'Finance', icon: Landmark, status: 'pending',
    alonDoes: 'Compares loan offers from 10+ banks, finds best rates',
    youDo: 'Share basic income details for pre-approval' },
  { num: 6, label: 'Legal', icon: Scale, status: 'pending',
    alonDoes: 'Flags risky clauses, verifies title & RERA compliance',
    youDo: 'Upload the draft agreement when received' },
  { num: 7, label: 'Negotiate', icon: Handshake, status: 'pending',
    alonDoes: 'Finds your leverage from comparable sales data',
    youDo: "Negotiate price using ALON's market insights" },
  { num: 8, label: 'Possession', icon: Key, status: 'pending',
    alonDoes: 'Complete checklist — documents, inspections, meter transfers',
    youDo: 'Inspect, accept & collect your keys' },
];

// Individual wheel item with animated transforms
function WheelItem({ stage, index, scrollY, onPress }: {
  stage: Stage;
  index: number;
  scrollY: any;
  onPress: () => void;
}) {
  const isDone = stage.status === 'done';
  const isActive = stage.status === 'active';

  const animStyle = useAnimatedStyle(() => {
    const center = scrollY.value;
    const itemCenter = index * ITEM_HEIGHT;
    const distance = Math.abs(center - itemCenter);
    const normalizedDist = distance / ITEM_HEIGHT;

    // Scale: 1 at center, 0.88 at ±1, 0.78 at ±2
    const scale = interpolate(
      normalizedDist,
      [0, 1, 2],
      [1, 0.9, 0.8],
      Extrapolation.CLAMP
    );

    // Opacity: 1 at center, 0.35 at ±1, 0.12 at ±2
    const opacity = interpolate(
      normalizedDist,
      [0, 1, 2, 3],
      [1, 0.4, 0.15, 0.05],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const isSelectedStyle = useAnimatedStyle(() => {
    const center = scrollY.value;
    const itemCenter = index * ITEM_HEIGHT;
    const distance = Math.abs(center - itemCenter);
    // 1 when selected (distance < half item), 0 otherwise
    const isSelected = distance < ITEM_HEIGHT * 0.5 ? 1 : 0;
    return {
      backgroundColor: isSelected ? Colors.terra500 : (isActive ? Colors.terra300 : Colors.warm100),
    };
  });

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Animated.View style={[styles.wheelItem, animStyle]}>
        <Animated.View style={[styles.numDot, isSelectedStyle]}>
          {isDone ? (
            <CheckCircle2 size={11} color="#fff" strokeWidth={2.5} />
          ) : (
            <Text style={styles.numText}>{stage.num}</Text>
          )}
        </Animated.View>
        <Text style={styles.wheelLabel}>{stage.label}</Text>
        {isActive && (
          <View style={styles.nowIndicator}>
            <View style={styles.nowPulse} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function JourneyCard() {
  const haptics = useHaptics();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [selected, setSelected] = useState(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(STAGES.length - 1, index));
    setSelected(clamped);
    haptics.selection();
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    setSelected(index);
    haptics.selection();
  }, []);

  const stage = STAGES[selected];

  return (
    <View style={styles.outer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your property journey</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>{selected + 1} of 8</Text>
        </View>
      </View>

      <View style={styles.card}>
        {/* ── Wheel ── */}
        <View style={styles.wheelWrap}>
          {/* Aperture lines — two thin lines marking the selection zone */}
          <View style={[styles.apertureLine, { top: CENTER_OFFSET - 1 }]} />
          <View style={[styles.apertureLine, { top: CENTER_OFFSET + ITEM_HEIGHT }]} />

          {/* Terra accent on left of selection zone */}
          <View style={styles.selectionAccent} />

          {/* Top fade mask */}
          <View style={styles.fadeTop} pointerEvents="none">
            <View style={[styles.fadeBand, { opacity: 0.95 }]} />
            <View style={[styles.fadeBand, { opacity: 0.6 }]} />
            <View style={[styles.fadeBand, { opacity: 0.2 }]} />
          </View>

          {/* Bottom fade mask */}
          <View style={styles.fadeBottom} pointerEvents="none">
            <View style={[styles.fadeBand, { opacity: 0.2 }]} />
            <View style={[styles.fadeBand, { opacity: 0.6 }]} />
            <View style={[styles.fadeBand, { opacity: 0.95 }]} />
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
            contentContainerStyle={{
              paddingTop: CENTER_OFFSET,
              paddingBottom: CENTER_OFFSET,
            }}
          >
            {STAGES.map((s, i) => (
              <WheelItem
                key={s.num}
                stage={s}
                index={i}
                scrollY={scrollY}
                onPress={() => scrollToIndex(i)}
              />
            ))}
          </Animated.ScrollView>
        </View>

        {/* ── Detail ── */}
        <Animated.View
          key={stage.num}
          style={styles.detail}
          entering={FadeInUp.duration(200).springify().damping(18)}
        >
          <View style={styles.roleBlock}>
            <View style={styles.alonPill}>
              <Text style={styles.alonPillText}>ALON</Text>
            </View>
            <Text style={styles.roleText}>{stage.alonDoes}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.roleBlock}>
            <View style={styles.youPill}>
              <Text style={styles.youPillText}>YOUR PART</Text>
            </View>
            <Text style={styles.roleText}>{stage.youDo}</Text>
          </View>

          <Text style={styles.nextHint}>
            {selected < 7
              ? `Next: ${STAGES[selected + 1].label} \u2192`
              : 'The final step — your new home awaits'}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  counter: {
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  counterText: {
    fontSize: 11,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.terra500,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },

  // Wheel
  wheelWrap: {
    position: 'relative',
    overflow: 'hidden',
  },

  // Two thin aperture lines
  apertureLine: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: Colors.warm200,
    zIndex: 5,
  },

  // Terra left accent in selection zone
  selectionAccent: {
    position: 'absolute',
    top: CENTER_OFFSET + 6,
    left: 14,
    width: 3,
    height: ITEM_HEIGHT - 12,
    backgroundColor: Colors.terra500,
    borderRadius: 2,
    zIndex: 6,
  },

  // Edge fade masks (white → transparent)
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CENTER_OFFSET - 4,
    zIndex: 4,
    justifyContent: 'flex-start',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CENTER_OFFSET - 4,
    zIndex: 4,
    justifyContent: 'flex-end',
  },
  fadeBand: {
    height: (CENTER_OFFSET - 4) / 3,
    backgroundColor: '#fff',
  },

  // Wheel items
  wheelItem: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    gap: 12,
  },
  numDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontSize: 11,
    fontFamily: 'DMSans-SemiBold',
    color: '#fff',
  },
  wheelLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  nowIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.terra500,
  },

  // Detail
  detail: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
    padding: 14,
  },
  roleBlock: {
    gap: 6,
  },
  alonPill: {
    backgroundColor: Colors.navy800,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  alonPillText: {
    fontSize: 9,
    fontFamily: 'DMSans-Bold',
    color: Colors.activationGlow,
    letterSpacing: 0.5,
  },
  youPill: {
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  youPillText: {
    fontSize: 9,
    fontFamily: 'DMSans-Bold',
    color: Colors.terra500,
    letterSpacing: 0.5,
  },
  roleText: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.warm100,
    marginVertical: 10,
  },
  nextHint: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
  },
});
