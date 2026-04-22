import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  Pencil,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import {
  useOnboardingStore,
  countSnagDefects,
} from '../../store/onboarding';
import {
  resolveLegalProperty,
  defaultLegalPropertyId,
} from '../../utils/legalProperty';
import { useHaptics } from '../../hooks/useHaptics';
import {
  SNAG_CATEGORIES,
  POSSESSION_DOCUMENTS,
  HANDOVER_CHECKLIST,
} from '../../constants/possession';

// ═══════════════════════════════════════════════════════════════
// Possession home — standalone checklist experience.
//
// No prerequisites. The snag walkthrough, document vault, and
// handover-day playbook are universally useful — a user who bought
// entirely outside ALON can come here on handover day and get value.
//
// We need a property reference only to attach records to (so notes,
// photos, checkmarks persist). If the user has a Legal-selected or
// shortlisted property, we inherit that. Otherwise we auto-create a
// placeholder "Your property" they can rename inline via the property
// card tap.
// ═══════════════════════════════════════════════════════════════

export default function PossessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const {
    negotiatePropertyId,
    likedPropertyIds,
    userProperties,
    externalProperties,
    activeLegalPropertyId,
    legalAnalyses,
    possessions,
    setPossessionHandoverDate,
    setActiveLegalProperty,
    addExternalProperty,
    updateExternalProperty,
  } = useOnboardingStore();

  // Auto-select-or-create a property on mount. Preference order:
  //   1. Whatever Legal selected (covers the "I did Legal on this" case).
  //   2. Default fallback — Negotiate → shortlist → user-added.
  //   3. Reuse an existing named external without a legal analysis
  //      (that's a previous Possession-only placeholder).
  //   4. Create a fresh "Your property" placeholder.
  // Runs once per mount — after we pick, activeLegalPropertyId stays
  // stable until the user changes it or navigates away.
  useEffect(() => {
    if (activeLegalPropertyId) {
      const resolved = resolveLegalProperty({ userProperties, externalProperties }, activeLegalPropertyId);
      if (resolved) return;
      // stale ID → fall through
    }
    const fallback = defaultLegalPropertyId({
      negotiatePropertyId,
      likedPropertyIds,
      userProperties,
    });
    if (fallback) {
      setActiveLegalProperty(fallback);
      return;
    }
    const reusable = Object.keys(externalProperties).find((id) => {
      const ext = externalProperties[id];
      return ext && ext.name.length > 0 && !legalAnalyses[id];
    });
    if (reusable) {
      setActiveLegalProperty(reusable);
      return;
    }
    const newId = addExternalProperty({ name: 'Your property', location: '' });
    setActiveLegalProperty(newId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const property = useMemo(
    () => resolveLegalProperty({ userProperties, externalProperties }, activeLegalPropertyId),
    [activeLegalPropertyId, userProperties, externalProperties],
  );

  // Rename sheet state — inline, minimal. Only meaningful for external
  // (placeholder) properties; shortlist / user-added properties aren't
  // renamable from here (those are ALON's authoritative records).
  const canRename = property?.source === 'external';
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftLocation, setDraftLocation] = useState('');

  // Date picker state — must live above the early-return below.
  // Rules-of-hooks: hook count must match across renders, so all
  // useState calls are hoisted to the top of the component.
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(() => {
    const rec = activeLegalPropertyId ? possessions[activeLegalPropertyId] : undefined;
    const exp = rec?.expectedHandoverDate;
    if (exp) return new Date(exp + 'T00:00:00');
    const d = new Date();
    d.setDate(d.getDate() + 90); // 90 days out — typical handover window
    return d;
  });

  const openRename = () => {
    if (!canRename || !property) return;
    haptics.light();
    setDraftName(property.name);
    setDraftLocation(property.location);
    setRenaming(true);
  };

  const saveRename = () => {
    if (!activeLegalPropertyId) return;
    const name = draftName.trim() || 'Your property';
    const location = draftLocation.trim();
    updateExternalProperty(activeLegalPropertyId, { name, location });
    haptics.success();
    setRenaming(false);
  };

  // Possession waits a tick for the mount-effect to set active + resolve,
  // so during that frame `property` can be null. Render nothing to avoid
  // flash; effect is synchronous so this is invisible in practice.
  if (!property || !activeLegalPropertyId) {
    return <View style={[styles.container, { paddingTop: insets.top }]} />;
  }

  const record = possessions[activeLegalPropertyId];

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

  // ── Expected handover date (derived; useState is above the early return) ──
  const expected = record?.expectedHandoverDate;
  const displayDate = expected ? formatHandoverDate(expected) : 'Tap to set';

  const openDatePicker = () => {
    haptics.light();
    // Reset the wheel position to the currently-saved value so reopening
    // the sheet doesn't show yesterday's draft.
    setDraftDate(expected ? new Date(expected + 'T00:00:00') : draftDate);
    setDatePickerOpen(true);
  };

  const saveDate = () => {
    if (!activeLegalPropertyId) return;
    setPossessionHandoverDate(activeLegalPropertyId, 'expected', toISODate(draftDate));
    haptics.success();
    setDatePickerOpen(false);
  };

  const clearDate = () => {
    if (!activeLegalPropertyId) return;
    setPossessionHandoverDate(activeLegalPropertyId, 'expected', null);
    haptics.light();
    setDatePickerOpen(false);
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
        {/* Property + handover date. Edit pencil only for placeholder
            (external) properties — shortlist/user-added records are
            ALON's authoritative data and aren't renamable from here. */}
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
              {(property.location || property.price) ? (
                <Text style={styles.propertyMeta} numberOfLines={1}>
                  {property.location}{property.location && property.price ? ' · ' : ''}{property.price ?? ''}
                </Text>
              ) : (
                canRename && (
                  <Text style={[styles.propertyMeta, { fontStyle: 'italic' }]} numberOfLines={1}>
                    Tap the pencil to add a location
                  </Text>
                )
              )}
            </View>
            {canRename && (
              <TouchableOpacity style={styles.editBtn} onPress={openRename} activeOpacity={0.7}>
                <Pencil size={14} color={Colors.terra500} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.dateRow} onPress={openDatePicker} activeOpacity={0.7}>
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

        {/* Phase strip — 4 equal columns with an absolute connector overlay.
            Connectors sit at dot-center Y and span between adjacent column
            centers (12.5% → 37.5% → 62.5% → 87.5%), so the line visibly
            joins dot to dot with no floating mid-gaps. */}
        <Animated.View entering={FadeInDown.delay(80).duration(260)} style={styles.phaseStrip}>
          <View style={styles.phaseConnLayer} pointerEvents="none">
            <View style={[styles.phaseConnSeg, styles.phaseConnSeg1, phase1Active && styles.phaseConnSegDone]} />
            <View style={[styles.phaseConnSeg, styles.phaseConnSeg2, phase2Active && styles.phaseConnSegDone]} />
            <View style={[styles.phaseConnSeg, styles.phaseConnSeg3]} />
          </View>
          <PhaseNode label="Pre-handover"  active={phase1Active} done={false} />
          <PhaseNode label="Handover day"  active={phase2Active} done={false} />
          <PhaseNode label="Post-handover" active={false}        done={false} muted />
          <PhaseNode label="Warranty"      active={false}        done={false} muted />
        </Animated.View>

        {/* ── PRE-HANDOVER section ── */}
        <Text style={styles.sectionLabel}>PRE-HANDOVER</Text>

        <ActionCard
          icon={<Search size={18} color={Colors.terra500} strokeWidth={2} />}
          title="Run a snag inspection"
          subtitle={
            defects.total > 0
              ? `${defects.total} defect${defects.total === 1 ? '' : 's'} logged · ${categoriesChecked} of ${SNAG_CATEGORIES.length} categories checked`
              : `${SNAG_CATEGORIES.length}-category property checklist — ~45 min walkthrough`
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

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Info size={12} color={Colors.terra500} strokeWidth={1.5} />
          <Text style={styles.disclaimerText}>
            Handover regulations are defined by RERA, MOFA, and local municipal rules. This
            checklist is a guide — always cross-check with a registered advocate before
            signing anything.
          </Text>
        </View>
      </ScrollView>

      {/* Rename sheet — only reachable when canRename. */}
      <RenameSheet
        visible={renaming}
        name={draftName}
        location={draftLocation}
        onName={setDraftName}
        onLocation={setDraftLocation}
        onSave={saveRename}
        onClose={() => setRenaming(false)}
      />

      {/* Handover-date picker sheet. */}
      <HandoverDateSheet
        visible={datePickerOpen}
        value={draftDate}
        onChange={setDraftDate}
        onSave={saveDate}
        onClear={expected ? clearDate : undefined}
        onClose={() => setDatePickerOpen(false)}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// Rename sheet — a two-field mini-form for renaming a placeholder
// possession property. Kept inline (no dependency on the Legal
// selector) because the action is small and one-purpose.
// ═══════════════════════════════════════════════════════════════

function RenameSheet({
  visible, name, location, onName, onLocation, onSave, onClose,
}: {
  visible: boolean;
  name: string;
  location: string;
  onName: (v: string) => void;
  onLocation: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={renameStyles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[renameStyles.panel, { paddingBottom: insets.bottom + 16 }]}>
            <View style={renameStyles.handle} />
            <View style={renameStyles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={renameStyles.title}>Name this property</Text>
                <Text style={renameStyles.subtitle}>
                  So your snag notes, documents, and checklist all save against the right place.
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={renameStyles.closeBtn} activeOpacity={0.7}>
                <X size={18} color={Colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={renameStyles.body}>
              <Text style={renameStyles.fieldLabel}>Project name</Text>
              <TextInput
                style={renameStyles.input}
                placeholder="e.g. Kumar Pebble Bay"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={onName}
                autoCapitalize="words"
                returnKeyType="next"
              />

              <Text style={[renameStyles.fieldLabel, { marginTop: 12 }]}>Location</Text>
              <TextInput
                style={renameStyles.input}
                placeholder="e.g. Area, City"
                placeholderTextColor={Colors.textTertiary}
                value={location}
                onChangeText={onLocation}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={onSave}
              />

              <TouchableOpacity style={renameStyles.saveBtn} onPress={onSave} activeOpacity={0.88}>
                <Text style={renameStyles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// Handover-date sheet — bottom sheet wrapping the native date
// picker. Same panel styling as RenameSheet and the Legal selector
// so all sheets feel like one family.
// ═══════════════════════════════════════════════════════════════

function HandoverDateSheet({
  visible, value, onChange, onSave, onClear, onClose,
}: {
  visible: boolean;
  value: Date;
  onChange: (d: Date) => void;
  onSave: () => void;
  onClear?: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  // Reasonable bounds: can't schedule handover in the deep past or
  // more than 3 years out. Keeps the wheel/calendar usable.
  const minDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  }, []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 3);
    return d;
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={dateStyles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[dateStyles.panel, { paddingBottom: insets.bottom + 16 }]}>
          <View style={dateStyles.handle} />

          <View style={dateStyles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={dateStyles.title}>Expected handover</Text>
              <Text style={dateStyles.subtitle}>
                When is the builder handing over the keys? You can change this anytime.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={dateStyles.closeBtn} activeOpacity={0.7}>
              <X size={18} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={dateStyles.pickerWrap}>
            <DateTimePicker
              value={value}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={minDate}
              maximumDate={maxDate}
              onChange={(_, selected) => {
                if (selected) onChange(selected);
              }}
              // iOS spinner ignores textColor on modern versions, but
              // keeping navy for the Android inline fallback.
              textColor={Colors.textPrimary}
              themeVariant="light"
            />
          </View>

          <View style={dateStyles.actions}>
            {onClear && (
              <TouchableOpacity style={dateStyles.clearBtn} onPress={onClear} activeOpacity={0.8}>
                <Text style={dateStyles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={dateStyles.saveBtn} onPress={onSave} activeOpacity={0.88}>
              <Text style={dateStyles.saveText}>Save date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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

// ═══════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════

function formatHandoverDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Convert a Date to the "YYYY-MM-DD" shape the store expects. Uses
// local-date components so the picker value doesn't drift by a day
// at UTC boundaries.
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

  // Phase strip — row of 4 equal columns with an absolute connector overlay.
  // Each column flex:1, dot + label stacked and center-aligned. The overlay
  // sits at dot-center Y (9px = half the 18px dot height) with 3 segments
  // spanning between adjacent column centers so the lines visibly connect.
  phaseStrip: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xxl, marginTop: Spacing.lg, marginBottom: 4,
    position: 'relative',
  },
  phaseConnLayer: {
    position: 'absolute', left: 0, right: 0, top: 9,
    height: 1,
  },
  phaseConnSeg: {
    position: 'absolute', top: 0, height: 1,
    backgroundColor: Colors.warm200,
  },
  // Column centers live at 12.5 / 37.5 / 62.5 / 87.5 %. Each segment
  // spans the 25% between adjacent centers.
  phaseConnSeg1: { left: '12.5%', width: '25%' },
  phaseConnSeg2: { left: '37.5%', width: '25%' },
  phaseConnSeg3: { left: '62.5%', width: '25%' },
  phaseConnSegDone: { backgroundColor: Colors.terra400 },

  phaseNode: { flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 4 },
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

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', gap: 6,
    marginHorizontal: Spacing.xxl, marginTop: 20, padding: 12,
  },
  disclaimerText: {
    flex: 1, fontSize: 10, fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary, lineHeight: 14,
  },

  // Edit pencil on the property card (placeholder properties only)
  editBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.terra200,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ─── Rename sheet styles ────────────────────────────────────────────

const renameStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,31,74,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08, shadowRadius: 20,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.xxl, gap: 12, paddingBottom: 4,
  },
  title: {
    fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary, lineHeight: 24,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    marginTop: 4, lineHeight: 17,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.warm100,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    paddingHorizontal: Spacing.xxl, paddingTop: 14,
  },
  fieldLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 11, color: Colors.textSecondary,
    letterSpacing: 0.4, marginBottom: 6,
  },
  input: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.warm200, backgroundColor: Colors.warm50,
    fontFamily: 'DMSans-Regular', fontSize: 14, color: Colors.textPrimary,
  },
  saveBtn: {
    marginTop: 18, paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.terra500, alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white,
  },
});

// ─── Handover date sheet styles ─────────────────────────────────────
// Shares the sheet family pattern — navy-tint backdrop, cream/white
// panel with 20-radius top, handle, close button, terra primary CTA.

const dateStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,31,74,0.4)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: '#0D1F4A',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08, shadowRadius: 20,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.warm200, marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.xxl, gap: 12, paddingBottom: 4,
  },
  title: {
    fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary, lineHeight: 24,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
    marginTop: 4, lineHeight: 17,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.warm100,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  // The native picker has its own internal padding; we just give it
  // horizontal breathing room and a centered layout. Height lets the
  // iOS spinner settle at its natural ~216px without clipping.
  pickerWrap: {
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4, paddingHorizontal: Spacing.lg,
    minHeight: Platform.OS === 'ios' ? 220 : 0,
  },
  actions: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: Spacing.xxl, marginTop: 8,
  },
  clearBtn: {
    paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.warm100, alignItems: 'center', justifyContent: 'center',
  },
  clearText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.terra500, alignItems: 'center',
  },
  saveText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white,
  },
});
