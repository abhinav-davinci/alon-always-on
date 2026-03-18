import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import ChatBubble from '../../components/ChatBubble';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../constants/theme';

// Demo extracted values from voice input
const extractedData = [
  { icon: '📍', label: 'Location', value: 'Baner, Balewadi' },
  { icon: '📐', label: 'Size', value: '3 BHK' },
  { icon: '💰', label: 'Budget', value: '₹1.2Cr – ₹1.5Cr' },
  { icon: '🎯', label: 'Purpose', value: 'Family · Ready to move' },
];

export default function VoiceConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarRow}>
          <AlonAvatar size={40} showRings={false} showBlink />
        </View>

        <ChatBubble
          message="Here's what I heard. Does this match?"
          delay={200}
        />

        <Animated.View
          style={styles.card}
          entering={FadeIn.delay(500).duration(400)}
        >
          <Text style={styles.cardTitle}>Heard from you</Text>
          {extractedData.map((item, index) => (
            <View
              key={item.label}
              style={[styles.row, index > 0 && styles.rowBorder]}
            >
              <Text style={styles.rowIcon}>{item.icon}</Text>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View
        style={styles.buttons}
        entering={FadeIn.delay(800).duration(400)}
      >
        <Button
          title="Yes, perfect ✓"
          onPress={() => router.push('/onboarding/activation')}
          variant="primary"
        />
        <Button
          title="Tweak it"
          onPress={() => router.push('/onboarding/tweak')}
          variant="secondary"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  avatarRow: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.xxl,
    ...Shadows.md,
  },
  cardTitle: {
    ...Typography.captionMedium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
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
  },
  rowValue: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  buttons: {
    gap: Spacing.md,
    paddingBottom: 40,
  },
});
