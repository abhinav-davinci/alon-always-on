import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../../constants/theme';

const SHIMMER_DURATION = 1200;

// ── Base shimmer block ──
interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export default function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0.5, 1]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.warm100,
        },
        shimmerStyle,
        style,
      ]}
    />
  );
}

// ── Convenience: text-like skeleton line ──
export function SkeletonLine({
  width = '100%',
  height = 12,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: any;
}) {
  return <Skeleton width={width} height={height} borderRadius={4} style={style} />;
}

// ── Convenience: circle skeleton ──
export function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: any;
}) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}
