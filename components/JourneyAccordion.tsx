import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';
import { useOnboardingStore } from '../store/onboarding';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { STAGES } from '../constants/stages';

interface JourneyAccordionProps {
  onStageChange?: (stage: string) => void;
}

export default function JourneyAccordion({ onStageChange }: JourneyAccordionProps) {
  const haptics = useHaptics();
  const { scheduledVisits, likedPropertyIds } = useOnboardingStore();
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(true);

  // Dynamically update stages based on user actions
  const likedNames = React.useMemo(
    () => SHORTLIST_PROPERTIES.filter((p) => likedPropertyIds.includes(p.id)).map((p) => p.name),
    [likedPropertyIds]
  );

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
      return stage;
    });
  }, [scheduledVisits, likedPropertyIds, likedNames]);

  // Pulsing dot for active scanning
  const pulseOpacity = useSharedValue(1);
  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1, true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const toggleStage = (index: number) => {
    haptics.selection();
    setExpandedIndex(index);
    onStageChange?.(stages[index].label);
  };

  return (
    <View style={styles.container}>
      {/* Header with collapse toggle */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => { setCollapsed(!collapsed); haptics.light(); }}
        activeOpacity={0.7}
      >
        <Text style={styles.headerTitle}>Your property journey</Text>
        <View style={styles.headerRight}>
          <View style={styles.progressPill}>
            <Text style={styles.progressText}>
              {stages.filter(s => s.status === 'done').length + 1} of {stages.length}
            </Text>
          </View>
          {collapsed ? (
            <ChevronDown size={16} color={Colors.textTertiary} strokeWidth={2} />
          ) : (
            <ChevronUp size={16} color={Colors.textTertiary} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>

      {/* Collapsed state — compact current stage with live status */}
      {collapsed && (
        <TouchableOpacity
          style={styles.collapsedRow}
          onPress={() => { setCollapsed(false); haptics.light(); }}
          activeOpacity={0.7}
        >
          <View style={styles.collapsedLeft}>
            {(() => { const Icon = stages[expandedIndex].icon; return (
              <View style={[styles.dot, styles.dotActive]}>
                <Icon size={11} color="#fff" strokeWidth={1.8} />
              </View>
            ); })()}
            <View style={styles.collapsedInfo}>
              <Text style={styles.collapsedLabel}>
                {stages[expandedIndex].num}. {stages[expandedIndex].label}
              </Text>
              <View style={styles.scanningRow}>
                <Animated.View style={[styles.scanningDot, pulseStyle]} />
                <Text style={styles.scanningText}>{stages[expandedIndex].alonTask}</Text>
              </View>
            </View>
          </View>
          <ChevronDown size={14} color={Colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Expanded — full accordion (scrollable, capped height) */}
      {!collapsed && (
        <ScrollView style={styles.accordionScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        <View style={styles.accordion}>
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            const isExpanded = i === expandedIndex;
            const isDone = stage.status === 'done';
            const isActive = stage.status === 'active';

            return (
              <View key={stage.num}>
                {/* Stage row */}
                <TouchableOpacity
                  style={[styles.stageRow, isExpanded && styles.stageRowExpanded]}
                  onPress={() => toggleStage(i)}
                  activeOpacity={0.7}
                >
                  {/* Connector line */}
                  {i < stages.length - 1 && (
                    <View style={[styles.connector, (isDone || isActive) && styles.connectorActive]} />
                  )}

                  {/* Dot */}
                  <View style={[
                    styles.dot,
                    isActive && styles.dotActive,
                    isDone && styles.dotDone,
                    isExpanded && !isDone && !isActive && styles.dotExpanded,
                  ]}>
                    {isDone ? (
                      <CheckCircle2 size={10} color="#fff" strokeWidth={2.5} />
                    ) : (
                      <Icon size={11} color={isActive || isExpanded ? '#fff' : Colors.warm400} strokeWidth={1.8} />
                    )}
                  </View>

                  {/* Label */}
                  <Text style={[
                    styles.stageLabel,
                    isExpanded && styles.stageLabelExpanded,
                    isDone && styles.stageLabelDone,
                  ]}>
                    {stage.num}. {stage.label}
                  </Text>

                  {/* Status */}
                  {isDone && <Text style={styles.doneText}>Done</Text>}
                </TouchableOpacity>

                {/* Expanded subtitle — ALON's task for this stage */}
                {isExpanded && (
                  <Animated.View style={styles.detailSubtitle} entering={FadeIn.duration(200)}>
                    <Animated.View style={[styles.scanningDot, isActive && pulseStyle]} />
                    <Text style={styles.detailText}>{stage.alonTask}</Text>
                  </Animated.View>
                )}
              </View>
            );
          })}
        </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.sm,
  },

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

  // Collapsed
  collapsedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  collapsedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  collapsedInfo: { flex: 1, gap: 2 },
  collapsedLabel: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  scanningRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scanningDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.terra500 },
  scanningText: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },

  // Accordion
  accordionScroll: { maxHeight: 280 },
  accordion: {
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, overflow: 'hidden',
  },
  stageRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, position: 'relative',
  },
  stageRowExpanded: { backgroundColor: Colors.cream },

  connector: {
    position: 'absolute', left: 24, top: 32, width: 1, height: 16,
    backgroundColor: Colors.warm200,
  },
  connectorActive: { backgroundColor: Colors.terra300 },

  dot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.warm100, borderWidth: 1, borderColor: Colors.warm200,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: Colors.terra500, borderColor: Colors.terra500 },
  dotDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  dotExpanded: { backgroundColor: Colors.navy800, borderColor: Colors.navy800 },
  dotInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },

  stageLabel: { flex: 1, fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  stageLabelExpanded: { fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  stageLabelDone: { color: Colors.textSecondary },

  doneText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: '#22C55E' },

  // Detail subtitle
  detailSubtitle: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingBottom: 10, paddingLeft: 46,
    backgroundColor: Colors.cream,
  },
  detailText: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, lineHeight: 15 },
});
