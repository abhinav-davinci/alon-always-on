import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Scale,
  Building2,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import { Colors, Spacing } from '../../constants/theme';
import { useHaptics } from '../../hooks/useHaptics';

type ScreenState = 'input' | 'scanning' | 'result';

// Demo: properties with known conflicts
const CONFLICT_DB: Record<string, any> = {
  'kumar-builders': {
    hasConflict: true,
    type: 'Land title dispute',
    filed: '12 Jan 2025',
    status: 'Under review',
    source: 'District Court, Pune',
    recommendation: 'Proceed with caution. We recommend waiting for resolution before making any payment.',
  },
};

export default function ConflictCheckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [screen, setScreen] = useState<ScreenState>('input');
  const [buildingName, setBuildingName] = useState('');
  const [area, setArea] = useState('');
  const [reraId, setReraId] = useState('');
  const [result, setResult] = useState<any>(null);

  // Scanning animation values
  const scanProgress = useSharedValue(0);
  const [scanText, setScanText] = useState('Checking RERA database...');

  const scanProgressStyle = useAnimatedStyle(() => ({
    width: `${scanProgress.value}%`,
  }));

  // Signal ring for scanning
  const ring1 = useSharedValue(0.6);
  const ring1Op = useSharedValue(0);
  const ring2 = useSharedValue(0.6);
  const ring2Op = useSharedValue(0);

  const startScan = () => {
    if (!buildingName.trim() || !area.trim()) return;
    haptics.medium();
    setScreen('scanning');

    // Animate progress
    scanProgress.value = withTiming(100, { duration: 3000, easing: Easing.out(Easing.cubic) });

    // Signal rings
    ring1.value = withRepeat(withSequence(
      withTiming(0.6, { duration: 0 }),
      withTiming(1.4, { duration: 1500, easing: Easing.out(Easing.cubic) })
    ), -1, false);
    ring1Op.value = withRepeat(withSequence(
      withTiming(0.4, { duration: 100 }),
      withTiming(0, { duration: 1400 })
    ), -1, false);
    ring2.value = withDelay(500, withRepeat(withSequence(
      withTiming(0.6, { duration: 0 }),
      withTiming(1.4, { duration: 1500, easing: Easing.out(Easing.cubic) })
    ), -1, false));
    ring2Op.value = withDelay(500, withRepeat(withSequence(
      withTiming(0.3, { duration: 100 }),
      withTiming(0, { duration: 1400 })
    ), -1, false));

    // Cycle scanning text
    setTimeout(() => setScanText('Scanning court records...'), 1000);
    setTimeout(() => setScanText('Reviewing builder history...'), 2000);

    // Show result after 3s
    setTimeout(() => {
      const nameKey = buildingName.toLowerCase().replace(/\s+/g, '-');
      const conflict = CONFLICT_DB[nameKey];

      if (conflict) {
        setResult({ hasConflict: true, ...conflict });
      } else {
        setResult({
          hasConflict: false,
          checks: [
            'No court disputes found',
            'RERA compliant',
            'Builder trust score: 4.5/5',
            'No pending litigation',
          ],
          lastChecked: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          recommendation: 'This property has a clean record. Safe to proceed with negotiations.',
        });
      }
      haptics.success();
      setScreen('result');
    }, 3200);
  };

  const resetCheck = () => {
    setScreen('input');
    setBuildingName('');
    setArea('');
    setReraId('');
    setResult(null);
    scanProgress.value = 0;
    setScanText('Checking RERA database...');
  };

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: ring1Op.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value }],
    opacity: ring2Op.value,
  }));

  const canSubmit = buildingName.trim().length > 2 && area.trim().length > 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Check a property</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 50}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── INPUT STATE ── */}
          {screen === 'input' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarClip}>
                  <AlonAvatar size={36} showRings={false} showBlink />
                </View>
              </View>

              <Text style={styles.pageTitle}>Tell ALON about the property{'\n'}you're considering</Text>
              <Text style={styles.pageSubtitle}>
                ALON checks RERA records, court disputes & builder history to protect your investment.
              </Text>

              {/* Form */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Building / Project name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Godrej Hillside"
                  placeholderTextColor={Colors.textTertiary}
                  value={buildingName}
                  onChangeText={setBuildingName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Area, City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Baner, Pune"
                  placeholderTextColor={Colors.textTertiary}
                  value={area}
                  onChangeText={setArea}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>RERA ID <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. P52100012345"
                  placeholderTextColor={Colors.textTertiary}
                  value={reraId}
                  onChangeText={setReraId}
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={startScan}
                activeOpacity={0.85}
                disabled={!canSubmit}
              >
                <Text style={styles.submitBtnText}>Check this property</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.trustNote}>
                <ShieldCheck size={14} color={Colors.terra500} strokeWidth={1.5} />
                <Text style={styles.trustNoteText}>
                  ALON checks against RERA, court records & 50+ data sources
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── SCANNING STATE ── */}
          {screen === 'scanning' && (
            <View style={styles.scanningWrap}>
              <View style={styles.scanHero}>
                <Animated.View style={[styles.signalRing, ring1Style]} />
                <Animated.View style={[styles.signalRing, ring2Style]} />
                <View style={styles.scanEye}>
                  <AlonAvatar size={44} showRings={false} showBlink variant="light" />
                </View>
              </View>

              <Text style={styles.scanTitle}>Checking property...</Text>
              <Text style={styles.scanSubtitle}>
                {buildingName}, {area}
              </Text>

              <Animated.View
                entering={FadeIn.delay(200).duration(300)}
                style={styles.scanSteps}
              >
                <Text style={styles.scanStepText}>{scanText}</Text>
              </Animated.View>

              <View style={styles.scanProgressTrack}>
                <Animated.View style={[styles.scanProgressFill, scanProgressStyle]} />
              </View>
            </View>
          )}

          {/* ── RESULT STATE ── */}
          {screen === 'result' && result && (
            <Animated.View entering={FadeInDown.duration(400)}>
              {result.hasConflict ? (
                /* ── CONFLICT FOUND ── */
                <View>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultIconAlert}>
                      <AlertTriangle size={24} color="#D97706" strokeWidth={2} />
                    </View>
                    <Text style={styles.resultTitleAlert}>Conflict Reported</Text>
                  </View>

                  <Text style={styles.resultProperty}>{buildingName}, {area}</Text>
                  {reraId ? <Text style={styles.resultRera}>RERA: {reraId}</Text> : null}

                  <View style={styles.alertCard}>
                    <View style={styles.alertRow}>
                      <Scale size={14} color="#D97706" strokeWidth={1.5} />
                      <Text style={styles.alertLabel}>{result.type}</Text>
                    </View>
                    <View style={styles.alertMeta}>
                      <Text style={styles.alertMetaText}>Filed: {result.filed}</Text>
                      <Text style={styles.alertMetaText}>Status: {result.status}</Text>
                      <Text style={styles.alertMetaText}>Source: {result.source}</Text>
                    </View>
                  </View>

                  <View style={styles.recommendCard}>
                    <Text style={styles.recommendLabel}>ALON's recommendation</Text>
                    <Text style={styles.recommendText}>{result.recommendation}</Text>
                  </View>

                  <TouchableOpacity style={styles.advisorBtn} activeOpacity={0.85}>
                    <Text style={styles.advisorBtnText}>Talk to advisor →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.checkAnotherBtn} onPress={resetCheck} activeOpacity={0.7}>
                    <Text style={styles.checkAnotherText}>Check another property</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* ── NO CONFLICT ── */
                <View>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultIconClean}>
                      <ShieldCheck size={24} color="#16A34A" strokeWidth={2} />
                    </View>
                    <Text style={styles.resultTitleClean}>No Conflicts Found</Text>
                  </View>

                  <Text style={styles.resultProperty}>{buildingName}, {area}</Text>
                  {reraId ? <Text style={styles.resultRera}>RERA: {reraId}</Text> : null}

                  <View style={styles.cleanCard}>
                    {result.checks.map((check: string, i: number) => (
                      <Animated.View
                        key={i}
                        style={styles.cleanRow}
                        entering={FadeIn.delay(200 + i * 100).duration(200)}
                      >
                        <CheckCircle2 size={14} color="#16A34A" strokeWidth={2} />
                        <Text style={styles.cleanText}>{check}</Text>
                      </Animated.View>
                    ))}
                    <Text style={styles.cleanDate}>Last checked: {result.lastChecked}</Text>
                  </View>

                  <View style={styles.recommendCard}>
                    <Text style={styles.recommendLabel}>ALON's take</Text>
                    <Text style={styles.recommendText}>{result.recommendation}</Text>
                  </View>

                  <TouchableOpacity style={styles.shortlistBtn} activeOpacity={0.85}>
                    <Text style={styles.shortlistBtnText}>Shortlist this property →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.checkAnotherBtn} onPress={resetCheck} activeOpacity={0.7}>
                    <Text style={styles.checkAnotherText}>Check another property</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.warm100 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },

  // Input
  avatarRow: { marginBottom: Spacing.lg },
  avatarClip: { width: 36, height: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontFamily: 'DMSerifDisplay', fontSize: 22, color: Colors.textPrimary, lineHeight: 28, marginBottom: 8 },
  pageSubtitle: { fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, lineHeight: 19, marginBottom: Spacing.xxl },

  formGroup: { marginBottom: Spacing.lg },
  inputLabel: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary, marginBottom: 6 },
  optional: { fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  input: {
    fontSize: 15, fontFamily: 'DMSans-Medium', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.warm200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.white,
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.terra500, paddingVertical: 14, borderRadius: 12, marginTop: Spacing.md,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: '#fff' },

  trustNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.lg, paddingHorizontal: 4 },
  trustNoteText: { flex: 1, fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, lineHeight: 16 },

  // Scanning
  scanningWrap: { alignItems: 'center', paddingTop: 60 },
  scanHero: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxl },
  // Squircle rings (radius ≈ 32% of side) echo the AlonAvatar body shape,
  // matching the splash screen's built-in rings. Never borderRadius: 40 —
  // that's a perfect circle and breaks the brand's shape language.
  signalRing: { position: 'absolute', width: 80, height: 80, borderRadius: 26, borderWidth: 1.5, borderColor: Colors.activationGlow },
  scanEye: { zIndex: 1 },
  scanTitle: { fontFamily: 'DMSerifDisplay', fontSize: 22, color: Colors.textPrimary, marginBottom: 4 },
  scanSubtitle: { fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginBottom: Spacing.xxl },
  scanSteps: { marginBottom: Spacing.lg },
  scanStepText: { fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.terra500 },
  scanProgressTrack: { width: '80%', height: 4, backgroundColor: Colors.warm100, borderRadius: 2, overflow: 'hidden' },
  scanProgressFill: { height: '100%', backgroundColor: Colors.terra500, borderRadius: 2 },

  // Result shared
  resultHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  resultIconAlert: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  resultIconClean: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.green100, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  resultTitleAlert: { fontFamily: 'DMSerifDisplay', fontSize: 22, color: '#D97706' },
  resultTitleClean: { fontFamily: 'DMSerifDisplay', fontSize: 22, color: '#16A34A' },
  resultProperty: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, textAlign: 'center' },
  resultRera: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, textAlign: 'center', marginTop: 2, marginBottom: Spacing.lg },

  // Conflict alert card
  alertCard: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FBBF24', borderRadius: 14, padding: 14, marginTop: Spacing.lg, marginBottom: Spacing.lg },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  alertLabel: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: '#92400E' },
  alertMeta: { gap: 4, paddingLeft: 22 },
  alertMetaText: { fontSize: 12, fontFamily: 'DMSans-Regular', color: '#92400E', lineHeight: 17 },

  // Clean card
  cleanCard: { backgroundColor: Colors.green100, borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 14, padding: 14, marginTop: Spacing.lg, marginBottom: Spacing.lg },
  cleanRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cleanText: { fontSize: 13, fontFamily: 'DMSans-Regular', color: '#166534' },
  cleanDate: { fontSize: 11, fontFamily: 'DMSans-Regular', color: '#16A34A', marginTop: 4 },

  // Recommendation
  recommendCard: { backgroundColor: Colors.cream, borderRadius: 12, padding: 14, marginBottom: Spacing.xl },
  recommendLabel: { fontSize: 10, fontFamily: 'DMSans-Bold', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  recommendText: { fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textSecondary, lineHeight: 19 },

  // CTAs
  advisorBtn: { backgroundColor: Colors.terra500, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: Spacing.md },
  advisorBtnText: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  shortlistBtn: { backgroundColor: Colors.terra500, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: Spacing.md },
  shortlistBtnText: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  checkAnotherBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  checkAnotherText: { fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.terra500 },
});
