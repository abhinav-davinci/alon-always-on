import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Info,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Camera,
  Building,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import {
  useOnboardingStore,
  type SnagCategory,
  type SnagStatus,
  type SnagSeverity,
} from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import { SNAG_CATEGORY_MAP, type SnagCheckItem } from '../../constants/possession';
import { CATEGORY_ICONS } from './possession-snag';

// ═══════════════════════════════════════════════════════════════
// Category detail — renders all check items for the selected snag
// category. Each check has status (OK / Defect / NA). On "defect",
// the user reveals severity chips, photo button (mocked), and notes.
// ═══════════════════════════════════════════════════════════════

export default function PossessionSnagDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();

  const categoryKey = (params.category as SnagCategory | undefined) ?? 'structural';
  const category = SNAG_CATEGORY_MAP[categoryKey];

  const { activeLegalPropertyId, possessions } = useOnboardingStore();
  const findings = activeLegalPropertyId
    ? possessions[activeLegalPropertyId]?.findings ?? {}
    : {};

  if (!category || !activeLegalPropertyId) {
    // Shouldn't happen via normal navigation, but guard anyway.
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={{ padding: 24 }}>Category not found. Go back and pick one.</Text>
      </View>
    );
  }

  const Icon = CATEGORY_ICONS[category.icon] ?? Building;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Icon size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>{category.label}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Watch out — what makes this category tricky */}
        <Animated.View entering={FadeIn.duration(260)} style={styles.gotchaCard}>
          <View style={styles.gotchaHead}>
            <Info size={13} color={Colors.terra600} strokeWidth={2} />
            <Text style={styles.gotchaLabel}>WATCH OUT</Text>
          </View>
          <Text style={styles.gotchaText}>{category.gotcha}</Text>
        </Animated.View>

        {/* Checks */}
        <Text style={styles.sectionLabel}>CHECKS ({category.checks.length})</Text>
        {category.checks.map((check) => {
          const key = `${category.key}:${check.id}`;
          const finding = findings[key];
          return (
            <CheckCard
              key={check.id}
              category={category.key}
              check={check}
              status={finding?.status ?? 'unchecked'}
              severity={finding?.severity}
              photoCount={finding?.photoCount ?? 0}
              notes={finding?.notes ?? ''}
              propertyId={activeLegalPropertyId}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// CheckCard — one row per check. Status segmented control at top;
// severity + photo + notes revealed when status = defect.
// ═══════════════════════════════════════════════════════════════

function CheckCard({
  category, check, status, severity, photoCount, notes, propertyId,
}: {
  category: SnagCategory;
  check: SnagCheckItem;
  status: SnagStatus;
  severity?: SnagSeverity;
  photoCount: number;
  notes: string;
  propertyId: string;
}) {
  const haptics = useHaptics();
  const updateSnagFinding = useOnboardingStore((s) => s.updateSnagFinding);
  const [localNotes, setLocalNotes] = useState(notes);

  const setStatus = (next: SnagStatus) => {
    haptics.selection();
    updateSnagFinding(propertyId, category, check.id, {
      status: next,
      // Clearing status resets severity; setting defect w/o sev keeps whatever was set.
      severity: next === 'defect' ? severity : undefined,
    });
  };

  const setSeverity = (sev: SnagSeverity) => {
    haptics.light();
    updateSnagFinding(propertyId, category, check.id, { severity: sev });
  };

  const addPhoto = () => {
    haptics.light();
    // Prototype: increment the photo counter. Production = real file picker.
    updateSnagFinding(propertyId, category, check.id, { photoCount: photoCount + 1 });
  };

  const commitNotes = () => {
    if (localNotes !== notes) {
      updateSnagFinding(propertyId, category, check.id, { notes: localNotes });
    }
  };

  const isDefect = status === 'defect';

  return (
    <View style={[styles.checkCard, isDefect && styles.checkCardDefect]}>
      <Text style={styles.checkLabel}>{check.label}</Text>
      <Text style={styles.checkHint}>{check.hint}</Text>

      {/* Status segmented control */}
      <View style={styles.statusRow}>
        <StatusPill
          label="OK"
          icon={CheckCircle2}
          color={Colors.green500}
          bg={Colors.green100}
          active={status === 'ok'}
          onPress={() => setStatus('ok')}
        />
        <StatusPill
          label="Defect"
          icon={XCircle}
          color={Colors.red500}
          bg={'#FEE2E2'}
          active={status === 'defect'}
          onPress={() => setStatus('defect')}
        />
        <StatusPill
          label="N/A"
          icon={MinusCircle}
          color={Colors.textTertiary}
          bg={Colors.warm100}
          active={status === 'na'}
          onPress={() => setStatus('na')}
        />
      </View>

      {/* Defect details */}
      {isDefect && (
        <View style={styles.defectBlock}>
          <Text style={styles.defectLabel}>SEVERITY</Text>
          <View style={styles.sevRow}>
            <SeverityChip label="Critical" active={severity === 'critical'} color="#DC2626" bg="#FEE2E2" onPress={() => setSeverity('critical')} />
            <SeverityChip label="Major"    active={severity === 'major'}    color="#C2410C" bg="#FFEDD5" onPress={() => setSeverity('major')} />
            <SeverityChip label="Minor"    active={severity === 'minor'}    color={Colors.warm600} bg={Colors.warm100} onPress={() => setSeverity('minor')} />
          </View>

          <TouchableOpacity style={styles.photoBtn} onPress={addPhoto} activeOpacity={0.8}>
            <Camera size={14} color={Colors.terra500} strokeWidth={2} />
            <Text style={styles.photoBtnText}>
              {photoCount === 0
                ? 'Add photo'
                : `${photoCount} photo${photoCount === 1 ? '' : 's'} — add another`}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={styles.notesInput}
            placeholder="Notes (optional) — e.g. exact location, what you observed"
            placeholderTextColor={Colors.textTertiary}
            value={localNotes}
            onChangeText={setLocalNotes}
            onBlur={commitNotes}
            multiline
            numberOfLines={2}
          />
        </View>
      )}
    </View>
  );
}

function StatusPill({
  label, icon: Icon, color, bg, active, onPress,
}: {
  label: string;
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.statusPill, active && { backgroundColor: bg, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Icon size={12} color={active ? color : Colors.textTertiary} strokeWidth={2.2} />
      <Text style={[styles.statusPillText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SeverityChip({
  label, active, color, bg, onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sevChip, active && { backgroundColor: bg, borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.sevChipText, active && { color, fontFamily: 'DMSans-SemiBold' }]}>{label}</Text>
    </TouchableOpacity>
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

  gotchaCard: {
    marginHorizontal: Spacing.xxl, padding: 12,
    backgroundColor: Colors.terra50, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.terra100,
  },
  gotchaHead: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  gotchaLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.terra600, letterSpacing: 0.6,
  },
  gotchaText: {
    fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textPrimary, lineHeight: 17,
  },

  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, marginHorizontal: Spacing.xxl, marginTop: 18, marginBottom: 10,
  },

  checkCard: {
    marginHorizontal: Spacing.xxl, marginBottom: 10,
    padding: 14, backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  checkCardDefect: {
    borderColor: '#FECACA', backgroundColor: '#FFFBFB',
  },
  checkLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary,
  },
  checkHint: {
    fontFamily: 'DMSans-Regular', fontSize: 11,
    color: Colors.textSecondary, marginTop: 3, lineHeight: 16,
  },

  statusRow: {
    flexDirection: 'row', gap: 6, marginTop: 10,
  },
  statusPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
  },
  statusPillText: {
    fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.textTertiary,
  },

  defectBlock: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#FECACA',
  },
  defectLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.textTertiary,
    letterSpacing: 0.6, marginBottom: 6,
  },
  sevRow: {
    flexDirection: 'row', gap: 6, marginBottom: 10,
  },
  sevChip: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.white,
    alignItems: 'center',
  },
  sevChipText: {
    fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.textSecondary,
  },

  photoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.terra200, backgroundColor: Colors.terra50,
    marginBottom: 10,
  },
  photoBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.terra500,
  },

  notesInput: {
    padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.warm50,
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textPrimary,
    minHeight: 52,
    textAlignVertical: 'top',
  },
});
