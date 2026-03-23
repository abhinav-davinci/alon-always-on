import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ArrowRight, Shield } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';

type Step = 'name' | 'phone' | 'otp';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { userName, setUserName, userPhone, setUserPhone, setIsVerified } =
    useOnboardingStore();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState(userName);
  const [phone, setPhone] = useState(userPhone);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Auto-focus inputs
  useEffect(() => {
    const t = setTimeout(() => {
      if (step === 'name') nameRef.current?.focus();
      if (step === 'phone') phoneRef.current?.focus();
      if (step === 'otp') otpRefs.current[0]?.focus();
    }, 400);
    return () => clearTimeout(t);
  }, [step]);

  // OTP countdown timer
  useEffect(() => {
    if (!otpSent || otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpSent, otpTimer]);

  // Auto-fill OTP simulation (after 2s)
  useEffect(() => {
    if (step !== 'otp' || !otpSent) return;
    const t = setTimeout(() => {
      const autoOtp = ['8', '4', '2', '1', '6', '9'];
      setOtp(autoOtp);
      haptics.success();
      // Auto-verify after fill
      setTimeout(() => handleVerify(autoOtp), 600);
    }, 2000);
    return () => clearTimeout(t);
  }, [step, otpSent]);

  const handleNameNext = () => {
    if (name.trim().length < 2) return;
    haptics.light();
    setUserName(name.trim());
    setStep('phone');
  };

  const handlePhoneNext = () => {
    if (phone.length < 10) return;
    haptics.light();
    setUserPhone(phone);
    setOtpSent(true);
    setOtpTimer(30);
    setStep('otp');
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (value && index === 5) {
      const full = newOtp.join('');
      if (full.length === 6) {
        Keyboard.dismiss();
        handleVerify(newOtp);
      }
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (otpArr?: string[]) => {
    setVerifying(true);
    haptics.success();
    // Simulate verification
    setTimeout(() => {
      setIsVerified(true);
      router.push('/onboarding/activation');
    }, 800);
  };

  const firstName = name.trim().split(' ')[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step === 'otp') setStep('phone');
            else if (step === 'phone') setStep('name');
            else router.back();
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Step indicator */}
        <View style={styles.stepDots}>
          {['name', 'phone', 'otp'].map((s, i) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                (step === s || ['name', 'phone', 'otp'].indexOf(step) > i) &&
                  styles.stepDotActive,
              ]}
            />
          ))}
        </View>

        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 50}
      >
        <View style={styles.content}>
          {/* ── Step 1: Name ── */}
          {step === 'name' && (
            <Animated.View
              style={styles.stepContent}
              entering={FadeInDown.duration(300)}
            >
              <View style={styles.avatarRow}>
                <View style={styles.avatarClip}>
                  <AlonAvatar size={40} showRings={false} showBlink />
                </View>
              </View>
              <Text style={styles.stepTitle}>What should ALON call you?</Text>
              <Text style={styles.stepSubtitle}>
                Just a first name is fine — keeps things personal.
              </Text>

              <TextInput
                ref={nameRef}
                style={styles.nameInput}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={handleNameNext}
              />

              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  { marginTop: Spacing.xxl },
                  name.trim().length < 2 && styles.nextBtnDisabled,
                ]}
                onPress={handleNameNext}
                activeOpacity={0.85}
                disabled={name.trim().length < 2}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Step 2: Phone ── */}
          {step === 'phone' && (
            <Animated.View
              style={styles.stepContent}
              entering={FadeInDown.duration(300)}
            >
              <Text style={styles.stepTitle}>
                Hey {firstName}, what's your number?
              </Text>
              <Text style={styles.stepSubtitle}>
                We'll send a one-time code to verify. No spam, ever.
              </Text>

              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <TextInput
                  ref={phoneRef}
                  style={styles.phoneInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={Colors.textTertiary}
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="done"
                  onSubmitEditing={handlePhoneNext}
                />
              </View>

              <View style={styles.privacyRow}>
                <Shield size={14} color={Colors.terra500} strokeWidth={1.8} />
                <Text style={styles.privacyText}>
                  Your number stays with ALON. Never shared with builders or agents.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  { marginTop: Spacing.xxl },
                  phone.length < 10 && styles.nextBtnDisabled,
                ]}
                onPress={handlePhoneNext}
                activeOpacity={0.85}
                disabled={phone.length < 10}
              >
                <Text style={styles.nextBtnText}>Send code</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ── Step 3: OTP ── */}
          {step === 'otp' && (
            <Animated.View
              style={styles.stepContent}
              entering={FadeInDown.duration(300)}
            >
              <Text style={styles.stepTitle}>Enter the code</Text>
              <Text style={styles.stepSubtitle}>
                Sent to +91 {phone.slice(0, 2)}••••{phone.slice(-2)}
              </Text>

              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { otpRefs.current[i] = r; }}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      verifying && styles.otpBoxVerifying,
                    ]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v.replace(/[^0-9]/g, '').slice(-1), i)}
                    onKeyPress={(e) => handleOtpKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {verifying && (
                <Animated.View
                  style={styles.verifyingRow}
                  entering={FadeIn.duration(300)}
                >
                  <View style={styles.verifyingDot} />
                  <Text style={styles.verifyingText}>Verifying...</Text>
                </Animated.View>
              )}

              {!verifying && (
                <View style={styles.resendRow}>
                  {otpTimer > 0 ? (
                    <Text style={styles.resendTimer}>
                      Resend in {otpTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setOtpTimer(30);
                        setOtp(['', '', '', '', '', '']);
                        otpRefs.current[0]?.focus();
                      }}
                    >
                      <Text style={styles.resendLink}>Resend code</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Text style={styles.autoReadHint}>
                OTP will be auto-read from SMS
              </Text>
            </Animated.View>
          )}
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.warm200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.warm200,
  },
  stepDotActive: {
    backgroundColor: Colors.terra500,
  },

  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },

  // Step content
  stepContent: {
    paddingTop: Spacing.xxxl,
  },
  avatarRow: {
    marginBottom: Spacing.lg,
  },
  avatarClip: {
    width: 40,
    height: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 30,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    lineHeight: 21,
    marginBottom: Spacing.xxxl,
  },

  // Name input
  nameInput: {
    fontSize: 20,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.terra500,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },

  // Phone input
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  countryCode: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.terra500,
    paddingVertical: 12,
    letterSpacing: 1,
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.terra50,
    borderRadius: 10,
    padding: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  // OTP
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xxl,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
    backgroundColor: Colors.cream,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: Colors.terra500,
    backgroundColor: Colors.terra50,
  },
  otpBoxVerifying: {
    borderColor: Colors.green500,
    backgroundColor: Colors.green100,
  },

  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  verifyingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green500,
  },
  verifyingText: {
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: Colors.green500,
  },

  resendRow: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resendTimer: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
  },
  resendLink: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: Colors.terra500,
  },

  autoReadHint: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.terra500,
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: '#fff',
  },
});
