import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

/*
  ALON Avatar — Trust Architecture palette.

  Shape: Rounded square (like an app icon).
  Body: Frosted glass with warm tint.
  Eye: White dot with terracotta iris.
  Pulse rings: Warm terracotta tint on light bg, warm white on dark bg.
  Blink: scaleY → 0.08, gentle double-blink.
*/

interface AlonAvatarProps {
  size?: number;
  showRings?: boolean;
  showBlink?: boolean;
  variant?: 'default' | 'light'; // light = on dark/navy backgrounds
}

export default function AlonAvatar({
  size = 56,
  showRings = true,
  showBlink = true,
  variant = 'default',
}: AlonAvatarProps) {
  const eyeScaleY = useSharedValue(1);
  const ringScale = useSharedValue(0.9);
  const ringOpacity = useSharedValue(0.8);
  const ring2Scale = useSharedValue(0.9);
  const ring2Opacity = useSharedValue(0.5);

  useEffect(() => {
    if (showBlink) {
      eyeScaleY.value = withRepeat(
        withSequence(
          withDelay(3200, withTiming(0.08, { duration: 100 })),
          withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    }

    if (showRings) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 0 }),
          withTiming(1.1, { duration: 2500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 0 }),
          withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
      ring2Scale.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(0.9, { duration: 0 }),
            withTiming(1.1, { duration: 2500, easing: Easing.out(Easing.ease) })
          ),
          -1,
          false
        )
      );
      ring2Opacity.value = withDelay(
        500,
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 0 }),
            withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) })
          ),
          -1,
          false
        )
      );
    }
  }, []);

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyeScaleY.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const isLight = variant === 'light';

  const containerR = size * 0.35;
  const eyeSize = size * 0.175;
  const irisSize = size * 0.075;
  const ringInset1 = size * 0.175;
  const ringInset2 = size * 0.35;

  const ring1Size = size + ringInset1 * 2;
  const ring2Size = size + ringInset2 * 2;

  return (
    <View
      style={[
        styles.wrap,
        { width: ring2Size + 8, height: ring2Size + 8 },
      ]}
    >
      {/* Pulse rings — warm tint */}
      {showRings && (
        <>
          <Animated.View
            style={[
              styles.ring,
              {
                width: ring1Size,
                height: ring1Size,
                borderRadius: containerR + ringInset1 * 0.6,
                borderColor: isLight
                  ? 'rgba(232,168,76,0.2)'   // warm amber on dark
                  : 'rgba(217,95,43,0.18)',    // terracotta on light
              },
              ringStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                width: ring2Size,
                height: ring2Size,
                borderRadius: containerR + ringInset2 * 0.5,
                borderColor: isLight
                  ? 'rgba(232,168,76,0.1)'
                  : 'rgba(217,95,43,0.1)',
              },
              ring2Style,
            ]}
          />
        </>
      )}

      {/* Body — frosted rounded square */}
      <View
        style={[
          styles.body,
          {
            width: size,
            height: size,
            borderRadius: containerR,
            backgroundColor: isLight
              ? 'rgba(255,255,255,0.12)'
              : 'rgba(217,95,43,0.06)',       // warm tint on light bg
            borderColor: isLight
              ? 'rgba(255,255,255,0.25)'
              : 'rgba(217,95,43,0.15)',
          },
        ]}
      >
        {/* Eye — white dot */}
        <Animated.View
          style={[
            styles.eye,
            {
              width: eyeSize,
              height: eyeSize,
              borderRadius: eyeSize / 2,
            },
            eyeStyle,
          ]}
        >
          {/* Iris — terracotta center dot */}
          <View
            style={[
              styles.iris,
              {
                width: irisSize,
                height: irisSize,
                borderRadius: irisSize / 2,
                backgroundColor: '#D95F2B',   // terracotta
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  eye: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iris: {
    position: 'absolute',
  },
});
