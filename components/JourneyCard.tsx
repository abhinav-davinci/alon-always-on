import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
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
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

const ITEM_HEIGHT = 46;
const VISIBLE_COUNT = 3;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

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
    youDo: 'Set criteria & areas — done ✓' },
  { num: 2, label: 'Shortlist', icon: ListChecks, status: 'pending',
    alonDoes: 'Curates top 5 with price-vs-market comparison & track record',
    youDo: 'Pick your top 2–3 favorites' },
  { num: 3, label: 'Site Visits', icon: MapPin, status: 'pending',
    alonDoes: 'Books visits with your number hidden + inspection checklist',
    youDo: 'Share your available time slots' },
  { num: 4, label: 'Compare', icon: GitCompare, status: 'pending',
    alonDoes: 'Side-by-side view with real transaction data, not listed prices',
    youDo: 'Make the final call — always yours' },
  { num: 5, label: 'Finance', icon: Landmark, status: 'pending',
    alonDoes: 'Compares loan offers from 10+ banks, finds best rates',
    youDo: 'Share basic income details' },
  { num: 6, label: 'Legal', icon: Scale, status: 'pending',
    alonDoes: 'Flags risky clauses, verifies title & RERA compliance',
    youDo: 'Upload the draft agreement' },
  { num: 7, label: 'Negotiate', icon: Handshake, status: 'pending',
    alonDoes: 'Finds your leverage from comparable sales data',
    youDo: "Negotiate using ALON's insights" },
  { num: 8, label: 'Possession', icon: Key, status: 'pending',
    alonDoes: 'Complete checklist — documents, inspections, transfers',
    youDo: 'Inspect, accept & get your keys 🏡' },
];

export default function JourneyCard() {
  const haptics = useHaptics();
  const scrollRef = useRef<ScrollView>(null);
  const [selected, setSelected] = useState(0);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(STAGES.length - 1, index));
    setSelected(clamped);
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
    haptics.selection();
  }, []);

  const stage = STAGES[selected];
  const Icon = stage.icon;

  return (
    <View style={styles.outer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your property journey</Text>
        <View style={styles.counter}>
          <Text style={styles.counterText}>{selected + 1} of 8</Text>
        </View>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Wheel area */}
        <View style={styles.wheelWrap}>
          {/* Selection highlight — cream bg with terra left border */}
          <View style={styles.selectionBar}>
            <View style={styles.selectionAccent} />
          </View>

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onMomentumScrollEnd={handleMomentumEnd}
            style={{ height: WHEEL_HEIGHT }}
            contentContainerStyle={{
              paddingTop: ITEM_HEIGHT, // 1 item above center
              paddingBottom: ITEM_HEIGHT, // 1 item below center
            }}
          >
            {STAGES.map((s, i) => {
              const isSelected = i === selected;
              const isDone = s.status === 'done';
              const isActive = s.status === 'active';

              return (
                <TouchableOpacity
                  key={s.num}
                  style={styles.wheelItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
                    setSelected(i);
                    haptics.selection();
                  }}
                >
                  <View style={[
                    styles.numDot,
                    isSelected && styles.numDotSelected,
                    isDone && styles.numDotDone,
                    isActive && !isSelected && styles.numDotActive,
                  ]}>
                    {isDone ? (
                      <CheckCircle2 size={11} color="#fff" strokeWidth={2.5} />
                    ) : (
                      <Text style={[styles.numText, (isSelected || isActive) && styles.numTextLight]}>{s.num}</Text>
                    )}
                  </View>

                  <Text style={[
                    styles.label,
                    isSelected && styles.labelSelected,
                  ]}>{s.label}</Text>

                  {isActive && isSelected && (
                    <View style={styles.nowBadge}>
                      <View style={styles.nowPulse} />
                      <Text style={styles.nowText}>Now</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Detail — vertically stacked, no redundant header */}
        <Animated.View key={stage.num} style={styles.detail} entering={FadeIn.duration(180)}>
          {/* ALON does */}
          <View style={styles.roleBlock}>
            <View style={styles.alonPill}>
              <Text style={styles.alonPillText}>ALON</Text>
            </View>
            <Text style={styles.roleText}>{stage.alonDoes}</Text>
          </View>

          {/* Dashed divider */}
          <View style={styles.dashedLine} />

          {/* Your part */}
          <View style={styles.roleBlock}>
            <View style={styles.youPill}>
              <Text style={styles.youPillText}>YOUR PART</Text>
            </View>
            <Text style={styles.roleText}>{stage.youDo}</Text>
          </View>

          {/* Next hint */}
          <Text style={styles.nextHint}>
            {selected < 7
              ? `Next: ${STAGES[selected + 1].label} →`
              : 'The final step — your new home awaits 🏡'}
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
  wheelWrap: {
    position: 'relative',
  },
  selectionBar: {
    position: 'absolute',
    top: ITEM_HEIGHT, // 1 item from top = center
    left: 8,
    right: 8,
    height: ITEM_HEIGHT,
    backgroundColor: Colors.terra50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.terra200,
    zIndex: 0,
    flexDirection: 'row',
  },
  selectionAccent: {
    width: 3,
    backgroundColor: Colors.terra500,
    borderRadius: 2,
    marginVertical: 8,
    marginLeft: 2,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
    zIndex: 1,
  },
  numDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.warm100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numDotSelected: {
    backgroundColor: Colors.terra500,
  },
  numDotDone: {
    backgroundColor: '#22C55E',
  },
  numDotActive: {
    backgroundColor: Colors.terra300,
  },
  numText: {
    fontSize: 11,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.warm400,
  },
  numTextLight: {
    color: '#fff',
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  labelSelected: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nowPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.terra500,
  },
  nowText: {
    fontSize: 10,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.terra500,
  },

  // Detail
  detail: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
    padding: 14,
    gap: 0,
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
  dashedLine: {
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
