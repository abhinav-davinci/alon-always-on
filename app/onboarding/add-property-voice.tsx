import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Building2,
  MapPin,
  Wallet,
  Maximize2,
  Layers,
  ShieldCheck,
  User,
  MessageSquare,
  Mic,
  Pause,
  Play,
  Square,
  Check,
  CheckCircle2,
  Circle,
  AlertCircle,
  Pencil,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
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
import VoiceOrb from '../../components/VoiceOrb';
import Button from '../../components/Button';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useOnboardingStore } from '../../store/onboarding';
import { UserProperty } from '../../constants/properties';
import { checkCompleteness } from '../../utils/propertyCompleteness';

type ScreenPhase = 'explainer' | 'recording' | 'review' | 'done';
type VoiceState = 'idle' | 'listening' | 'paused' | 'done';

const FIELDS = [
  { id: 'name', icon: Building2, label: 'Building name', hint: 'Project/society name' },
  { id: 'area', icon: MapPin, label: 'Location', hint: 'Baner, Wakad, Hinjewadi' },
  { id: 'price', icon: Wallet, label: 'Price', hint: '₹80L, 1.2 Cr' },
  { id: 'size', icon: Maximize2, label: 'Size', hint: '1450 sqft' },
  { id: 'bhk', icon: Layers, label: 'Config', hint: '2 BHK, 3 BHK' },
  { id: 'builder', icon: User, label: 'Builder', hint: 'Godrej, Lodha, etc.' },
  { id: 'rera', icon: ShieldCheck, label: 'RERA', hint: 'RERA registration no.' },
];

const EXAMPLE_BRIEF = '"Godrej Hillside in Baner, 3BHK, around 1.35 crore, 1450 sqft, by Godrej Properties, RERA verified."';

const DEMO_TRANSCRIPT =
  'I found a property called Godrej Hillside in Baner, Pune. It is a 3BHK apartment, around 1.35 crore, 1450 square feet. Builder is Godrej Properties.';

const TRANSCRIPT_CHUNKS = [
  'I found a property called ',
  'Godrej Hillside ',
  'in Baner, Pune. ',
  'It is a 3BHK apartment, ',
  'around 1.35 crore, ',
  '1450 square feet. ',
  'Builder is ',
  'Godrej Properties.',
];

// Simulated extraction from transcript
const DEMO_EXTRACTION = {
  name: 'Godrej Hillside',
  area: 'Baner, Pune',
  price: '₹1.35 Cr',
  size: '1,450 sq.ft',
  bhk: '3 BHK',
  builderName: 'Godrej Properties',
  rera: '',
  propertyType: 'Apartment',
};

// ── Pulsing mic for start button ──
function PulsingMic() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, true
    );
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.pulsingMicWrap, s]}>
      <Mic size={18} color="#fff" strokeWidth={2} />
    </Animated.View>
  );
}

// ── Animated glow for field chips ──
function FieldGlow({ index }: { index: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(
      800 + index * 350,
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.15, { duration: 800 }),
      )
    );
  }, []);
  const s = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.fieldGlowBar, s]} />;
}

// ── Editable review field ──
function ReviewField({ label, value, onChangeText, extracted }: {
  label: string; value: string; onChangeText: (t: string) => void; extracted: boolean;
}) {
  return (
    <View style={rfStyles.container}>
      <View style={rfStyles.statusRow}>
        {extracted && value ? (
          <CheckCircle2 size={12} color="#22C55E" strokeWidth={2} />
        ) : (
          <AlertCircle size={12} color={Colors.amber500} strokeWidth={2} />
        )}
        <Text style={[rfStyles.statusLabel, (!extracted || !value) && rfStyles.statusLabelMissed]}>
          {extracted && value ? 'Extracted' : 'Not found — enter manually'}
        </Text>
      </View>
      <Text style={rfStyles.label}>{label}</Text>
      <TextInput
        style={rfStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor={Colors.warm300}
      />
    </View>
  );
}

const rfStyles = StyleSheet.create({
  container: { gap: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 1 },
  statusLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: '#22C55E' },
  statusLabelMissed: { color: Colors.amber500 },
  label: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
  input: {
    fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: Colors.warm200,
    paddingVertical: 6, paddingHorizontal: 0,
  },
});

