import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Maximize2, Wallet, Target, Pencil, Mic } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import ChatBubble from '../../components/ChatBubble';
import BottomSheet from '../../components/BottomSheet';
import LocationPicker from '../../components/LocationPicker';
import PillSelector from '../../components/PillSelector';
import BudgetSlider from '../../components/BudgetSlider';
import PurposeGrid from '../../components/PurposeGrid';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { PROPERTY_SIZES, TIMELINE_OPTIONS, formatBudget } from '../../constants/locations';

const PURPOSE_ITEMS_MAP: Record<string, string> = {
  self: 'Live in it',
  invest: 'Invest',
  family: 'Family',
  work: 'Work hub',
};

export default function VoiceConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useOnboardingStore();
  const [sheetField, setSheetField] = useState<string | null>(null);

  // Initialize from parsed voice data (in production, these would come from AI parsing)
  const [locations, setLocations] = useState(['Baner', 'Balewadi']);
  const [size, setSize] = useState(['3 BHK']);
  const [budget, setBudget] = useState({ min: 12000000, max: 15000000 });
  const [needsLoan, setNeedsLoan] = useState(false);
  const [purpose, setPurpose] = useState('Family');
  const [timeline, setTimeline] = useState('Ready to move');

  const rows = [
    { icon: MapPin, label: 'Location', value: locations.join(', '), field: 'Location' },
    { icon: Maximize2, label: 'Size', value: size.join(', '), field: 'Size' },
    { icon: Wallet, label: 'Budget', value: `${formatBudget(budget.min)} – ${formatBudget(budget.max)}`, field: 'Budget' },
    { icon: Target, label: 'Purpose', value: `${purpose} · ${timeline}`, field: 'Purpose' },
  ];

  const handleConfirm = () => {
    // Push parsed values into store
    store.setLocations(locations);
    store.setPropertySize(size);
    store.setBudget(budget);
    store.setNeedsLoan(needsLoan);
    store.setPurpose(purpose);
    store.setTimeline(timeline);
    router.push('/onboarding/activation');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
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
          {rows.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.row, index > 0 && styles.rowBorder]}
                onPress={() => setSheetField(item.field)}
                activeOpacity={0.6}
              >
                <Icon size={16} color={Colors.terra500} strokeWidth={1.8} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowValue}>{item.value}</Text>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                </View>
                <Pencil size={14} color={Colors.warm300} strokeWidth={1.8} />
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.buttons, { paddingBottom: insets.bottom + 20 }]}
        entering={FadeIn.delay(800).duration(400)}
      >
        <Button
          title="Yes, perfect ✓"
          onPress={handleConfirm}
          variant="primary"
        />
        <TouchableOpacity
          style={styles.recordAgainBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Mic size={14} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.recordAgainText}>Record again</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Bottom Sheets ── */}

      {/* Location */}
      <BottomSheet
        visible={sheetField === 'Location'}
        title="Where in Pune?"
        onClose={() => setSheetField(null)}
      >
        <LocationPicker
          selected={locations}
          onSelect={setLocations}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Done" onPress={() => setSheetField(null)} variant="primary" />
        </View>
      </BottomSheet>

      {/* Size */}
      <BottomSheet
        visible={sheetField === 'Size'}
        title="Property size"
        onClose={() => setSheetField(null)}
      >
        <PillSelector
          options={PROPERTY_SIZES}
          selected={size}
          onSelect={setSize}
          multiSelect
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Done" onPress={() => setSheetField(null)} variant="primary" />
        </View>
      </BottomSheet>

      {/* Budget */}
      <BottomSheet
        visible={sheetField === 'Budget'}
        title="Budget range"
        onClose={() => setSheetField(null)}
      >
        <BudgetSlider
          min={budget.min}
          max={budget.max}
          onChangeMin={(min) => setBudget(prev => ({ ...prev, min }))}
          onChangeMax={(max) => setBudget(prev => ({ ...prev, max }))}
          showLoanToggle
          needsLoan={needsLoan}
          onToggleLoan={setNeedsLoan}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Done" onPress={() => setSheetField(null)} variant="primary" />
        </View>
      </BottomSheet>

      {/* Purpose + Timeline */}
      <BottomSheet
        visible={sheetField === 'Purpose'}
        title="What's this for?"
        onClose={() => setSheetField(null)}
      >
        <PurposeGrid
          selected={
            purpose === 'Live in it' || purpose === 'Self use' ? 'self'
            : purpose === 'Investment' || purpose === 'Invest' ? 'invest'
            : purpose === 'Family' ? 'family'
            : purpose === 'Work hub' ? 'work'
            : purpose
          }
          onSelect={(id) => {
            const label = PURPOSE_ITEMS_MAP[id] || id;
            setPurpose(label);
          }}
        />
        <Text style={styles.sheetSectionLabel}>Possession timeline</Text>
        <PillSelector
          options={TIMELINE_OPTIONS}
          selected={[timeline]}
          onSelect={(sel) => setTimeline(sel[0])}
        />
        <View style={{ marginTop: 20 }}>
          <Button title="Done" onPress={() => setSheetField(null)} variant="primary" />
        </View>
      </BottomSheet>
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.gray50, borderWidth: 1, borderColor: Colors.gray200,
    alignItems: 'center', justifyContent: 'center',
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
    marginTop: Spacing.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  cardTitle: {
    ...Typography.captionMedium,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.cream,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
  },
  buttons: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  recordAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
    backgroundColor: Colors.white,
    width: '100%',
  },
  recordAgainText: {
    fontSize: 14,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.terra500,
  },
  sheetSectionLabel: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 20,
  },
});
