import React, { useMemo, useState } from 'react';
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
  ChevronRight,
  Search,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building,
  LayoutGrid,
  Paintbrush,
  DoorOpen,
  Zap,
  Droplet,
  ChefHat,
  Sun,
  Building2,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import {
  useOnboardingStore,
  type SnagCategory,
  type SnagFinding,
} from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import { SNAG_CATEGORIES, SNAG_CATEGORY_MAP } from '../../constants/possession';

// Map icon string → lucide component. Declared here so category-detail
// can reuse without a shared import module.
export const CATEGORY_ICONS: Record<string, typeof Building> = {
  building: Building,
  'layout-grid': LayoutGrid,
  paintbrush: Paintbrush,
  'door-open': DoorOpen,
  zap: Zap,
  droplet: Droplet,
  'chef-hat': ChefHat,
  sun: Sun,
  'building-2': Building2,
};

// ═══════════════════════════════════════════════════════════════
// Category list screen — 9 rows, each shows category name, summary,
// watch-out hint, and counters (checks logged / defects found).
// Tap a row → detail screen for that category.
// ═══════════════════════════════════════════════════════════════

export default function PossessionSnagScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const { activeLegalPropertyId, possessions } = useOnboardingStore();
  const [exported, setExported] = useState(false);

  const findings = activeLegalPropertyId
    ? possessions[activeLegalPropertyId]?.findings ?? {}
    : {};

  // Per-category counts derived from findings map.
  const perCategory = useMemo(() => {
    const byCat: Record<string, { checked: number; defects: number; total: number }> = {};
    for (const cat of SNAG_CATEGORIES) {
      const catFindings = Object.values(findings).filter((f) => f.category === cat.key);
      const defects = catFindings.filter((f) => f.status === 'defect').length;
      const checked = catFindings.filter((f) => f.status !== 'unchecked').length;
      byCat[cat.key] = { checked, defects, total: cat.checks.length };
    }
    return byCat;
  }, [findings]);

  const totalDefects = Object.values(perCategory).reduce((s, c) => s + c.defects, 0);
  const totalChecked = Object.values(perCategory).reduce((s, c) => s + c.checked, 0);
  const totalChecks = SNAG_CATEGORIES.reduce((s, c) => s + c.checks.length, 0);

  const handleExport = () => {
    haptics.success();
    setExported(true);
    setTimeout(() => setExported(false), 2400);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Search size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Snag Inspection</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary header */}
        <Animated.View entering={FadeIn.duration(260)} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {totalDefects > 0
              ? `${totalDefects} defect${totalDefects === 1 ? '' : 's'} logged`
              : 'Start with any category'}
          </Text>
          <Text style={styles.summarySub}>
            {totalChecked} of {totalChecks} checks reviewed across {SNAG_CATEGORIES.length} categories
          </Text>
          <View style={styles.summaryBarTrack}>
            <View style={[styles.summaryBarFill, { width: `${(totalChecked / totalChecks) * 100}%` as any }]} />
          </View>
        </Animated.View>

        {/* How to use */}
        <View style={styles.usageCard}>
          <Info size={12} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.usageText}>
            For each check: mark OK, defect, or not applicable. Defects take a photo +
            severity tag. Progress saves as you go — pick up where you left off.
          </Text>
        </View>

        {/* Category list */}
        <Text style={styles.sectionLabel}>CATEGORIES</Text>
        {SNAG_CATEGORIES.map((cat) => {
          const counts = perCategory[cat.key];
          const Icon = CATEGORY_ICONS[cat.icon] ?? Building;
          return (
            <TouchableOpacity
              key={cat.key}
              style={styles.catCard}
              onPress={() => {
                haptics.light();
                router.push({
                  pathname: '/onboarding/possession-snag-detail',
                  params: { category: cat.key },
                });
              }}
              activeOpacity={0.85}
            >
              <View style={styles.catIcon}>
                <Icon size={18} color={Colors.terra500} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.catHeadRow}>
                  <Text style={styles.catTitle}>{cat.label}</Text>
                  {counts.defects > 0 && (
                    <View style={styles.catDefectPill}>
                      <AlertTriangle size={9} color={Colors.red500} strokeWidth={2.2} />
                      <Text style={styles.catDefectPillText}>{counts.defects}</Text>
                    </View>
                  )}
                  {counts.checked === counts.total && counts.defects === 0 && (
                    <View style={styles.catDonePill}>
                      <CheckCircle2 size={10} color={Colors.green500} strokeWidth={2.5} />
                      <Text style={styles.catDonePillText}>all clear</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.catSummary}>{cat.summary}</Text>
                <Text style={styles.catProgress}>
                  {counts.checked}/{counts.total} checked
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.warm400} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}

        {/* Export */}
        <Animated.View entering={FadeInDown.delay(80).duration(260)} style={{ marginTop: 20 }}>
          <TouchableOpacity
            style={[styles.exportBtn, totalDefects === 0 && styles.exportBtnDisabled]}
            onPress={handleExport}
            disabled={totalDefects === 0}
            activeOpacity={0.88}
          >
            <FileDown size={15} color={Colors.white} strokeWidth={2} />
            <Text style={styles.exportBtnText}>
              {exported ? 'Report ready — share with builder' : 'Export snag report (PDF)'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.exportHint}>
            Includes every defect with photos, severity, and timestamps. Builder gets a
            documented list — no "I'll look into it" responses.
          </Text>
        </Animated.View>
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
    marginTop: 4, marginBottom: 10,
  },
  summaryBarTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%', backgroundColor: Colors.terra500,
  },

  usageCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: Spacing.xxl, marginTop: 12,
    padding: 12, borderRadius: 10,
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra100,
  },
  usageText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textSecondary, lineHeight: 17,
  },

  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, marginHorizontal: Spacing.xxl, marginTop: 20, marginBottom: 10,
  },

  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: Spacing.xxl, marginBottom: 8,
    padding: 12, backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  catIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.terra50,
    alignItems: 'center', justifyContent: 'center',
  },
  catHeadRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  },
  catTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary,
  },
  catDefectPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, backgroundColor: '#FEE2E2',
  },
  catDefectPillText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.red500,
  },
  catDonePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, backgroundColor: Colors.green100,
  },
  catDonePillText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.green500, letterSpacing: 0.3,
  },
  catSummary: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 2,
  },
  catProgress: {
    fontFamily: 'DMSans-Medium', fontSize: 10, color: Colors.textTertiary, marginTop: 4,
  },

  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.xxl, paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.terra500,
  },
  exportBtnDisabled: { backgroundColor: Colors.warm300 },
  exportBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white },
  exportHint: {
    fontFamily: 'DMSans-Regular', fontSize: 11,
    color: Colors.textTertiary, textAlign: 'center',
    marginTop: 8, marginHorizontal: Spacing.xxl, lineHeight: 15,
  },
});
