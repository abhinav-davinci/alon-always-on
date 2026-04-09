import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  IndianRupee,
  Heart,
  Pencil,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  UserPlus,
  Info,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { SHORTLIST_PROPERTIES, Property } from '../../constants/properties';
import { useHaptics } from '../../hooks/useHaptics';
import {
  calculateEMI,
  getInterestRate,
  getLoanAmount,
  calculateAcquisitionCost,
  calculateEligibility,
  formatINR,
  formatEMI,
} from '../../utils/financeCalc';
import {
  getCibilBracket,
  DEFAULT_CIBIL,
  DEFAULT_TENURE,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  CIBIL_BRACKETS,
  EmploymentType,
} from '../../constants/financeData';
import { parsePriceToNumber } from '../../utils/compareScore';

type Tab = 'emi' | 'cost' | 'eligibility';

// Unified selectable property
interface SelectableProperty {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  area: string;
  image?: string;
  isUserAdded: boolean;
}

export default function LoanPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const {
    likedPropertyIds, userProperties,
    cibilScore, cibilSkipped, setCibilScore, setCibilSkipped,
    monthlyIncome, existingEMIs, setMonthlyIncome, setExistingEMIs,
    budget,
  } = useOnboardingStore();

  // ── Build selectable property list ──
  const properties = useMemo<SelectableProperty[]>(() => {
    const liked = likedPropertyIds
      .map(id => SHORTLIST_PROPERTIES.find(p => p.id === id))
      .filter(Boolean)
      .map(p => ({
        id: p!.id,
        name: p!.name,
        price: parsePriceToNumber(p!.price),
        priceLabel: p!.price,
        area: p!.area,
        image: p!.image,
        isUserAdded: false,
      }));
    const user = userProperties
      .filter(p => p.price)
      .map(p => ({
        id: p.id,
        name: p.name,
        price: parsePriceToNumber(p.price),
        priceLabel: p.price,
        area: p.area,
        image: p.images?.[0],
        isUserAdded: true,
      }));
    return [...liked, ...user];
  }, [likedPropertyIds, userProperties]);

  const hasProperties = properties.length > 0;

  // ── State ──
  const [selectedId, setSelectedId] = useState<string | null>(hasProperties ? properties[0]?.id : null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(!hasProperties);
  const [activeTab, setActiveTab] = useState<Tab>('emi');

  // CIBIL
  const [cibilSliderValue, setCibilSliderValue] = useState(cibilScore ?? DEFAULT_CIBIL);
  const [showCibilEditor, setShowCibilEditor] = useState(false);
  const hasCibil = !!cibilScore || cibilSkipped;

  // Eligibility inputs
  const [incomeInput, setIncomeInput] = useState(monthlyIncome ? monthlyIncome.toString() : '');
  const [emisInput, setEmisInput] = useState(existingEMIs ? existingEMIs.toString() : '');

  // ── Derived values ──
  const selectedProp = selectedId ? properties.find(p => p.id === selectedId) : null;
  // Custom amount input is in lakhs — multiply by 100000
  const customPrice = (parseFloat(customAmount) || 0) * 100000;
  const propertyPrice = useCustom ? customPrice : (selectedProp?.price || 0);
  const propertyName = useCustom ? undefined : selectedProp?.name;
  const effectiveCibil = cibilScore ?? DEFAULT_CIBIL;
  const rate = getInterestRate(effectiveCibil);

  // EMI state — reactive to property price changes
  const [loanAmount, setLoanAmount] = useState(getLoanAmount(propertyPrice));
  const [tenure, setTenure] = useState(DEFAULT_TENURE);
  const [emiRate, setEmiRate] = useState(rate);

  // Actual loan amount used for calculations — always derived
  const activeLoan = propertyPrice > 0 ? loanAmount : 0;
  const emi = calculateEMI(activeLoan, emiRate, tenure);
  const totalPayable = emi * tenure * 12;
  const totalInterest = totalPayable - activeLoan;

  const selectProperty = (id: string) => {
    haptics.selection();
    setSelectedId(id);
    setUseCustom(false);
    const prop = properties.find(p => p.id === id);
    if (prop) {
      setLoanAmount(getLoanAmount(prop.price));
    }
  };

  const selectCustom = () => {
    haptics.selection();
    setUseCustom(true);
    setSelectedId(null);
    if (customPrice > 0) {
      setLoanAmount(getLoanAmount(customPrice));
    }
  };

  const confirmCibil = (score: number) => {
    setCibilScore(score);
    setShowCibilEditor(false);
    setEmiRate(getInterestRate(score));
    haptics.success();
  };

  const skipCibil = () => {
    setCibilSkipped(true);
    setShowCibilEditor(false);
    haptics.light();
  };

  const bracket = getCibilBracket(effectiveCibil);

  // ── Render ──
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <IndianRupee size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.headerTitle}>Loan Planner</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Property Selector ── */}
        <Text style={styles.sectionLabel}>PLAN FOR</Text>

        {hasProperties ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.propertySelectorScroll}
          >
            {properties.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.propertyCard, selectedId === p.id && !useCustom && styles.propertyCardSelected]}
                onPress={() => selectProperty(p.id)}
                activeOpacity={0.7}
              >
                {p.image ? (
                  <Image source={{ uri: p.image }} style={styles.propertyCardImg} />
                ) : (
                  <View style={[styles.propertyCardImg, styles.propertyCardImgPlaceholder]}>
                    <Text style={styles.propertyCardInitial}>{p.name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.propertyCardName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.propertyCardPrice}>{p.priceLabel}</Text>
                {p.isUserAdded && (
                  <View style={styles.userBadge}>
                    <Text style={styles.userBadgeText}>By you</Text>
                  </View>
                )}
                {selectedId === p.id && !useCustom && (
                  <View style={styles.selectedCheck}>
                    <CheckCircle2 size={14} color={Colors.terra500} strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Custom amount card */}
            <TouchableOpacity
              style={[styles.propertyCard, styles.customCard, useCustom && styles.propertyCardSelected]}
              onPress={selectCustom}
              activeOpacity={0.7}
            >
              <View style={styles.customIconWrap}>
                <IndianRupee size={18} color={Colors.terra500} strokeWidth={2} />
              </View>
              <Text style={styles.propertyCardName}>Custom</Text>
              <Text style={styles.propertyCardPrice}>Enter amount</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Empty state — no properties */
          <Animated.View style={styles.emptyState} entering={FadeIn.duration(300)}>
            <Heart size={20} color={Colors.warm300} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No properties shortlisted yet</Text>
            <Text style={styles.emptySub}>
              You can plan a loan for any amount, or browse matches to shortlist first.
            </Text>
            <TouchableOpacity
              style={styles.emptyLink}
              onPress={() => router.push('/onboarding/shortlist')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyLinkText}>Browse matches</Text>
              <ChevronRight size={12} color={Colors.terra500} strokeWidth={2} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Custom amount input */}
        {useCustom && (
          <Animated.View style={styles.customInputRow} entering={FadeInDown.duration(200)}>
            <Text style={styles.customInputLabel}>Property price (in Lakhs)</Text>
            <View style={styles.customInputWrap}>
              <Text style={styles.customInputPrefix}>₹</Text>
              <TextInput
                style={styles.customInput}
                placeholder="e.g. 135 for ₹1.35 Cr"
                placeholderTextColor={Colors.warm300}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={(v) => {
                  setCustomAmount(v);
                  const parsed = parseFloat(v) || 0;
                  const price = parsed * 100000;
                  setLoanAmount(getLoanAmount(price));
                }}
              />
              <Text style={styles.customInputSuffix}>Lakhs</Text>
            </View>
            {customPrice > 0 && (
              <Text style={styles.customInputHint}>
                Property: {formatINR(customPrice)} · Loan (80%): {formatINR(getLoanAmount(customPrice))}
              </Text>
            )}
          </Animated.View>
        )}

        {/* ── CIBIL Section ── */}
        {!hasCibil || showCibilEditor ? (
          <Animated.View style={styles.cibilCard} entering={FadeInDown.duration(250)}>
            <Text style={styles.cibilTitle}>Your CIBIL score</Text>
            <View style={styles.cibilScoreRow}>
              <Text style={styles.cibilScoreNumber}>{cibilSliderValue}</Text>
              <View style={[styles.cibilBracketBadge, { backgroundColor: getCibilBracket(cibilSliderValue).color + '20' }]}>
                <View style={[styles.cibilDot, { backgroundColor: getCibilBracket(cibilSliderValue).color }]} />
                <Text style={[styles.cibilBracketText, { color: getCibilBracket(cibilSliderValue).color }]}>
                  {getCibilBracket(cibilSliderValue).label}
                </Text>
              </View>
            </View>
            <View style={styles.cibilRateRow}>
              <Text style={styles.cibilRateLabel}>Expected rate</Text>
              <Text style={styles.cibilRateValue}>{getInterestRate(cibilSliderValue).toFixed(1)}%</Text>
            </View>
            {/* Bracket bar */}
            <View style={styles.bracketBar}>
              {CIBIL_BRACKETS.slice().reverse().map(b => (
                <View
                  key={b.label}
                  style={[
                    styles.bracketSegment,
                    { backgroundColor: b.color + '30', flex: b.max - b.min },
                    cibilSliderValue >= b.min && cibilSliderValue <= b.max && { backgroundColor: b.color + '50' },
                  ]}
                />
              ))}
            </View>
            <Slider
              style={styles.slider}
              minimumValue={300}
              maximumValue={900}
              step={5}
              value={cibilSliderValue}
              onValueChange={(v) => setCibilSliderValue(Math.round(v))}
              minimumTrackTintColor={getCibilBracket(cibilSliderValue).color}
              maximumTrackTintColor={Colors.warm200}
              thumbTintColor={getCibilBracket(cibilSliderValue).color}
            />
            <View style={styles.cibilActions}>
              <TouchableOpacity style={styles.cibilConfirmBtn} onPress={() => confirmCibil(cibilSliderValue)} activeOpacity={0.85}>
                <Text style={styles.cibilConfirmText}>Confirm — {cibilSliderValue}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={skipCibil}>
                <Text style={styles.cibilSkipText}>I don't know · Use estimate</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <TouchableOpacity style={styles.cibilBadgeRow} onPress={() => setShowCibilEditor(true)} activeOpacity={0.7}>
            <View style={[styles.cibilBadgeInline, { borderColor: bracket.color + '40' }]}>
              <View style={[styles.cibilDot, { backgroundColor: bracket.color }]} />
              <Text style={styles.cibilBadgeLabel}>
                CIBIL {cibilScore || '~750'} · {bracket.label} · {rate.toFixed(1)}%
              </Text>
              <Pencil size={11} color={Colors.warm400} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        )}

        {/* ── Tab Bar ── */}
        <View style={styles.tabBar}>
          {([
            { key: 'emi' as Tab, label: 'EMI Calculator' },
            { key: 'cost' as Tab, label: 'Total Cost' },
            { key: 'eligibility' as Tab, label: 'Eligibility' },
          ]).map(t => (
            <Pressable
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => { setActiveTab(t.key); haptics.selection(); }}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── EMI Calculator Tab ── */}
        {activeTab === 'emi' && propertyPrice > 0 && (
          <Animated.View style={styles.tabContent} entering={FadeIn.duration(200)}>
            {/* EMI Result */}
            <View style={styles.emiResultBox}>
              <Text style={styles.emiResultLabel}>Monthly EMI</Text>
              <Text style={styles.emiResultAmount}>{formatEMI(emi)}</Text>
              {propertyName && <Text style={styles.emiResultSub}>for {propertyName}</Text>}
            </View>

            {/* Loan Amount */}
            <SliderRow
              label="Loan amount"
              value={activeLoan}
              displayValue={formatINR(activeLoan)}
              min={500000}
              max={Math.max(propertyPrice, 20000000)}
              step={100000}
              onChange={setLoanAmount}
              color={Colors.terra500}
            />

            {/* Tenure */}
            <SliderRow
              label="Tenure"
              value={tenure}
              displayValue={`${tenure} years`}
              min={5}
              max={30}
              step={1}
              onChange={setTenure}
              color={Colors.terra500}
            />

            {/* Interest Rate */}
            <SliderRow
              label="Interest rate"
              value={emiRate}
              displayValue={`${emiRate.toFixed(1)}% p.a.`}
              min={7}
              max={14}
              step={0.1}
              onChange={setEmiRate}
              color={Colors.terra500}
            />

            {/* Summary */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total interest</Text>
                <Text style={styles.summaryValue}>{formatINR(totalInterest)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total payable</Text>
                <Text style={styles.summaryValue}>{formatINR(totalPayable)}</Text>
              </View>
            </View>

            <Text style={styles.footnote}>
              {cibilScore
                ? `Rate pre-set based on your CIBIL score of ${cibilScore}`
                : 'Based on estimated CIBIL of 750 — update your score for accuracy'}
            </Text>
          </Animated.View>
        )}

        {activeTab === 'emi' && propertyPrice === 0 && (
          <View style={styles.tabEmptyState}>
            <IndianRupee size={24} color={Colors.warm300} strokeWidth={1.5} />
            <Text style={styles.tabEmptyText}>Select a property above or enter a custom amount to calculate EMI</Text>
          </View>
        )}

        {/* ── Total Cost Tab ── */}
        {activeTab === 'cost' && propertyPrice > 0 && (
          <Animated.View style={styles.tabContent} entering={FadeIn.duration(200)}>
            {(() => {
              const cost = calculateAcquisitionCost(propertyPrice, false);
              const rows = [
                { label: 'Property price', amount: cost.propertyPrice },
                { label: 'Stamp duty (5%)', amount: cost.stampDuty },
                { label: 'Registration (1%)', amount: cost.registrationFee },
                ...(cost.gst > 0 ? [{ label: 'GST (5%)', amount: cost.gst }] : []),
                { label: 'Legal & misc', amount: cost.legalFees },
              ];
              return (
                <>
                  {propertyName && <Text style={styles.costForLabel}>for {propertyName}</Text>}
                  <View style={styles.costRows}>
                    {rows.map((row, i) => (
                      <View key={i} style={[styles.costRow, i % 2 === 0 && styles.costRowAlt]}>
                        <Text style={styles.costRowLabel}>{row.label}</Text>
                        <Text style={styles.costRowAmount}>{formatINR(row.amount)}</Text>
                      </View>
                    ))}
                    <View style={styles.costTotalRow}>
                      <Text style={styles.costTotalLabel}>You'll actually pay</Text>
                      <Text style={styles.costTotalAmount}>{formatINR(cost.totalCost)}</Text>
                    </View>
                  </View>
                  <View style={styles.costCallout}>
                    <Text style={styles.costCalloutText}>
                      That's <Text style={styles.costCalloutBold}>{formatINR(cost.overPropertyPrice)}</Text> above the listed price
                    </Text>
                  </View>
                  <Text style={styles.footnote}>
                    Rates for Maharashtra (Pune). Under-construction properties attract 5% GST additionally.
                  </Text>
                </>
              );
            })()}
          </Animated.View>
        )}

        {activeTab === 'cost' && propertyPrice === 0 && (
          <View style={styles.tabEmptyState}>
            <IndianRupee size={24} color={Colors.warm300} strokeWidth={1.5} />
            <Text style={styles.tabEmptyText}>Select a property to see the full acquisition cost breakdown</Text>
          </View>
        )}

        {/* ── Eligibility Tab ── */}
        {activeTab === 'eligibility' && (
          <Animated.View style={styles.tabContent} entering={FadeIn.duration(200)}>
            {/* Income input */}
            <View style={styles.eligInputSection}>
              <Text style={styles.eligInputLabel}>Monthly take-home salary</Text>
              <View style={styles.eligInputRow}>
                <Text style={styles.eligInputPrefix}>₹</Text>
                <TextInput
                  style={styles.eligInput}
                  placeholder="e.g. 150000"
                  placeholderTextColor={Colors.warm300}
                  keyboardType="numeric"
                  value={incomeInput}
                  onChangeText={(v) => {
                    setIncomeInput(v);
                    const parsed = parseInt(v, 10) || 0;
                    if (parsed > 0) setMonthlyIncome(parsed);
                  }}
                />
              </View>
            </View>

            <View style={styles.eligInputSection}>
              <Text style={styles.eligInputLabel}>Existing EMIs (car, personal loan, etc.)</Text>
              <View style={styles.eligInputRow}>
                <Text style={styles.eligInputPrefix}>₹</Text>
                <TextInput
                  style={styles.eligInput}
                  placeholder="0 if none"
                  placeholderTextColor={Colors.warm300}
                  keyboardType="numeric"
                  value={emisInput}
                  onChangeText={(v) => {
                    setEmisInput(v);
                    const parsed = parseInt(v, 10) || 0;
                    setExistingEMIs(parsed);
                  }}
                />
              </View>
            </View>

            {/* Results */}
            {(parseInt(incomeInput, 10) || monthlyIncome) > 0 && (() => {
              const income = parseInt(incomeInput, 10) || monthlyIncome;
              const emis = parseInt(emisInput, 10) || existingEMIs || 0;
              const result = calculateEligibility(income, emis, effectiveCibil);

              return (
                <Animated.View entering={FadeIn.duration(200)}>
                  {/* CIBIL badge */}
                  <View style={styles.eligCibilRow}>
                    <View style={[styles.cibilBadgeInline, { borderColor: bracket.color + '40' }]}>
                      <View style={[styles.cibilDot, { backgroundColor: bracket.color }]} />
                      <Text style={styles.cibilBadgeLabel}>
                        CIBIL {cibilScore || '~750'} · Approval: {result.approvalLikelihood}
                      </Text>
                    </View>
                  </View>

                  {/* Result boxes */}
                  <View style={styles.eligResultBox}>
                    <View style={styles.eligResultItem}>
                      <Text style={styles.eligResultLabel}>Max loan</Text>
                      <Text style={styles.eligResultValue}>{formatINR(result.maxLoanAmount)}</Text>
                    </View>
                    <View style={styles.eligResultDivider} />
                    <View style={styles.eligResultItem}>
                      <Text style={styles.eligResultLabel}>Max EMI</Text>
                      <Text style={styles.eligResultValue}>{formatEMI(result.maxEMI)}/mo</Text>
                    </View>
                    <View style={styles.eligResultDivider} />
                    <View style={styles.eligResultItem}>
                      <Text style={styles.eligResultLabel}>Max property</Text>
                      <Text style={styles.eligResultValue}>{formatINR(result.maxPropertyPrice)}</Text>
                    </View>
                  </View>

                  <Text style={styles.eligDetailText}>
                    @ {result.interestRate.toFixed(1)}% for {result.tenureYears} years · {DEFAULT_DOWN_PAYMENT_PERCENT}% down payment
                  </Text>

                  {/* Property comparison */}
                  {properties.length > 0 && (
                    <View style={styles.eligCompare}>
                      <Text style={styles.eligCompareTitle}>Your properties</Text>
                      {properties.map(p => {
                        const isAffordable = p.price <= result.maxPropertyPrice;
                        const isStretch = p.price > result.maxPropertyPrice && p.price <= result.maxPropertyPrice * 1.15;
                        return (
                          <View key={p.id} style={styles.eligCompareRow}>
                            {isAffordable ? (
                              <CheckCircle2 size={14} color="#22C55E" strokeWidth={2} />
                            ) : (
                              <AlertCircle size={14} color={isStretch ? Colors.amber500 : '#EF4444'} strokeWidth={2} />
                            )}
                            <Text style={styles.eligCompareName} numberOfLines={1}>{p.name}</Text>
                            <Text style={styles.eligComparePrice}>{p.priceLabel}</Text>
                            <Text style={[
                              styles.eligCompareStatus,
                              isAffordable ? styles.statusGreen : isStretch ? styles.statusAmber : styles.statusRed,
                            ]}>
                              {isAffordable ? 'In range' : isStretch ? 'Stretch' : 'Over'}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.eligSummary}>
                    <TrendingUp size={13} color={Colors.terra500} strokeWidth={2} />
                    <Text style={styles.eligSummaryText}>
                      {properties.filter(p => p.price <= result.maxPropertyPrice).length > 0
                        ? `${properties.filter(p => p.price <= result.maxPropertyPrice).length} of ${properties.length} properties are within your eligibility.`
                        : properties.length > 0
                          ? 'Consider a higher down payment or co-applicant to improve eligibility.'
                          : 'Shortlist properties to see how they match your eligibility.'}
                    </Text>
                  </View>
                </Animated.View>
              );
            })()}

            {!incomeInput && !monthlyIncome && (
              <View style={styles.tabEmptyState}>
                <Text style={styles.tabEmptyText}>Enter your monthly income above to check eligibility</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* AI Disclaimer */}
        <View style={styles.disclaimer}>
          <Info size={12} color={Colors.warm400} strokeWidth={1.5} />
          <Text style={styles.disclaimerText}>
            ALON's calculations are estimates based on publicly available rates and standard banking norms.
            Actual loan terms may vary. Please consult your bank or a qualified financial advisor before making decisions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Reusable Slider Row ──
function SliderRow({ label, value, displayValue, min, max, step, onChange, color }: {
  label: string; value: number; displayValue: string;
  min: number; max: number; step: number;
  onChange: (v: number) => void; color: string;
}) {
  return (
    <View style={sliderStyles.section}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.label}>{label}</Text>
        <Text style={sliderStyles.value}>{displayValue}</Text>
      </View>
      <Slider
        style={sliderStyles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor={Colors.warm200}
        thumbTintColor={color}
      />
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  section: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
  value: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  slider: { width: '100%', height: 32 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // Header
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

  // Section labels
  sectionLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    letterSpacing: 0.8, paddingHorizontal: Spacing.xxl, marginBottom: 10,
  },

  // ── Property selector ──
  propertySelectorScroll: { paddingHorizontal: Spacing.xxl, gap: 10, paddingBottom: 4 },
  propertyCard: {
    width: 110, borderRadius: 14, padding: 8,
    backgroundColor: Colors.warm50, borderWidth: 1.5, borderColor: Colors.warm100,
    alignItems: 'center', position: 'relative', overflow: 'visible',
  },
  propertyCardSelected: { borderColor: Colors.terra500, backgroundColor: Colors.terra50 },
  propertyCardImg: { width: 94, height: 54, borderRadius: 8, marginBottom: 6, backgroundColor: Colors.warm100 },
  propertyCardImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  propertyCardInitial: { fontSize: 18, fontFamily: 'DMSans-Bold', color: Colors.warm400 },
  propertyCardName: { fontSize: 11, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, textAlign: 'center' },
  propertyCardPrice: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.terra600, marginTop: 2 },
  userBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.warm200, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4,
  },
  userBadgeText: { fontSize: 7, fontFamily: 'DMSans-SemiBold', color: Colors.warm600 },
  selectedCheck: {
    position: 'absolute', top: 6, left: 6, zIndex: 5,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2,
    elevation: 3,
  },
  customCard: { justifyContent: 'center' },
  customIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.terra50, borderWidth: 1, borderColor: Colors.terra200,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },

  // Empty state
  emptyState: {
    alignItems: 'center', paddingVertical: 24, paddingHorizontal: 40, gap: 8,
    marginHorizontal: Spacing.xxl,
    backgroundColor: Colors.cream, borderRadius: 16, borderWidth: 1, borderColor: Colors.warm100,
  },
  emptyTitle: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  emptySub: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
  emptyLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  emptyLinkText: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.terra500 },

  // Custom amount
  customInputRow: { paddingHorizontal: Spacing.xxl, marginTop: 12 },
  customInputLabel: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, marginBottom: 6 },
  customInputWrap: { flexDirection: 'row', alignItems: 'center' },
  customInputPrefix: {
    fontSize: 16, fontFamily: 'DMSans-Bold', color: Colors.textPrimary,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm200,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, borderRightWidth: 0,
  },
  customInput: {
    flex: 1, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: 'DMSans-Regular',
    color: Colors.textPrimary,
  },
  customInputSuffix: {
    fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.warm400,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm200,
    borderTopRightRadius: 12, borderBottomRightRadius: 12,
    paddingHorizontal: 12, paddingVertical: 13, borderLeftWidth: 0,
  },
  customInputHint: {
    fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.terra500, marginTop: 6,
  },

  // ── CIBIL ──
  cibilCard: {
    marginHorizontal: Spacing.xxl, marginTop: 16, padding: 16,
    backgroundColor: Colors.cream, borderRadius: 16, borderWidth: 1, borderColor: Colors.warm200,
  },
  cibilTitle: { fontSize: 13, fontFamily: 'DMSans-Bold', color: Colors.textPrimary, marginBottom: 10 },
  cibilScoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
  cibilScoreNumber: { fontSize: 32, fontFamily: 'DMSans-Bold', color: Colors.navy800 },
  cibilBracketBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  cibilDot: { width: 6, height: 6, borderRadius: 3 },
  cibilBracketText: { fontSize: 11, fontFamily: 'DMSans-SemiBold' },
  cibilRateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.navy800, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10,
  },
  cibilRateLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.5)' },
  cibilRateValue: { fontSize: 14, fontFamily: 'DMSans-Bold', color: Colors.white },
  bracketBar: { flexDirection: 'row', height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  bracketSegment: { height: 5 },
  slider: { width: '100%', height: 32, marginBottom: 8 },
  cibilActions: { alignItems: 'center', gap: 8, marginTop: 4 },
  cibilConfirmBtn: {
    width: '100%', paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.terra500, alignItems: 'center',
  },
  cibilConfirmText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  cibilSkipText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.warm400 },

  cibilBadgeRow: { paddingHorizontal: Spacing.xxl, marginTop: 14 },
  cibilBadgeInline: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100,
    borderWidth: 1, backgroundColor: Colors.warm50,
  },
  cibilBadgeLabel: { fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.textSecondary, flex: 1 },

  // ── Tabs ──
  tabBar: {
    flexDirection: 'row', marginHorizontal: Spacing.xxl, marginTop: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.terra500 },
  tabText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
  tabTextActive: { fontFamily: 'DMSans-SemiBold', color: Colors.terra500 },

  tabContent: { paddingHorizontal: Spacing.xxl, paddingTop: 16 },

  tabEmptyState: {
    alignItems: 'center', paddingVertical: 32, gap: 10,
    paddingHorizontal: Spacing.xxl,
  },
  tabEmptyText: { fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.warm400, textAlign: 'center' },

  // ── EMI tab ──
  emiResultBox: {
    alignItems: 'center', paddingVertical: 16,
    backgroundColor: Colors.navy800, borderRadius: 14, marginBottom: 20,
  },
  emiResultLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  emiResultAmount: { fontSize: 26, fontFamily: 'DMSans-Bold', color: Colors.white },
  emiResultSub: { fontSize: 10, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cream, borderRadius: 12, padding: 14, marginTop: 4,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  summaryDivider: { width: 1, height: 28, backgroundColor: Colors.warm200 },

  footnote: {
    fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.warm400,
    fontStyle: 'italic', textAlign: 'center', marginTop: 12,
  },

  // ── Cost tab ──
  costForLabel: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginBottom: 8 },
  costRows: {},
  costRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 10,
  },
  costRowAlt: { backgroundColor: 'rgba(245,240,232,0.3)', borderRadius: 6 },
  costRowLabel: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
  costRowAmount: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  costTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10, marginTop: 6,
    borderTopWidth: 1.5, borderTopColor: Colors.navy800,
  },
  costTotalLabel: { fontSize: 13, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  costTotalAmount: { fontSize: 17, fontFamily: 'DMSans-Bold', color: Colors.terra600 },
  costCallout: {
    backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10,
  },
  costCalloutText: { fontSize: 11, fontFamily: 'DMSans-Regular', color: '#92400E', lineHeight: 16, textAlign: 'center' },
  costCalloutBold: { fontFamily: 'DMSans-Bold' },

  // ── Eligibility tab ──
  eligInputSection: { marginBottom: 14 },
  eligInputLabel: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, marginBottom: 6 },
  eligInputRow: { flexDirection: 'row', alignItems: 'center' },
  eligInputPrefix: {
    fontSize: 16, fontFamily: 'DMSans-Bold', color: Colors.textPrimary,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm200,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, borderRightWidth: 0,
  },
  eligInput: {
    flex: 1, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
    borderTopRightRadius: 12, borderBottomRightRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: 'DMSans-Regular',
    color: Colors.textPrimary,
  },
  eligCibilRow: { marginBottom: 12 },
  eligResultBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.navy800, borderRadius: 14, padding: 14, marginBottom: 8,
  },
  eligResultItem: { flex: 1, alignItems: 'center' },
  eligResultLabel: { fontSize: 9, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  eligResultValue: { fontSize: 13, fontFamily: 'DMSans-Bold', color: Colors.white },
  eligResultDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  eligDetailText: { fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.warm400, textAlign: 'center', marginBottom: 14 },
  eligCompare: { marginTop: 4 },
  eligCompareTitle: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8,
  },
  eligCompareRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  eligCompareName: { flex: 1, fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textPrimary },
  eligComparePrice: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginRight: 6 },
  eligCompareStatus: { fontSize: 10, fontFamily: 'DMSans-SemiBold' },
  statusGreen: { color: '#22C55E' },
  statusAmber: { color: Colors.amber500 },
  statusRed: { color: '#EF4444' },
  eligSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.terra50, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 14,
  },
  eligSummaryText: { flex: 1, fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.terra600, lineHeight: 16 },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginHorizontal: Spacing.xxl, marginTop: 24,
    paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: 'rgba(245,240,232,0.5)', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.warm100,
  },
  disclaimerText: {
    flex: 1, fontFamily: 'DMSans-Regular', fontSize: 10, color: Colors.warm400, lineHeight: 15,
  },
});
