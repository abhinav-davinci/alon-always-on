import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '../constants/theme';
import { calculateAcquisitionCost, formatINR } from '../utils/financeCalc';

interface CostBreakdownCardProps {
  propertyPrice: number;
  propertyName?: string;
  isUnderConstruction?: boolean;
}

export default function CostBreakdownCard({ propertyPrice, propertyName, isUnderConstruction = false }: CostBreakdownCardProps) {
  const cost = calculateAcquisitionCost(propertyPrice, isUnderConstruction);

  const rows = [
    { label: 'Property price', amount: cost.propertyPrice, highlight: false },
    { label: 'Stamp duty (5%)', amount: cost.stampDuty, highlight: false },
    { label: 'Registration (1%)', amount: cost.registrationFee, highlight: false },
    ...(cost.gst > 0 ? [{ label: `GST (${propertyPrice <= 4500000 ? '1%' : '5%'})`, amount: cost.gst, highlight: false }] : []),
    { label: 'Legal & misc', amount: cost.legalFees, highlight: false },
  ];

  return (
    <Animated.View style={styles.card} entering={FadeInUp.duration(300)}>
      <Text style={styles.title}>Total Acquisition Cost</Text>
      {propertyName && <Text style={styles.subtitle}>for {propertyName}</Text>}

      <View style={styles.rows}>
        {rows.map((row, i) => (
          <View key={i} style={[styles.row, i % 2 === 0 && styles.rowAlt]}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowAmount}>{formatINR(row.amount)}</Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>You'll actually pay</Text>
          <Text style={styles.totalAmount}>{formatINR(cost.totalCost)}</Text>
        </View>
      </View>

      {/* Over-price callout */}
      <View style={styles.callout}>
        <Text style={styles.calloutText}>
          That's <Text style={styles.calloutBold}>{formatINR(cost.overPropertyPrice)}</Text> above the listed price
        </Text>
      </View>

      {!isUnderConstruction && (
        <Text style={styles.note}>
          GST not applicable for ready-to-move properties. Under-construction? Ask me to recalculate.
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
  title: { fontSize: 14, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  subtitle: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 2 },

  rows: { marginTop: 14 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 10,
  },
  rowAlt: { backgroundColor: 'rgba(245,240,232,0.3)', borderRadius: 6 },
  rowLabel: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
  rowAmount: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10, marginTop: 6,
    borderTopWidth: 1.5, borderTopColor: Colors.navy800,
  },
  totalLabel: { fontSize: 13, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  totalAmount: { fontSize: 16, fontFamily: 'DMSans-Bold', color: Colors.terra600 },

  callout: {
    backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10,
  },
  calloutText: { fontSize: 11, fontFamily: 'DMSans-Regular', color: '#92400E', lineHeight: 16, textAlign: 'center' },
  calloutBold: { fontFamily: 'DMSans-Bold' },

  note: {
    fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.warm400,
    fontStyle: 'italic', textAlign: 'center', marginTop: 10,
  },
});
