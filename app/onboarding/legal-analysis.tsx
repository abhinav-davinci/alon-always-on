import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Scale,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Wallet,
  RefreshCw,
  Shield,
  Calendar,
  CreditCard,
  Home,
  ShieldCheck,
  ClipboardCheck,
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
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import { calculateEligibility, getInterestRate, formatINR, formatINRShort } from '../../utils/financeCalc';
import { parsePriceToNumber } from '../../utils/compareScore';
import LegalPropertySelector from '../../components/LegalPropertySelector';
import { defaultLegalPropertyId, resolveLegalProperty } from '../../utils/legalProperty';

// ═══════════════════════════════════════════════════════════════
// DEMO DATA (Phase 1: pre-baked analysis for MahaRERA model)
// ═══════════════════════════════════════════════════════════════

interface RiskFinding {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  quote: string;
  explanation: string;
  action: string;
}

const DEMO_RISKS: RiskFinding[] = [
  // HIGH (2)
  {
    id: 'no-possession-penalty',
    severity: 'high',
    title: 'No possession delay penalty clause',
    quote: '"In the event of delay in possession, the Promoter shall not be liable for any compensation..."',
    explanation: 'The agreement lacks a clear penalty clause if the builder delays possession beyond the promised date. RERA mandates a minimum interest payout at MCLR+2% for delays — this is missing.',
    action: 'Demand a clause stating ₹X per sq.ft per month of delay, or interest at MCLR+2% on amounts paid.',
  },
  {
    id: 'one-sided-cancellation',
    severity: 'high',
    title: 'One-sided cancellation terms',
    quote: '"In case of cancellation by the Allottee, 10% of the total consideration shall be forfeited by the Promoter..."',
    explanation: 'You lose 10% if you cancel, but the builder faces no equivalent penalty for their default or delay. This is an unfair trade practice under the Consumer Protection Act.',
    action: 'Negotiate reciprocal terms: 10% penalty only after construction milestones; builder pays equal penalty on delay.',
  },
  // MEDIUM (3)
  {
    id: 'maintenance-above-avg',
    severity: 'medium',
    title: 'Maintenance above area average',
    quote: '"Monthly maintenance charges shall be ₹4.50 per sq.ft..."',
    explanation: 'Baner area average is ₹3.50/sq.ft. You are paying 28% above market rate. Over 5 years on a 1,450 sq.ft flat, this adds up to ₹87,000 in excess maintenance.',
    action: 'Ask for a breakdown of maintenance costs. Push to negotiate down to ₹3.75-4.00/sq.ft.',
  },
  {
    id: 'club-membership',
    severity: 'medium',
    title: 'Club membership not disclosed at booking',
    quote: '"A one-time club membership fee of ₹2,50,000 is payable at the time of possession..."',
    explanation: 'This charge was not mentioned at the booking stage. MahaRERA disclosure norms require all charges to be stated upfront.',
    action: 'Ask for a written waiver of this fee or reduction by 50%. Many builders waive it during negotiation.',
  },
  {
    id: 'common-area-ambiguous',
    severity: 'medium',
    title: 'Common-area definition is ambiguous',
    quote: '"Common areas include such areas as the Promoter may designate..."',
    explanation: 'The clause gives the builder unilateral discretion to designate common areas, which can reduce your usable carpet area post-possession.',
    action: 'Insist on a specific, itemized list of common areas with sq.ft allocations in an annexure.',
  },
  // LOW (4)
  {
    id: 'arbitration',
    severity: 'low',
    title: 'Standard arbitration clause',
    quote: '"Any disputes shall be resolved by arbitration in Pune..."',
    explanation: 'Standard clause, aligned with MahaRERA requirements. Nothing to worry about.',
    action: 'No action needed.',
  },
  {
    id: 'jurisdiction',
    severity: 'low',
    title: 'Default jurisdiction clause',
    quote: '"Courts in Pune shall have exclusive jurisdiction..."',
    explanation: 'Standard and fair — disputes can be filed in Pune where the property is located.',
    action: 'No action needed.',
  },
  {
    id: 'missing-disclosure',
    severity: 'low',
    title: 'Non-mandatory MahaRERA disclosure missing',
    quote: '(Page 7: promoter financial disclosure section incomplete)',
    explanation: 'The optional promoter financial disclosure is incomplete. Not legally required, but reduces transparency.',
    action: 'Request the builder share their 3-year financial statement if you want extra assurance.',
  },
  {
    id: 'formatting',
    severity: 'low',
    title: 'Minor formatting inconsistencies',
    quote: '(Various pages: numbering, font inconsistencies)',
    explanation: 'Minor typos and inconsistent formatting. No legal impact.',
    action: 'No action needed.',
  },
];

interface BenchmarkItem {
  label: string;
  yours: string;
  market: string;
  severity: 'concern' | 'neutral' | 'favorable';
  deltaText: string;
  why?: string;
}

