import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Home, TrendingUp, BarChart3, Building2, ArrowLeftRight, FileSignature, ChevronRight } from 'lucide-react-native';
import AlonAvatar from '../../components/AlonAvatar';
import { Colors, Spacing } from '../../constants/theme';
import { PersonaType } from '../../constants/personas';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';

const BUY_INTENTS: { key: PersonaType; icon: typeof Home; title: string; sub: string }[] = [
  {
    key: 'first',
    icon: Home,
    title: 'Buying my first home',
    sub: 'Need a little guidance along the way',
  },
  {
    key: 'upgrade',
    icon: TrendingUp,
    title: 'Upgrading to something bigger',
    sub: 'I know what I want, need the right match',
  },
  {
    key: 'invest',
    icon: BarChart3,
    title: 'Looking for an investment',
    sub: 'ROI, rental yield, capital appreciation',
  },
];

const RENT_INTENTS: { key: PersonaType; icon: typeof Home; title: string; sub: string }[] = [
  {
    key: 'rent_new',
    icon: Building2,
    title: 'First office or upgrading',
    sub: 'Finding the right space for your team',
  },
  {
    key: 'rent_change',
    icon: ArrowLeftRight,
    title: 'Changing office space',
    sub: 'Relocating or resizing your current setup',
  },
  {
    key: 'rent_sublease',
    icon: FileSignature,
    title: 'Sub-leasing',
    sub: 'Lease out unused office space',
  },
];

export default function IntentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const goal = useOnboardingStore((s) => s.goal);
  const setPersona = useOnboardingStore((s) => s.setPersona);
  const [selected, setSelected] = useState<PersonaType | null>(null);

  const intents = goal === 'rent' ? RENT_INTENTS : BUY_INTENTS;
  const bubbleText = goal === 'rent'
    ? "Great — let's find you the perfect office. What best describes your situation?"
    : "What's bringing you here today?";

  // Reset selection when screen regains focus (back navigation)
  useFocusEffect(
    useCallback(() => {
      setSelected(null);
    }, [])
  );

  const handleSelect = useCallback(
    (persona: PersonaType) => {
      if (selected) return;
      haptics.medium();
      setSelected(persona);
      setPersona(persona);
      setTimeout(() => {
        router.push('/onboarding/profile');
      }, 300);
    },
    [selected]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View style={styles.backArrow} />
        </TouchableOpacity>
      </View>

      {/* Avatar + label */}
      <View style={styles.avatarSection}>
        <AlonAvatar size={52} showRings showBlink variant="light" />
        <Text style={styles.alonLabel}>ALON</Text>
      </View>

      {/* Chat bubble */}
      <Animated.View
        style={styles.chatBubble}
        entering={FadeIn.delay(200).duration(300)}
      >
        <Text style={styles.chatText}>
          {bubbleText}
        </Text>
      </Animated.View>

      {/* Intent cards */}
      <View style={styles.cards}>
        {intents.map((intent, index) => {
          const Icon = intent.icon;
          const isSelected = selected === intent.key;
          return (
            <Animated.View
              key={intent.key}
              entering={FadeIn.delay(400 + index * 80).duration(250)}
            >
              <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(intent.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIcon, isSelected && styles.cardIconSelected]}>
                  <Icon size={18} color="#fff" strokeWidth={1.8} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>{intent.title}</Text>
                  <Text style={styles.cardSub}>{intent.sub}</Text>
                </View>
                <ChevronRight size={16} color="rgba(255,255,255,0.35)" strokeWidth={1.8} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Animated.View entering={FadeIn.delay(700).duration(300)}>
          <Text style={styles.footerText}>
            takes under 60 seconds · no account needed
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Canvas: DARK (Canvas.intent) — must be navy800 to match splash & goal.
    // navy700/600/500 are reserved for hover/pressed states, never screen bg.
    backgroundColor: Colors.navy800,
    paddingHorizontal: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    width: 8,
    height: 8,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#fff',
    transform: [{ rotate: '45deg' }, { translateX: 1.5 }],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  alonLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },
  chatBubble: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 18,
    borderTopLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: Spacing.lg,
  },
  chatText: {
    fontSize: 14,
    fontFamily: 'DMSans-Regular',
    color: '#fff',
    lineHeight: 22,
  },
  cards: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  cardSelected: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: '#fff',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 16,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.25)',
  },
});
