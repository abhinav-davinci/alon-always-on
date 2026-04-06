import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ChevronDown, ChevronUp, Award, Info } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { Property, SHORTLIST_PROPERTIES } from '../constants/properties';
import { buildComparisonData, computeMatchScore, parseBHK, CompareGroup } from '../utils/compareScore';

interface CompareTableProps {
  propertyIds: string[];
  preferences: {
    budget: { min: number; max: number };
    locations: string[];
    propertySize: string[];
  };
}

export default function CompareTable({ propertyIds, preferences }: CompareTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const properties = propertyIds
    .map((id) => SHORTLIST_PROPERTIES.find((p) => p.id === id))
    .filter(Boolean) as Property[];

  const { groups, recommendedId } = buildComparisonData(propertyIds, preferences);
  const scores = properties.map((p) => computeMatchScore(p, preferences));
  const colWidth = properties.length === 2 ? '48%' : '31%';

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* --- Sticky property headers --- */}
      <View style={styles.headerRow}>
        {properties.map((p, i) => {
          const isRecommended = p.id === recommendedId;
          const score = scores[i];
          return (
            <View
              key={p.id}
              style={[
                styles.headerCol,
                { width: colWidth as any },
                isRecommended && styles.headerColRecommended,
              ]}
            >
              {isRecommended && (
                <View style={styles.pickBadge}>
                  <Award size={10} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.pickBadgeText}>ALON's Pick</Text>
                </View>
              )}
              <Image source={{ uri: p.image }} style={styles.headerImage} />
              <Text style={styles.headerName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.headerArea} numberOfLines={1}>{p.area}</Text>
              <Text style={styles.headerPrice}>{p.price}</Text>
              <View style={styles.scorePill}>
                <Text style={styles.scorePillText}>{score.score}% match</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* --- Comparison groups --- */}
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <TouchableOpacity
            style={styles.groupHeader}
            onPress={() => toggleGroup(group.title)}
            activeOpacity={0.7}
          >
            <Text style={styles.groupTitle}>{group.title}</Text>
            {collapsedGroups[group.title] ? (
              <ChevronDown size={16} color={Colors.warm400} strokeWidth={1.8} />
            ) : (
              <ChevronUp size={16} color={Colors.warm400} strokeWidth={1.8} />
            )}
          </TouchableOpacity>

          {!collapsedGroups[group.title] &&
            group.rows.map((row, ri) => (
              <View key={ri} style={[styles.dataRow, ri % 2 === 0 && styles.dataRowAlt]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <View style={styles.rowValues}>
                  {row.values.map((val, vi) => {
                    const isBest = row.bestIndex === vi && row.bestIndex >= 0;
                    return (
                      <View
                        key={vi}
                        style={[styles.cellWrap, { width: colWidth as any }]}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            isBest && styles.cellTextBest,
                            val.startsWith('⚠') && styles.cellTextWarning,
                          ]}
                          numberOfLines={2}
                        >
                          {val}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
        </View>
      ))}

      {/* --- AI Disclaimer --- */}
      <View style={styles.disclaimer}>
        <Info size={12} color={Colors.warm400} strokeWidth={1.5} />
        <Text style={styles.disclaimerText}>
          ALON's recommendations are AI-generated based on available data and your preferences.
          Please consult qualified real estate and legal professionals before making any property decisions.
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // --- Property headers ---
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  headerCol: {
    alignItems: 'center',
    backgroundColor: Colors.warm50,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerColRecommended: {
    borderColor: Colors.terra400,
    borderWidth: 1.5,
    backgroundColor: Colors.terra50,
  },
  pickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.terra500,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    marginBottom: Spacing.sm,
  },
  pickBadgeText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 9,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  headerImage: {
    width: '100%',
    height: 56,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.gray100,
  },
  headerName: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  headerArea: {
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  headerPrice: {
    fontFamily: 'DMSans-Bold',
    fontSize: 14,
    color: Colors.terra600,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  scorePill: {
    backgroundColor: Colors.navy800,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  scorePillText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    color: Colors.white,
  },

  // --- Groups ---
  group: {
    marginBottom: Spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cream,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  groupTitle: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // --- Data rows ---
  dataRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dataRowAlt: {
    backgroundColor: 'rgba(245,240,232,0.3)',
  },
  rowLabel: {
    fontFamily: 'DMSans-Medium',
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rowValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cellWrap: {
    alignItems: 'center',
  },
  cellText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
  cellTextBest: {
    color: Colors.green500,
    fontFamily: 'DMSans-Bold',
  },
  cellTextWarning: {
    color: Colors.amber500,
    fontSize: 11,
  },

  // --- Disclaimer ---
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(245,240,232,0.5)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 10,
    color: Colors.warm400,
    lineHeight: 15,
  },
});
