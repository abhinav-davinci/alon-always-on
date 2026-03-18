import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { formatBudget, getBudgetHint } from '../constants/locations';

interface BudgetSliderProps {
  min: number;
  max: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  showLoanToggle?: boolean;
  needsLoan?: boolean;
  onToggleLoan?: (val: boolean) => void;
}

const ABSOLUTE_MIN = 2000000; // 20L
const ABSOLUTE_MAX = 50000000; // 5Cr
const STEP = 500000; // 5L steps
const THUMB_SIZE = 26;

const TICK_MARKS = [
  { value: 4000000, label: '40L' },
  { value: 7000000, label: '70L' },
  { value: 10000000, label: '1 Cr' },
  { value: 15000000, label: '1.5 Cr' },
  { value: 20000000, label: '2 Cr' },
  { value: 30000000, label: '3 Cr' },
  { value: 50000000, label: '5 Cr+' },
];

function snap(value: number): number {
  return Math.round(Math.max(ABSOLUTE_MIN, Math.min(ABSOLUTE_MAX, value)) / STEP) * STEP;
}

function getEMI(budget: number): string {
  // Rough EMI: 80% loan, 8.5% interest, 20 years
  const principal = budget * 0.8;
  const monthlyRate = 0.085 / 12;
  const months = 240;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  if (emi >= 100000) return `₹${(emi / 100000).toFixed(1)}L/mo`;
  return `₹${Math.round(emi / 1000)}K/mo`;
}

export default function BudgetSlider({
  min,
  max,
  onChangeMin,
  onChangeMax,
  showLoanToggle = false,
  needsLoan = false,
  onToggleLoan,
}: BudgetSliderProps) {
  const [sliderWidth, setSliderWidth] = useState(280);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  const valueToX = (val: number) =>
    ((val - ABSOLUTE_MIN) / (ABSOLUTE_MAX - ABSOLUTE_MIN)) * sliderWidth;

  const xToValue = (x: number) =>
    snap(ABSOLUTE_MIN + (x / sliderWidth) * (ABSOLUTE_MAX - ABSOLUTE_MIN));

  const minX = valueToX(min);
  const maxX = valueToX(max);

  const createPanResponder = (thumb: 'min' | 'max') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setActiveThumb(thumb),
      onPanResponderMove: (_, gs) => {
        const currentX = thumb === 'min' ? minX : maxX;
        const newX = Math.max(0, Math.min(sliderWidth, currentX + gs.dx));
        const newVal = xToValue(newX);

        if (thumb === 'min' && newVal < max - STEP) {
          onChangeMin(newVal);
        } else if (thumb === 'max' && newVal > min + STEP) {
          onChangeMax(newVal);
        }
      },
      onPanResponderRelease: () => setActiveThumb(null),
    });

  const minPan = createPanResponder('min');
  const maxPan = createPanResponder('max');
  const hint = getBudgetHint(min, max);

  return (
    <View style={styles.container}>
      {/* Big budget display */}
      <Text style={styles.budgetDisplay}>
        {formatBudget(min)} – {formatBudget(max)}
      </Text>
      <Text style={styles.emiText}>
        Approx. {getEMI(max)} EMI (80% loan, 20 yrs)
      </Text>

      {/* Slider track */}
      <View
        style={styles.sliderWrap}
        onLayout={(e: LayoutChangeEvent) =>
          setSliderWidth(e.nativeEvent.layout.width)
        }
      >
        <View style={styles.track} />
        <View
          style={[
            styles.activeTrack,
            { left: minX, width: Math.max(0, maxX - minX) },
          ]}
        />
        {/* Min thumb */}
        <View
          style={[
            styles.thumb,
            { left: minX - THUMB_SIZE / 2 },
            activeThumb === 'min' && styles.thumbActive,
          ]}
          {...minPan.panHandlers}
        />
        {/* Max thumb */}
        <View
          style={[
            styles.thumb,
            { left: maxX - THUMB_SIZE / 2 },
            activeThumb === 'max' && styles.thumbActive,
          ]}
          {...maxPan.panHandlers}
        />
      </View>

      {/* Tick marks */}
      <View style={styles.ticks}>
        {TICK_MARKS.map((tick) => {
          const x = valueToX(tick.value);
          const isInRange = tick.value >= min && tick.value <= max;
          return (
            <View
              key={tick.value}
              style={[styles.tickItem, { left: x - 15 }]}
            >
              <View
                style={[styles.tickLine, isInRange && styles.tickLineActive]}
              />
              <Text
                style={[styles.tickLabel, isInRange && styles.tickLabelActive]}
              >
                {tick.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Context hint */}
      <Text style={styles.hint}>{hint}</Text>

      {/* Loan toggle */}
      {showLoanToggle && (
        <TouchableOpacity
          style={styles.loanRow}
          onPress={() => onToggleLoan?.(!needsLoan)}
          activeOpacity={0.7}
        >
          <View style={[styles.toggle, needsLoan && styles.toggleOn]}>
            <View
              style={[styles.toggleKnob, needsLoan && styles.toggleKnobOn]}
            />
          </View>
          <Text style={styles.loanText}>
            <Text style={styles.loanTextBold}>I'll need a home loan</Text>
            {' '}— ALON factors eligibility into shortlisting
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  budgetDisplay: {
    fontSize: 26,
    fontFamily: 'DMSans-Bold',
    color: Colors.blue600,
    marginBottom: 2,
  },
  emiText: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginBottom: Spacing.xl,
  },
  sliderWrap: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 5,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
  },
  activeTrack: {
    position: 'absolute',
    height: 5,
    backgroundColor: Colors.blue500,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.blue500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbActive: {
    borderColor: Colors.blue700,
    transform: [{ scale: 1.1 }],
  },
  ticks: {
    height: 30,
    position: 'relative',
    marginTop: 4,
  },
  tickItem: {
    position: 'absolute',
    alignItems: 'center',
    width: 30,
  },
  tickLine: {
    width: 1,
    height: 6,
    backgroundColor: Colors.gray200,
    marginBottom: 3,
  },
  tickLineActive: {
    backgroundColor: Colors.blue400,
  },
  tickLabel: {
    fontSize: 9,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
  },
  tickLabelActive: {
    color: Colors.blue500,
    fontFamily: 'DMSans-Medium',
  },
  hint: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  loanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 12,
    marginTop: Spacing.lg,
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: Colors.blue500,
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  loanText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  loanTextBold: {
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
  },
});
