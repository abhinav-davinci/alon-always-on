import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';
import { getCibilBracket, DEFAULT_CIBIL, CIBIL_BRACKETS } from '../constants/financeData';
import { getInterestRate } from '../utils/financeCalc';

interface CibilSliderCardProps {
  onConfirm: (score: number) => void;
  onSkip: () => void;
}

export default function CibilSliderCard({ onConfirm, onSkip }: CibilSliderCardProps) {
  const [score, setScore] = useState(DEFAULT_CIBIL);
  const bracket = getCibilBracket(score);
  const rate = getInterestRate(score);

  return (
    <Animated.View style={styles.card} entering={FadeInUp.duration(300)}>
      <Text style={styles.title}>What's your CIBIL score?</Text>

      {/* Score display */}
      <View style={styles.scoreDisplay}>
        <Text style={styles.scoreNumber}>{score}</Text>
        <View style={[styles.bracketBadge, { backgroundColor: bracket.color + '20' }]}>
          <View style={[styles.bracketDot, { backgroundColor: bracket.color }]} />
          <Text style={[styles.bracketLabel, { color: bracket.color }]}>{bracket.label}</Text>
        </View>
      </View>

      {/* Rate preview */}
      <View style={styles.rateRow}>
        <Text style={styles.rateLabel}>Expected interest rate</Text>
        <Text style={styles.rateValue}>{rate.toFixed(1)}% p.a.</Text>
      </View>

      {/* Bracket color bar */}
      <View style={styles.bracketBar}>
        {CIBIL_BRACKETS.slice().reverse().map((b) => (
          <View
            key={b.label}
            style={[
              styles.bracketSegment,
              { backgroundColor: b.color + '30', flex: b.max - b.min },
              score >= b.min && score <= b.max && styles.bracketSegmentActive,
              score >= b.min && score <= b.max && { backgroundColor: b.color + '50' },
            ]}
          />
        ))}
      </View>
      <View style={styles.bracketLabels}>
        <Text style={styles.bracketLabelSmall}>300</Text>
        <Text style={styles.bracketLabelSmall}>550</Text>
        <Text style={styles.bracketLabelSmall}>650</Text>
        <Text style={styles.bracketLabelSmall}>700</Text>
        <Text style={styles.bracketLabelSmall}>750</Text>
        <Text style={styles.bracketLabelSmall}>900</Text>
      </View>

      {/* Slider */}
      <Slider
        style={styles.slider}
        minimumValue={300}
        maximumValue={900}
        step={5}
        value={score}
        onValueChange={(v) => setScore(Math.round(v))}
        minimumTrackTintColor={bracket.color}
        maximumTrackTintColor={Colors.warm200}
        thumbTintColor={bracket.color}
      />

      {/* Approval likelihood */}
      <View style={styles.approvalRow}>
        <Text style={styles.approvalLabel}>Loan approval likelihood</Text>
        <Text style={[styles.approvalValue, { color: bracket.color }]}>{bracket.approvalLikelihood}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => onConfirm(score)}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm — {score}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>I don't know · Use estimate</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  title: {
    fontSize: 14, fontFamily: 'DMSans-Bold', color: Colors.textPrimary, marginBottom: 12,
  },

  scoreDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 36, fontFamily: 'DMSans-Bold', color: Colors.navy800,
  },
  bracketBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  bracketDot: { width: 7, height: 7, borderRadius: 4 },
  bracketLabel: { fontSize: 12, fontFamily: 'DMSans-SemiBold' },

  rateRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.navy800, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  rateLabel: { fontSize: 11, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.5)' },
  rateValue: { fontSize: 15, fontFamily: 'DMSans-Bold', color: Colors.white },

  bracketBar: {
    flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 2,
  },
  bracketSegment: { height: 6 },
  bracketSegmentActive: { height: 8, marginTop: -1, borderRadius: 2 },
  bracketLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4,
  },
  bracketLabelSmall: { fontSize: 8, fontFamily: 'DMSans-Regular', color: Colors.warm400 },

  slider: { width: '100%', height: 36, marginBottom: 8 },

  approvalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  approvalLabel: { fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
  approvalValue: { fontSize: 12, fontFamily: 'DMSans-Bold' },

  actions: { alignItems: 'center', gap: 10 },
  confirmBtn: {
    width: '100%', paddingVertical: 13, borderRadius: 12,
    backgroundColor: Colors.terra500, alignItems: 'center',
  },
  confirmBtnText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  skipText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.warm400 },
});
