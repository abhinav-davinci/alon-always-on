import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
  ClipboardCheck,
  Info,
  IndianRupee,
  FilePen,
  Stamp,
  Landmark,
  Wallet,
  Banknote,
  BookOpen,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Bell,
  BellOff,
  FileText,
  ArrowRight,
  FileUp,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  interpolateColor,
  SharedValue,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import { resolveLegalProperty } from '../../utils/legalProperty';

// ═══════════════════════════════════════════════════════════════
// DEMO DATA — dates extracted from the uploaded BBA
// Today's reference date: 2026-04-18
// ═══════════════════════════════════════════════════════════════

type MilestoneStatus = 'done' | 'upcoming' | 'overdue';
type Phase = 'booking' | 'loan' | 'registration';

interface Milestone {
  id: string;
  label: string;
  phase: Phase;
  icon: typeof IndianRupee;
  date: string; // YYYY-MM-DD
  time?: string;
  amount?: string;
  note?: string;
  status: MilestoneStatus;
}

const MILESTONES: Milestone[] = [
  {
    id: 'token',
    label: 'Token / Booking Amount',
    phase: 'booking',
    icon: IndianRupee,
    date: '2026-02-28',
    amount: '₹5,00,000 paid',
    note: 'Booking confirmed with Kolte-Patil',
    status: 'done',
  },
  {
    id: 'ats',
    label: 'Sale Agreement (ATS) signed',
    phase: 'booking',
    icon: FilePen,
    date: '2026-03-25',
    note: 'Registered on MahaRERA portal',
    status: 'done',
  },
  {
    id: 'stamp',
    label: 'Stamp Duty payment',
    phase: 'loan',
    icon: Stamp,
    date: '2026-04-16',
    amount: '₹6,27,000',
    note: '5% of agreement value — Maharashtra',
    status: 'overdue',
  },
  {
    id: 'sanction',
    label: 'Loan Sanction',
    phase: 'loan',
    icon: Landmark,
    date: '2026-04-22',
    note: 'ICICI Bank — pre-sanction in progress',
    status: 'upcoming',
  },
  {
    id: 'disbursement',
    label: 'Loan Disbursement',
    phase: 'loan',
    icon: Wallet,
    date: '2026-05-05',
    amount: '₹1,00,00,000',
    status: 'upcoming',
  },
  {
    id: 'balance',
    label: 'Balance Payment to builder',
    phase: 'loan',
    icon: Banknote,
    date: '2026-05-08',
    amount: '₹15,50,000',
    status: 'upcoming',
  },
  {
    id: 'registration',
    label: 'Registration of Sale Deed',
    phase: 'registration',
    icon: BookOpen,
    date: '2026-05-15',
    note: 'Final deed registration',
    status: 'upcoming',
  },
  {
    id: 'subregistrar',
    label: 'Sub-registrar Visit',
    phase: 'registration',
    icon: Building2,
    date: '2026-05-15',
    time: '11:00 AM',
    note: 'Haveli Sub-Registrar Office, Pune',
    status: 'upcoming',
  },
];

// Reference "today" for the demo
const TODAY = new Date('2026-04-18T00:00:00');

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function relativeLabel(iso: string): { text: string; tone: 'done' | 'overdue' | 'soon' | 'later' } {
  const d = new Date(iso + 'T00:00:00');
  const diff = daysBetween(TODAY, d);
  if (diff < 0) {
    const abs = Math.abs(diff);
    return { text: `${abs} day${abs === 1 ? '' : 's'} overdue`, tone: 'overdue' };
  }
  if (diff === 0) return { text: 'Today', tone: 'soon' };
  if (diff === 1) return { text: 'Tomorrow', tone: 'soon' };
  if (diff <= 7) return { text: `In ${diff} days`, tone: 'soon' };
  return { text: `In ${diff} days`, tone: 'later' };
}

// ═══════════════════════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════════════════════

