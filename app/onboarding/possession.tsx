import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Key,
  Search,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import {
  useOnboardingStore,
  countSnagDefects,
  type PossessionRecord,
} from '../../store/onboarding';
import { resolveLegalProperty } from '../../utils/legalProperty';
import { useHaptics } from '../../hooks/useHaptics';
import {
  SNAG_CATEGORIES,
  POSSESSION_DOCUMENTS,
  HANDOVER_CHECKLIST,
} from '../../constants/possession';

// ═══════════════════════════════════════════════════════════════
// Possession home — one screen, three action cards, phase strip.
//
// Gate: a property must be active (Legal's selector drives this).
// We don't gate on Deal Closure completion in Phase 1 — users can
// preview Possession anytime, consistent with the "Legal is
// independent" pattern established earlier.
// ═══════════════════════════════════════════════════════════════

export default function PossessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const {
    userProperties,
    externalProperties,
    activeLegalPropertyId,
    possessions,
    setPossessionHandoverDate,
  } = useOnboardingStore();

  const property = useMemo(
    () => resolveLegalProperty({ userProperties, externalProperties }, activeLegalPropertyId),
    [activeLegalPropertyId, userProperties, externalProperties],
  );

  // No active property → empty gate. Direct user to Legal, which has
  // the property selector and the same activeLegalPropertyId wiring.
  if (!property || !activeLegalPropertyId) {
    return (
      <PossessionEmpty
        insetsTop={insets.top}
        onBack={() => router.back()}
        onGoLegal={() => router.push('/onboarding/legal-analysis')}
      />
    );
  }

  const record: PossessionRecord | undefined = possessions[activeLegalPropertyId];

  // ── Derived counts for the action cards ──
  const defects = countSnagDefects({ possessions }, activeLegalPropertyId);
  const categoriesChecked = record
    ? new Set(Object.values(record.findings).map((f) => f.category)).size
    : 0;

  const docsReceived = record
    ? Object.values(record.documents).filter((s) => s === 'received').length
    : 0;
  const docsTotal = POSSESSION_DOCUMENTS.length;
  const ocStatus = record?.documents.oc ?? 'pending';

  const handoverDone = record
    ? Object.values(record.handoverChecklist).filter(Boolean).length
    : 0;
  const handoverTotal = HANDOVER_CHECKLIST.length;

  // ── Expected handover date: demo-populate if missing ──
  // For prototype, auto-set to Dec 15, 2026 (a few months out) so the
  // date row isn't empty on first visit. Production would prompt user.
  const expected = record?.expectedHandoverDate;
  const displayDate = expected
    ? formatHandoverDate(expected)
    : 'Tap to set';

  const setDemoDate = () => {
    haptics.light();
    // Prototype: single-tap cycles through a couple of demo dates.
    if (!expected) {
      setPossessionHandoverDate(activeLegalPropertyId, 'expected', '2026-12-15');
    }
  };

  // ── Red banner: OC pending past handover is a blocking issue ──
  const showOcWarning = !!expected && new Date() > new Date(expected) && ocStatus !== 'received';

  // ── Phase status ──
  const preHandoverProgress =
    (categoriesChecked > 0 ? 1 : 0) + (docsReceived > 0 ? 1 : 0);
  const phase1Active = preHandoverProgress > 0;
  const phase2Active = handoverDone > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Key size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Possession</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Property + handover date */}
        <Animated.View entering={FadeIn.duration(280)} style={styles.propertyCard}>
          <View style={styles.propertyTop}>
            {property.image ? (
              <Image source={{ uri: property.image }} style={styles.propertyImage} />
            ) : (
              <View style={[styles.propertyImage, styles.propertyImagePlaceholder]}>
                <Text style={styles.propertyImageInitial}>{property.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyLabel}>MOVING INTO</Text>
              <Text style={styles.propertyName} numberOfLines={1}>{property.name}</Text>
              <Text style={styles.propertyMeta} numberOfLines={1}>
                {property.location}{property.price ? ` · ${property.price}` : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.dateRow} onPress={setDemoDate} activeOpacity={0.7}>
            <Calendar size={12} color={Colors.terra500} strokeWidth={2} />
            <Text style={styles.dateRowLabel}>Expected handover</Text>
            <Text style={styles.dateRowValue}>{displayDate}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* OC missing — blocking warning */}
        {showOcWarning && (
          <Animated.View entering={FadeInDown.duration(240)} style={styles.ocWarnCard}>
            <AlertTriangle size={14} color="#C2410C" strokeWidth={2} />
            <Text style={styles.ocWarnText}>
              <Text style={styles.ocWarnBold}>Don't accept keys without the OC.</Text> Possession
              without an Occupation Certificate is legally weak — utility transfers and tax
              mutation won't go through.
            </Text>
          </Animated.View>
        )}

        {/* Phase strip */}
        <Animated.View entering={FadeInDown.delay(80).duration(260)} style={styles.phaseStrip}>
          <PhaseNode label="Pre-handover" active={phase1Active} done={false} />
          <PhaseConnector done={phase1Active} />
          <PhaseNode label="Handover day" active={phase2Active} done={false} />
          <PhaseConnector done={phase2Active} />
          <PhaseNode label="Post-handover" active={false} done={false} muted />
          <PhaseConnector done={false} />
          <PhaseNode label="Warranty" active={false} done={false} muted />
        </Animated.View>

        {/* ── PRE-HANDOVER section ── */}
        <Text style={styles.sectionLabel}>PRE-HANDOVER</Text>

        <ActionCard
          icon={<Search size={18} color={Colors.terra500} strokeWidth={2} />}
          title="Run a snag inspection"
          subtitle={
            defects.total > 0
              ? `${defects.total} defect${defects.total === 1 ? '' : 's'} logged · ${categoriesChecked} of ${SNAG_CATEGORIES.length} categories checked`
              : `Pune-specific checklist across ${SNAG_CATEGORIES.length} categories — ~45 min walkthrough`
          }
          defectSummary={defects.total > 0 ? `${defects.critical}C · ${defects.major}M · ${defects.minor}m` : undefined}
          onPress={() => {
            haptics.light();
            router.push('/onboarding/possession-snag');
          }}
        />

        <ActionCard
          icon={<FileText size={18} color={Colors.terra500} strokeWidth={2} />}
          title="Document vault"
          subtitle={`${docsReceived} of ${docsTotal} handover documents received`}
          onPress={() => {
            haptics.light();
            router.push('/onboarding/possession-documents');
          }}
        />

        {/* ── HANDOVER DAY section ── */}
        <Text style={styles.sectionLabel}>HANDOVER DAY</Text>

        <ActionCard
          icon={<ClipboardCheck size={18} color={Colors.terra500} strokeWidth={2} />}
          title="Handover checklist"
          subtitle={`${handoverDone} of ${handoverTotal} items · run on possession day`}
          onPress={() => {
            haptics.light();
            router.push('/onboarding/possession-handover');
          }}
        />

        {/* ── POST-HANDOVER (Phase 2 preview) ── */}
        <Text style={styles.sectionLabel}>AFTER HANDOVER · COMING SOON</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <View style={styles.previewDot} />
            <Text style={styles.previewText}>Utility transfers — MSEDCL, PMC water, MNGL gas</Text>
          </View>
          <View style={styles.previewRow}>
            <View style={styles.previewDot} />
            <Text style={styles.previewText}>Society formation — 4-month MOFA window tracker</Text>
          </View>
          <View style={styles.previewRow}>
            <View style={styles.previewDot} />
            <Text style={styles.previewText}>TDS 26QB filing if price &gt; 50L</Text>
          </View>
          <View style={styles.previewRow}>
            <View style={styles.previewDot} />
            <Text style={styles.previewText}>Structural defect warranty — 5-year clock</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Info size={12} color={Colors.terra500} strokeWidth={1.5} />
          <Text style={styles.disclaimerText}>
            Handover regulations in Maharashtra are defined by RERA, MOFA, and local PMC/PCMC
            rules. This checklist is a guide — always cross-check with a registered advocate
            before signing anything.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// Subcomponents
// ═══════════════════════════════════════════════════════════════

function ActionCard({
  icon,
  title,
  subtitle,
  defectSummary,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  defectSummary?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.actionIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
        {defectSummary && (
          <View style={styles.defectPill}>
            <AlertTriangle size={10} color={Colors.red500} strokeWidth={2} />
            <Text style={styles.defectPillText}>{defectSummary}</Text>
          </View>
        )}
      </View>
      <ChevronRight size={16} color={Colors.terra500} strokeWidth={2} />
    </TouchableOpacity>
  );
}

function PhaseNode({ label, active, done, muted }: { label: string; active: boolean; done: boolean; muted?: boolean }) {
  return (
    <View style={styles.phaseNode}>
      <View style={[
        styles.phaseDot,
        done && styles.phaseDotDone,
        active && styles.phaseDotActive,
        muted && styles.phaseDotMuted,
      ]}>
        {done ? (
          <CheckCircle2 size={10} color={Colors.white} strokeWidth={3} />
        ) : active ? (
          <View style={styles.phaseDotInner} />
        ) : null}
      </View>
      <Text style={[
        styles.phaseLabel,
        active && styles.phaseLabelActive,
        muted && styles.phaseLabelMuted,
      ]}>
        {label}
      </Text>
    </View>
  );
}

function PhaseConnector({ done }: { done: boolean }) {
  return <View style={[styles.phaseConnector, done && styles.phaseConnectorDone]} />;
}

function PossessionEmpty({
  insetsTop, onBack, onGoLegal,
}: {
  insetsTop: number;
  onBack: () => void;
  onGoLegal: () => void;
}) {
  return (
    <View style={[styles.container, { paddingTop: insetsTop }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Key size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Possession</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View entering={FadeIn.duration(260)} style={styles.emptyBody}>
        <View style={styles.emptyIconWrap}>
          <Key size={32} color={Colors.terra500} strokeWidth={1.6} />
        </View>
        <Text style={styles.emptyHeadline}>Possession checklist waiting</Text>
        <Text style={styles.emptySubhead}>
          Pick a property in Legal first — I'll line up your snag inspection, document vault,
          and handover-day checklist for that specific property.
        </Text>

        <TouchableOpacity style={styles.emptyCta} onPress={onGoLegal} activeOpacity={0.88}>
          <Text style={styles.emptyCtaText}>Go to Legal</Text>
          <ChevronRight size={15} color={Colors.white} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.emptyPreview}>
          <Text style={styles.emptyPreviewTitle}>What Possession covers</Text>
          {[
            `Pune-flavored snag inspection across ${SNAG_CATEGORIES.length} categories`,
            `${POSSESSION_DOCUMENTS.length}-document handover vault with source + red-flag notes`,
            `${HANDOVER_CHECKLIST.length}-item handover-day micro-checklist`,
            'Post-handover setup: utilities, tax, society formation (Phase 2)',
          ].map((line) => (
            <View key={line} style={styles.emptyPreviewRow}>
              <View style={styles.emptyPreviewDot} />
              <Text style={styles.emptyPreviewText}>{line}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════

function formatHandoverDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

  // Property card
  propertyCard: {
    marginHorizontal: Spacing.xxl, padding: 12,
    backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  propertyTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  propertyImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: Colors.warm100 },
  propertyImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  propertyImageInitial: { fontSize: 22, fontFamily: 'DMSerifDisplay', color: Colors.terra500 },
  propertyInfo: { flex: 1 },
  propertyLabel: {
    fontSize: 9, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.6, marginBottom: 2,
  },
  propertyName: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  propertyMeta: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textSecondary, marginTop: 1 },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.warm200,
  },
  dateRowLabel: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary,
  },
  dateRowValue: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.terra500,
  },

  // OC warning
  ocWarnCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: Spacing.xxl, marginTop: 12,
    padding: 12, borderRadius: 10,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  ocWarnText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: '#991B1B', lineHeight: 17,
  },
  ocWarnBold: { fontFamily: 'DMSans-SemiBold' },

  // Phase strip
  phaseStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.xxl, marginTop: Spacing.lg, marginBottom: 4,
  },
  phaseNode: { alignItems: 'center', gap: 6, width: 64 },
  phaseDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.warm100, borderWidth: 1.5, borderColor: Colors.warm300,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseDotDone: { backgroundColor: Colors.green500, borderColor: Colors.green500 },
  phaseDotActive: { backgroundColor: Colors.terra500, borderColor: Colors.terra400 },
  phaseDotMuted: { backgroundColor: Colors.warm100, borderColor: Colors.warm200 },
  phaseDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
  phaseLabel: {
    fontFamily: 'DMSans-Medium', fontSize: 10,
    color: Colors.textTertiary, textAlign: 'center',
  },
  phaseLabelActive: { color: Colors.textPrimary, fontFamily: 'DMSans-SemiBold' },
  phaseLabelMuted: { color: Colors.warm300 },
  phaseConnector: {
    flex: 1, height: 1, backgroundColor: Colors.warm200, marginTop: -12,
  },
  phaseConnectorDone: { backgroundColor: Colors.terra400 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, marginHorizontal: Spacing.xxl, marginTop: 22, marginBottom: 10,
  },

  // Action card
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: Spacing.xxl, marginBottom: 10,
    padding: 14, backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: Colors.terra50, alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary,
  },
  actionSubtitle: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary,
    marginTop: 2, lineHeight: 16,
  },
  defectPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, backgroundColor: '#FEE2E2',
    alignSelf: 'flex-start',
  },
  defectPillText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10, color: Colors.red500, letterSpacing: 0.3,
  },

  // Preview card (phase 2 coming soon)
  previewCard: {
    marginHorizontal: Spacing.xxl, padding: 14,
    backgroundColor: Colors.warm50, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm100,
  },
  previewRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4,
  },
  previewDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.warm300, marginTop: 7,
  },
  previewText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textSecondary, lineHeight: 17,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', gap: 6,
    marginHorizontal: Spacing.xxl, marginTop: 20, padding: 12,
  },
  disclaimerText: {
    flex: 1, fontSize: 10, fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary, lineHeight: 14,
  },

  // Empty state
  emptyBody: {
    flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxxl,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.terra50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyHeadline: {
    fontFamily: 'DMSerifDisplay', fontSize: 22, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 8,
  },
  emptySubhead: {
    fontFamily: 'DMSans-Regular', fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 19, marginBottom: 20, paddingHorizontal: 8,
  },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.terra500, marginBottom: 20,
  },
  emptyCtaText: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white },
  emptyPreview: {
    alignSelf: 'stretch', padding: 14, borderRadius: 12,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm100,
  },
  emptyPreviewTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 10,
  },
  emptyPreviewRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4,
  },
  emptyPreviewDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: Colors.terra400, marginTop: 7,
  },
  emptyPreviewText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textSecondary, lineHeight: 17,
  },
});
