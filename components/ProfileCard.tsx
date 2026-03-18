import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';

interface ProfileRow {
  icon: string;
  label: string;
  value: string;
}

interface ProfileCardProps {
  rows: ProfileRow[];
  onRowPress?: (label: string) => void;
}

function AnimatedRow({
  row,
  index,
  onPress,
}: {
  row: ProfileRow;
  index: number;
  onPress?: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    const delay = 400 + index * 100;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.row, index > 0 && styles.rowBorder]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.rowIcon}>{row.icon}</Text>
        <View style={styles.rowContent}>
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Text style={styles.rowValue}>{row.value}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfileCard({ rows, onRowPress }: ProfileCardProps) {
  return (
    <View style={styles.card}>
      {rows.map((row, index) => (
        <AnimatedRow
          key={row.label}
          row={row}
          index={index}
          onPress={() => onRowPress?.(row.label)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    ...Shadows.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  rowIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
    width: 28,
    textAlign: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    ...Typography.small,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginTop: 1,
  },
});
