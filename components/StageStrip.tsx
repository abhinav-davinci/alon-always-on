import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';
import { STAGES } from '../constants/stages';
import { useOnboardingStore } from '../store/onboarding';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { useHaptics } from '../hooks/useHaptics';

const SPRING = { damping: 20, stiffness: 260, mass: 0.6 };
const PAD_H = 16;
const PAD_H_COMPACT = 12;
const PAD_V = 8;
const PAD_V_COMPACT = 6;
const BUBBLE_OVERSHOOT = 6;

interface StageStripProps {
  compact?: boolean;
}

export default function StageStrip({ compact = false }: StageStripProps) {
  const haptics = useHaptics();
  const {
    activeStage, setActiveStage, likedPropertyIds, scheduledVisits,
    cibilScore, cibilSkipped, monthlyIncome, negotiatePropertyId,
    legalAnalysisDone,
  } = useOnboardingStore();
  const activeIndex = STAGES.findIndex((s) => s.label === activeStage);

  const hasFinanceActivity = cibilScore !== null || cibilSkipped || monthlyIncome > 0;

  // Non-numeric "has activity" indicator — used for stages where count doesn't apply (e.g. Finance, Negotiate)
  const hasActivity = (label: string): boolean => {
    if (label === 'Finance') return hasFinanceActivity;
    if (label === 'Negotiate') return negotiatePropertyId !== null;
    if (label === 'Legal') return legalAnalysisDone;
    return false;
  };

  const scrollRef = useRef<ScrollView>(null);
  const containerWidth = useRef(0);
  const pillLayouts = useRef<{ x: number; width: number }[]>([]);
  const bubbleX = useSharedValue(0);
  const bubbleW = useSharedValue(80);
  const measured = useRef(0);
  const padH = compact ? PAD_H_COMPACT : PAD_H;

  const getBadge = (label: string): number | null => {
    if (label === 'Search') return SHORTLIST_PROPERTIES.length;
    if (label === 'Shortlist') return likedPropertyIds.length || null;
    if (label === 'Site Visits') return scheduledVisits.length || null;
    return null;
  };

  const scrollToCenter = useCallback((index: number) => {
    const layout = pillLayouts.current[index];
    if (!layout || !scrollRef.current || !containerWidth.current) return;
    // Center the pill in the visible area
    const pillCenter = layout.x + padH + layout.width / 2;
    const scrollTarget = pillCenter - containerWidth.current / 2;
    scrollRef.current.scrollTo({ x: Math.max(0, scrollTarget), animated: true });
  }, [padH]);

  const snapBubbleTo = useCallback((index: number) => {
    const layout = pillLayouts.current[index];
    if (layout) {
      bubbleX.value = withSpring(layout.x + padH - BUBBLE_OVERSHOOT, SPRING);
      bubbleW.value = withSpring(layout.width + BUBBLE_OVERSHOOT * 2, SPRING);
    }
  }, [padH]);

  React.useEffect(() => {
    if (measured.current >= STAGES.length) {
      snapBubbleTo(activeIndex);
      scrollToCenter(activeIndex);
    }
  }, [activeIndex]);

  const onPillLayout = useCallback((index: number, x: number, width: number) => {
    const prev = pillLayouts.current[index];
    pillLayouts.current[index] = { x, width };

    if (measured.current < STAGES.length) {
      measured.current++;
      if (measured.current === STAGES.length) {
        const active = pillLayouts.current[activeIndex];
        if (active) {
          bubbleX.value = active.x + padH - BUBBLE_OVERSHOOT;
          bubbleW.value = active.width + BUBBLE_OVERSHOOT * 2;
        }
        scrollToCenter(activeIndex);
      }
    } else if (index === activeIndex || (prev && (prev.x !== x || prev.width !== width))) {
      // Re-snap bubble when any pill layout changes (badge added/removed shifts positions)
      snapBubbleTo(activeIndex);
    }
  }, [activeIndex, padH, scrollToCenter, snapBubbleTo]);

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    containerWidth.current = e.nativeEvent.layout.width;
  }, []);

  const selectStage = useCallback((index: number) => {
    const label = STAGES[index]?.label;
    if (label && index !== activeIndex) {
      haptics.selection();
      setActiveStage(label);
    }
  }, [activeIndex]);

  const pillHeight = compact ? 30 : 34;
  const bubbleTop = (compact ? PAD_V_COMPACT : PAD_V) - BUBBLE_OVERSHOOT;

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bubbleX.value }],
    width: bubbleW.value,
  }));

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={onContainerLayout}
    >
      <View style={[styles.container, compact && styles.containerCompact]}>
        {/* Glass bubble */}
        <Animated.View
          style={[
            styles.bubble,
            {
              height: pillHeight + BUBBLE_OVERSHOOT * 2,
              borderRadius: (pillHeight + BUBBLE_OVERSHOOT * 2) / 2,
              top: bubbleTop,
            },
            bubbleStyle,
          ]}
        />

        {/* Pills */}
        <View style={styles.pillRow}>
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const badge = getBadge(stage.label);
            const isActive = activeIndex === i;
            const hasBadge = badge != null && badge > 0;
            const showActivityDot = !hasBadge && hasActivity(stage.label);

            return (
              <Pressable
                key={stage.label}
                onPress={() => selectStage(i)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  onPillLayout(i, x, width);
                }}
              >
                <View style={[styles.pill, { height: pillHeight }, compact && styles.pillCompact]}>
                  <Icon
                    size={compact ? 10 : 12}
                    color={isActive ? Colors.terra500 : Colors.warm400}
                    strokeWidth={isActive ? 2.2 : 1.5}
                  />
                  <Text
                    style={[
                      styles.pillText,
                      compact && styles.pillTextCompact,
                      isActive && styles.pillTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {stage.label}
                  </Text>
                  {hasBadge && (
                    <View style={[styles.badge, isActive && styles.badgeActive]}>
                      <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                        {badge}
                      </Text>
                    </View>
                  )}
                  {showActivityDot && <View style={styles.activityDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: PAD_V,
    paddingHorizontal: PAD_H,
    position: 'relative',
  },
  containerCompact: {
    paddingVertical: PAD_V_COMPACT,
    paddingHorizontal: PAD_H_COMPACT,
  },

  bubble: {
    position: 'absolute',
    left: 0,
    backgroundColor: '#fff',
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(217, 95, 43, 0.12)',
  },

  pillRow: {
    flexDirection: 'row',
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  pillCompact: {
    paddingHorizontal: 10,
    gap: 3,
  },

  pillText: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.warm400,
  },
  pillTextCompact: {
    fontSize: 10,
  },
  pillTextActive: {
    color: Colors.terra500,
    fontFamily: 'DMSans-SemiBold',
  },

  badge: {
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: Colors.warm200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeActive: {
    backgroundColor: Colors.terra100,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'DMSans-Bold',
    color: Colors.textTertiary,
  },
  badgeTextActive: {
    color: Colors.terra600,
  },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.terra500,
  },
});
