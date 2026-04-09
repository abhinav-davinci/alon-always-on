import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/theme';
import { EligibilityResult, formatINR, formatEMI } from '../utils/financeCalc';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { parsePriceToNumber } from '../utils/compareScore';

interface EligibilityResultCardProps {
  result: EligibilityResult;
  cibilScore: number | null;
  likedPropertyIds: string[];
}

export default function EligibilityResultCard({ result, cibilScore, likedPropertyIds }: EligibilityResultCardProps) {
  // Compare eligibility against shortlisted properties
  const shortlisted = likedPropertyIds
    .map(id => SHORTLIST_PROPERTIES.find(p => p.id === id))
    .filter(Boolean);

  const affordable = shortlisted.filter(p => parsePriceToNumber(p!.price) <= result.maxPropertyPrice);
  const stretch = shortlisted.filter(p => {
    const price = parsePriceToNumber(p!.price);
    return price > result.maxPropertyPrice && price <= result.maxPropertyPrice * 1.15;
  });

  return (
    <Animated.View style={styles.card} entering={FadeInUp.duration(300)}>
      <Text style={styles.title}>Loan Eligibility</Text>

      {/* CIBIL Badge */}
      <View style={styles.cibilRow}>
        <View style={[styles.cibilBadge, { backgroundColor: result.cibilColor + '18' }]}>
          <View style={[styles.cibilDot, { backgroundColor: result.cibilColor }]} />
          <Text style={[styles.cibilText, { color: result.cibilColor }]}>
            CIBIL {cibilScore ?? '~750'} — {result.cibilBracketLabel}
          </Text>
        </View>
        <Text style={styles.approvalText}>Approval: {result.approvalLikelihood}</Text>
      </View>

      {/* Main Result */}
      <View style={styles.resultBox}>
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Max loan</Text>
          <Text style={styles.resultValue}>{formatINR(result.maxLoanAmount)}</Text>
        </View>
        <View style={styles.resultDivider} />
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Max EMI</Text>
          <Text style={styles.resultValue}>{formatEMI(result.maxEMI)}/mo</Text>
        </View>
        <View style={styles.resultDivider} />
        <View style={styles.resultItem}>
          <Text style={styles.resultLabel}>Max property</Text>
          <Text style={styles.resultValue}>{formatINR(result.maxPropertyPrice)}</Text>
        </View>
      </View>

      {/* Rate & Tenure */}
      <View style={styles.detailRow}>
        <Text style={styles.detailText}>
          @ {result.interestRate.toFixed(1)}% for {result.tenureYears} years · 20% down payment assumed
        </Text>
      </View>

      {/* Property Comparison */}
      {shortlisted.length > 0 && (
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Your shortlisted properties</Text>
          {shortlisted.map(p => {
            const price = parsePriceToNumber(p!.price);
            const isAffordable = price <= result.maxPropertyPrice;
            const isStretch = price > result.maxPropertyPrice && price <= result.maxPropertyPrice * 1.15;
            return (
              <View key={p!.id} style={styles.comparisonRow}>
                {isAffordable ? (
                  <CheckCircle2 size={14} color="#22C55E" strokeWidth={2} />
                ) : isStretch ? (
                  <AlertCircle size={14} color={Colors.amber500} strokeWidth={2} />
                ) : (
                  <AlertCircle size={14} color="#EF4444" strokeWidth={2} />
                )}
                <Text style={styles.comparisonName} numberOfLines={1}>{p!.name}</Text>
                <Text style={styles.comparisonPrice}>{p!.price}</Text>
                <Text style={[
                  styles.comparisonStatus,
                  isAffordable ? styles.statusGreen : isStretch ? styles.statusAmber : styles.statusRed,
                ]}>
                  {isAffordable ? 'Within range' : isStretch ? 'Stretch' : 'Over budget'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Summary */}
      <View style={styles.summary}>
        <TrendingUp size={13} color={Colors.terra500} strokeWidth={2} />
        <Text style={styles.summaryText}>
          {affordable.length > 0
            ? `${affordable.length} of your shortlisted properties are within your loan eligibility.`
            : shortlisted.length > 0
              ? 'Your shortlisted properties may require a higher down payment or co-applicant.'
              : 'Shortlist properties to see how they match your eligibility.'}
        </Text>
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
  title: { fontSize: 14, fontFamily: 'DMSans-Bold', color: Colors.textPrimary, marginBottom: 10 },

  cibilRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  cibilBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  cibilDot: { width: 6, height: 6, borderRadius: 3 },
  cibilText: { fontSize: 11, fontFamily: 'DMSans-SemiBold' },
  approvalText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },

  resultBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.navy800, borderRadius: 12, padding: 14,
  },
  resultItem: { flex: 1, alignItems: 'center' },
  resultLabel: { fontSize: 9, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  resultValue: { fontSize: 13, fontFamily: 'DMSans-Bold', color: Colors.white },
  resultDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },

  detailRow: { alignItems: 'center', marginTop: 8, marginBottom: 12 },
  detailText: { fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.warm400 },

  comparisonSection: { marginTop: 4 },
  comparisonTitle: {
    fontSize: 10, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  comparisonName: { flex: 1, fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textPrimary },
  comparisonPrice: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginRight: 6 },
  comparisonStatus: { fontSize: 10, fontFamily: 'DMSans-SemiBold' },
  statusGreen: { color: '#22C55E' },
  statusAmber: { color: Colors.amber500 },
  statusRed: { color: '#EF4444' },

  summary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.terra50, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 12,
  },
  summaryText: { flex: 1, fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.terra600, lineHeight: 16 },
});
