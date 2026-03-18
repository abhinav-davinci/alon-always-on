import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'primaryWhite';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.blue500}
        />
      ) : (
        <Text
          style={[
            styles.baseText,
            styles[`${variant}Text` as keyof typeof styles] as TextStyle,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.blue500,
  },
  primaryWhite: {
    backgroundColor: Colors.white,
  },
  secondary: {
    backgroundColor: Colors.blue50,
    borderWidth: 1,
    borderColor: Colors.blue200,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  baseText: {
    ...Typography.button,
  },
  primaryText: {
    color: Colors.white,
  },
  primaryWhiteText: {
    color: Colors.blue500,
  },
  secondaryText: {
    color: Colors.blue500,
  },
  ghostText: {
    color: Colors.blue500,
  },
});