export default function AddPropertyVoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { addUserProperty } = useOnboardingStore();

  const [phase, setPhase] = useState<ScreenPhase>('explainer');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Editable fields for review
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [bhk, setBhk] = useState('');
  const [builderName, setBuilderName] = useState('');
  const [rera, setRera] = useState('');
  const [submittedProperty, setSubmittedProperty] = useState<UserProperty | null>(null);

  const getDetectedFields = (text: string): string[] => {
    const detected: string[] = [];
    if (/hillside|belmondo|world city|24k|dream acres|panchshil|lodha|godrej/i.test(text)) detected.push('name');
    if (/baner|balewadi|wakad|pune|hinjewadi|kharadi|gahunje/i.test(text)) detected.push('area');
    if (/crore|lakh|₹|\d+\s*(cr|l)/i.test(text)) detected.push('price');
    if (/sq\.?ft|square\s*feet|\d{3,4}\s*(sq|sft)/i.test(text)) detected.push('size');
    if (/bhk|apartment|villa/i.test(text)) detected.push('bhk');
    if (/godrej|lodha|kolte|sobha|panchshil|builder|properties|group/i.test(text)) detected.push('builder');
    if (/rera|P\d{5,}/i.test(text)) detected.push('rera');
    return detected;
  };

  const handleStartRecording = () => {
    haptics.medium();
    setPhase('recording');
    setTimeout(() => startListening(), 300);
  };

  const startListening = () => {
    haptics.medium();
    setVoiceState('listening');
    setLiveTranscript('');
    setRecordSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordSeconds(s => s + 1);
    }, 1000);

    const chunks = [...TRANSCRIPT_CHUNKS];
    let chunkI = 0;
    const addChunk = () => {
      if (chunkI < chunks.length) {
        const text = chunks[chunkI];
        setLiveTranscript(prev => prev + text);
        chunkI++;
        typingRef.current = setTimeout(addChunk, 800 + Math.random() * 600);
      }
    };
    typingRef.current = setTimeout(addChunk, 500);
  };

  const handlePause = () => {
    haptics.light();
    setVoiceState('paused');
    if (timerRef.current) clearInterval(timerRef.current);
    if (typingRef.current) clearTimeout(typingRef.current);
  };

  const handleResume = () => {
    haptics.light();
    setVoiceState('listening');
    timerRef.current = setInterval(() => {
      setRecordSeconds(s => s + 1);
    }, 1000);
  };

  const handleStopAndSubmit = () => {
    haptics.success();
    setVoiceState('done');
    if (timerRef.current) clearInterval(timerRef.current);
    if (typingRef.current) clearTimeout(typingRef.current);
  };

  const handleReviewFields = () => {
    // Populate from demo extraction
    setName(DEMO_EXTRACTION.name);
    setArea(DEMO_EXTRACTION.area);
    setPrice(DEMO_EXTRACTION.price);
    setSize(DEMO_EXTRACTION.size);
    setBhk(DEMO_EXTRACTION.bhk);
    setBuilderName(DEMO_EXTRACTION.builderName);
    setRera(DEMO_EXTRACTION.rera);
    setPhase('review');
  };

  const handleConfirm = () => {
    haptics.success();
    const property: UserProperty = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      area: area.trim(),
      price: price.trim(),
      size: [bhk, size].filter(Boolean).join(' · '),
      bhk,
      propertyType: DEMO_EXTRACTION.propertyType,
      images: [],
      source: 'voice',
      addedAt: Date.now(),
      rera: rera.trim() || undefined,
      builderName: builderName.trim() || undefined,
    };
    addUserProperty(property);
    setSubmittedProperty(property);
    setPhase('done');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typingRef.current) clearTimeout(typingRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // ── Explainer Phase ──
  if (phase === 'explainer') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={20} color={Colors.gray400} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Add by voice</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.explainerScroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={styles.headerRow} entering={FadeIn.duration(300)}>
            <AlonAvatar size={36} showRings={false} showBlink variant="light" />
            <View style={styles.headerBubble}>
              <Text style={styles.headerBubbleText}>
                Describe the property you found — name, location, price, and any details you know. I'll fill in the rest.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200).duration(200)}>
            <Text style={styles.sectionLabel}>MENTION THESE DETAILS</Text>
          </Animated.View>

          <View style={styles.fieldGrid}>
            {FIELDS.map((field, i) => {
              const Icon = field.icon;
              return (
                <Animated.View
                  key={field.id}
                  style={styles.fieldCard}
                  entering={FadeIn.delay(300 + i * 70).duration(250)}
                >
                  <FieldGlow index={i} />
                  <View style={styles.fieldRow}>
                    <View style={styles.fieldIconCircle}>
                      <Icon size={13} color={Colors.terra500} strokeWidth={2} />
                    </View>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                  </View>
                  <Text style={styles.fieldHint} numberOfLines={1}>{field.hint}</Text>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View style={styles.extrasNote} entering={FadeIn.delay(750).duration(200)}>
            <MessageSquare size={11} color={Colors.terra300} strokeWidth={2} />
            <Text style={styles.extrasText}>
              Don't worry if you don't have all details — share what you know
            </Text>
          </Animated.View>

          <Animated.View style={styles.exampleCard} entering={FadeIn.delay(900).duration(300)}>
            <View style={styles.exampleHeader}>
              <View style={styles.exampleDot} />
              <Text style={styles.exampleLabel}>EXAMPLE</Text>
            </View>
            <Text style={styles.exampleText}>{EXAMPLE_BRIEF}</Text>
          </Animated.View>
        </ScrollView>

        <Animated.View
          style={[styles.startCtaWrap, { paddingBottom: insets.bottom + 16 }]}
          entering={FadeInUp.delay(1100).duration(300)}
        >
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStartRecording}
            activeOpacity={0.85}
          >
            <PulsingMic />
            <Text style={styles.startBtnText}>Start recording</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.switchLink} onPress={() => router.back()}>
            <Text style={styles.switchLinkText}>Switch to manual entry</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Review Phase ──
  if (phase === 'review') {
    const reviewFields = [
      { label: 'Building name', value: name, setter: setName, extracted: !!DEMO_EXTRACTION.name },
      { label: 'Location', value: area, setter: setArea, extracted: !!DEMO_EXTRACTION.area },
      { label: 'Price', value: price, setter: setPrice, extracted: !!DEMO_EXTRACTION.price },
      { label: 'Size (sq.ft)', value: size, setter: setSize, extracted: !!DEMO_EXTRACTION.size },
      { label: 'Configuration', value: bhk, setter: setBhk, extracted: !!DEMO_EXTRACTION.bhk },
      { label: 'Builder / Developer', value: builderName, setter: setBuilderName, extracted: !!DEMO_EXTRACTION.builderName },
      { label: 'RERA number', value: rera, setter: setRera, extracted: !!DEMO_EXTRACTION.rera },
    ];
    const extractedCount = reviewFields.filter(f => f.extracted && f.value).length;
    const missedCount = reviewFields.filter(f => !f.extracted || !f.value).length;
    const canConfirm = name.trim() && area.trim();

    return (
      <View style={[styles.reviewContainer, { paddingTop: insets.top }]}>
        <View style={styles.reviewTopBar}>
          <TouchableOpacity style={styles.reviewBackBtn} onPress={() => setPhase('recording')}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.reviewTitle}>Review details</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.reviewContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.reviewHeader}>
              <Mic size={14} color="#22C55E" strokeWidth={2} />
              <Text style={styles.reviewHeaderText}>
                {extractedCount} of {reviewFields.length} details extracted from voice
              </Text>
            </View>

            <View style={styles.fieldsCard}>
              {reviewFields.map((f) => (
                <ReviewField
                  key={f.label}
                  label={f.label}
                  value={f.value}
                  onChangeText={f.setter}
                  extracted={f.extracted}
                />
              ))}
            </View>

            {missedCount > 0 && (
              <View style={styles.missedNudge}>
                <AlertCircle size={13} color={Colors.amber500} strokeWidth={2} />
                <Text style={styles.missedNudgeText}>
                  {missedCount} field{missedCount > 1 ? 's' : ''} couldn't be detected. Fill them in for better comparison accuracy.
                </Text>
              </View>
            )}

            <View style={styles.editNote}>
              <Pencil size={11} color={Colors.textTertiary} strokeWidth={2} />
              <Text style={styles.editNoteText}>Tap any field to edit before confirming</Text>
            </View>
          </Animated.View>
        </ScrollView>

        <View style={[styles.reviewStickyBottom, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
            activeOpacity={0.85}
            disabled={!canConfirm}
            onPress={handleConfirm}
          >
            <CheckCircle2 size={16} color="#fff" strokeWidth={2} />
            <Text style={styles.confirmBtnText}>Confirm & add to my list</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Done Phase ──
  if (phase === 'done' && submittedProperty) {
    const completeness = checkCompleteness(submittedProperty);
    return (
      <View style={[styles.reviewContainer, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.doneScroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={styles.doneWrap} entering={FadeIn.duration(400)}>
            <View style={styles.doneIcon}>
              <CheckCircle2 size={48} color="#22C55E" strokeWidth={1.8} />
            </View>
            <Text style={styles.doneTitle}>Property added!</Text>
            <Text style={styles.doneSub}>{submittedProperty.name} has been added to your list.</Text>

            <View style={styles.completenessCard}>
              <View style={styles.completenessHeader}>
                <Text style={styles.completenessLabel}>Data completeness</Text>
                <Text style={[
                  styles.completenessPercent,
                  completeness.percent === 100 && styles.completenessPercentFull,
                ]}>{completeness.percent}%</Text>
              </View>
              <View style={styles.completenessBar}>
                <View style={[styles.completenessBarFill, { width: `${completeness.percent}%` }]} />
              </View>
              <View style={styles.fieldsList}>
                {completeness.fields.map((field) => (
                  <View key={field.key} style={styles.fieldsListRow}>
                    {field.filled ? (
                      <CheckCircle2 size={14} color="#22C55E" strokeWidth={2} />
                    ) : (
                      <Circle size={14} color={Colors.warm300} strokeWidth={1.5} />
                    )}
                    <Text style={[styles.fieldsListLabel, !field.filled && styles.fieldsListLabelMissing]}>
                      {field.label}
                    </Text>
                    {field.filled ? (
                      <Text style={styles.fieldsListValue} numberOfLines={1}>{field.value}</Text>
                    ) : (
                      <Text style={styles.fieldsListHint}>{field.hint}</Text>
                    )}
                  </View>
                ))}
              </View>
              {completeness.missingImportant.length > 0 && (
                <View style={styles.completenessNudge}>
                  <AlertCircle size={13} color={Colors.amber500} strokeWidth={2} />
                  <Text style={styles.completenessNudgeText}>
                    {completeness.missingImportant.length === 1
                      ? `Add ${completeness.missingImportant[0].label.toLowerCase()} for better comparison accuracy`
                      : `Add ${completeness.missingImportant.length} more details to compare with ALON's verified data`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.doneActions}>
              <TouchableOpacity
                style={styles.doneBtnPrimary}
                activeOpacity={0.85}
                onPress={() => router.replace('/onboarding/shortlist')}
              >
                <Text style={styles.doneBtnPrimaryText}>View my list</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneBtnSecondary}
                activeOpacity={0.7}
                onPress={() => router.back()}
              >
                <Text style={styles.doneBtnSecondaryText}>Back to dashboard</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── Recording Phase ──
  const detectedFields = getDetectedFields(liveTranscript);
  const orbState = voiceState === 'paused' ? 'idle' : voiceState === 'done' ? 'done' : voiceState === 'idle' ? 'idle' : 'listening';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.recTopBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (timerRef.current) clearInterval(timerRef.current);
          if (typingRef.current) clearTimeout(typingRef.current);
          setVoiceState('idle');
          setLiveTranscript('');
          setRecordSeconds(0);
          setPhase('explainer');
        }}>
          <ChevronLeft size={20} color={Colors.gray400} strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.recStatusRow}>
          <View style={styles.miniOrbWrap}>
            <VoiceOrb state={orbState} onPress={() => {}} />
          </View>
          <View style={styles.recStatusText}>
            <Text style={styles.recTimer}>{formatTime(recordSeconds)}</Text>
            {voiceState === 'listening' && (
              <View style={styles.recIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recIndicatorText}>Recording</Text>
              </View>
            )}
            {voiceState === 'paused' && <Text style={styles.recPausedText}>Paused</Text>}
            {voiceState === 'done' && <Text style={styles.recDoneText}>Complete</Text>}
            {voiceState === 'idle' && <Text style={styles.recPausedText}>Starting...</Text>}
          </View>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <View style={styles.recBody}>
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptCardLabel}>Live transcription</Text>
          {liveTranscript.length > 0 ? (
            <Text style={styles.transcriptCardText}>
              "{liveTranscript}{voiceState === 'listening' ? <Text style={styles.transcriptCursor}>|</Text> : null}"
            </Text>
          ) : (
            <Text style={styles.transcriptPlaceholder}>
              Start speaking — describe the property you found...
            </Text>
          )}
        </View>

        <View style={styles.fieldCheckSection}>
          <Text style={styles.fieldCheckLabel}>
            {detectedFields.length}/{FIELDS.length} details detected
          </Text>
          <View style={styles.fieldCheckGrid}>
            {FIELDS.map((f) => {
              const Icon = f.icon;
              const isDetected = detectedFields.includes(f.id);
              return (
                <View key={f.id} style={[styles.fieldCheckChip, isDetected && styles.fieldCheckChipDone]}>
                  {isDetected ? (
                    <Check size={11} color="#22C55E" strokeWidth={3} />
                  ) : (
                    <Icon size={11} color="rgba(255,255,255,0.3)" strokeWidth={2} />
                  )}
                  <Text style={[styles.fieldCheckText, isDetected && styles.fieldCheckTextDone]}>
                    {f.label}
                  </Text>
                </View>
              );
            })}
          </View>
          {detectedFields.length < FIELDS.length && voiceState !== 'done' && (
            <Text style={styles.fieldCheckHint}>Keep speaking to cover remaining details</Text>
          )}
        </View>
      </View>

      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 16 }]}>
        {(voiceState === 'listening' || voiceState === 'paused') && (
          <View style={styles.recordingActions}>
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={voiceState === 'listening' ? handlePause : handleResume}
              activeOpacity={0.75}
            >
              {voiceState === 'listening' ? (
                <Pause size={16} color={Colors.terra500} strokeWidth={2} />
              ) : (
                <Play size={16} color={Colors.terra500} strokeWidth={2} />
              )}
              <Text style={styles.pauseBtnText}>
                {voiceState === 'listening' ? 'Pause' : 'Resume'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStopAndSubmit} activeOpacity={0.85}>
              <Square size={14} color="#fff" strokeWidth={2} fill="#fff" />
              <Text style={styles.stopBtnText}>Stop & Submit</Text>
            </TouchableOpacity>
          </View>
        )}

        {voiceState === 'done' && (
          <Animated.View entering={FadeIn.duration(300)} style={{ width: '100%', gap: 10 }}>
            <Button
              title="Review & confirm →"
              onPress={handleReviewFields}
              variant="primary"
            />
            <TouchableOpacity
              style={styles.reRecordBtn}
              onPress={() => { setVoiceState('idle'); setLiveTranscript(''); setRecordSeconds(0); startListening(); }}
              activeOpacity={0.7}
            >
              <Mic size={13} color={Colors.terra400} strokeWidth={2} />
              <Text style={styles.reRecordText}>Record again</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {voiceState === 'idle' && (
          <TouchableOpacity style={styles.switchLink} onPress={() => router.back()}>
            <Text style={styles.switchLinkText}>Switch to manual entry</Text>
          </TouchableOpacity>
        )}

        {(voiceState === 'listening' || voiceState === 'paused') && (
          <Text style={styles.timeHint}>15 seconds recommended for best results</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy800 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { ...Typography.heading3, color: Colors.gray300 },

  // ── Explainer ──
  explainerScroll: {
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md, paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing.lg,
  },
  headerBubble: {
    flex: 1, backgroundColor: Colors.navy700, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, borderTopLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 10,
  },
  headerBubbleText: {
    fontSize: 13, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.8)', lineHeight: 19,
  },
  sectionLabel: {
    fontSize: 9, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1, marginBottom: 10,
  },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  fieldCard: {
    width: '47.5%', backgroundColor: Colors.navy700,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 2, borderLeftColor: 'rgba(217,95,43,0.4)',
    borderRadius: 12, paddingHorizontal: 11, paddingVertical: 10,
    overflow: 'hidden', position: 'relative',
  },
  fieldGlowBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: Colors.terra500, borderRadius: 1,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  fieldIconCircle: {
    width: 24, height: 24, borderRadius: 7, backgroundColor: 'rgba(217,95,43,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  fieldHint: { fontSize: 10, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.4)', marginLeft: 31 },
  extrasNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg, paddingLeft: 2,
  },
  extrasText: {
    fontSize: 11, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.35)', flex: 1, lineHeight: 16,
  },
  exampleCard: {
    backgroundColor: 'rgba(217,95,43,0.1)', borderWidth: 1, borderColor: 'rgba(217,95,43,0.2)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  exampleHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  exampleDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.terra400 },
  exampleLabel: { fontSize: 9, fontFamily: 'DMSans-SemiBold', color: Colors.terra400, letterSpacing: 0.8 },
  exampleText: {
    fontSize: 12, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.5)', lineHeight: 18, fontStyle: 'italic',
  },
  startCtaWrap: {
    paddingHorizontal: Spacing.xxl, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', alignItems: 'center', gap: 10,
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.terra500, borderRadius: 14, paddingVertical: 14, width: '100%',
  },
  startBtnText: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  pulsingMicWrap: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Recording phase ──
  recTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
  },
  recStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniOrbWrap: { transform: [{ scale: 0.35 }], marginHorizontal: -30, marginVertical: -30 },
  recStatusText: { alignItems: 'flex-start', gap: 2 },
  recTimer: { fontSize: 20, fontFamily: 'DMSans-SemiBold', color: '#fff', letterSpacing: 1 },
  recIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recordingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#EF4444' },
  recIndicatorText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: '#EF4444' },
  recPausedText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.4)' },
  recDoneText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: '#22C55E' },
  recBody: { flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.sm, gap: Spacing.md },
  transcriptCard: {
    flex: 1, backgroundColor: Colors.navy700, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  transcriptCardLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
  },
  transcriptCardText: {
    fontSize: 15, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.85)', lineHeight: 24, fontStyle: 'italic',
  },
  transcriptPlaceholder: {
    fontSize: 13, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.2)', lineHeight: 20, fontStyle: 'italic',
  },
  transcriptCursor: { color: Colors.terra500, fontStyle: 'normal' },
  fieldCheckSection: { gap: 8 },
  fieldCheckLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  fieldCheckGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fieldCheckChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.navy700, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
  },
  fieldCheckChipDone: { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.08)' },
  fieldCheckText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.4)' },
  fieldCheckTextDone: { color: 'rgba(255,255,255,0.8)' },
  fieldCheckHint: { fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.terra400, fontStyle: 'italic' },
  recordingActions: { flexDirection: 'row', gap: 10, width: '100%' },
  pauseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.navy700, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  pauseBtnText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.7)' },
  stopBtn: {
    flex: 1.3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.terra500,
  },
  stopBtnText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  reRecordBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6 },
  reRecordText: { fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.terra400 },
  timeHint: { fontSize: 10, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 4 },
  bottomWrap: { paddingHorizontal: Spacing.xxl, alignItems: 'center', gap: Spacing.lg },
  switchLink: { paddingVertical: Spacing.xs },
  switchLinkText: { ...Typography.captionMedium, color: Colors.terra300 },

  // ── Review phase (light background) ──
  reviewContainer: { flex: 1, backgroundColor: Colors.white },
  reviewTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  reviewBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  reviewTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  reviewContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg },
  reviewHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  reviewHeaderText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: '#16A34A' },
  fieldsCard: {
    backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, padding: 16, gap: 14,
  },
  missedNudge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 4,
  },
  missedNudgeText: {
    flex: 1, fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.amber500, lineHeight: 16,
  },
  editNote: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingHorizontal: 4,
  },
  editNoteText: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  reviewStickyBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.xxl, paddingTop: 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.warm100,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.terra500,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },

  // ── Done phase ──
  doneScroll: { flexGrow: 1, justifyContent: 'center' },
  doneWrap: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 40, gap: 12 },
  doneIcon: { marginBottom: 8 },
  doneTitle: { fontSize: 22, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  doneSub: {
    fontSize: 14, fontFamily: 'DMSans-Regular', color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 20, maxWidth: 280,
  },
  doneActions: { marginTop: 8, gap: 10, width: '100%' },
  doneBtnPrimary: { paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.terra500, alignItems: 'center' },
  doneBtnPrimaryText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  doneBtnSecondary: {
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.warm200, alignItems: 'center',
  },
  doneBtnSecondaryText: { fontSize: 14, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
  completenessCard: {
    width: '100%', backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200, padding: 16, marginTop: 4,
  },
  completenessHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  completenessLabel: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  completenessPercent: { fontSize: 13, fontFamily: 'DMSans-Bold', color: Colors.terra500 },
  completenessPercentFull: { color: '#22C55E' },
  completenessBar: {
    height: 4, borderRadius: 2, backgroundColor: Colors.warm200, marginBottom: 14, overflow: 'hidden',
  },
  completenessBarFill: { height: 4, borderRadius: 2, backgroundColor: Colors.terra500 },
  fieldsList: { gap: 10 },
  fieldsListRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldsListLabel: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textPrimary, width: 90 },
  fieldsListLabelMissing: { color: Colors.warm400 },
  fieldsListValue: {
    flex: 1, fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textSecondary, textAlign: 'right',
  },
  fieldsListHint: {
    flex: 1, fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.warm400,
    fontStyle: 'italic', textAlign: 'right',
  },
  completenessNudge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.warm200,
  },
  completenessNudgeText: {
    flex: 1, fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.amber500, lineHeight: 16,
  },
});
