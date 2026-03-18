import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import VoiceOrb from '../../components/VoiceOrb';
import Button from '../../components/Button';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { useHaptics } from '../../hooks/useHaptics';

type VoiceState = 'idle' | 'listening' | 'done';

// Simulated transcript for demo
const DEMO_TRANSCRIPT =
  'I want a 3BHK in Baner or Balewadi, around 1.2 to 1.5 crore budget, for my family to live in. Ready to move preferred.';

export default function VoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOrbPress = () => {
    if (voiceState === 'idle') {
      haptics.medium();
      setVoiceState('listening');

      // Simulate listening for 3 seconds
      setTimeout(() => {
        setVoiceState('done');
        setTranscript(DEMO_TRANSCRIPT);
        haptics.success();
      }, 3000);
    } else if (voiceState === 'done') {
      // Reset
      setVoiceState('idle');
      setTranscript('');
      setDisplayedText('');
    }
  };

  // Typing effect for transcript
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
      return () => {
        if (typingRef.current) clearTimeout(typingRef.current);
      };
    }
  }, [transcript, voiceState]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Tell ALON directly</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <VoiceOrb state={voiceState} onPress={handleOrbPress} />

        {displayedText ? (
          <Animated.View
            style={styles.transcriptContainer}
            entering={FadeIn.duration(300)}
          >
            <Text style={styles.transcriptLabel}>What I heard:</Text>
            <Text style={styles.transcriptText}>"{displayedText}"</Text>
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.bottomContainer}>
        {voiceState === 'done' && displayedText.length === transcript.length && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.bottomButtons}>
            <Button
              title="Looks right, find my home →"
              onPress={() => router.push('/onboarding/voice-confirm')}
              variant="primary"
            />
          </Animated.View>
        )}
        <TouchableOpacity
          style={styles.switchLink}
          onPress={() => router.back()}
        >
          <Text style={styles.switchLinkText}>Switch to tap instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.voiceBg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...Typography.heading3,
    color: Colors.gray300,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  transcriptContainer: {
    marginTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  transcriptLabel: {
    ...Typography.smallMedium,
    color: Colors.gray500,
    marginBottom: Spacing.sm,
  },
  transcriptText: {
    ...Typography.body,
    color: Colors.white,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  bottomButtons: {
    width: '100%',
  },
  switchLink: {
    paddingVertical: Spacing.sm,
  },
  switchLinkText: {
    ...Typography.captionMedium,
    color: Colors.blue300,
  },
});
