import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MapPin,
  Building2,
  Maximize2,
  Wallet,
  Target,
  Clock,
  MessageSquare,
  Mic,
  Pause,
  Play,
  Square,
  Check,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
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

type ScreenPhase = 'explainer' | 'recording';
type VoiceState = 'idle' | 'listening' | 'paused' | 'done';

const FIELDS = [
  { id: 'loc', icon: MapPin, label: 'Location', hint: 'Baner, Wakad, West Pune' },
  { id: 'type', icon: Building2, label: 'Type', hint: 'Apartment, Villa, Office' },
  { id: 'size', icon: Maximize2, label: 'Size', hint: '2 BHK, 3 BHK, 1000 sqft' },
  { id: 'budget', icon: Wallet, label: 'Budget', hint: '80L to 1.2 Cr' },
  { id: 'purpose', icon: Target, label: 'Purpose', hint: 'Self use, investment' },
  { id: 'timeline', icon: Clock, label: 'Timeline', hint: 'Ready to move, 1 year' },
];

const EXAMPLE_BRIEF = '"3BHK in Baner or Balewadi, 1.2–1.5 Cr, family use, ready to move, need parking, established builder."';

const DEMO_TRANSCRIPT =
  'I want a 3BHK in Baner or Balewadi, around 1.2 to 1.5 crore budget, for my family to live in. Ready to move preferred.';

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

// ── Compact recording orb for inline header (replaces scaled VoiceOrb) ──
function CompactRecordingOrb({ active }: { active: boolean }) {
  const pulse = useSharedValue(1);
  const ring = useSharedValue(0);
  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, true,
      );
      ring.value = withRepeat(withTiming(1, { duration: 1400 }), -1, false);
    } else {
      pulse.value = withTiming(1, { duration: 300 });
      ring.value = withTiming(0, { duration: 300 });
    }
  }, [active]);
  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring.value * 0.8 }],
    opacity: 0.35 * (1 - ring.value),
  }));
  return (
    <View style={styles.compactOrbWrap}>
      <Animated.View style={[styles.compactOrbRing, ringStyle]} />
      <Animated.View style={[styles.compactOrb, orbStyle]}>
        <CompactWaveform active={active} />
      </Animated.View>
    </View>
  );
}

function CompactWaveform({ active }: { active: boolean }) {
  return (
    <View style={styles.compactWaveRow}>
      {[0, 1, 2, 3].map(i => <CompactWaveBar key={i} index={i} active={active} />)}
    </View>
  );
}

function CompactWaveBar({ index, active }: { index: number; active: boolean }) {
  const h = useSharedValue(4);
  useEffect(() => {
    if (active) {
      h.value = withDelay(
        index * 80,
        withRepeat(
          withSequence(
            withTiming(10 + Math.random() * 8, { duration: 220 + Math.random() * 150 }),
            withTiming(4 + Math.random() * 3, { duration: 220 + Math.random() * 150 }),
          ),
          -1, true,
        ),
      );
    } else {
      h.value = withTiming(4, { duration: 200 });
    }
  }, [active]);
  const s = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[styles.compactWaveBar, s]} />;
}

// ── Animated sequencing glow for field chips ──
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

