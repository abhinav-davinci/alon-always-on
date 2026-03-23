import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/theme';

type VoiceState = 'idle' | 'listening' | 'done';

interface VoiceOrbProps {
  state: VoiceState;
  onPress: () => void;
}

function WaveformBars({ active }: { active: boolean }) {
  const bars = Array.from({ length: 5 });

  return (
    <View style={styles.waveformContainer}>
      {bars.map((_, i) => (
        <WaveformBar key={i} index={i} active={active} />
      ))}
    </View>
  );
}

function WaveformBar({ index, active }: { index: number; active: boolean }) {
  const height = useSharedValue(8);

  useEffect(() => {
    if (active) {
      height.value = withDelay(
        index * 100,
        withRepeat(
          withSequence(
            withTiming(16 + Math.random() * 20, { duration: 200 + Math.random() * 200 }),
            withTiming(6 + Math.random() * 8, { duration: 200 + Math.random() * 200 })
          ),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(8, { duration: 300 });
    }
  }, [active]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.waveformBar, barStyle]} />;
}

export default function VoiceOrb({ state, onPress }: VoiceOrbProps) {
  const pulseScale = useSharedValue(1);
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0);

  useEffect(() => {
    if (state === 'listening') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      ring1Scale.value = withRepeat(
        withTiming(2, { duration: 1500 }),
        -1,
        false
      );
      ring1Opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 100 }),
          withTiming(0, { duration: 1400 })
        ),
        -1,
        false
      );
      ring2Scale.value = withDelay(
        500,
        withRepeat(
          withTiming(2, { duration: 1500 }),
          -1,
          false
        )
      );
      ring2Opacity.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(0.2, { duration: 100 }),
            withTiming(0, { duration: 1400 })
          ),
          -1,
          false
        )
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      ring1Opacity.value = withTiming(0, { duration: 300 });
      ring2Opacity.value = withTiming(0, { duration: 300 });
    }
  }, [state]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const stateLabel =
    state === 'idle'
      ? 'Tap to speak'
      : state === 'listening'
      ? 'Listening...'
      : 'Got it ✓';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <View style={styles.orbWrapper}>
          <Animated.View style={[styles.ring, ring1Style]} />
          <Animated.View style={[styles.ring, ring2Style]} />
          <Animated.View style={[styles.orb, orbStyle]}>
            <WaveformBars active={state === 'listening'} />
          </Animated.View>
        </View>
      </TouchableOpacity>
      <Text style={styles.stateLabel}>{stateLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  orbWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.terra400,
  },
  orb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.terra500,
  },
  stateLabel: {
    ...Typography.bodyMedium,
    color: Colors.gray400,
    marginTop: Spacing.xl,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveformBar: {
    width: 4,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
});
