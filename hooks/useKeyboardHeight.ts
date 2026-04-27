import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Tracks the keyboard height in pixels (0 when hidden).
 *
 * Why this exists: KeyboardAvoidingView inside a React Native Modal
 * is unreliable on Android — the Modal opens its own native window
 * and KAV's height/padding adjustments often don't propagate. The
 * workaround used widely is to listen for keyboard events directly
 * and translate / pad the sheet content by the measured height.
 *
 * Usage:
 *   const kb = useKeyboardHeight();
 *   <View style={{ marginBottom: kb }}>...</View>
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // iOS fires the *will* events ahead of the animation; Android only
    // exposes the *did* events reliably.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
