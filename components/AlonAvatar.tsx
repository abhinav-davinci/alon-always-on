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
  ALON Avatar — Minimal tech-sensor aesthetic.

  Shape: Rounded square (like an app icon) — NOT a circle.
  Body: Frosted glass (translucent white on blue, or translucent white on dark).
  Eye: Simple white dot with a blue iris dot inside.
  Blink: The white dot does scaleY → 0.08 (gentle squish, not eyelids closing).
  Pulse ring: One subtle ring expanding outward.

  This is a tech product indicator, not a biological eye.
*/

interface AlonAvatarProps {
  size?: number;
  showRings?: boolean;
  showBlink?: boolean;
  variant?: 'default' | 'light'; // light = on dark/blue backgrounds
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
      // Gentle blink — matches prototype: scaleY 1→0.08 at 96% of 3.5s cycle
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
      // Subtle pulse ring — matches prototype ringPulse
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
      // Second ring, staggered
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

  // Proportions from prototype
  const containerR = size * 0.35; // rounded square radius (28/80)
  const eyeSize = size * 0.175; // white dot (14/80)
  const irisSize = size * 0.075; // blue center dot (6/80)
  const ringInset1 = size * 0.175; // first ring inset (14/80 from edge)
  const ringInset2 = size * 0.35; // second ring inset (28/80 from edge)

  const ring1Size = size + ringInset1 * 2;
  const ring2Size = size + ringInset2 * 2;

  return (
    <View
      style={[
        styles.wrap,
        { width: ring2Size + 8, height: ring2Size + 8 },
      ]}
    >
      {/* Pulse rings */}
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
                  ? 'rgba(255,255,255,0.15)'
                  : 'rgba(41,82,216,0.2)',
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
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(41,82,216,0.12)',
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
              : 'rgba(41,82,216,0.1)',
            borderColor: isLight
              ? 'rgba(255,255,255,0.25)'
              : 'rgba(41,82,216,0.25)',
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
          {/* Iris — blue center dot */}
          <View
            style={[
              styles.iris,
              {
                width: irisSize,
                height: irisSize,
                borderRadius: irisSize / 2,
                backgroundColor: isLight ? '#2952D8' : '#2952D8',
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
