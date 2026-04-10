import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';
import { useOnboardingStore } from '../store/onboarding';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { STAGES } from '../constants/stages';
import StageStrip from './StageStrip';
import { getInterestRate, calculateEligibility, formatINRShort } from '../utils/financeCalc';

interface JourneyAccordionProps {
  onStageChange?: (stage: string) => void;
}

export default function JourneyAccordion({ onStageChange }: JourneyAccordionProps) {
  const haptics = useHaptics();
  const {
    scheduledVisits, likedPropertyIds, activeStage, setActiveStage,
    cibilScore, cibilSkipped, monthlyIncome, existingEMIs,
  } = useOnboardingStore();
  const [expanded, setExpanded] = useState(false);
  const activeIndex = STAGES.findIndex((s) => s.label === activeStage);

  // Dynamically update stages based on user actions
  const likedNames = React.useMemo(
    () => SHORTLIST_PROPERTIES.filter((p) => likedPropertyIds.includes(p.id)).map((p) => p.name),
    [likedPropertyIds]
  );

  // Finance activity signal — any engagement with the Finance step
  const hasFinanceActivity = cibilScore !== null || cibilSkipped || monthlyIncome > 0;

  const financeStatusText = React.useMemo(() => {
    if (!hasFinanceActivity) return null;
    const effectiveCibil = cibilScore ?? 750; // estimate when skipped
    const rate = getInterestRate(effectiveCibil);
    const cibilLabel = cibilScore ? `CIBIL ${cibilScore}` : 'CIBIL ~750';

    // Full data: CIBIL + income → show eligibility
    if (monthlyIncome > 0) {
      const result = calculateEligibility(monthlyIncome, existingEMIs || 0, cibilScore);
      return `${cibilLabel} · ${formatINRShort(result.maxLoanAmount)} eligible · ${rate.toFixed(1)}%`;
    }
    // CIBIL only — show rate, nudge for income
    return `${cibilLabel} · Rate ~${rate.toFixed(1)}% · Add income for eligibility`;
  }, [hasFinanceActivity, cibilScore, cibilSkipped, monthlyIncome, existingEMIs]);

  const stages = React.useMemo(() => {
    return STAGES.map((stage) => {
      if (stage.label === 'Shortlist' && likedPropertyIds.length > 0) {
        return {
          ...stage,
          status: 'active' as const,
          alonTask: `${likedPropertyIds.length} shortlisted — ${likedNames.join(', ')}`,
        };
      }
      if (stage.label === 'Site Visits' && scheduledVisits.length > 0) {
        const names = scheduledVisits.map((v) => v.propertyName).join(', ');
        return {
          ...stage,
          status: 'active' as const,
          alonTask: `${scheduledVisits.length} visit${scheduledVisits.length > 1 ? 's' : ''} scheduled — ${names}`,
        };
      }
      if (stage.label === 'Finance' && hasFinanceActivity && financeStatusText) {
        return {
          ...stage,
          status: 'active' as const,
          alonTask: financeStatusText,
        };
      }
      return stage;
    });
  }, [scheduledVisits, likedPropertyIds, likedNames, hasFinanceActivity, financeStatusText]);


  // Pulsing dot for detail subtitle
  const pulseOpacity = useSharedValue(1);
  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const getBadge = (label: string): number | null => {
    if (label === 'Search') return SHORTLIST_PROPERTIES.length;
    if (label === 'Shortlist') return likedPropertyIds.length || null;
    if (label === 'Site Visits') return scheduledVisits.length || null;
    return null;
  };

  const hasActivity = (label: string): boolean => {
    if (label === 'Search') return true;
    if (label === 'Shortlist') return likedPropertyIds.length > 0;
    if (label === 'Site Visits') return scheduledVisits.length > 0;
    return false;
  };

  const selectStage = useCallback((index: number) => {
    haptics.selection();
    setActiveStage(stages[index].label);
    onStageChange?.(stages[index].label);
  }, [stages]);

  // ── Vertical drag in accordion ──
  const rowPositions = useRef<number[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const lastTickIdx = useRef(activeIndex);

  const onRowLayout = useCallback((index: number, y: number) => {
    rowPositions.current[index] = y;
  }, []);

  const findNearestIndex = useCallback((translationY: number): number => {
    // Use direction + distance to determine target
    const direction = translationY > 0 ? 1 : -1;
    const steps = Math.round(Math.abs(translationY) / 44); // ~44px per row avg
    const newIdx = activeIndex + direction * Math.max(steps, 0);
    return Math.max(0, Math.min(newIdx, STAGES.length - 1));
  }, [activeIndex]);

  const onDragTick = useCallback((idx: number) => {
    if (idx !== lastTickIdx.current && idx >= 0 && idx < STAGES.length) {
      lastTickIdx.current = idx;
      haptics.light();
      setDragOverIndex(idx);
    }
  }, []);

  const onDragEndJS = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, STAGES.length - 1));
    setDragOverIndex(null);
    selectStage(clamped);
    lastTickIdx.current = clamped;
  }, [selectStage]);

  const accordionPanGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-15, 15])
    .onUpdate((e) => {
      const idx = findNearestIndex(e.translationY);
      runOnJS(onDragTick)(idx);
    })
    .onEnd((e) => {
      const idx = findNearestIndex(e.translationY);
      runOnJS(onDragEndJS)(idx);
    })
    .runOnJS(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => { setExpanded(!expanded); haptics.light(); }}
        activeOpacity={0.7}
      >
        <Text style={styles.headerTitle}>Your property journey</Text>
        <View style={styles.headerRight}>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              {stages.length} steps
            </Text>
          </View>
          {expanded ? (
            <ChevronUp size={16} color={Colors.textTertiary} strokeWidth={2} />
          ) : (
            <ChevronDown size={16} color={Colors.textTertiary} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>

      {/* ── Collapsed: Fluid stage strip with glass bubble ── */}
      {!expanded && (
        <View style={styles.stripContainer}>
          <StageStrip compact />
          {/* Active stage detail */}
          <View style={styles.stageDetail}>
            <Animated.View style={[styles.scanningDot, pulseStyle]} />
            <Text style={styles.detailText} numberOfLines={2}>
              {stages[activeIndex >= 0 ? activeIndex : 0].alonTask}
            </Text>
          </View>
        </View>
      )}

      {/* ── Expanded: Full accordion with vertical drag ── */}
      {expanded && (
        <GestureDetector gesture={accordionPanGesture}>
          <View>
            <ScrollView style={styles.accordionScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <View style={styles.accordion}>
                {stages.map((stage, i) => {
                  const Icon = stage.icon;
                  const isSelected = activeIndex === i;
                  const isDone = stage.status === 'done';
                  const isStageActive = stage.status === 'active';
                  const isDragOver = dragOverIndex === i;

                  return (
                    <View key={stage.label}>
                      <TouchableOpacity
                        style={[
                          styles.stageRow,
                          isSelected && styles.stageRowSelected,
                          isDragOver && !isSelected && styles.stageRowDragOver,
                        ]}
                        onPress={() => selectStage(i)}
                        activeOpacity={0.7}
                      >
                        {i < stages.length - 1 && (
                          <View style={styles.connector} />
                        )}

                        <View style={[
                          styles.dot,
                          isStageActive && styles.dotActive,
                          isDone && styles.dotDone,
                          isSelected && !isDone && !isStageActive && styles.dotSelected,
                          (isSelected || isDragOver) && styles.dotGlow,
                          isDragOver && !isSelected && !isDone && !isStageActive && styles.dotDragOver,
                        ]}>
                          {isDone ? (
                            <CheckCircle2 size={10} color="#fff" strokeWidth={2.5} />
                          ) : (
                            <Icon size={11} color={isStageActive || isSelected || isDragOver ? '#fff' : Colors.warm400} strokeWidth={1.8} />
                          )}
                        </View>

                        <Text style={[
                          styles.stageLabel,
                          isSelected && styles.stageLabelSelected,
                          isDragOver && !isSelected && styles.stageLabelDragOver,
                          isDone && styles.stageLabelDone,
                        ]}>
                          {stage.label}
                        </Text>

                        {isStageActive && !isSelected && (
                          <View style={styles.activityDot} />
                        )}
                        {isDone && <Text style={styles.doneText}>Done</Text>}
                      </TouchableOpacity>

                      {isSelected && (
                        <Animated.View style={styles.accordionDetail} entering={FadeIn.duration(200)}>
                          <Animated.View style={[styles.scanningDot, isStageActive && pulseStyle]} />
                          <Text style={styles.detailText}>{stage.alonTask}</Text>
                        </Animated.View>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.sm,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerTitle: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressPill: { backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  progressText: { fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.terra500 },

  // Strip container with tinted background
  stripContainer: {
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
    marginHorizontal: -4,
  },

  // Active stage detail line below strip
  stageDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.warm200,
  },
  scanningDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.terra500 },
  detailText: { flex: 1, fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, lineHeight: 15 },

  // ── Accordion (expanded) ──
  accordionScroll: { maxHeight: 300 },
  accordion: {
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, overflow: 'hidden',
    position: 'relative',
  },
  stageRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, position: 'relative',
  },
  stageRowSelected: { backgroundColor: Colors.cream },
  stageRowDragOver: { backgroundColor: Colors.terra50 },

  connector: {
    position: 'absolute', left: 24, top: 32, width: 1, height: 16,
    backgroundColor: Colors.warm200,
  },

  dot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.warm100, borderWidth: 1, borderColor: Colors.warm200,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: Colors.terra500, borderColor: Colors.terra500 },
  dotDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  dotSelected: { backgroundColor: Colors.navy800, borderColor: Colors.navy800 },
  dotDragOver: { backgroundColor: Colors.terra400, borderColor: Colors.terra400 },
  dotGlow: {
    shadowColor: Colors.terra500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  stageLabel: { flex: 1, fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  stageLabelSelected: { fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  stageLabelDragOver: { fontFamily: 'DMSans-Medium', color: Colors.terra600 },
  stageLabelDone: { color: Colors.textSecondary },
  activityDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.terra500,
  },
  doneText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: '#22C55E' },

  accordionDetail: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingBottom: 10, paddingLeft: 46,
    backgroundColor: Colors.cream,
  },
});
