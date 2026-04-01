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
type VoiceState = 'idle' | 'listening' | 'done';

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
  const [transcript, setTranscript] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStartRecording = () => {
    haptics.medium();
    setPhase('recording');
  };

  const handleOrbPress = () => {
    if (voiceState === 'idle') {
      haptics.medium();
      setVoiceState('listening');
      setTimeout(() => {
        setVoiceState('done');
        setTranscript(DEMO_TRANSCRIPT);
        haptics.success();
      }, 3000);
    } else if (voiceState === 'done') {
      setVoiceState('idle');
      setTranscript('');
      setDisplayedText('');
    }
  };

  useEffect(() => {
    if (transcript && voiceState === 'done') {
      let i = 0;
      setDisplayedText('');
      const type = () => {
        if (i < transcript.length) {
          setDisplayedText(transcript.slice(0, i + 1));
          i++;
          typingRef.current = setTimeout(type, 25);
        }
      };
      type();
      return () => { if (typingRef.current) clearTimeout(typingRef.current); };
    }
  }, [transcript, voiceState]);

  // ── Explainer Phase ──
  if (phase === 'explainer') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={20} color={Colors.gray400} strokeWidth={2} />
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
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          if (voiceState === 'idle') { setPhase('explainer'); }
          else { setVoiceState('idle'); setTranscript(''); setDisplayedText(''); }
        }}>
          <ChevronLeft size={20} color={Colors.gray400} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {voiceState === 'listening' ? 'Listening...' : voiceState === 'done' ? 'Got it' : 'Speak now'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.recordingContent}>
        {/* Field reminder strip — above orb */}
        {voiceState === 'idle' && (
          <Animated.View style={styles.fieldStrip} entering={FadeIn.delay(200).duration(300)}>
            <Text style={styles.fieldStripLabel}>Mention in your brief</Text>
            <View style={styles.fieldStripRow}>
              {FIELDS.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Animated.View
                    key={f.id}
                    style={styles.fieldStripChip}
                    entering={FadeIn.delay(300 + i * 80).duration(200)}
                  >
                    <Icon size={12} color={Colors.terra400} strokeWidth={2} />
                    <Text style={styles.fieldStripChipText}>{f.label}</Text>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        <VoiceOrb state={voiceState} onPress={handleOrbPress} />

        {voiceState === 'idle' && (
          <Animated.View style={styles.recordingHint} entering={FadeIn.duration(300)}>
            <Text style={styles.recordingHintSub}>
              Speak naturally — I'll pick up every detail
            </Text>
          </Animated.View>
        )}

        {displayedText ? (
          <Animated.View style={styles.transcriptWrap} entering={FadeIn.duration(300)}>
            <Text style={styles.transcriptLabel}>What I heard:</Text>
            <Text style={styles.transcriptText}>"{displayedText}"</Text>
          </Animated.View>
        ) : null}
      </View>

      <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 20 }]}>
        {voiceState === 'done' && displayedText.length === transcript.length && (
          <Animated.View entering={FadeIn.duration(400)} style={{ width: '100%' }}>
            <Button
              title="Looks right, find my home →"
              onPress={() => router.push('/onboarding/voice-confirm')}
              variant="primary"
            />
          </Animated.View>
        )}
        <TouchableOpacity style={styles.switchLink} onPress={() => router.back()}>
          <Text style={styles.switchLinkText}>Switch to tap instead</Text>
        </TouchableOpacity>
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

  // ── Recording ──
  recordingContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl,
  },

  // Field strip above orb
  fieldStrip: {
    alignItems: 'center', marginBottom: Spacing.xxxl, gap: 10,
  },
  fieldStripLabel: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  fieldStripRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8,
  },
  fieldStripChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.navy700, borderWidth: 1, borderColor: 'rgba(217,95,43,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  fieldStripChipText: {
    fontSize: 12, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.6)',
  },

  // Hint below orb
  recordingHint: { alignItems: 'center', marginTop: Spacing.sm },
  recordingHintSub: {
    fontSize: 13, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.3)', textAlign: 'center',
  },

  transcriptWrap: { marginTop: Spacing.xxxl, paddingHorizontal: Spacing.xl },
  transcriptLabel: { ...Typography.smallMedium, color: Colors.gray500, marginBottom: Spacing.sm },
  transcriptText: {
    ...Typography.body, color: Colors.white, fontStyle: 'italic', textAlign: 'center', lineHeight: 26,
  },

  bottomWrap: {
    paddingHorizontal: Spacing.xxl, alignItems: 'center', gap: Spacing.lg,
  },

  switchLink: { paddingVertical: Spacing.xs },
  switchLinkText: { ...Typography.captionMedium, color: Colors.terra300 },
});
