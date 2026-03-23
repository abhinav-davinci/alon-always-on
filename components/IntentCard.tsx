import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

interface IntentCardProps {
  icon: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function IntentCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: IntentCardProps) {
  const scale = useSharedValue(1);
  const haptics = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    haptics.medium();
    onPress();
  };

  return (
    <AnimatedPressable
      style={[
        styles.card,
        selected && styles.cardSelected,
        animatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Animated.View style={styles.textContainer}>
        <Text style={[styles.title, selected && styles.titleSelected]}>
          {title}
        </Text>
        <Text style={[styles.subtitle, selected && styles.subtitleSelected]}>
          {subtitle}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    ...Shadows.sm,
  },
  cardSelected: {
    borderColor: Colors.terra500,
    backgroundColor: Colors.terra50,
  },
  icon: {
    fontSize: 28,
    marginRight: Spacing.lg,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  titleSelected: {
    color: Colors.navy700,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  subtitleSelected: {
    color: Colors.terra400,
  },
});