export default function VoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [phase, setPhase] = useState<ScreenPhase>('explainer');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptIdx = useRef(0);

  // Simulated live transcript chunks
  const TRANSCRIPT_CHUNKS = [
    'I want a ',
    '3BHK in ',
    'Baner or Balewadi, ',
    'around 1.2 to 1.5 crore ',
    'budget, ',
    'for my family ',
    'to live in. ',
    'Ready to move ',
    'preferred.',
  ];

  // Detected fields based on transcript progress
  const getDetectedFields = (text: string): string[] => {
    const detected: string[] = [];
    if (/baner|balewadi|wakad|pune|hinjewadi|kharadi/i.test(text)) detected.push('loc');
    if (/bhk|apartment|villa|office/i.test(text)) detected.push('type', 'size');
    if (/crore|lakh|budget|₹/i.test(text)) detected.push('budget');
    if (/family|self|invest|live in/i.test(text)) detected.push('purpose');
    if (/ready|move|year|immediate/i.test(text)) detected.push('timeline');
    return detected;
  };

  const handleStartRecording = () => {
    haptics.medium();
    setPhase('recording');
    // Auto-start recording after phase transition
    setTimeout(() => startListening(), 300);
  };

  const startListening = () => {
    haptics.medium();
    setVoiceState('listening');
    transcriptIdx.current = 0;
    setLiveTranscript('');
    setRecordSeconds(0);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordSeconds(s => s + 1);
    }, 1000);

    // Simulate live transcription chunks with closure-safe index
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

  const handleOrbPress = () => {
    if (voiceState === 'idle') {
      startListening();
    }
  };

  // Cleanup on unmount
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
            <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Voice brief</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.explainerScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + bubble */}
          <Animated.View style={styles.headerRow} entering={FadeIn.duration(300)}>
            <AlonAvatar size={36} showRings={false} showBlink variant="light" />
            <View style={styles.headerBubble}>
              <Text style={styles.headerBubbleText}>
                Tell me what you're looking for — naturally, in your own words. I'll pick up every detail.
              </Text>
            </View>
          </Animated.View>

          {/* Section label */}
          <Animated.View entering={FadeIn.delay(200).duration(200)}>
            <Text style={styles.sectionLabel}>COVER THESE IN YOUR BRIEF</Text>
          </Animated.View>

          {/* 2-column field grid */}
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

          {/* Extras note */}
          <Animated.View style={styles.extrasNote} entering={FadeIn.delay(750).duration(200)}>
            <MessageSquare size={11} color={Colors.terra300} strokeWidth={2} />
            <Text style={styles.extrasText}>
              Also mention any deal-breakers — parking, floor preference, builders to avoid
            </Text>
          </Animated.View>

          {/* Example card */}
          <Animated.View style={styles.exampleCard} entering={FadeIn.delay(900).duration(300)}>
            <View style={styles.exampleHeader}>
              <View style={styles.exampleDot} />
              <Text style={styles.exampleLabel}>EXAMPLE</Text>
            </View>
            <Text style={styles.exampleText}>{EXAMPLE_BRIEF}</Text>
          </Animated.View>
        </ScrollView>

        {/* Sticky bottom CTA */}
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
            <Text style={styles.switchLinkText}>Switch to tap instead</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Recording Phase ──
  const detectedFields = getDetectedFields(liveTranscript);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Compact top bar with inline orb + timer */}
      <View style={styles.recTopBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (timerRef.current) clearInterval(timerRef.current);
          if (typingRef.current) clearTimeout(typingRef.current);
          setVoiceState('idle');
          setLiveTranscript('');
          setRecordSeconds(0);
          setPhase('explainer');
        }}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>

        {/* Inline orb + timer + status */}
        <View style={styles.recStatusRow}>
          <CompactRecordingOrb active={voiceState === 'listening'} />
          <View style={styles.recStatusText}>
            <Text style={styles.recTimer}>{formatTime(recordSeconds)}</Text>
            {voiceState === 'listening' && (
              <View style={styles.recIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recIndicatorText}>Recording</Text>
              </View>
            )}
            {voiceState === 'paused' && (
              <Text style={styles.recPausedText}>Paused</Text>
            )}
            {voiceState === 'done' && (
              <Text style={styles.recDoneText}>Complete</Text>
            )}
            {voiceState === 'idle' && (
              <Text style={styles.recPausedText}>Starting...</Text>
            )}
          </View>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Main content — no scroll needed */}
      <View style={styles.recBody}>
        {/* Live transcript */}
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptCardLabel}>Live transcription</Text>
          {liveTranscript.length > 0 ? (
            <Text style={styles.transcriptCardText}>
              "{liveTranscript}{voiceState === 'listening' ? <Text style={styles.transcriptCursor}>|</Text> : null}"
            </Text>
          ) : (
            <Text style={styles.transcriptPlaceholder}>
              Start speaking — your words will appear here in real time...
            </Text>
          )}
        </View>

        {/* Field checklist as compact chips */}
        <View style={styles.fieldCheckSection}>
          <Text style={styles.fieldCheckLabel}>
            {detectedFields.length}/{FIELDS.length} fields covered
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
            <Text style={styles.fieldCheckHint}>Keep speaking to cover remaining fields</Text>
          )}
        </View>
      </View>

      {/* ── Bottom CTAs ── */}
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
              onPress={() => router.push('/onboarding/voice-confirm')}
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
            <Text style={styles.switchLinkText}>Switch to tap instead</Text>
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
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing.lg,
  },
  headerBubble: {
    flex: 1,
    backgroundColor: Colors.navy700, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, borderTopLeftRadius: 4,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  headerBubbleText: {
    fontSize: 13, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.8)', lineHeight: 19,
  },

  sectionLabel: {
    fontSize: 9, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1, marginBottom: 10,
  },

  // 2-column grid
  fieldGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10,
  },
  fieldCard: {
    width: '47.5%',
    backgroundColor: Colors.navy700,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 2, borderLeftColor: 'rgba(217,95,43,0.4)',
    borderRadius: 12, paddingHorizontal: 11, paddingVertical: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  fieldGlowBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: Colors.terra500, borderRadius: 1,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3,
  },
  fieldIconCircle: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: 'rgba(217,95,43,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 13, fontFamily: 'DMSans-SemiBold', color: '#fff',
  },
  fieldHint: {
    fontSize: 10, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.4)',
    marginLeft: 31,
  },

  // Extras note
  extrasNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: Spacing.lg, paddingLeft: 2,
  },
  extrasText: {
    fontSize: 11, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.35)',
    flex: 1, lineHeight: 16,
  },

  // Example
  exampleCard: {
    backgroundColor: 'rgba(217,95,43,0.1)', borderWidth: 1, borderColor: 'rgba(217,95,43,0.2)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  exampleHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5,
  },
  exampleDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.terra400,
  },
  exampleLabel: {
    fontSize: 9, fontFamily: 'DMSans-SemiBold', color: Colors.terra400, letterSpacing: 0.8,
  },
  exampleText: {
    fontSize: 12, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.5)',
    lineHeight: 18, fontStyle: 'italic',
  },

  // Start CTA — sticky bottom
  startCtaWrap: {
    paddingHorizontal: Spacing.xxl, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', gap: 10,
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.terra500, borderRadius: 14, paddingVertical: 14, width: '100%',
  },
  startBtnText: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  pulsingMicWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Recording phase ──
  recTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  recStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },

  // Compact inline orb (replaces scaled VoiceOrb)
  compactOrbWrap: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  compactOrbRing: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: Colors.terra400,
  },
  compactOrb: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.terra500,
    alignItems: 'center', justifyContent: 'center',
  },
  compactWaveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 2.5,
  },
  compactWaveBar: {
    width: 2.5, backgroundColor: '#fff', borderRadius: 1.5,
  },

  recStatusText: {
    alignItems: 'flex-start', gap: 3,
  },
  recTimer: {
    fontSize: 20, fontFamily: 'DMSans-SemiBold', color: '#fff', letterSpacing: 1,
  },
  recIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  recordingDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#EF4444',
  },
  recIndicatorText: {
    fontSize: 10, fontFamily: 'DMSans-Medium', color: '#EF4444',
  },
  recPausedText: {
    fontSize: 10, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.4)',
  },
  recDoneText: {
    fontSize: 10, fontFamily: 'DMSans-Medium', color: '#22C55E',
  },

  recBody: {
    flex: 1, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, gap: Spacing.lg,
  },

  // Transcript card
  transcriptCard: {
    flex: 1,
    backgroundColor: Colors.navy700, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  transcriptCardLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
  },
  transcriptCardText: {
    fontSize: 15, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.85)',
    lineHeight: 24, fontStyle: 'italic',
  },
  transcriptPlaceholder: {
    fontSize: 13, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.2)',
    lineHeight: 20, fontStyle: 'italic',
  },
  transcriptCursor: {
    color: Colors.terra500, fontStyle: 'normal',
  },

  // Field check section — compact chips
  fieldCheckSection: {
    gap: 0,
  },
  fieldCheckLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
  },
  fieldCheckGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  fieldCheckChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.navy700, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
  },
  fieldCheckChipDone: {
    borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.08)',
  },
  fieldCheckText: {
    fontSize: 12, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.4)',
  },
  fieldCheckTextDone: {
    color: 'rgba(255,255,255,0.8)',
  },
  fieldCheckHint: {
    fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.terra400, fontStyle: 'italic',
    marginTop: 14, lineHeight: 16,
  },

  // Recording action buttons
  recordingActions: {
    flexDirection: 'row', gap: 10, width: '100%',
  },
  pauseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.navy700, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  pauseBtnText: {
    fontSize: 14, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.7)',
  },
  stopBtn: {
    flex: 1.3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.terra500,
  },
  stopBtnText: {
    fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff',
  },
  reRecordBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 6,
  },
  reRecordText: {
    fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.terra400,
  },
  timeHint: {
    fontSize: 10, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.2)',
    textAlign: 'center', marginTop: 4,
  },

  bottomWrap: {
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md,
    alignItems: 'center', gap: Spacing.sm,
  },

  switchLink: { paddingVertical: Spacing.xs },
  switchLinkText: { ...Typography.captionMedium, color: Colors.terra300 },
});
