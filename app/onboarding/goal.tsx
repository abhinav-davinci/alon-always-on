import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Home, Building2, ChevronRight } from 'lucide-react-native';
import AlonAvatar from '../../components/AlonAvatar';
import { Colors, Spacing } from '../../constants/theme';
import { GoalType } from '../../constants/personas';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';

const GOALS: { key: GoalType; icon: typeof Home; title: string; sub: string }[] = [
  {
    key: 'buy',
    icon: Home,
    title: 'Buying a home',
    sub: 'First home, upgrade, or investment',
  },
  {
    key: 'rent',
    icon: Building2,
    title: 'Renting an office',
    sub: 'Find, change, or sub-lease office space',
  },
];

export default function GoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const setGoal = useOnboardingStore((s) => s.setGoal);
  const [selected, setSelected] = useState<GoalType | null>(null);

  useFocusEffect(
    useCallback(() => {
      setSelected(null);
    }, [])
  );

  const handleSelect = useCallback(
    (goal: GoalType) => {
      if (selected) return;
      haptics.medium();
      setSelected(goal);
      setGoal(goal);
      setTimeout(() => {
        router.push('/onboarding/intent');
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
          Hey — I'm <Text style={styles.chatBold}>ALON</Text>, your personal
          property assistant. What are you looking for?
        </Text>
      </Animated.View>

      {/* Goal cards */}
      <View style={styles.cards}>
        {GOALS.map((goal, index) => {
          const Icon = goal.icon;
          const isSelected = selected === goal.key;
          return (
            <Animated.View
              key={goal.key}
              entering={FadeIn.delay(400 + index * 100).duration(250)}
            >
              <TouchableOpacity
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelect(goal.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIcon, isSelected && styles.cardIconSelected]}>
                  <Icon size={22} color="#fff" strokeWidth={1.6} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={styles.cardTitle}>{goal.title}</Text>
                  <Text style={styles.cardSub}>{goal.sub}</Text>
                </View>
                <ChevronRight size={16} color="rgba(255,255,255,0.35)" strokeWidth={1.8} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Animated.View entering={FadeIn.delay(650).duration(300)}>
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
    backgroundColor: Colors.navy700,
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
  chatBold: {
    fontFamily: 'DMSans-Medium',
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
  },
  cardSelected: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: '#fff',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 17,
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
