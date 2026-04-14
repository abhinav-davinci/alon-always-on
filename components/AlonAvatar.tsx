import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
  FadeIn,
  FadeOut,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  ALON_LOGO_VIEWBOX,
  ALON_HEAD_PATHS,
  ALON_EAR_LEFT_PATH,
  ALON_EAR_RIGHT_PATH,
  ALON_BODY_PATHS,
  ALON_ACCENT_PATHS,
} from '../constants/alonLogo';
import { useHaptics } from '../hooks/useHaptics';

/*
  ALON Avatar — Interactive animated character.

  Touch reactions (size ≥ 40 only):
    Single tap: Squish + ears perk + speech bubble
    Double tap: Excited jump + hand wave
    Long press: Stretch & hold, elastic snapback on release

  Speech bubbles cycle through friendly greetings (taps 1-5),
  then funny "stop poking me" messages (taps 6-11), then reset.
*/

// --- Greeting pools ---
const GREETINGS_FRIENDLY = [
  'Hey there',
  "I'm here",
  'Always on',
  'Need me?',
  "Let's go",
];

const GREETINGS_FUNNY = [
  'Bhai, chill',
  'Not a stress ball',
  'My ears hurt',
  'Tapping won\'t find homes faster',
  'Bug report: excessive tapping',
  'Even Siri gets a break',
];

interface AlonAvatarProps {
  size?: number;
  showRings?: boolean;
  showBlink?: boolean;
  variant?: 'default' | 'light';
  interactive?: boolean; // explicit override; defaults based on size
  autoGreet?: boolean;   // auto-show intro bubble after entrance animation
  onPress?: () => void;
}

const SPRING_BOUNCY = { damping: 12, stiffness: 180, mass: 0.8 };
const SPRING_GENTLE = { damping: 14, stiffness: 120, mass: 1 };
const SPRING_ELASTIC = { damping: 8, stiffness: 220, mass: 0.6 };