export default function DealClosureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const {
    userProperties,
    externalProperties,
    legalAnalyses,
    activeLegalPropertyId,
  } = useOnboardingStore();

  // Deal Closure rides the same selected property as Legal. If the user
  // analyzed a different agreement (external, or a non-Negotiate shortlist
  // property), Deal Closure shows that property's timeline — not whatever
  // happens to be in Negotiate.
  const analysisRecord = activeLegalPropertyId ? legalAnalyses[activeLegalPropertyId] : null;
  const analysisDone = Boolean(analysisRecord);
  const legalDocName = analysisRecord?.docName ?? null;

  // Intermediate "preparing" loader — runs once on mount
  const [isPreparing, setIsPreparing] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsPreparing(false), 2600);
    return () => clearTimeout(t);
  }, []);

  // Local UI state (prototype — not persisted)
  const [reminders, setReminders] = useState<Record<string, boolean>>({
    stamp: true,
    sanction: true,
    disbursement: true,
    balance: false,
    registration: false,
    subregistrar: false,
  });
  const property = useMemo(
    () => resolveLegalProperty({ userProperties, externalProperties }, activeLegalPropertyId),
    [activeLegalPropertyId, userProperties, externalProperties],
  );

  // Only hard dependency: a parsed agreement for the selected property.
  // Property lock/shortlist cascading lives upstream in Legal's flow.
  if (!analysisDone || !property) {
    return (
      <DealClosureEmpty
        propertyName={property?.name ?? null}
        insetsTop={insets.top}
        onBack={() => router.back()}
        onUpload={() => router.push('/onboarding/legal-analysis')}
      />
    );
  }

  // ── Preparing / intermediate loader ──
  if (isPreparing) {
    return (
      <PreparingScreen
        propertyName={property.name}
        docName={legalDocName || 'Builder-Buyer Agreement'}
        insetsTop={insets.top}
        onBack={() => router.back()}
      />
    );
  }

  // ── Derived ──
  const doneCount = MILESTONES.filter((m) => m.status === 'done').length;
  const overdueCount = MILESTONES.filter((m) => m.status === 'overdue').length;
  const upcomingCount = MILESTONES.filter((m) => m.status === 'upcoming').length;
  const totalCount = MILESTONES.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);

  const toggleReminder = (id: string) => {
    haptics.light();
    setReminders((r) => ({ ...r, [id]: !r[id] }));
  };

  // Phase state for status strip
  const phaseState = (phase: Phase): 'done' | 'active' | 'pending' => {
    const list = MILESTONES.filter((m) => m.phase === phase);
    if (list.every((m) => m.status === 'done')) return 'done';
    if (list.some((m) => m.status !== 'done')) {
      const earliest = list.reduce((min, m) => (m.date < min.date ? m : min));
      if (earliest.status === 'overdue') return 'active';
      // any phase that has next-due within reasonable window = active
      const anyActive = list.some((m) => m.status !== 'done' && relativeLabel(m.date).tone !== 'later');
      if (anyActive) return 'active';
    }
    return 'pending';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ClipboardCheck size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Deal Closure</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Locked property ── */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.lockedProperty}>
          <View style={styles.lockedPropertyTop}>
            {property.image ? (
              <Image source={{ uri: property.image }} style={styles.lockedImage} />
            ) : (
              <View style={[styles.lockedImage, styles.lockedImagePlaceholder]}>
                <Text style={styles.lockedImageInitial}>{property.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.lockedInfo}>
              <Text style={styles.lockedLabel}>CLOSING DEAL FOR</Text>
              <Text style={styles.lockedName} numberOfLines={1}>{property.name}</Text>
              <Text style={styles.lockedMeta} numberOfLines={1}>
                {property.location}{property.price ? ` · ${property.price}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.lockedHintInline}>
            <FileText size={10} color={Colors.warm400} strokeWidth={2} />
            <Text style={styles.lockedHintText}>
              Key dates extracted from <Text style={{ fontFamily: 'DMSans-SemiBold' }}>{legalDocName || 'Builder-Buyer Agreement'}</Text>
            </Text>
          </View>
        </Animated.View>

        {/* ── Progress + phase strip (compact) ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.progressCard}>
          <View style={styles.progressTitleRow}>
            <Text style={styles.progressTitleText}>
              {doneCount} of {totalCount} done
            </Text>
            <Text style={styles.progressTitlePct}>· {progressPct}%</Text>
            {overdueCount > 0 && (
              <View style={styles.overdueInline}>
                <AlertTriangle size={11} color={Colors.red500} strokeWidth={2.5} />
                <Text style={styles.overdueInlineText}>{overdueCount} overdue</Text>
              </View>
            )}
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>

          {/* Phase strip */}
          <View style={styles.phaseStrip}>
            {(['booking', 'loan', 'registration'] as Phase[]).map((phase, i) => {
              const state = phaseState(phase);
              const label =
                phase === 'booking' ? 'Booking' :
                phase === 'loan' ? 'Loan & Stamp' :
                'Registration';
              return (
                <React.Fragment key={phase}>
                  <View style={styles.phasePill}>
                    <View
                      style={[
                        styles.phaseDot,
                        state === 'done' && styles.phaseDotDone,
                        state === 'active' && styles.phaseDotActive,
                      ]}
                    >
                      {state === 'done' && <CheckCircle2 size={10} color={Colors.white} strokeWidth={3} />}
                      {state === 'active' && <View style={styles.phaseDotActiveInner} />}
                    </View>
                    <Text
                      style={[
                        styles.phaseLabel,
                        state === 'done' && styles.phaseLabelDone,
                        state === 'active' && styles.phaseLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  {i < 2 && (
                    <View style={[
                      styles.phaseConnector,
                      state === 'done' && styles.phaseConnectorDone,
                    ]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </Animated.View>

        {/* ════════════════════════════════════════════════════════════
             TIMELINE — dates + inline reminder toggle per milestone
             ════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(160).duration(300)}>
          <Text style={styles.sectionLabel}>TIMELINE</Text>
          <View style={styles.sectionHintRow}>
            <View style={styles.sectionHintIcon}>
              <Bell size={11} color={Colors.terra500} strokeWidth={2.2} fill={Colors.terra500} />
            </View>
            <Text style={styles.sectionHintInline}>
              Every date from your agreement. Tap the bell on any row to get alerts 3 days, 1 day, and morning-of the deadline.
            </Text>
          </View>
          <View style={styles.timelineWrap}>
            {MILESTONES.map((m, i) => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                isLast={i === MILESTONES.length - 1}
                reminderOn={reminders[m.id] ?? false}
                onToggleReminder={() => toggleReminder(m.id)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Info size={12} color={Colors.terra500} strokeWidth={1.5} />
          <Text style={styles.disclaimerText}>
            Dates are extracted from your agreement. Always cross-check with your builder and
            a registered advocate before acting on them.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MILESTONE ROW
// ═══════════════════════════════════════════════════════════════

function MilestoneRow({
  milestone, isLast, reminderOn, onToggleReminder,
}: {
  milestone: Milestone;
  isLast: boolean;
  reminderOn: boolean;
  onToggleReminder: () => void;
}) {
  const rel = relativeLabel(milestone.date);
  const Icon = milestone.icon;

  const nodeColor =
    milestone.status === 'done' ? Colors.green500 :
    milestone.status === 'overdue' ? Colors.red500 :
    Colors.terra500;

  const nodeBg =
    milestone.status === 'done' ? '#DCFCE7' :
    milestone.status === 'overdue' ? '#FEE2E2' :
    Colors.terra50;

  // Right-side date line. For done: green muted "Completed · date". Otherwise: "date · relative".
  const isDone = milestone.status === 'done';
  const isOverdue = milestone.status === 'overdue';

  return (
    <View style={styles.timelineRow}>
      {/* Rail + node */}
      <View style={styles.railCol}>
        <View style={[styles.timelineNode, { backgroundColor: nodeBg, borderColor: nodeColor }]}>
          {isDone ? (
            <CheckCircle2 size={14} color={nodeColor} strokeWidth={2.5} />
          ) : isOverdue ? (
            <AlertTriangle size={12} color={nodeColor} strokeWidth={2.5} />
          ) : (
            <Icon size={12} color={nodeColor} strokeWidth={2} />
          )}
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineRail,
              isDone && { backgroundColor: Colors.green500, opacity: 0.35 },
            ]}
          />
        )}
      </View>

      {/* Content */}
      <View
        style={[
          styles.timelineCard,
          isOverdue && styles.timelineCardOverdue,
          isDone && styles.timelineCardDone,
        ]}
      >
        <View style={styles.timelineCardHead}>
          <Text
            style={[styles.timelineLabel, isDone && styles.timelineLabelDone]}
            numberOfLines={2}
          >
            {milestone.label}
          </Text>
          {!isDone && (
            <TouchableOpacity
              onPress={onToggleReminder}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              style={[styles.bellBtn, reminderOn && styles.bellBtnOn]}
            >
              {reminderOn ? (
                <Bell size={13} color={Colors.terra500} strokeWidth={2.2} fill={Colors.terra500} />
              ) : (
                <BellOff size={13} color={Colors.warm400} strokeWidth={2} />
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.timelineMetaRow}>
          <Text style={[styles.timelineDate, isDone && { color: Colors.textTertiary }]}>
            {formatDate(milestone.date)}{milestone.time ? ` · ${milestone.time}` : ''}
          </Text>
          <Text style={styles.timelineDot}>·</Text>
          <Text
            style={[
              styles.timelineRel,
              isDone && { color: Colors.green500 },
              !isDone && rel.tone === 'overdue' && { color: Colors.red500 },
              !isDone && rel.tone === 'soon' && { color: Colors.terra500 },
            ]}
          >
            {isDone ? 'Completed' : rel.text}
          </Text>
        </View>

        {(milestone.amount || milestone.note) && !isDone && (
          <View style={styles.timelineInline}>
            {milestone.amount && (
              <Text style={styles.timelineAmount}>{milestone.amount}</Text>
            )}
            {milestone.note && (
              <Text style={styles.timelineNote} numberOfLines={2}>{milestone.note}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE — shown when no parsed agreement is available yet
// Deal Closure's only hard dependency is a parsed Builder-Buyer
// Agreement. Without it, we don't bounce the user back through the
// shortlist/negotiate chain — we just ask them to upload it in Legal.
// ═══════════════════════════════════════════════════════════════

function DealClosureEmpty({
  propertyName, insetsTop, onBack, onUpload,
}: {
  propertyName: string | null;
  insetsTop: number;
  onBack: () => void;
  onUpload: () => void;
}) {
  return (
    <View style={[styles.container, { paddingTop: insetsTop }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ClipboardCheck size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Deal Closure</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View entering={FadeIn.duration(260)} style={styles.emptyBody}>
        <View style={styles.emptyIllus}>
          <View style={styles.emptyDocBack} />
          <View style={styles.emptyDocFront}>
            <FileText size={32} color={Colors.terra500} strokeWidth={1.6} />
          </View>
          <View style={styles.emptyUploadChip}>
            <FileUp size={12} color={Colors.white} strokeWidth={2.4} />
          </View>
        </View>

        <Text style={styles.emptyHeadline}>Your deal hub is waiting</Text>
        <Text style={styles.emptySubhead}>
          {propertyName
            ? `Upload the agreement for ${propertyName} in Legal — I'll extract every key date and line up your timeline.`
            : `Upload your Builder-Buyer Agreement in Legal — I'll extract every key date and line up your timeline.`}
        </Text>

        <View style={styles.emptyChecklistWrap}>
          {[
            'Token, stamp duty & registration dates',
            'Loan sanction & disbursement milestones',
            'Smart reminders 3 days, 1 day, morning-of',
          ].map((item) => (
            <View key={item} style={styles.emptyChecklistRow}>
              <View style={styles.emptyChecklistDot} />
              <Text style={styles.emptyChecklistText}>{item}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.emptyPrimaryBtn}
          onPress={onUpload}
          activeOpacity={0.88}
        >
          <FileUp size={15} color={Colors.white} strokeWidth={2.2} />
          <Text style={styles.emptyPrimaryText}>Upload Agreement</Text>
          <ArrowRight size={15} color={Colors.white} strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={styles.emptyFootnote}>
          Dates are parsed automatically — no manual entry.
        </Text>
      </Animated.View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// PREPARING SCREEN — intermediate loader
// ═══════════════════════════════════════════════════════════════

const PREP_STEPS = [
  { id: 'dates', label: 'Extracting key dates from agreement', icon: FilePen },
  { id: 'reminders', label: 'Setting up smart reminders', icon: Bell },
  { id: 'milestones', label: 'Mapping your closure milestones', icon: ClipboardCheck },
];

function PreparingScreen({
  propertyName, docName, insetsTop, onBack,
}: {
  propertyName: string;
  docName: string;
  insetsTop: number;
  onBack: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  // Single driver. Every piece of the hero derives from this.
  // 0 → 0.72 : scan travels top→bottom, rows flash & lock in sequence
  // 0.72 → 0.86 : hold — extracted data sits brightly on the page
  // 0.86 → 1.00 : fade — rows dim back, scan retreats, ready to loop
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 3800, easing: Easing.bezier(0.65, 0, 0.35, 1) }),
      -1, false,
    );

    const stepInterval = setInterval(() => {
      setCurrentStep((s) => Math.min(s + 1, PREP_STEPS.length - 1));
    }, 800);

    return () => clearInterval(stepInterval);
  }, []);

  return (
    <Animated.View
      style={[styles.container, { paddingTop: insetsTop }]}
      exiting={FadeOut.duration(200)}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ClipboardCheck size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Deal Closure</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.prepBody}>
        {/* Hero — live extraction: document being read, key rows lighting up */}
        <ScanDocHero progress={progress} />


        <Text style={styles.prepHeadline}>Setting up your deal hub</Text>
        <Text style={styles.prepSubhead} numberOfLines={2}>
          Reading {docName} for {propertyName}
        </Text>

        {/* Steps */}
        <View style={styles.prepStepsWrap}>
          {PREP_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <Animated.View
                key={step.id}
                style={[
                  styles.prepStepRow,
                  isActive && styles.prepStepRowActive,
                ]}
                entering={FadeIn.delay(i * 120).duration(300)}
              >
                <View
                  style={[
                    styles.prepStepIconWrap,
                    (isDone || isActive) && styles.prepStepIconWrapActive,
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={14} color={Colors.green500} strokeWidth={2.5} />
                  ) : (
                    <Icon
                      size={13}
                      color={isActive ? Colors.terra500 : Colors.warm400}
                      strokeWidth={2}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.prepStepLabel,
                    isActive && styles.prepStepLabelActive,
                    isDone && styles.prepStepLabelDone,
                  ]}
                >
                  {step.label}
                </Text>
                {isActive && <PrepDots />}
              </Animated.View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCAN DOC HERO — live-extraction animation
// A document card where rows light up in sequence as a scan bar
// sweeps down. Two "key" rows settle to terra (extracted), the rest
// settle to warm (read and passed). At cycle end, everything dims
// back to baseline for a seamless loop.
// ═══════════════════════════════════════════════════════════════

const DOC_WIDTH = 188;
const DOC_HEIGHT = 208;
const DOC_INSET_X = 14;
const DOC_HEADER_H = 28;
const DOC_FOOTER_H = 22;
const DOC_BODY_PAD_Y = 12;
const DOC_BODY_H = DOC_HEIGHT - DOC_HEADER_H - DOC_FOOTER_H - DOC_BODY_PAD_Y * 2;

// 6 rows. `rowStart` = progress at which the scan bar crosses this row.
// isKey rows settle to terra (the extracted entities).
type DocRowSpec = { rowStart: number; width: number; isKey: boolean };
const DOC_ROWS: DocRowSpec[] = [
  { rowStart: 0.08, width: 88, isKey: false },
  { rowStart: 0.20, width: 62, isKey: false },
  { rowStart: 0.32, width: 82, isKey: true },   // key date
  { rowStart: 0.44, width: 55, isKey: false },
  { rowStart: 0.56, width: 76, isKey: true },   // key amount
  { rowStart: 0.68, width: 46, isKey: false },
];

function ScanDocHero({ progress }: { progress: SharedValue<number> }) {
  // Card lift — subtle breath synced to the cycle. Barely perceptible.
  const cardStyle = useAnimatedStyle(() => {
    const lift = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, -2, 0],
      'clamp',
    );
    return { transform: [{ translateY: lift }] };
  });

  // Scan bar: glides from top of body to bottom during 0→0.72,
  // visible only while scanning.
  const scanStyle = useAnimatedStyle(() => {
    const y = interpolate(progress.value, [0, 0.72], [0, DOC_BODY_H], 'clamp');
    const op = interpolate(
      progress.value,
      [0, 0.04, 0.70, 0.78],
      [0, 1, 1, 0],
      'clamp',
    );
    return { transform: [{ translateY: y }], opacity: op };
  });

  // Soft wash beneath the scan bar — gives it weight, like a highlighter's
  // afterglow. Same Y, larger height, low opacity.
  const scanGlowStyle = useAnimatedStyle(() => {
    const y = interpolate(progress.value, [0, 0.72], [-18, DOC_BODY_H - 18], 'clamp');
    const op = interpolate(
      progress.value,
      [0, 0.06, 0.70, 0.80],
      [0, 0.5, 0.5, 0],
      'clamp',
    );
    return { transform: [{ translateY: y }], opacity: op };
  });

  // Header icon: gentle tick-forward when scan begins, to signal life.
  const headerIconStyle = useAnimatedStyle(() => {
    const s = interpolate(progress.value, [0, 0.05, 0.12], [1, 1.12, 1], 'clamp');
    return { transform: [{ scale: s }] };
  });

  return (
    <Animated.View style={[styles.docHero, cardStyle]}>
      {/* Floor shadow — separate layer so the doc feels anchored */}
      <View style={styles.docShadow} />

      <View style={styles.docCard}>
        {/* Header — clipboard + title bar */}
        <View style={styles.docHeader}>
          <Animated.View style={headerIconStyle}>
            <ClipboardCheck size={12} color={Colors.terra500} strokeWidth={2.4} />
          </Animated.View>
          <View style={styles.docHeaderBar} />
        </View>

        {/* Body — rows + scan bar */}
        <View style={styles.docBody}>
          {DOC_ROWS.map((row, i) => (
            <DocRow
              key={i}
              index={i}
              progress={progress}
              rowStart={row.rowStart}
              width={row.width}
              isKey={row.isKey}
            />
          ))}

          {/* Scan glow (soft wash) sits under the sharp bar */}
          <Animated.View style={[styles.scanGlow, scanGlowStyle]} pointerEvents="none" />
          {/* Scan bar (sharp line) */}
          <Animated.View style={[styles.scanBar, scanStyle]} pointerEvents="none" />
        </View>

        {/* Footer identity strip */}
        <View style={styles.docFooter}>
          <View style={styles.docFooterTick} />
          <Text style={styles.docFooterText}>BUILDER–BUYER AGREEMENT</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function DocRow({
  index, progress, rowStart, width, isKey,
}: {
  index: number;
  progress: SharedValue<number>;
  rowStart: number;
  width: number;
  isKey: boolean;
}) {
  const rowStyle = useAnimatedStyle(() => {
    const p = progress.value;

    // How locked-in the row is (0 before scan crosses, 1 shortly after).
    const locked = interpolate(p, [rowStart, rowStart + 0.05], [0, 1], 'clamp');

    // Brief flash right as the scan crosses — narrow triangular pulse.
    const flash =
      p < rowStart - 0.035 || p > rowStart + 0.035
        ? 0
        : 1 - Math.abs(p - rowStart) / 0.035;

    // Fade-back at cycle end — mask that collapses everyone to baseline.
    const endFade = interpolate(p, [0.86, 0.98], [1, 0], 'clamp');

    const baseOp = 0.16;
    const settledOp = isKey ? 0.95 : 0.40;
    const lockedOp = baseOp + (settledOp - baseOp) * locked;
    const withFlash = lockedOp + (1 - lockedOp) * flash;
    const finalOp = baseOp + (withFlash - baseOp) * endFade;

    // Color: non-key stays warm; key rows shift to terra as they lock.
    // Flash briefly pushes toward terra for every row regardless.
    const colorBlend = Math.max(flash, isKey ? locked : 0);
    const bg = interpolateColor(
      colorBlend,
      [0, 1],
      [Colors.warm400, Colors.terra500],
    );

    return { backgroundColor: bg, opacity: finalOp };
  });

  return (
    <Animated.View
      style={[
        styles.docRow,
        { width: `${width}%` as any, marginTop: index === 0 ? 0 : 10 },
        rowStyle,
      ]}
    />
  );
}

function PrepDots() {
  const d1 = useSharedValue(0.3);
  const d2 = useSharedValue(0.3);
  const d3 = useSharedValue(0.3);
  useEffect(() => {
    d1.value = withRepeat(withSequence(
      withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 }),
    ), -1, false);
    d2.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 150 }),
      withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 }),
    ), -1, false);
    d3.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 300 }),
      withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 }),
    ), -1, false);
  }, []);
  const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));
  return (
    <View style={styles.prepDotsRow}>
      <Animated.View style={[styles.prepDot, s1]} />
      <Animated.View style={[styles.prepDot, s2]} />
      <Animated.View style={[styles.prepDot, s3]} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
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

  // Locked property
  lockedProperty: {
    marginHorizontal: Spacing.xxl, padding: 12,
    backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  lockedPropertyTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  lockedImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: Colors.warm100 },
  lockedImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  lockedImageInitial: { fontSize: 22, fontFamily: 'DMSerifDisplay', color: Colors.terra500 },
  lockedInfo: { flex: 1 },
  lockedLabel: {
    fontSize: 9, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.6, marginBottom: 2,
  },
  lockedName: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  lockedMeta: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textSecondary, marginTop: 1 },
  lockedHintInline: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.warm200,
  },
  lockedHintText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 10,
    color: Colors.warm500, lineHeight: 14,
  },

  // Progress + status strip
  progressCard: {
    marginHorizontal: Spacing.xxl, marginTop: Spacing.lg,
    padding: 14, borderRadius: 14,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.warm200,
  },
  progressTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
    flexWrap: 'wrap',
  },
  progressTitleText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.textPrimary,
  },
  progressTitlePct: {
    fontFamily: 'DMSans-Medium', fontSize: 13, color: Colors.textTertiary,
  },
  overdueInline: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: '#FEE2E2', borderRadius: 8,
  },
  overdueInlineText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 11, color: Colors.red500,
  },
  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: Colors.warm100,
    overflow: 'hidden', marginBottom: 14,
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.terra500, borderRadius: 2,
  },

  phaseStrip: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 2,
  },
  phasePill: { alignItems: 'center', gap: 5 },
  phaseDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.warm300,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  phaseDotDone: {
    backgroundColor: Colors.green500, borderColor: Colors.green500,
  },
  phaseDotActive: {
    backgroundColor: Colors.terra50, borderColor: Colors.terra500,
  },
  phaseDotActiveInner: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.terra500,
  },
  phaseLabel: {
    fontFamily: 'DMSans-Medium', fontSize: 10, color: Colors.textTertiary,
  },
  phaseLabelDone: { color: Colors.green500 },
  phaseLabelActive: { color: Colors.terra600, fontFamily: 'DMSans-SemiBold' },
  phaseConnector: {
    flex: 1, height: 2, backgroundColor: Colors.warm200,
    marginHorizontal: 4, marginBottom: 18,
  },
  phaseConnectorDone: { backgroundColor: Colors.green500, opacity: 0.35 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, marginHorizontal: Spacing.xxl, marginTop: 24, marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textSecondary,
    marginHorizontal: Spacing.xxl, marginBottom: 12, lineHeight: 17,
  },
  sectionHintRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginHorizontal: Spacing.xxl, marginBottom: 12,
  },
  sectionHintInline: {
    flex: 1,
    fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textSecondary,
    lineHeight: 17,
  },
  sectionHintIcon: {
    // Seat the bell on the first line's x-height.
    marginTop: 3,
  },

  // ── Timeline ──
  timelineWrap: {
    marginHorizontal: Spacing.xxl, paddingTop: 4,
  },
  timelineRow: {
    flexDirection: 'row', gap: 12,
  },
  railCol: {
    alignItems: 'center', width: 28,
  },
  timelineNode: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  timelineRail: {
    flex: 1, width: 2, minHeight: 30,
    backgroundColor: Colors.warm200,
    marginVertical: 2,
  },
  timelineCard: {
    flex: 1, marginBottom: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  timelineCardOverdue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  timelineCardDone: {
    backgroundColor: Colors.warm50,
    borderColor: Colors.warm100,
  },
  timelineCardHead: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4,
  },
  timelineLabel: {
    flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 13,
    color: Colors.textPrimary, lineHeight: 18,
  },
  timelineLabelDone: {
    color: Colors.textSecondary,
  },
  timelineMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap',
  },
  timelineDate: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary,
  },
  timelineDot: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.warm300,
  },
  timelineRel: {
    fontFamily: 'DMSans-Medium', fontSize: 11, color: Colors.textSecondary,
  },
  timelineInline: {
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: Colors.warm100,
    gap: 3,
  },
  timelineAmount: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.textPrimary,
  },
  timelineNote: {
    fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textSecondary,
    lineHeight: 16,
  },
  bellBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.warm50,
  },
  bellBtnOn: {
    backgroundColor: Colors.terra50,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginHorizontal: Spacing.xxl, marginTop: 20,
    padding: 10, borderRadius: 8,
    backgroundColor: Colors.warm50,
  },
  disclaimerText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 10,
    color: Colors.textSecondary, lineHeight: 14, fontStyle: 'italic',
  },

  // ── Empty state (agreement not uploaded yet) ──
  emptyBody: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: Spacing.xxl, paddingTop: 64,
  },
  // Layered document illustration: a back card peeks behind the front one,
  // with a small terra upload-chip clipped to the corner. Reads as
  // "document waiting for upload" without a stock illustration.
  emptyIllus: {
    width: 120, height: 120, alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  emptyDocBack: {
    position: 'absolute',
    top: 14, left: 28,
    width: 72, height: 90, borderRadius: 10,
    backgroundColor: Colors.warm100,
    transform: [{ rotate: '-6deg' }],
  },
  emptyDocFront: {
    width: 84, height: 100, borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.warm200,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06, shadowRadius: 14,
    elevation: 3,
  },
  emptyUploadChip: {
    position: 'absolute',
    right: 16, bottom: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.terra500,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.terra500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10,
    elevation: 6,
  },
  emptyHeadline: {
    fontFamily: 'DMSerifDisplay', fontSize: 26, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 8,
  },
  emptySubhead: {
    fontFamily: 'DMSans-Regular', fontSize: 13.5, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  emptyChecklistWrap: {
    alignSelf: 'stretch',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.warm50,
    borderWidth: 1, borderColor: Colors.warm100,
    marginBottom: 28,
  },
  emptyChecklistRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  emptyChecklistDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.terra500,
  },
  emptyChecklistText: {
    flex: 1,
    fontFamily: 'DMSans-Medium', fontSize: 12.5,
    color: Colors.textSecondary,
  },
  emptyPrimaryBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.terra500,
    shadowColor: Colors.terra500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14,
    elevation: 6,
  },
  emptyPrimaryText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 15, color: Colors.white,
  },
  emptyFootnote: {
    marginTop: 14,
    fontFamily: 'DMSans-Regular', fontSize: 11.5,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // ── Preparing screen ──
  prepBody: {
    flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xxl,
    paddingTop: 60,
  },
  // ── ScanDoc hero ──
  docHero: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  docShadow: {
    position: 'absolute',
    bottom: -6, width: DOC_WIDTH - 32, height: 14, borderRadius: 12,
    backgroundColor: Colors.warm400,
    opacity: 0.10,
  },
  docCard: {
    width: DOC_WIDTH, height: DOC_HEIGHT,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm100,
    paddingHorizontal: DOC_INSET_X,
    shadowColor: '#0A0A0A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06, shadowRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  docHeader: {
    height: DOC_HEADER_H,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  docHeaderBar: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: Colors.warm200,
    opacity: 0.7,
  },
  docBody: {
    flex: 1,
    paddingVertical: DOC_BODY_PAD_Y,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  docRow: {
    height: 8, borderRadius: 4,
    backgroundColor: Colors.warm400,
  },
  scanBar: {
    position: 'absolute',
    left: -DOC_INSET_X, right: -DOC_INSET_X, top: DOC_BODY_PAD_Y - 1,
    height: 2,
    backgroundColor: Colors.terra500,
    shadowColor: Colors.terra500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 6,
    elevation: 4,
  },
  scanGlow: {
    position: 'absolute',
    left: -DOC_INSET_X, right: -DOC_INSET_X, top: DOC_BODY_PAD_Y,
    height: 36,
    backgroundColor: Colors.terra100 ?? '#FCE6DC',
  },
  docFooter: {
    height: DOC_FOOTER_H,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, borderTopColor: Colors.warm100,
  },
  docFooterTick: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.terra500,
  },
  docFooterText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 8.5,
    letterSpacing: 0.7,
    color: Colors.textTertiary,
  },
  prepHeadline: {
    fontFamily: 'DMSerifDisplay', fontSize: 24, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 6,
  },
  prepSubhead: {
    fontFamily: 'DMSans-Regular', fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 19, marginBottom: 32,
    paddingHorizontal: 12,
  },
  prepStepsWrap: {
    alignSelf: 'stretch', gap: 8,
  },
  prepStepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, backgroundColor: Colors.warm50,
    borderWidth: 1, borderColor: Colors.warm100,
  },
  prepStepRowActive: {
    backgroundColor: Colors.terra50, borderColor: Colors.terra200,
  },
  prepStepIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  prepStepIconWrapActive: {
    backgroundColor: Colors.white,
  },
  prepStepLabel: {
    flex: 1, fontFamily: 'DMSans-Medium', fontSize: 13,
    color: Colors.textTertiary,
  },
  prepStepLabelActive: {
    color: Colors.textPrimary, fontFamily: 'DMSans-SemiBold',
  },
  prepStepLabelDone: {
    color: Colors.textSecondary,
  },
  prepDotsRow: {
    flexDirection: 'row', gap: 3, alignItems: 'center',
  },
  prepDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.terra500,
  },
});
