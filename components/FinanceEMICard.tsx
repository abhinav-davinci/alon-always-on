import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';
import { calculateEMI, formatINR, getInterestRate, getLoanAmount } from '../utils/financeCalc';
import { DEFAULT_TENURE } from '../constants/financeData';

interface FinanceEMICardProps {
  propertyPrice: number;    // pre-filled from shortlisted property
  cibilScore: number | null;
  propertyName?: string;
}

export default function FinanceEMICard({ propertyPrice, cibilScore, propertyName }: FinanceEMICardProps) {
  const baseRate = getInterestRate(cibilScore);
  const defaultLoan = getLoanAmount(propertyPrice);

  const [loanAmount, setLoanAmount] = useState(defaultLoan);
  const [tenure, setTenure] = useState(DEFAULT_TENURE);
  const [rate, setRate] = useState(baseRate);

  const emi = calculateEMI(loanAmount, rate, tenure);
  const totalPayable = emi * tenure * 12;
  const totalInterest = totalPayable - loanAmount;

  return (
    <Animated.View style={styles.card} entering={FadeInUp.duration(300)}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>EMI Calculator</Text>
        {propertyName && <Text style={styles.headerSub}>for {propertyName}</Text>}
      </View>

      {/* EMI Result */}
      <View style={styles.emiResult}>
        <Text style={styles.emiLabel}>Monthly EMI</Text>
        <Text style={styles.emiAmount}>{formatINR(emi)}</Text>
      </View>

      {/* Loan Amount Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Loan amount</Text>
          <Text style={styles.sliderValue}>{formatINR(loanAmount)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={500000}
          maximumValue={Math.max(propertyPrice, 20000000)}
          step={100000}
          value={loanAmount}
          onValueChange={setLoanAmount}
          minimumTrackTintColor={Colors.terra500}
          maximumTrackTintColor={Colors.warm200}
          thumbTintColor={Colors.terra500}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.sliderRangeText}>₹5L</Text>
          <Text style={styles.sliderRangeText}>{formatINR(Math.max(propertyPrice, 20000000))}</Text>
        </View>
      </View>

      {/* Tenure Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Tenure</Text>
          <Text style={styles.sliderValue}>{tenure} years</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={30}
          step={1}
          value={tenure}
          onValueChange={setTenure}
          minimumTrackTintColor={Colors.terra500}
          maximumTrackTintColor={Colors.warm200}
          thumbTintColor={Colors.terra500}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.sliderRangeText}>5 yr</Text>
          <Text style={styles.sliderRangeText}>30 yr</Text>
        </View>
      </View>

      {/* Interest Rate Slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Interest rate</Text>
          <Text style={styles.sliderValue}>{rate.toFixed(1)}% p.a.</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={7}
          maximumValue={14}
          step={0.1}
          value={rate}
          onValueChange={setRate}
          minimumTrackTintColor={Colors.terra500}
          maximumTrackTintColor={Colors.warm200}
          thumbTintColor={Colors.terra500}
        />
        <View style={styles.sliderRange}>
          <Text style={styles.sliderRangeText}>7%</Text>
          <Text style={styles.sliderRangeText}>14%</Text>
        </View>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total interest</Text>
          <Text style={styles.summaryValue}>{formatINR(totalInterest)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total payable</Text>
          <Text style={styles.summaryValue}>{formatINR(totalPayable)}</Text>
        </View>
      </View>

      {cibilScore && (
        <Text style={styles.cibilNote}>
          Rate pre-set based on your CIBIL score of {cibilScore}
        </Text>
      )}
      {!cibilScore && (
        <Text style={styles.cibilNote}>
          Rate based on estimated CIBIL of 750 — update your score for accuracy
        </Text>
      )}
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
  header: { marginBottom: 12 },
  headerTitle: { fontSize: 14, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  headerSub: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 2 },

  emiResult: {
    alignItems: 'center', paddingVertical: 14,
    backgroundColor: Colors.navy800, borderRadius: 12, marginBottom: 16,
  },
  emiLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  emiAmount: { fontSize: 24, fontFamily: 'DMSans-Bold', color: Colors.white },

  sliderSection: { marginBottom: 14 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sliderLabel: { fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
  sliderValue: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  slider: { width: '100%', height: 32 },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderRangeText: { fontSize: 9, fontFamily: 'DMSans-Regular', color: Colors.warm400 },

  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cream, borderRadius: 10, padding: 12, marginTop: 4,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  summaryDivider: { width: 1, height: 28, backgroundColor: Colors.warm200 },

  cibilNote: {
    fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.warm400,
    fontStyle: 'italic', textAlign: 'center', marginTop: 10,
  },
});