const DEMO_BENCHMARKS: BenchmarkItem[] = [
  {
    label: 'Maintenance',
    yours: '₹4.50/sq.ft',
    market: '₹3.50/sq.ft',
    severity: 'concern',
    deltaText: '+28% above',
    why: 'Adds ~₹87K over 5 years on a 1,450 sq.ft flat',
  },
  {
    label: 'Possession buffer',
    yours: '8 months',
    market: '3–6 months',
    severity: 'concern',
    deltaText: 'Builder has buffer',
    why: 'Extra months let the builder delay without penalty',
  },
  {
    label: 'Floor rise',
    yours: '₹75/sq.ft',
    market: '₹50–100/sq.ft',
    severity: 'neutral',
    deltaText: 'Within range',
  },
  {
    label: 'GST',
    yours: '5% on under-construction',
    market: 'Standard',
    severity: 'neutral',
    deltaText: 'As per law',
  },
  {
    label: 'Cancellation penalty',
    yours: '10% (buyer only)',
    market: 'Reciprocal preferred',
    severity: 'concern',
    deltaText: 'One-sided',
    why: 'You forfeit 10%, builder owes nothing on delay',
  },
];

// ═══════════════════════════════════════════════════════════════
// SCREEN
// ═══════════════════════════════════════════════════════════════

