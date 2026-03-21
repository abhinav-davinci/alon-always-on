import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Pencil,
  MapPin,
  Building2,
  Maximize2,
  Wallet,
  Target,
  Mic,
  SlidersHorizontal,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AlonAvatar from '../../components/AlonAvatar';
import BottomSheet from '../../components/BottomSheet';
import PillSelector from '../../components/PillSelector';
import BudgetSlider from '../../components/BudgetSlider';
import PurposeGrid from '../../components/PurposeGrid';
import Button from '../../components/Button';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { PERSONA_PROFILE_ROWS } from '../../constants/personas';
import {
  PUNE_LOCATIONS,
  PROPERTY_SIZES,
  PROPERTY_TYPE_FLAT,
  PURPOSE_OPTIONS,
  TIMELINE_OPTIONS,
  formatBudget,
} from '../../constants/locations';

const ROW_ICONS: Record<string, typeof MapPin> = {
  Location: MapPin,
  Type: Building2,
  Size: Maximize2,
  Budget: Wallet,
  Purpose: Target,
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useOnboardingStore();
  const [sheetField, setSheetField] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const briefRef = useRef<View>(null);

  // Status pill animation
  const dotScale = useSharedValue(1);
  const pillOpacity = useSharedValue(1);

  useEffect(() => {
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    pillOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const dotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));
  const pillAnimStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
  }));

  const rows = store.persona ? PERSONA_PROFILE_ROWS[store.persona] : [];

  const contextLabel =
    store.persona === 'first'
      ? 'Based on first-time buyers in Pune'
      : store.persona === 'upgrade'
      ? 'Based on upgraders in Pune'
      : 'Based on investors in Pune';

  // Get live values from store (so edits reflect immediately)
  const liveValues: Record<string, string> = {
    Location: store.locations.join(', '),
    Type: store.propertyType,
    Size: store.propertySize.join(', '),
    Budget: `${formatBudget(store.budget.min)} – ${formatBudget(store.budget.max)}`,
    Purpose: store.purpose + (store.timeline ? ` · ${store.timeline}` : ''),
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>ALON</Text>
          <Animated.View style={[styles.statusPill, pillAnimStyle]}>
            <Animated.View style={[styles.statusDot, dotAnimStyle]} />
            <Text style={styles.statusText}>thinking for you</Text>
          </Animated.View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.scrollView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 50}
      >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Chat row — compact */}
        <Animated.View
          style={styles.chatRow}
          entering={FadeIn.delay(200).duration(300)}
        >
          <AlonAvatar size={28} showRings={false} showBlink />
          <View style={styles.chatBubble}>
            <Text style={styles.chatText}>
              Here's what most buyers like you search for. Does this feel close?
            </Text>
          </View>
        </Animated.View>

        {/* Profile card with integrated brief */}
        <Animated.View
          style={styles.profileCard}
          entering={FadeIn.delay(400).duration(350)}
        >
          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>{contextLabel}</Text>
          </View>

          {/* Rows */}
          {rows.map((row, index) => {
            const Icon = ROW_ICONS[row.label] || Target;
            const displayValue = liveValues[row.label] || row.value;
            return (
              <TouchableOpacity
                key={row.label}
                style={[styles.profileRow, styles.profileRowBorder]}
                onPress={() => setSheetField(row.label)}
                activeOpacity={0.6}
              >
                <Icon size={16} color={Colors.terra500} strokeWidth={1.8} />
                <View style={styles.rowContent}>
                  <Text style={styles.rowValue}>{displayValue}</Text>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                </View>
                <Pencil size={14} color={Colors.warm300} strokeWidth={1.8} />
              </TouchableOpacity>
            );
          })}

          {/* Brief inline — part of the card */}
          <View
            ref={briefRef}
            style={styles.briefRow}
            onLayout={() => {}}
          >
            <Text style={styles.briefLabel}>Your brief to ALON</Text>
            <TextInput
              style={styles.briefInput}
              placeholder="e.g. Need parking, avoid ground floor, only RERA-registered..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              value={store.briefText}
              onChangeText={store.setBriefText}
              onFocus={() => {
                // Scroll to bottom so the text input is visible above keyboard
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
            />
          </View>
        </Animated.View>

        {/* CTAs */}
        <Animated.View
          style={styles.ctas}
          entering={FadeIn.delay(700).duration(350)}
        >
          <Button
            title="Yes, this feels right →"
            onPress={() => router.push('/onboarding/activation')}
            variant="primary"
          />

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => router.push('/onboarding/tweak')}
              activeOpacity={0.7}
            >
              <SlidersHorizontal
                size={13}
                color={Colors.terra500}
                strokeWidth={1.8}
              />
              <Text style={styles.secondaryActionText}>I'll set my own</Text>
            </TouchableOpacity>

            <View style={styles.secondaryDivider} />

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => router.push('/onboarding/voice')}
              activeOpacity={0.7}
            >
              <Mic size={13} color={Colors.terra500} strokeWidth={1.8} />
              <Text style={styles.secondaryActionText}>Voice brief</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom Sheets ── */}

      {/* Location */}
      <BottomSheet
        visible={sheetField === 'Location'}
        title="Where in Pune?"
        onClose={() => setSheetField(null)}
      >
        <PillSelector
          options={PUNE_LOCATIONS}
          selected={store.locations}
          onSelect={store.setLocations}
          multiSelect
        />
        <View style={{ marginTop: 20 }}>
          <Button
            title="Done"
            onPress={() => setSheetField(null)}
            variant="primary"
          />
        </View>
      </BottomSheet>

      {/* Property Type */}
      <BottomSheet
        visible={sheetField === 'Type'}
        title="Property type"
        onClose={() => setSheetField(null)}
      >
        <Text style={styles.sheetSectionLabel}>Residential</Text>
        <PillSelector
          options={['Apartment', 'Villa', 'Penthouse', 'Row House', 'Duplex']}
          selected={[store.propertyType]}
          onSelect={(sel) => {
            store.setPropertyType(sel[0]);
            setSheetField(null);
          }}
        />
        <Text style={[styles.sheetSectionLabel, { marginTop: 20 }]}>
          Commercial
        </Text>
        <PillSelector
          options={['Office', 'Shop', 'Showroom', 'Coworking']}
          selected={[store.propertyType]}
          onSelect={(sel) => {
            store.setPropertyType(sel[0]);
            setSheetField(null);
          }}
        />
        <Text style={[styles.sheetSectionLabel, { marginTop: 20 }]}>
          Plots & Land
        </Text>
        <PillSelector
          options={['Residential Plot', 'Commercial Plot', 'Agricultural Land']}
          selected={[store.propertyType]}
          onSelect={(sel) => {
            store.setPropertyType(sel[0]);
            setSheetField(null);
          }}
        />
      </BottomSheet>

      {/* Size */}
      <BottomSheet
        visible={sheetField === 'Size'}
        title="Property size"
        onClose={() => setSheetField(null)}
      >
        <PillSelector
          options={PROPERTY_SIZES}
          selected={store.propertySize}
          onSelect={store.setPropertySize}
          multiSelect
        />
        <View style={{ marginTop: 20 }}>
          <Button
            title="Done"
            onPress={() => setSheetField(null)}
            variant="primary"
          />
        </View>
      </BottomSheet>

      {/* Budget */}
      <BottomSheet
        visible={sheetField === 'Budget'}
        title="Budget range"
        onClose={() => setSheetField(null)}
      >
        <BudgetSlider
          min={store.budget.min}
          max={store.budget.max}
          onChangeMin={(min) => store.setBudget({ ...store.budget, min })}
          onChangeMax={(max) => store.setBudget({ ...store.budget, max })}
          showLoanToggle
          needsLoan={store.needsLoan}
          onToggleLoan={store.setNeedsLoan}
        />
        <View style={{ marginTop: 20 }}>
          <Button
            title="Done"
            onPress={() => setSheetField(null)}
            variant="primary"
          />
        </View>
      </BottomSheet>

      {/* Purpose */}
      <BottomSheet
        visible={sheetField === 'Purpose'}
        title="What's this for?"
        onClose={() => setSheetField(null)}
      >
        <PurposeGrid
          selected={store.purpose === 'Self use' ? 'self' : store.purpose === 'Investment' ? 'invest' : store.purpose}
          onSelect={(id) => {
            const label = PURPOSE_OPTIONS.find((o) => o.id === id)?.label || id;
            store.setPurpose(label);
          }}
        />
        <Text style={[styles.sheetSectionLabel, { marginTop: 20 }]}>
          Possession timeline
        </Text>
        <PillSelector
          options={TIMELINE_OPTIONS}
          selected={[store.timeline]}
          onSelect={(sel) => store.setTimeline(sel[0])}
        />
        <View style={{ marginTop: 20 }}>
          <Button
            title="Done"
            onPress={() => setSheetField(null)}
            variant="primary"
          />
        </View>
      </BottomSheet>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
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
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontFamily: 'DMSerifDisplay',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: '#16A34A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  chatBubble: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderTopLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chatText: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
    marginBottom: Spacing.xxxl,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.cream,
  },
  cardHeaderText: {
    fontSize: 10,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  profileRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  rowContent: {
    flex: 1,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
  },
  rowLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  briefRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  briefLabel: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  ctas: {
    gap: Spacing.lg,
    alignItems: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  secondaryActionText: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: Colors.terra500,
  },
  secondaryDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.warm200,
    marginHorizontal: 8,
  },
  briefInput: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textPrimary,
    lineHeight: 19,
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.cream,
    borderRadius: 8,
  },
  sheetSectionLabel: {
    fontSize: 12,
    fontFamily: 'DMSans-Medium',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
});
