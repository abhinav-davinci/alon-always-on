import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ClipboardCheck,
  Check,
  Info,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import { HANDOVER_CHECKLIST } from '../../constants/possession';

// ═══════════════════════════════════════════════════════════════
// Handover day micro-checklist. 8 items the user walks through on
// the actual handover day. Tappable rows with tick state.
// ═══════════════════════════════════════════════════════════════

export default function PossessionHandoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const { activeLegalPropertyId, possessions, toggleHandoverCheckItem } = useOnboardingStore();
  const checklist = activeLegalPropertyId
    ? possessions[activeLegalPropertyId]?.handoverChecklist ?? {}
    : {};

  const done = HANDOVER_CHECKLIST.filter((i) => checklist[i.id]).length;
  const total = HANDOVER_CHECKLIST.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ClipboardCheck size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Handover Day</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(260)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {done === total
              ? 'All handed over — keys are yours'
              : `${done} of ${total} confirmed`}
          </Text>
          <Text style={styles.summarySub}>
            Work through these on the day itself. Don't sign anything until every line is ticked
            or explicitly noted.
          </Text>
          <View style={styles.summaryBarTrack}>
            <View style={[styles.summaryBarFill, { width: `${(done / total) * 100}%` as any }]} />
          </View>
        </Animated.View>

        <View style={styles.infoCard}>
          <Info size={12} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.infoText}>
            Possession date = start of your 5-year structural warranty under RERA § 14(3).
            Whatever date you tick "Keys received," that's the clock start.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>CHECKLIST</Text>

        {HANDOVER_CHECKLIST.map((item) => {
          const checked = !!checklist[item.id];
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, checked && styles.itemRowChecked]}
              onPress={() => {
                if (!activeLegalPropertyId) return;
                haptics.light();
                toggleHandoverCheckItem(activeLegalPropertyId, item.id);
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                {checked && <Check size={14} color={Colors.white} strokeWidth={3} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemLabel, checked && styles.itemLabelChecked]}>
                  {item.label}
                </Text>
                <Text style={styles.itemHint}>{item.hint}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },

  content: { paddingTop: Spacing.lg },

  summaryCard: {
    marginHorizontal: Spacing.xxl, padding: 14,
    backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  summaryTitle: { fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary },
  summarySub: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    marginTop: 4, marginBottom: 10, lineHeight: 17,
  },
  summaryBarTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%', backgroundColor: Colors.terra500,
  },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: Spacing.xxl, marginTop: 12,
    padding: 12, borderRadius: 10,
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra100,
  },
  infoText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textSecondary, lineHeight: 17,
  },

  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, marginHorizontal: Spacing.xxl, marginTop: 20, marginBottom: 10,
  },

  itemRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: Spacing.xxl, marginBottom: 8,
    padding: 14, backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  itemRowChecked: {
    backgroundColor: Colors.green100, borderColor: '#BBF7D0',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: Colors.warm300,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white,
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: Colors.green500, borderColor: Colors.green500,
  },
  itemLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary,
  },
  itemLabelChecked: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  itemHint: {
    fontFamily: 'DMSans-Regular', fontSize: 11,
    color: Colors.textSecondary, marginTop: 3, lineHeight: 16,
  },
});