export default function LegalAnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const {
    negotiatePropertyId,
    likedPropertyIds,
    userProperties,
    externalProperties,
    cibilScore,
    monthlyIncome,
    existingEMIs,
    legalAnalyses,
    activeLegalPropertyId,
    setActiveLegalProperty,
    setLegalAnalysisForProperty,
    clearLegalAnalysisForProperty,
    addExternalProperty,
    updateExternalProperty,
  } = useOnboardingStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedSeverity, setExpandedSeverity] = useState<'high' | 'medium' | 'low' | null>('high');

  // First-visit defaulting: prefer Negotiate lock → shortlist → userProperties → null.
  // We only set the default once (when the selection is empty). If the user
  // later picks something else via the selector, we keep their choice.
  React.useEffect(() => {
    if (activeLegalPropertyId) return;
    const fallback = defaultLegalPropertyId({
      negotiatePropertyId,
      likedPropertyIds,
      userProperties,
    });
    if (fallback) setActiveLegalProperty(fallback);
  }, [activeLegalPropertyId, negotiatePropertyId, likedPropertyIds, userProperties, setActiveLegalProperty]);

  const property = useMemo(
    () => resolveLegalProperty({ userProperties, externalProperties }, activeLegalPropertyId),
    [activeLegalPropertyId, userProperties, externalProperties],
  );

  // Pending-external: user picked "Analyze a different property" and we
  // created a placeholder record, but the agreement hasn't been uploaded
  // yet so name/location are still empty. In this mode, the upload card
  // announces the auto-extract flow; after upload, the AI fills in details.
  const isExternalPending = property?.source === 'external' && !property.name;

  // Per-property analysis record — null if this property hasn't been analyzed yet.
  const analysisRecord = activeLegalPropertyId ? legalAnalyses[activeLegalPropertyId] : null;
  const analysisDone = Boolean(analysisRecord);
  const docName = analysisRecord?.docName ?? null;

  const handleStartExternalUpload = useCallback(() => {
    // Create an empty placeholder — the parser populates it after upload.
    // Intentionally no user-typed fields: the agreement is the source of truth.
    const id = addExternalProperty({ name: '', location: '' });
    setActiveLegalProperty(id);
    haptics.selection();
  }, [addExternalProperty, setActiveLegalProperty, haptics]);

  const startAnalysis = useCallback(
    (fileName: string = 'Builder-Buyer Agreement') => {
      if (!activeLegalPropertyId) return; // can't analyze without a property
      haptics.medium();
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        // External-pending: the uploaded agreement is the source of truth
        // for property metadata. In production the parser fills these in;
        // for this prototype we mock plausible demo values so the rest of
        // the screen (AT A GLANCE, affordability, benchmarks) has context.
        if (isExternalPending && activeLegalPropertyId) {
          updateExternalProperty(activeLegalPropertyId, {
            name: 'Kumar Pebble Bay',
            location: 'Kalyani Nagar, Pune',
            price: '₹1.68 Cr',
            propertyType: 'Apartment',
          });
        }
        setLegalAnalysisForProperty({ propertyId: activeLegalPropertyId, docName: fileName });
        haptics.success();
      }, 3500);
    },
    [activeLegalPropertyId, isExternalPending, setLegalAnalysisForProperty, updateExternalProperty, haptics],
  );

  const reupload = useCallback(() => {
    if (!activeLegalPropertyId) return;
    haptics.light();
    clearLegalAnalysisForProperty(activeLegalPropertyId);
  }, [activeLegalPropertyId, clearLegalAnalysisForProperty, haptics]);

  // ═══ RISK COUNTS ═══
  const highCount = DEMO_RISKS.filter((r) => r.severity === 'high').length;

  // ═══ AFFORDABILITY ═══
  // Only meaningful once a property is selected; empty-state path falls back to 0s
  // and the affordability block doesn't render unless analysis is complete anyway.
  const propertyPrice = property ? parsePriceToNumber(property.price ?? '') : 0;
  const additionalCosts = propertyPrice * 0.095; // ~9.5% (stamp+reg+GST+misc)
  const totalCost = propertyPrice + additionalCosts;
  const hasFinanceData = cibilScore !== null || monthlyIncome > 0;
  const eligibility = hasFinanceData && monthlyIncome > 0
    ? calculateEligibility(monthlyIncome, existingEMIs || 0, cibilScore)
    : null;
  const eligibilityTotal = eligibility
    ? eligibility.maxLoanAmount + propertyPrice * 0.2 // assume 20% down
    : null;
  const shortfall = eligibilityTotal ? totalCost - eligibilityTotal : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Scale size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Legal Analysis</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Property selector (replaces the old locked card) ── */}
        <LegalPropertySelector
          activePropertyId={activeLegalPropertyId}
          onChange={setActiveLegalProperty}
          onStartExternalUpload={handleStartExternalUpload}
        />

        {/* ════════════════════════════════════
             STATE: Upload (no analysis yet)
             ════════════════════════════════════ */}
        {!analysisDone && !isProcessing && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Text style={styles.sectionLabel}>UPLOAD YOUR AGREEMENT</Text>

            <View style={styles.uploadCard}>
              <View style={styles.uploadIconWrap}>
                <FileText size={28} color={Colors.terra500} strokeWidth={1.8} />
              </View>
              <Text style={styles.uploadHeadline}>Upload your builder agreement</Text>
              <Text style={styles.uploadBody}>
                {isExternalPending
                  ? "I'll pull the project name, location, and price straight from the agreement — no typing needed. Then I'll flag risky clauses, check affordability, and benchmark every term against MahaRERA and Pune market norms."
                  : 'ALON will parse it, flag risky clauses, check affordability, and benchmark every term against MahaRERA standards and Pune market norms.'}
              </Text>

              <TouchableOpacity
                style={[styles.uploadBtn, !activeLegalPropertyId && styles.uploadBtnDisabled]}
                onPress={() => startAnalysis()}
                activeOpacity={0.85}
                disabled={!activeLegalPropertyId}
              >
                <Upload size={16} color={Colors.white} strokeWidth={2} />
                <Text style={styles.uploadBtnText}>
                  {activeLegalPropertyId ? 'Choose a PDF or image' : 'Select a property first'}
                </Text>
              </TouchableOpacity>

            </View>

            {/* What ALON checks */}
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>What ALON checks</Text>
              <FeatureBullet text="Plain-language TL;DR — the entire agreement in 5 bullets" />
              <FeatureBullet text="Risk detection categorized by severity (High, Medium, Low)" />
              <FeatureBullet text="Affordability check using your Finance data" />
              <FeatureBullet text="Clause-by-clause benchmarking vs MahaRERA model" />
            </View>
          </Animated.View>
        )}

        {/* ════════════════════════════════════
             STATE: Processing
             ════════════════════════════════════ */}
        {isProcessing && <ScanningCard />}

        {/* ════════════════════════════════════
             STATE: Analysis complete
             ════════════════════════════════════ */}
        {analysisDone && !isProcessing && property && (
          <>
            {/* Document row + re-upload */}
            <View style={styles.docRow}>
              <View style={styles.docIconWrap}>
                <FileText size={14} color={Colors.terra500} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docName} numberOfLines={1}>{docName || 'Agreement.pdf'}</Text>
                <Text style={styles.docSub}>Analyzed · 3 sections reviewed</Text>
              </View>
              <TouchableOpacity style={styles.reuploadBtn} onPress={reupload} activeOpacity={0.7}>
                <RefreshCw size={12} color={Colors.terra500} strokeWidth={2} />
                <Text style={styles.reuploadText}>Re-upload</Text>
              </TouchableOpacity>
            </View>

            {/* ── At a Glance ── */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.sectionLabel}>AT A GLANCE</Text>
              <View style={styles.glanceCard}>
                <GlanceRow
                  icon={<Wallet size={14} color={Colors.terra500} strokeWidth={2} />}
                  label="Agreement value"
                  value={`${property.price ?? 'Price not set'} · ${property.name}`}
                />
                <GlanceRow
                  icon={<Calendar size={14} color={Colors.terra500} strokeWidth={2} />}
                  label="Possession promised"
                  value="Dec 2026"
                  warning="No delay penalty clause"
                />
                <GlanceRow
                  icon={<CreditCard size={14} color={Colors.terra500} strokeWidth={2} />}
                  label="Payment plan"
                  value="10 construction-linked stages · 20% upfront"
                />
                <GlanceRow
                  icon={<Home size={14} color={Colors.terra500} strokeWidth={2} />}
                  label="Monthly maintenance"
                  value="₹4.50/sq.ft"
                  warning="28% above Baner average"
                />
                <GlanceRow
                  icon={<ShieldCheck size={14} color="#16A34A" strokeWidth={2} />}
                  label="RERA verified"
                  value="P52100012345"
                />
              </View>
            </Animated.View>

            {/* ── What We Found ── */}
            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
              <Text style={styles.sectionLabel}>WHAT WE FOUND</Text>

              {/* What to do first — prioritizing hint */}
              <View style={styles.priorityHint}>
                <AlertTriangle size={13} color="#C2410C" strokeWidth={2} />
                <Text style={styles.priorityHintText}>
                  <Text style={styles.priorityHintBold}>Start with the {highCount} high-priority items</Text> — they have the biggest impact on your negotiation leverage.
                </Text>
              </View>

              {/* Risk findings (collapsible by severity) */}
              <RiskSection
                severity="high"
                label="High priority"
                color="#DC2626"
                bgColor="#FEE2E2"
                findings={DEMO_RISKS.filter((r) => r.severity === 'high')}
                expanded={expandedSeverity === 'high'}
                onToggle={() => { haptics.light(); setExpandedSeverity(expandedSeverity === 'high' ? null : 'high'); }}
              />
              <RiskSection
                severity="medium"
                label="Medium priority"
                color="#C2410C"
                bgColor="#FFEDD5"
                findings={DEMO_RISKS.filter((r) => r.severity === 'medium')}
                expanded={expandedSeverity === 'medium'}
                onToggle={() => { haptics.light(); setExpandedSeverity(expandedSeverity === 'medium' ? null : 'medium'); }}
              />
              <RiskSection
                severity="low"
                label="Low priority"
                color="#16A34A"
                bgColor="#DCFCE7"
                findings={DEMO_RISKS.filter((r) => r.severity === 'low')}
                expanded={expandedSeverity === 'low'}
                onToggle={() => { haptics.light(); setExpandedSeverity(expandedSeverity === 'low' ? null : 'low'); }}
              />
            </Animated.View>

            {/* ── Affordability check ── */}
            <Animated.View entering={FadeInDown.delay(300).duration(300)}>
              <Text style={styles.sectionLabel}>DOES IT FIT YOUR BUDGET?</Text>
              <View style={styles.affordabilityCard}>
                <View style={styles.affordabilityHeader}>
                  <Wallet size={16} color={Colors.terra500} strokeWidth={2} />
                  <Text style={styles.affordabilityTitle}>Total cost of buying</Text>
                </View>

                <View style={styles.affordabilityRow}>
                  <Text style={styles.affordabilityLabel}>Agreement value</Text>
                  <Text style={styles.affordabilityValue}>{formatINR(propertyPrice)}</Text>
                </View>
                <View style={styles.affordabilityRow}>
                  <Text style={styles.affordabilityLabel}>Stamp duty, registration, GST, misc (~9.5%)</Text>
                  <Text style={styles.affordabilityValue}>+ {formatINR(additionalCosts)}</Text>
                </View>
                <View style={[styles.affordabilityRow, styles.affordabilityTotalRow]}>
                  <Text style={styles.affordabilityTotalLabel}>All-in cost</Text>
                  <Text style={styles.affordabilityTotalValue}>{formatINR(totalCost)}</Text>
                </View>

                {/* Your eligibility */}
                {hasFinanceData && eligibility && eligibilityTotal !== null ? (
                  <>
                    <View style={styles.affordabilityDivider} />
                    <View style={styles.affordabilityRow}>
                      <Text style={styles.affordabilityLabel}>Your loan eligibility</Text>
                      <Text style={styles.affordabilityValue}>{formatINR(eligibility.maxLoanAmount)}</Text>
                    </View>
                    <View style={styles.affordabilityRow}>
                      <Text style={styles.affordabilityLabel}>+ 20% down payment</Text>
                      <Text style={styles.affordabilityValue}>{formatINR(propertyPrice * 0.2)}</Text>
                    </View>
                    <View style={[styles.affordabilityRow, styles.affordabilityTotalRow]}>
                      <Text style={styles.affordabilityTotalLabel}>Total budget</Text>
                      <Text style={styles.affordabilityTotalValue}>{formatINR(eligibilityTotal)}</Text>
                    </View>

                    {/* Verdict */}
                    {shortfall !== null && shortfall > 0 ? (
                      <View style={styles.verdictCard}>
                        <AlertTriangle size={14} color="#C2410C" strokeWidth={2} />
                        <Text style={styles.verdictTextWarn}>
                          Stretches your budget by <Text style={{ fontFamily: 'DMSans-Bold' }}>{formatINR(shortfall)}</Text>. Negotiate the additional charges (maintenance, club fee) to close the gap.
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.verdictCard, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                        <CheckCircle2 size={14} color="#16A34A" strokeWidth={2} />
                        <Text style={[styles.verdictTextWarn, { color: '#166534' }]}>
                          Within your budget. You have <Text style={{ fontFamily: 'DMSans-Bold' }}>{formatINR(Math.abs(shortfall || 0))}</Text> of headroom.
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.affordabilityHint}>
                    <Info size={12} color={Colors.warm400} strokeWidth={2} />
                    <Text style={styles.affordabilityHintText}>
                      Complete the Finance step to see personalized affordability checks.
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* ── Market benchmarking ── */}
            <Animated.View entering={FadeInDown.delay(400).duration(300)}>
              <Text style={styles.sectionLabel}>HOW YOUR TERMS COMPARE</Text>
              <View style={styles.benchmarkCard}>
                <View style={styles.benchmarkHeader}>
                  <TrendingUp size={14} color={Colors.terra500} strokeWidth={2} />
                  <Text style={styles.benchmarkTitle}>Your terms vs Pune market</Text>
                </View>

                {DEMO_BENCHMARKS.map((item, i) => {
                  const isConcern = item.severity === 'concern';
                  const isFavorable = item.severity === 'favorable';
                  return (
                    <View
                      key={item.label}
                      style={[styles.benchmarkRow, i < DEMO_BENCHMARKS.length - 1 && styles.benchmarkRowBorder]}
                    >
                      <View style={styles.benchmarkTopRow}>
                        <Text style={styles.benchmarkLabel}>{item.label}</Text>
                        <View
                          style={[
                            styles.benchmarkBadge,
                            isConcern && styles.benchmarkBadgeConcern,
                            isFavorable && styles.benchmarkBadgeFavorable,
                            !isConcern && !isFavorable && styles.benchmarkBadgeNeutral,
                          ]}
                        >
                          <Text
                            style={[
                              styles.benchmarkBadgeText,
                              isConcern && { color: '#DC2626' },
                              isFavorable && { color: '#16A34A' },
                              !isConcern && !isFavorable && { color: Colors.warm500 },
                            ]}
                          >
                            {item.deltaText}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.benchmarkValues}>
                        <View style={styles.benchmarkCell}>
                          <Text style={styles.benchmarkCellLabel}>Yours</Text>
                          <Text style={styles.benchmarkCellValue}>{item.yours}</Text>
                        </View>
                        <View style={styles.benchmarkCellDivider} />
                        <View style={styles.benchmarkCell}>
                          <Text style={styles.benchmarkCellLabel}>Market</Text>
                          <Text style={styles.benchmarkCellValue}>{item.market}</Text>
                        </View>
                      </View>
                      {item.why && (
                        <Text style={styles.benchmarkWhy}>{item.why}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          </>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Info size={12} color={Colors.terra500} strokeWidth={1.5} />
          <Text style={styles.disclaimerText}>
            ALON's analysis is AI-generated and informational only. For binding legal opinions on
            your builder agreement, consult a registered advocate.
          </Text>
        </View>

        {/* Continue → Deal Closure */}
        {analysisDone && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.closureCtaWrap}>
            <View style={styles.closureCtaHeader}>
              <ClipboardCheck size={14} color={Colors.terra500} strokeWidth={2} />
              <Text style={styles.closureCtaHeaderText}>Ready for the next step?</Text>
            </View>
            <Text style={styles.closureCtaBody}>
              We'll extract key dates — token, stamp duty, registration — from your agreement and
              set up reminders for every deadline.
            </Text>
            <TouchableOpacity
              style={styles.closureCtaBtn}
              onPress={() => {
                haptics.medium();
                router.push('/onboarding/deal-closure');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.closureCtaBtnText}>Continue to Deal Closure</Text>
              <ChevronRight size={16} color={Colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════

// ── Scanning card: polished "ALON is reading" animation ──
const SCAN_STATUSES = [
  'Reading clauses…',
  'Cross-checking MahaRERA model…',
  'Benchmarking Pune market norms…',
  'Extracting key dates…',
  'Flagging risk patterns…',
];

const DOC_HEIGHT = 280;

function ScanningCard() {
  const scanY = useSharedValue(0);
  const pulseOp = useSharedValue(0.3);
  const progress = useSharedValue(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    // Scan bar moves down then up, repeating
    scanY.value = withRepeat(
      withSequence(
        withTiming(DOC_HEIGHT - 8, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    // Soft pulse on the scan beam
    pulseOp.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Progress grows 0 → 100 over ~3.4s
    progress.value = withTiming(100, { duration: 3400, easing: Easing.out(Easing.ease) });

    // Cycle status text
    const interval = setInterval(() => {
      setStatusIdx((i) => (i + 1) % SCAN_STATUSES.length);
    }, 700);

    // Mirror progress to React state for rendering
    const progressInterval = setInterval(() => {
      setProgressPct((p) => Math.min(p + 3, 100));
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, []);

  const scanBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: pulseOp.value,
  }));
  const scanGlowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: pulseOp.value * 0.5,
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={scanStyles.wrap}>
      {/* Document scanner viewport */}
      <View style={scanStyles.scanner}>
        {/* Mock document "pages" in background */}
        <View style={scanStyles.docBg}>
          {/* Header block */}
          <View style={scanStyles.docHeaderBar} />
          <View style={scanStyles.docHeaderBarShort} />
          <View style={{ height: 8 }} />
          {/* Body line groups */}
          {[...Array(3)].map((_, i) => (
            <View key={`g${i}`} style={scanStyles.docGroup}>
              <View style={scanStyles.docLineTitle} />
              <View style={scanStyles.docLine} />
              <View style={scanStyles.docLine} />
              <View style={scanStyles.docLineShort} />
            </View>
          ))}
        </View>

        {/* Corner brackets — viewfinder framing */}
        <View style={[scanStyles.corner, scanStyles.cornerTL]} />
        <View style={[scanStyles.corner, scanStyles.cornerTR]} />
        <View style={[scanStyles.corner, scanStyles.cornerBL]} />
        <View style={[scanStyles.corner, scanStyles.cornerBR]} />

        {/* Glow trail — wider, faded */}
        <Animated.View style={[scanStyles.scanGlow, scanGlowStyle]} />
        {/* Scan bar — sharp line */}
        <Animated.View style={[scanStyles.scanBar, scanBarStyle]} />
      </View>

      {/* Status + progress */}
      <View style={scanStyles.statusBlock}>
        <View style={scanStyles.statusRow}>
          <View style={scanStyles.statusDot} />
          <Text style={scanStyles.statusText}>{SCAN_STATUSES[statusIdx]}</Text>
        </View>
        <View style={scanStyles.progressTrack}>
          <View style={[scanStyles.progressFill, { width: `${progressPct}%` as any }]} />
        </View>
        <Text style={scanStyles.progressLabel}>{progressPct}% analyzed</Text>
      </View>
    </Animated.View>
  );
}

function GlanceRow({
  icon, label, value, warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warning?: string;
}) {
  return (
    <View style={styles.glanceRow}>
      <View style={styles.glanceIconWrap}>{icon}</View>
      <View style={styles.glanceContent}>
        <Text style={styles.glanceLabel}>{label}</Text>
        <Text style={styles.glanceValue}>{value}</Text>
        {warning && (
          <View style={styles.glanceWarnRow}>
            <AlertTriangle size={10} color="#C2410C" strokeWidth={2} />
            <Text style={styles.glanceWarnText}>{warning}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function FeatureBullet({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <CheckCircle2 size={13} color={Colors.terra500} strokeWidth={2} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function RiskSection({
  severity, label, color, bgColor, findings, expanded, onToggle,
}: {
  severity: 'high' | 'medium' | 'low';
  label: string;
  color: string;
  bgColor: string;
  findings: RiskFinding[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.riskSectionCard}>
      <TouchableOpacity
        style={[styles.riskSectionHeader, { backgroundColor: bgColor }]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={[styles.riskSectionDot, { backgroundColor: color }]} />
        <Text style={[styles.riskSectionTitle, { color }]}>{label}</Text>
        <Text style={[styles.riskSectionCount, { color }]}>({findings.length})</Text>
        {expanded ? (
          <ChevronUp size={15} color={color} strokeWidth={2} />
        ) : (
          <ChevronDown size={15} color={color} strokeWidth={2} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.riskFindings}>
          {findings.map((f, i) => (
            <View key={f.id} style={[styles.riskFindingItem, i > 0 && styles.riskFindingItemBorder]}>
              <Text style={styles.riskFindingTitle}>{f.title}</Text>
              <Text style={styles.riskFindingQuote}>{f.quote}</Text>
              <Text style={styles.riskFindingExplanation}>{f.explanation}</Text>
              <View style={styles.riskFindingAction}>
                <Text style={styles.riskFindingActionLabel}>WHAT TO DO</Text>
                <Text style={styles.riskFindingActionText}>{f.action}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
// ── Scanner styles ──
const scanStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.terra200,
    overflow: 'hidden',
  },
  scanner: {
    height: DOC_HEIGHT,
    backgroundColor: Colors.cream,
    position: 'relative',
    overflow: 'hidden',
  },
  // Document page — white paper with subtle shadow, sitting inside the cream frame
  docBg: {
    position: 'absolute',
    top: 20, left: 24, right: 24, bottom: 20,
    backgroundColor: Colors.white,
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  docHeaderBar: {
    height: 8,
    width: '55%',
    backgroundColor: Colors.textPrimary,
    opacity: 0.85,
    borderRadius: 2,
    marginBottom: 4,
  },
  docHeaderBarShort: {
    height: 5,
    width: '35%',
    backgroundColor: Colors.warm400,
    opacity: 0.6,
    borderRadius: 2,
  },
  docGroup: {
    gap: 4,
    marginTop: 10,
  },
  docLineTitle: {
    height: 4,
    width: '30%',
    backgroundColor: Colors.terra500,
    opacity: 0.7,
    borderRadius: 1,
    marginBottom: 3,
  },
  docLine: {
    height: 3,
    width: '100%',
    backgroundColor: Colors.warm400,
    opacity: 0.45,
    borderRadius: 1,
  },
  docLineShort: {
    height: 3,
    width: '70%',
    backgroundColor: Colors.warm400,
    opacity: 0.45,
    borderRadius: 1,
  },
  corner: {
    position: 'absolute',
    width: 18, height: 18,
    borderColor: Colors.terra500,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 2.5, borderRightWidth: 2.5 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 2.5, borderLeftWidth: 2.5 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 2.5, borderRightWidth: 2.5 },
  // Scan beam — terra line on white paper, like a highlighter
  scanBar: {
    position: 'absolute',
    left: 24, right: 24, height: 2.5,
    backgroundColor: Colors.terra500,
    borderRadius: 2,
    shadowColor: Colors.terra500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  // Highlighter trail — warm terra50 wash behind the beam
  scanGlow: {
    position: 'absolute',
    left: 24, right: 24, height: 44,
    backgroundColor: Colors.terra200,
    opacity: 0.5,
    marginTop: -22,
    borderRadius: 4,
  },

  // Status + progress
  statusBlock: {
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.terra500,
  },
  statusText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  progressTrack: {
    alignSelf: 'stretch', height: 3, borderRadius: 2,
    backgroundColor: Colors.warm100, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.terra500,
  },
  progressLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: Colors.textTertiary,
  },
});

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

  // Section label (reused)
  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, marginHorizontal: Spacing.xxl, marginTop: 20, marginBottom: 10,
  },

  // ── Upload state ──
  uploadCard: {
    marginHorizontal: Spacing.xxl, padding: 18,
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.warm200, alignItems: 'center',
  },
  uploadIconWrap: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.terra50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  uploadHeadline: {
    fontFamily: 'DMSerifDisplay', fontSize: 20, color: Colors.textPrimary,
    textAlign: 'center', marginBottom: 8,
  },
  uploadBody: {
    fontFamily: 'DMSans-Regular', fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 19, marginBottom: 18,
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.terra500, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, alignSelf: 'stretch',
  },
  uploadBtnDisabled: {
    backgroundColor: Colors.warm300,
  },
  uploadBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white },

  featuresCard: {
    marginHorizontal: Spacing.xxl, marginTop: 16, padding: 14,
    backgroundColor: Colors.warm50, borderRadius: 12,
  },
  featuresTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4,
  },
  featureText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textSecondary, lineHeight: 17,
  },

  // ── Analysis: Document row ──
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: Spacing.xxl, marginTop: 16,
    padding: 12, backgroundColor: Colors.terra50,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.terra200,
  },
  docIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  docName: { fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textPrimary },
  docSub: { fontFamily: 'DMSans-Regular', fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  reuploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: Colors.white, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.terra200,
  },
  reuploadText: { fontFamily: 'DMSans-SemiBold', fontSize: 11, color: Colors.terra500 },

  // ── At a Glance (iconographic row layout) ──
  glanceCard: {
    marginHorizontal: Spacing.xxl, paddingVertical: 4,
    backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  glanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  glanceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  glanceContent: {
    flex: 1,
    gap: 2,
  },
  glanceLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
  glanceValue: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  glanceWarnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  glanceWarnText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: '#C2410C',
  },

  // ── Priority hint (replaces pills) ──
  priorityHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: Spacing.xxl, marginBottom: 12,
    padding: 12, borderRadius: 10,
    backgroundColor: '#FFEDD5', borderWidth: 1, borderColor: '#FED7AA',
  },
  priorityHintText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12,
    color: '#9A3412', lineHeight: 17,
  },
  priorityHintBold: {
    fontFamily: 'DMSans-SemiBold', color: '#9A3412',
  },

  // ── Risk sections ──
  riskSectionCard: {
    marginHorizontal: Spacing.xxl, marginBottom: 8,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.warm200,
  },
  riskSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  riskSectionDot: { width: 8, height: 8, borderRadius: 4 },
  riskSectionTitle: { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 13 },
  riskSectionCount: { fontFamily: 'DMSans-Medium', fontSize: 12 },
  riskFindings: { backgroundColor: Colors.white },
  riskFindingItem: { padding: 14 },
  riskFindingItemBorder: { borderTopWidth: 1, borderTopColor: Colors.warm100 },
  riskFindingTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13,
    color: Colors.textPrimary, marginBottom: 6,
  },
  riskFindingQuote: {
    fontFamily: 'DMSans-Regular', fontStyle: 'italic', fontSize: 11,
    color: Colors.textTertiary, lineHeight: 16,
    paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: Colors.warm200,
    marginBottom: 8,
  },
  riskFindingExplanation: {
    fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textSecondary, lineHeight: 18,
    marginBottom: 10,
  },
  riskFindingAction: {
    padding: 10, backgroundColor: Colors.cream, borderRadius: 8,
  },
  riskFindingActionLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.terra600,
    letterSpacing: 0.6, marginBottom: 4,
  },
  riskFindingActionText: {
    fontFamily: 'DMSans-Medium', fontSize: 12,
    color: Colors.textPrimary, lineHeight: 17,
  },

  // ── Affordability ──
  affordabilityCard: {
    marginHorizontal: Spacing.xxl, padding: 14,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
  },
  affordabilityHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  affordabilityTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textPrimary,
  },
  affordabilityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6,
  },
  affordabilityLabel: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 12, color: Colors.textSecondary,
  },
  affordabilityValue: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.textPrimary,
  },
  affordabilityTotalRow: {
    borderTopWidth: 1, borderTopColor: Colors.warm100,
    marginTop: 4, paddingTop: 10,
  },
  affordabilityTotalLabel: {
    flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textPrimary,
  },
  affordabilityTotalValue: {
    fontFamily: 'DMSans-Bold', fontSize: 14, color: Colors.textPrimary,
  },
  affordabilityDivider: {
    height: 1, backgroundColor: Colors.warm200, marginVertical: 10,
  },
  verdictCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: 12, padding: 10,
    backgroundColor: '#FFEDD5', borderRadius: 10,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  verdictTextWarn: {
    flex: 1, fontFamily: 'DMSans-Medium', fontSize: 12,
    color: '#9A3412', lineHeight: 17,
  },
  affordabilityHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, padding: 10,
    backgroundColor: Colors.warm50, borderRadius: 10,
  },
  affordabilityHintText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 11,
    color: Colors.textSecondary, lineHeight: 16,
  },

  // ── Benchmark ──
  benchmarkCard: {
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, overflow: 'hidden',
  },
  benchmarkHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.warm100,
    backgroundColor: Colors.cream,
  },
  benchmarkTitle: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textPrimary,
  },
  benchmarkRow: {
    paddingHorizontal: 12, paddingVertical: 12, gap: 6,
  },
  benchmarkRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.warm100 },
  benchmarkTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  },
  benchmarkLabel: {
    fontFamily: 'DMSans-SemiBold', fontSize: 13, color: Colors.textPrimary,
  },
  benchmarkValues: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 2,
  },
  benchmarkCell: { minWidth: 70 },
  benchmarkCellLabel: {
    fontFamily: 'DMSans-Regular', fontSize: 10, color: Colors.textTertiary,
  },
  benchmarkCellValue: {
    fontFamily: 'DMSans-Medium', fontSize: 12, color: Colors.textPrimary, marginTop: 1,
  },
  benchmarkCellDivider: {
    width: 1, height: 20, backgroundColor: Colors.warm200,
  },
  benchmarkWhy: {
    fontFamily: 'DMSans-Regular', fontSize: 11,
    color: Colors.textTertiary, fontStyle: 'italic', lineHeight: 15,
    marginTop: 4,
  },
  benchmarkBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  benchmarkBadgeConcern: {
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA',
  },
  benchmarkBadgeFavorable: {
    backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#BBF7D0',
  },
  benchmarkBadgeNeutral: {
    backgroundColor: Colors.warm100,
  },
  benchmarkBadgeText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 10,
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

  // ── Continue → Deal Closure ──
  closureCtaWrap: {
    marginHorizontal: Spacing.xxl, marginTop: 16,
    padding: 16, borderRadius: 14,
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200,
  },
  closureCtaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
  },
  closureCtaHeaderText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 12, color: Colors.terra600,
    letterSpacing: 0.3,
  },
  closureCtaBody: {
    fontFamily: 'DMSans-Regular', fontSize: 12,
    color: Colors.textSecondary, lineHeight: 17, marginBottom: 12,
  },
  closureCtaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.terra500,
  },
  closureCtaBtnText: {
    fontFamily: 'DMSans-SemiBold', fontSize: 14, color: Colors.white,
  },
});
