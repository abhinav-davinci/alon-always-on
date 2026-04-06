import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/theme';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import {
  ALON_LOGO_VIEWBOX,
  ALON_HEAD_PATHS,
  ALON_EAR_LEFT_PATH,
  ALON_EAR_RIGHT_PATH,
  ALON_BODY_PATHS,
  ALON_ACCENT_PATHS,
} from '../constants/alonLogo';

/*
  ALON Avatar — Logo-based animated character.

  "ON" is written vertically. The head is a white chat bubble shape
  (showing ALON is an interactive assistant). Ears are terracotta.
  Hands/body are terracotta vertical bars.

  Animation layers:
    1. Head (white chat bubble) — entrance drop + idle bob
    2. Ears (terracotta side pieces) — entrance pop + periodic flick
    3. Hands (terracotta vertical bars) — entrance slide + breathing
    4. Center accent (terracotta stair bars) — entrance fade + subtle pulse

  Pulse rings are separate, outside the body.
*/

interface AlonAvatarProps {
  size?: number;
  showRings?: boolean;
  showBlink?: boolean; // controls body animation (entrance + idle)
  variant?: 'default' | 'light';
}

// Spring config for snappy, premium feel
const SPRING_BOUNCY = { damping: 12, stiffness: 180, mass: 0.8 };
const SPRING_GENTLE = { damping: 14, stiffness: 120, mass: 1 };