export default function AlonAvatar({
  size = 56,
  showRings = true,
  showBlink = true,
  variant = 'default',
  interactive,
  autoGreet = false,
  onPress,
}: AlonAvatarProps) {
  const haptics = useHaptics();
  const isSmall = size < 40;
  const isInteractive = interactive ?? (!isSmall && showBlink);

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

  // --- Touch reaction animations ---
  const squishScaleX = useSharedValue(1);
  const squishScaleY = useSharedValue(1);
  const earPerk = useSharedValue(1);
  const jumpY = useSharedValue(0);
  const waveRotate = useSharedValue(0);
  const stretchScaleX = useSharedValue(1);
  const stretchScaleY = useSharedValue(1);

  // --- Speech bubble state ---
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const tapCount = useRef(0);
  const bubbleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTap = useRef(false);

  // --- Entrance + idle setup ---
  useEffect(() => {
    if (showBlink && !isSmall) {
      headOpacity.value = withTiming(1, { duration: 300 });
      headY.value = withSpring(0, SPRING_BOUNCY);
      headScale.value = withSpring(1, SPRING_BOUNCY);
      earsOpacity.value = withDelay(250, withTiming(1, { duration: 200 }));
      earsScale.value = withDelay(250, withSpring(1, { damping: 10, stiffness: 200, mass: 0.6 }));
      handsOpacity.value = withDelay(350, withTiming(1, { duration: 250 }));
      handsY.value = withDelay(350, withSpring(0, SPRING_GENTLE));
      handsScale.value = withDelay(350, withSpring(1, SPRING_GENTLE));
      accentOpacity.value = withDelay(500, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));

      const idleDelay = 900;
      headBob.value = withDelay(idleDelay, withRepeat(withSequence(
        withTiming(-1.5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.5, { duration: 1600, easing: Easing.inOut(Easing.sin) })
      ), -1, true));
      bodyBreath.value = withDelay(idleDelay, withRepeat(withSequence(
        withTiming(1.018, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ), -1, false));
      earFlickL.value = withDelay(idleDelay + 600, withRepeat(withSequence(
        withTiming(1.1, { duration: 120, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withDelay(3600, withTiming(1, { duration: 0 }))
      ), -1, false));
      earFlickR.value = withDelay(idleDelay + 2200, withRepeat(withSequence(
        withTiming(1.1, { duration: 120, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withDelay(4200, withTiming(1, { duration: 0 }))
      ), -1, false));
      sway.value = withDelay(idleDelay, withRepeat(withSequence(
        withTiming(0.8, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-0.8, { duration: 2500, easing: Easing.inOut(Easing.sin) })
      ), -1, true));
    } else if (isSmall || !showBlink) {
      headOpacity.value = 1; headY.value = 0; headScale.value = 1;
      earsOpacity.value = 1; earsScale.value = 1;
      handsOpacity.value = 1; handsY.value = 0; handsScale.value = 1;
      accentOpacity.value = 1;
    }

    if (showRings) {
      ringScale.value = withRepeat(withSequence(
        withTiming(0.9, { duration: 0 }), withTiming(1.1, { duration: 2500, easing: Easing.out(Easing.ease) })
      ), -1, false);
      ringOpacity.value = withRepeat(withSequence(
        withTiming(0.8, { duration: 0 }), withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) })
      ), -1, false);
      ring2Scale.value = withDelay(500, withRepeat(withSequence(
        withTiming(0.9, { duration: 0 }), withTiming(1.1, { duration: 2500, easing: Easing.out(Easing.ease) })
      ), -1, false));
      ring2Opacity.value = withDelay(500, withRepeat(withSequence(
        withTiming(0.5, { duration: 0 }), withTiming(0, { duration: 2500, easing: Easing.out(Easing.ease) })
      ), -1, false));
    }
  }, []);

  // --- Speech bubble helpers ---
  const showBubble = useCallback((text: string) => {
    if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current);
    setBubbleText(text);
    bubbleTimeout.current = setTimeout(() => setBubbleText(null), 2000);
  }, []);

  // Auto-greet on first appearance (intro screen)
  // Delay accounts for splash intro sequence before avatar becomes visible
  const autoGreetDone = useRef(false);
  useEffect(() => {
    if (autoGreet && !autoGreetDone.current) {
      autoGreetDone.current = true;
      const timer = setTimeout(() => {
        showBubble("Hey, I'm ALON");
      }, 4200); // ~3.4s for phase2 reveal + 0.8s after avatar is visible
      return () => clearTimeout(timer);
    }
  }, [autoGreet]);

  const getGreeting = useCallback(() => {
    const count = tapCount.current;
    if (count <= 5) {
      return GREETINGS_FRIENDLY[(count - 1) % GREETINGS_FRIENDLY.length];
    } else if (count <= 11) {
      return GREETINGS_FUNNY[(count - 6) % GREETINGS_FUNNY.length];
    } else {
      // Reset cycle
      tapCount.current = 1;
      return GREETINGS_FRIENDLY[0];
    }
  }, []);

  // --- Touch handlers ---
  const handleSingleTap = useCallback(() => {
    haptics.light();
    tapCount.current++;

    // Squish: scaleY down, scaleX up → spring back
    squishScaleY.value = withSequence(
      withTiming(0.78, { duration: 80, easing: Easing.out(Easing.ease) }),
      withSpring(1.04, SPRING_ELASTIC),
      withSpring(1, SPRING_BOUNCY)
    );
    squishScaleX.value = withSequence(
      withTiming(1.12, { duration: 80, easing: Easing.out(Easing.ease) }),
      withSpring(0.97, SPRING_ELASTIC),
      withSpring(1, SPRING_BOUNCY)
    );

    // Ears perk up
    earPerk.value = withSequence(
      withTiming(1.25, { duration: 150, easing: Easing.out(Easing.ease) }),
      withSpring(1, { damping: 10, stiffness: 160, mass: 0.7 })
    );

    // Speech bubble
    showBubble(getGreeting());
    onPress?.();
  }, [onPress]);

  const handleDoubleTap = useCallback(() => {
    haptics.medium();

    // Jump up and bounce back
    jumpY.value = withSequence(
      withTiming(-10, { duration: 150, easing: Easing.out(Easing.ease) }),
      withSpring(0, SPRING_ELASTIC)
    );

    // Hand wave: oscillate rotation
    waveRotate.value = withSequence(
      withTiming(8, { duration: 100 }),
      withTiming(-8, { duration: 100 }),
      withTiming(6, { duration: 100 }),
      withTiming(-6, { duration: 100 }),
      withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const handlePressIn = useCallback(() => {
    if (!isInteractive) return;
    haptics.selection();

    // Stretch vertically
    stretchScaleY.value = withTiming(1.25, { duration: 200, easing: Easing.out(Easing.ease) });
    stretchScaleX.value = withTiming(0.9, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [isInteractive]);

  const handlePressOut = useCallback(() => {
    if (!isInteractive) return;

    // Elastic snapback
    stretchScaleY.value = withSequence(
      withTiming(0.88, { duration: 100, easing: Easing.out(Easing.ease) }),
      withSpring(1, SPRING_ELASTIC)
    );
    stretchScaleX.value = withSequence(
      withTiming(1.08, { duration: 100, easing: Easing.out(Easing.ease) }),
      withSpring(1, SPRING_ELASTIC)
    );
  }, [isInteractive]);

  const handlePress = useCallback(() => {
    if (!isInteractive) return;

    if (pendingTap.current) {
      // Double tap detected
      pendingTap.current = false;
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
      handleDoubleTap();
    } else {
      // Wait to see if second tap comes
      pendingTap.current = true;
      doubleTapTimer.current = setTimeout(() => {
        if (pendingTap.current) {
          pendingTap.current = false;
          handleSingleTap();
        }
      }, 250);
    }
  }, [isInteractive, handleSingleTap, handleDoubleTap]);

  // --- Animated styles ---
  const wrapTouchStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: jumpY.value },
      { scaleX: squishScaleX.value * stretchScaleX.value },
      { scaleY: squishScaleY.value * stretchScaleY.value },
    ],
  }));

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
      { scale: earsScale.value * earFlickL.value * earPerk.value },
      { translateX: sway.value * 0.6 },
    ],
  }));

  const earRStyle = useAnimatedStyle(() => ({
    opacity: earsOpacity.value,
    transform: [
      { scale: earsScale.value * earFlickR.value * earPerk.value },
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
      { rotate: `${waveRotate.value}deg` },
    ],
  }));

  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
    transform: [{ translateX: sway.value * 0.5 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  // --- Layout ---
  const isLight = variant === 'light';
  const containerR = size * 0.35;
  const ringInset1 = size * 0.175;
  const ringInset2 = size * 0.35;
  const ring1Size = size + ringInset1 * 2;
  const ring2Size = size + ringInset2 * 2;
  const svgSize = size * 0.62;

  const mapFill = (fill: string) => {
    if (isLight) return fill;
    if (fill.startsWith('#FE') || fill === '#FFFFFF') return Colors.navy800;
    return fill;
  };

  const svgProps = { width: svgSize, height: svgSize, viewBox: ALON_LOGO_VIEWBOX };

  const avatarContent = (
    <View style={[styles.wrap, { width: ring2Size + 8, height: ring2Size + 8 }]}>
      {/* Speech bubble */}
      {bubbleText && (
        <Animated.View
          entering={FadeIn.duration(200).springify()}
          exiting={FadeOut.duration(300)}
          style={[
            styles.bubble,
            {
              bottom: ring2Size / 2 + size / 2 + 6,
              backgroundColor: isLight ? 'rgba(13,31,74,0.85)' : Colors.warm50,
              borderColor: isLight ? 'rgba(217,95,43,0.4)' : Colors.warm200,
            },
          ]}
        >
          <Text style={[
            styles.bubbleText,
            { color: isLight ? Colors.warm50 : Colors.navy800 },
          ]}>
            {bubbleText}
          </Text>
          <View style={[
            styles.bubbleArrow,
            { borderTopColor: isLight ? 'rgba(13,31,74,0.85)' : Colors.warm50 },
          ]} />
        </Animated.View>
      )}

      {/* Pulse rings */}
      {showRings && (
        <>
          <Animated.View style={[styles.ring, {
            width: ring1Size, height: ring1Size,
            borderRadius: containerR + ringInset1 * 0.6,
            borderColor: isLight ? 'rgba(232,168,76,0.2)' : 'rgba(217,95,43,0.18)',
          }, ringStyle]} />
          <Animated.View style={[styles.ring, {
            width: ring2Size, height: ring2Size,
            borderRadius: containerR + ringInset2 * 0.5,
            borderColor: isLight ? 'rgba(232,168,76,0.1)' : 'rgba(217,95,43,0.1)',
          }, ring2Style]} />
        </>
      )}

      {/* Body */}
      <Animated.View style={wrapTouchStyle}>
        <View style={[styles.body, {
          width: size, height: size, borderRadius: containerR,
          backgroundColor: isLight ? 'rgba(255,255,255,0.12)' : Colors.warm50,
          borderColor: isLight ? 'rgba(255,255,255,0.25)' : Colors.warm200,
        }]}>
          <View style={{ width: svgSize, height: svgSize }}>
            <Animated.View style={[StyleSheet.absoluteFill, handsStyle]}>
              <Svg {...svgProps}>
                {ALON_BODY_PATHS.map((p, i) => (
                  <Path key={`body-${i}`} d={p.d} fill={mapFill(p.fill)} transform={p.transform} />
                ))}
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, headStyle]}>
              <Svg {...svgProps}>
                {ALON_HEAD_PATHS.map((p, i) => (
                  <Path key={`head-${i}`} d={p.d} fill={mapFill(p.fill)} transform={p.transform} />
                ))}
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, earLStyle]}>
              <Svg {...svgProps}>
                <Path d={ALON_EAR_LEFT_PATH.d} fill={mapFill(ALON_EAR_LEFT_PATH.fill)} transform={ALON_EAR_LEFT_PATH.transform} />
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, earRStyle]}>
              <Svg {...svgProps}>
                <Path d={ALON_EAR_RIGHT_PATH.d} fill={mapFill(ALON_EAR_RIGHT_PATH.fill)} transform={ALON_EAR_RIGHT_PATH.transform} />
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, accentStyle]}>
              <Svg {...svgProps}>
                {ALON_ACCENT_PATHS.map((p, i) => (
                  <Path key={`accent-${i}`} d={p.d} fill={mapFill(p.fill)} transform={p.transform} />
                ))}
              </Svg>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );

  if (!isInteractive) return avatarContent;

  return (
    <Pressable
      style={{ overflow: 'visible' }}
      onPress={handlePress}
      onLongPress={() => {}} // handled via pressIn/pressOut
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={400}
    >
      {avatarContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
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
  bubble: {
    position: 'absolute',
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'center',
  },
  bubbleText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    textAlign: 'center',
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
