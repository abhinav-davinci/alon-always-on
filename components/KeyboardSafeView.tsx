import React from 'react';
import { KeyboardAvoidingView, KeyboardAvoidingViewProps, Platform } from 'react-native';

/**
 * KeyboardSafeView — the one place we get keyboard handling right.
 *
 * The trap: `behavior={ios ? 'padding' : undefined}` is a no-op on
 * Android, and Expo SDK 54's edge-to-edge default disables Android's
 * native auto-resize. Result: keyboard covers inputs on Android only.
 *
 * Use this anywhere a screen has a TextInput. For most screens the
 * defaults are right; pass `offset` if there's a fixed top bar that
 * the picker should subtract from the available height (matches the
 * iOS `keyboardVerticalOffset` semantics).
 */
export function KeyboardSafeView({
  children,
  offset = 0,
  style,
  ...rest
}: {
  children: React.ReactNode;
  /** Pixels to subtract from the keyboard-avoiding region. Set this
   *  to the height of any fixed top bar / status-bar inset. */
  offset?: number;
} & Omit<KeyboardAvoidingViewProps, 'behavior' | 'keyboardVerticalOffset'>) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
      {...rest}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