export default function AlonAvatar({
  size = 56,
  showRings = true,
  showBlink = true,
  variant = 'default',
}: AlonAvatarProps) {
  // --- Entrance animations ---
  const headY = useSharedValue(-12);
  const headScale = useSharedValue(0.7);
  const headOpacity = useSharedValue(0);

  const earsScale = useSharedValue(0);
  const earsOpacity = useSharedValue(0);

  const handsY = useSharedValue(8);
  const handsScale = useSharedValue(0.5);
  const handsOpacity = useSharedValue(0);

  const accentOpacity = useSharedValue(0);

  // --- Idle animations ---
  const headBob = useSharedValue(0);
  const bodyBreath = useSharedValue(1);
  const earFlickL = useSharedValue(1);
  const earFlickR = useSharedValue(1);
  const sway = useSharedValue(0);

  // --- Ring animations ---
  const ringScale = useSharedValue(0.9);
  const ringOpacity = useSharedValue(0.8);
  const ring2Scale = useSharedValue(0.9);
  const ring2Opacity = useSharedValue(0.5);

  const isSmall = size < 40;

  useEffect(() => {
    if (showBlink && !isSmall) {
      // === ENTRANCE CHOREOGRAPHY ===

      // Head: drops in with spring (0ms)
      headOpacity.value = withTiming(1, { duration: 300 });
      headY.value = withSpring(0, SPRING_BOUNCY);
      headScale.value = withSpring(1, SPRING_BOUNCY);

      // Ears: pop out with overshoot (250ms delay)
      earsOpacity.value = withDelay(250, withTiming(1, { duration: 200 }));
      earsScale.value = withDelay(250, withSpring(1, { damping: 10, stiffness: 200, mass: 0.6 }));

      // Hands/body: slide up (350ms delay)
      handsOpacity.value = withDelay(350, withTiming(1, { duration: 250 }));
      handsY.value = withDelay(350, withSpring(0, SPRING_GENTLE));
      handsScale.value = withDelay(350, withSpring(1, SPRING_GENTLE));

      // Center accent: fade in last (500ms delay)
      accentOpacity.value = withDelay(500, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));

      // === IDLE LOOPS (start after entrance settles) ===
      const idleDelay = 900;

      // Head bob: ±1.5px vertical sine wave, 3.2s period
      headBob.value = withDelay(
        idleDelay,
        withRepeat(
          withSequence(
            withTiming(-1.5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.5, { duration: 1600, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );

      // Body breathing: scaleY 1 → 1.018 → 1, 3.6s period
      bodyBreath.value = withDelay(
        idleDelay,
        withRepeat(
          withSequence(
            withTiming(1.018, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        )
      );

      // Ear flick: periodic micro-scale burst every 4s
      earFlickL.value = withDelay(
        idleDelay + 600,
        withRepeat(
          withSequence(
            withTiming(1.1, { duration: 120, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withDelay(3600, withTiming(1, { duration: 0 }))
          ),
          -1,
          false
        )
      );
      earFlickR.value = withDelay(
        idleDelay + 2200,
        withRepeat(
          withSequence(
            withTiming(1.1, { duration: 120, easing: Easing.out(Easing.ease) }),
            withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withDelay(4200, withTiming(1, { duration: 0 }))
          ),
          -1,
          false
        )
      );

      // Subtle full-body sway: ±0.8px horizontal, 5s period
      sway.value = withDelay(
        idleDelay,
        withRepeat(
          withSequence(
            withTiming(0.8, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
            withTiming(-0.8, { duration: 2500, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );
    } else if (isSmall || !showBlink) {
      // Static render for small sizes or no animation
      headOpacity.value = 1;
      headY.value = 0;
      headScale.value = 1;
      earsOpacity.value = 1;
      earsScale.value = 1;
      handsOpacity.value = 1;
      handsY.value = 0;
      handsScale.value = 1;
      accentOpacity.value = 1;
    }

    // Rings (independent of body animation)
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

  // --- Animated styles ---
  const headStyle = useAnimatedStyle(() => ({
    opacity: headOpacity.value,
    transform: [
      { translateY: headY.value + headBob.value },
      { translateX: sway.value },
      { scale: headScale.value },
    ],
  }));

  const earLStyle = useAnimatedStyle(() => ({
    opacity: earsOpacity.value,
    transform: [
      { scale: earsScale.value * earFlickL.value },
      { translateX: sway.value * 0.6 },
    ],
  }));

  const earRStyle = useAnimatedStyle(() => ({
    opacity: earsOpacity.value,
    transform: [
      { scale: earsScale.value * earFlickR.value },
      { translateX: sway.value * 0.6 },
    ],
  }));

  const handsStyle = useAnimatedStyle(() => ({
    opacity: handsOpacity.value,
    transform: [
      { translateY: handsY.value },
      { translateX: sway.value * 0.4 },
      { scale: handsScale.value },
      { scaleY: bodyBreath.value },
    ],
  }));

  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
    transform: [
      { translateX: sway.value * 0.5 },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  // --- Layout calculations ---
  const isLight = variant === 'light';
  const containerR = size * 0.35;
  const ringInset1 = size * 0.175;
  const ringInset2 = size * 0.35;
  const ring1Size = size + ringInset1 * 2;
  const ring2Size = size + ringInset2 * 2;
  const svgSize = size * 0.62;

  // Map fill colors: white paths become navy on light backgrounds
  const mapFill = (fill: string) => {
    if (isLight) return fill; // on dark bg, keep original white/terra colors
    // On light bg (default variant): swap white → navy, keep terracotta
    if (fill.startsWith('#FE') || fill === '#FFFFFF') return Colors.navy800;
    return fill;
  };

  // Shared SVG props
  const svgProps = { width: svgSize, height: svgSize, viewBox: ALON_LOGO_VIEWBOX };

  return (
    <View style={[styles.wrap, { width: ring2Size + 8, height: ring2Size + 8 }]}>
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
                borderColor: isLight ? 'rgba(232,168,76,0.2)' : 'rgba(217,95,43,0.18)',
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
                borderColor: isLight ? 'rgba(232,168,76,0.1)' : 'rgba(217,95,43,0.1)',
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
            backgroundColor: isLight ? 'rgba(255,255,255,0.12)' : Colors.warm50,
            borderColor: isLight ? 'rgba(255,255,255,0.25)' : Colors.warm200,
          },
        ]}
      >
        <View style={{ width: svgSize, height: svgSize }}>
          {/* Layer 1: Hands + Body (bottom, behind everything) */}
          <Animated.View style={[StyleSheet.absoluteFill, handsStyle]}>
            <Svg {...svgProps}>
              {ALON_BODY_PATHS.map((p, i) => (
                <Path key={`body-${i}`} d={p.d} fill={mapFill(p.fill)} transform={p.transform} />
              ))}
            </Svg>
          </Animated.View>

          {/* Layer 2: Head (white chat bubble) */}
          <Animated.View style={[StyleSheet.absoluteFill, headStyle]}>
            <Svg {...svgProps}>
              {ALON_HEAD_PATHS.map((p, i) => (
                <Path key={`head-${i}`} d={p.d} fill={mapFill(p.fill)} transform={p.transform} />
              ))}
            </Svg>
          </Animated.View>

          {/* Layer 3: Left ear (terracotta) */}
          <Animated.View style={[StyleSheet.absoluteFill, earLStyle]}>
            <Svg {...svgProps}>
              <Path d={ALON_EAR_LEFT_PATH.d} fill={mapFill(ALON_EAR_LEFT_PATH.fill)} transform={ALON_EAR_LEFT_PATH.transform} />
            </Svg>
          </Animated.View>

          {/* Layer 4: Right ear (terracotta) */}
          <Animated.View style={[StyleSheet.absoluteFill, earRStyle]}>
            <Svg {...svgProps}>
              <Path d={ALON_EAR_RIGHT_PATH.d} fill={mapFill(ALON_EAR_RIGHT_PATH.fill)} transform={ALON_EAR_RIGHT_PATH.transform} />
            </Svg>
          </Animated.View>

          {/* Layer 5: Center accent pattern (terracotta stair bars) */}
          <Animated.View style={[StyleSheet.absoluteFill, accentStyle]}>
            <Svg {...svgProps}>
              {ALON_ACCENT_PATHS.map((p, i) => (
                <Path key={`accent-${i}`} d={p.d} fill={mapFill(p.fill)} transform={p.transform} />
              ))}
            </Svg>
          </Animated.View>
        </View>
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
    overflow: 'hidden',
  },
});
