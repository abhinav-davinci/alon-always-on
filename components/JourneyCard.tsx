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
} from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const CENTER_OFFSET = ITEM_HEIGHT * 2;

interface Stage {
  num: number;
  label: string;
  status: 'done' | 'active' | 'pending';
  alonDoes: string;
  youDo: string;
}

const STAGES: Stage[] = [
  { num: 1, label: 'Search', status: 'active',
    alonDoes: 'Scanning 12L+ listings filtered by RERA, builder trust & price history',
    youDo: 'Set criteria & preferred areas — done' },
  { num: 2, label: 'Shortlist', status: 'pending',
    alonDoes: 'Curates top 5 with price-vs-market comparison & track record',
    youDo: 'Pick your top 2-3 favorites' },
  { num: 3, label: 'Site Visits', status: 'pending',
    alonDoes: 'Books visits with your number hidden + inspection checklist',
    youDo: 'Share your available time slots' },
  { num: 4, label: 'Compare', status: 'pending',
    alonDoes: 'Side-by-side view with real transaction data, not listed prices',
    youDo: 'Make the final call — always yours' },
  { num: 5, label: 'Finance', status: 'pending',
    alonDoes: 'Compares loan offers from 10+ banks, finds best rates',
    youDo: 'Share basic income details for pre-approval' },
  { num: 6, label: 'Legal', status: 'pending',
    alonDoes: 'Flags risky clauses, verifies title & RERA compliance',
    youDo: 'Upload the draft agreement when received' },
  { num: 7, label: 'Negotiate', status: 'pending',
    alonDoes: 'Finds your leverage from comparable sales data',
    youDo: "Negotiate price using ALON's market insights" },
  { num: 8, label: 'Possession', status: 'pending',
    alonDoes: 'Complete checklist — documents, inspections, meter transfers',
    youDo: 'Inspect, accept & collect your keys' },
];

// Individual wheel item with 3D cylinder transforms
function WheelItem({ stage, index, scrollY, onPress }: {
  stage: Stage;
  index: number;
  scrollY: any;
  onPress: () => void;
}) {
  const animStyle = useAnimatedStyle(() => {
    const center = scrollY.value;
    const itemCenter = index * ITEM_HEIGHT;
    const distance = (center - itemCenter) / ITEM_HEIGHT; // signed: negative = above, positive = below

    // 3D rotation — items tilt away like on a cylinder
    const rotateX = interpolate(
      distance,
      [-3, -2, -1, 0, 1, 2, 3],
      [60, 45, 22, 0, -22, -45, -60],
      Extrapolation.CLAMP
    );

    // Scale — slight reduction as items move away
    const scale = interpolate(
      Math.abs(distance),
      [0, 1, 2, 3],
      [1, 0.97, 0.93, 0.88],
      Extrapolation.CLAMP
    );

    // Opacity — smooth fade
    const opacity = interpolate(
      Math.abs(distance),
      [0, 1, 2, 3],
      [1, 0.5, 0.2, 0.05],
      Extrapolation.CLAMP
    );

    // Vertical compression — items compress toward center as they rotate
    const translateY = interpolate(
      distance,
      [-3, -2, -1, 0, 1, 2, 3],
      [-8, -5, -2, 0, 2, 5, 8],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { perspective: 800 },
        { rotateX: `${rotateX}deg` },
        { scale },
        { translateY },
      ],
    };
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[styles.wheelItem, animStyle]}>
        <Text style={styles.wheelText}>{stage.label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function JourneyCard() {
  const haptics = useHaptics();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [selected, setSelected] = useState(0);
  const scrollY = useSharedValue(0);
  const lastIndex = useRef(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(STAGES.length - 1, index));
    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      haptics.selection();
    }
    setSelected(clamped);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    setSelected(index);
    haptics.selection();
    lastIndex.current = index;
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
        <View style={styles.wheelContainer}>
          {/* Selection highlight — cream filled rounded rect (Apple-style) */}
          <View style={styles.selectionRect} />

          {/* Top edge fade */}
          <View style={styles.fadeTop} pointerEvents="none">
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.97 }]} />
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.7 }]} />
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.3 }]} />
            <View style={[styles.fadeBand, { flex: 1, opacity: 0 }]} />
          </View>

          {/* Bottom edge fade */}
          <View style={styles.fadeBottom} pointerEvents="none">
            <View style={[styles.fadeBand, { flex: 1, opacity: 0 }]} />
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.3 }]} />
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.7 }]} />
            <View style={[styles.fadeBand, { flex: 1, opacity: 0.97 }]} />
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
          entering={FadeIn.duration(180)}
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
              : 'The final step \u2014 your new home awaits'}
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

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },

  // Wheel
  wheelContainer: {
    position: 'relative',
    overflow: 'hidden',
  },

  // Apple-style selection highlight — filled rect, no lines
  selectionRect: {
    position: 'absolute',
    top: CENTER_OFFSET,
    left: 10,
    right: 10,
    height: ITEM_HEIGHT,
    backgroundColor: Colors.cream,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warm200,
    zIndex: 0,
  },

  // Edge fade masks
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CENTER_OFFSET,
    zIndex: 4,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CENTER_OFFSET,
    zIndex: 4,
  },
  fadeBand: {
    backgroundColor: '#fff',
  },

  // Wheel items — text only, no circles
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  wheelText: {
    fontSize: 18,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Detail
  detail: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
    padding: 14,
  },
  roleBlock: {
    gap: 5,
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
