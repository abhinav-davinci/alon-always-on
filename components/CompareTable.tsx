import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ChevronDown, ChevronUp, Award, Info, AlertCircle, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { Property, UserProperty, SHORTLIST_PROPERTIES } from '../constants/properties';
import { buildComparisonData, computeMatchScore, parseBHK, CompareGroup } from '../utils/compareScore';
import { useOnboardingStore } from '../store/onboarding';
import { parsePriceToNumber, parseSizeToSqft, computePricePerSqft, getAppreciationYoY, getBestIndex } from '../utils/compareScore';

const NA = '—';

function buildUnifiedGroups(
  properties: DisplayProperty[],
  preferences: { budget: { min: number; max: number }; locations: string[]; propertySize: string[] }
): CompareGroup[] {
  const prices = properties.map((p) => p.price ? parsePriceToNumber(p.price) : 0);
  const sqfts = properties.map((p) => parseSizeToSqft(p.size));
  const ppsf = properties.map((p, i) => prices[i] && sqfts[i] ? Math.round(prices[i] / sqfts[i]) : 0);

  return [
    {
      title: 'Overview',
      rows: [
        {
          label: 'Price',
          values: properties.map((p) => p.price || NA),
          numericValues: prices,
          higherIsBetter: false,
          bestIndex: getBestIndex(prices.filter(v => v > 0), false),
        },
        {
          label: 'Price / sq.ft',
          values: ppsf.map((v) => v > 0 ? `₹${v.toLocaleString()}` : NA),
          numericValues: ppsf,
          higherIsBetter: false,
          bestIndex: getBestIndex(ppsf.map(v => v || Infinity), false),
        },
        {
          label: 'Size',
          values: sqfts.map((v) => v > 0 ? `${v.toLocaleString()} sq.ft` : NA),
          numericValues: sqfts,
          higherIsBetter: true,
          bestIndex: getBestIndex(sqfts, true),
        },
        {
          label: 'Config',
          values: properties.map((p) => parseBHK(p.size) || NA),
          bestIndex: -1,
        },
        {
          label: 'Location',
          values: properties.map((p) => p.area.split(',')[0].trim() || NA),
          bestIndex: -1,
        },
      ],
    },
    {
      title: 'Trust & Safety',
      rows: [
        {
          label: 'RERA',
          values: properties.map((p) => p.rera ? '✓ Verified' : p.isUserAdded ? 'Not available' : '✗ Not found'),
          bestIndex: -1,
        },
        {
          label: 'Builder Score',
          values: properties.map((p) => p.builderScore != null ? `${p.builderScore} / 5` : p.builderName ? `${p.builderName} (unscored)` : NA),
          numericValues: properties.map((p) => p.builderScore ?? 0),
          higherIsBetter: true,
          bestIndex: getBestIndex(properties.map((p) => p.builderScore ?? 0), true),
        },
        {
          label: 'Conflicts',
          values: properties.map((p) =>
            p.hasConflict != null
              ? (p.hasConflict ? `⚠ ${p.conflictType || 'Flagged'}` : '✓ None')
              : 'Not checked'
          ),
          bestIndex: -1,
        },
      ],
    },
    {
      title: 'Market Value',
      rows: [
        {
          label: 'YoY Growth',
          values: properties.map((p) => {
            if (p.isUserAdded) return NA;
            const yoy = getAppreciationYoY(p.id);
            return `${yoy}%`;
          }),
          bestIndex: -1,
        },
      ],
    },
    {
      title: 'ALON\'s Analysis',
      rows: [
        {
          label: 'Match Score',
          values: properties.map((p) => {
            if (p.isUserAdded) return 'Incomplete data';
            const alonProp = SHORTLIST_PROPERTIES.find((sp) => sp.id === p.id);
            if (!alonProp) return NA;
            return `${computeMatchScore(alonProp, preferences).score}%`;
          }),
          bestIndex: -1,
        },
        {
          label: 'Verdict',
          values: properties.map((p) => p.alonVerdict || (p.isUserAdded ? 'Add details for analysis' : NA)),
          bestIndex: -1,
        },
      ],
    },
  ];
}

interface CompareTableProps {
  propertyIds: string[];
  preferences: {
    budget: { min: number; max: number };
    locations: string[];
    propertySize: string[];
  };
}

// Unified property type for display
type DisplayProperty = {
  id: string;
  name: string;
  area: string;
  price: string;
  size: string;
  image?: string;
  images?: string[];
  isUserAdded: boolean;
  // ALON-only fields (may be undefined for user properties)
  rera?: string;
  builderScore?: number;
  hasConflict?: boolean;
  conflictType?: string;
  alonVerdict?: string;
  builderName?: string;
};

function resolveProperties(propertyIds: string[]): DisplayProperty[] {
  const userProperties = useOnboardingStore.getState().userProperties;
  return propertyIds.map((id) => {
    const alon = SHORTLIST_PROPERTIES.find((p) => p.id === id);
    if (alon) {
      return {
        id: alon.id, name: alon.name, area: alon.area, price: alon.price,
        size: alon.size, image: alon.image, isUserAdded: false,
        rera: alon.rera, builderScore: alon.builderScore,
        hasConflict: alon.hasConflict, conflictType: alon.conflictType,
        alonVerdict: alon.alonVerdict,
      };
    }
    const user = userProperties.find((p) => p.id === id);
    if (user) {
      return {
        id: user.id, name: user.name, area: user.area, price: user.price,
        size: user.size, images: user.images, isUserAdded: true,
        rera: user.rera, builderName: user.builderName,
      };
    }
    return null;
  }).filter(Boolean) as DisplayProperty[];
}

export default function CompareTable({ propertyIds, preferences }: CompareTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const displayProperties = resolveProperties(propertyIds);
  const hasUserProperty = displayProperties.some((p) => p.isUserAdded);

  // For ALON properties, use the existing comparison engine
  const alonIds = propertyIds.filter((id) => SHORTLIST_PROPERTIES.find((p) => p.id === id));
  const properties = alonIds
    .map((id) => SHORTLIST_PROPERTIES.find((p) => p.id === id))
    .filter(Boolean) as Property[];

  const { groups: alonGroups, recommendedId } = buildComparisonData(alonIds, preferences);
  const colWidth = displayProperties.length === 2 ? '48%' : '31%';

  // Build unified comparison groups that include user properties
  const groups = hasUserProperty ? buildUnifiedGroups(displayProperties, preferences) : alonGroups;
  const scores = displayProperties.map((p) => {
    if (p.isUserAdded) return null;
    const alonProp = SHORTLIST_PROPERTIES.find((sp) => sp.id === p.id);
    return alonProp ? computeMatchScore(alonProp, preferences) : null;
  });

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* --- Sticky property headers --- */}
      <View style={styles.headerRow}>
        {displayProperties.map((p, i) => {
          const isRecommended = !p.isUserAdded && p.id === recommendedId;
          const score = scores[i];
          const imageUri = p.image || (p.images && p.images[0]);
          return (
            <View
              key={p.id}
              style={[
                styles.headerCol,
                { width: colWidth as any },
                isRecommended && styles.headerColRecommended,
                p.isUserAdded && styles.headerColUser,
              ]}
            >
              {isRecommended && (
                <View style={styles.pickBadge}>
                  <Award size={10} color={Colors.white} strokeWidth={2} />
                  <Text style={styles.pickBadgeText}>ALON's Pick</Text>
                </View>
              )}
              {p.isUserAdded && (
                <View style={styles.userBadge}>
                  <Text style={styles.userBadgeText}>Added by you</Text>
                </View>
              )}
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.headerImage} />
              ) : (
                <View style={[styles.headerImage, styles.headerImagePlaceholder]}>
                  <Text style={styles.headerImageInitial}>{p.name.charAt(0)}</Text>
                </View>
              )}
              <Text style={styles.headerName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.headerArea} numberOfLines={1}>{p.area}</Text>
              <Text style={styles.headerPrice}>{p.price || '—'}</Text>
              {score ? (
                <View style={styles.scorePill}>
                  <Text style={styles.scorePillText}>{score.score}% match</Text>
                </View>
              ) : (
                <View style={styles.scorePillNA}>
                  <Text style={styles.scorePillNAText}>Limited data</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Data gap banner for user properties */}
      {hasUserProperty && (
        <View style={styles.dataGapBanner}>
          <AlertCircle size={13} color={Colors.amber500} strokeWidth={2} />
          <Text style={styles.dataGapText}>
            Some fields may be unavailable for manually added properties. Add RERA or builder details to improve accuracy.
          </Text>
        </View>
      )}

      {/* --- Comparison groups --- */}
      {groups.map((group) => {
        const isAlonGroup = group.title === "ALON's Analysis";
        return (
        <View key={group.title} style={styles.group}>
          <TouchableOpacity
            style={[styles.groupHeader, isAlonGroup && styles.groupHeaderAlon]}
            onPress={() => toggleGroup(group.title)}
            activeOpacity={0.7}
          >
            <Text style={[styles.groupTitle, isAlonGroup && styles.groupTitleAlon]}>{group.title}</Text>
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
        );
      })}

      {/* --- ALON's Verdict Summary --- */}
      {recommendedId && (() => {
        const pick = displayProperties.find((p) => p.id === recommendedId);
        const pickScore = scores[displayProperties.findIndex((p) => p.id === recommendedId)];
        const others = displayProperties.filter((p) => p.id !== recommendedId);

        if (!pick || !pickScore) return null;

        // Build verdict paragraph
        const scoreDiff = others.length > 0
          ? Math.round(pickScore.score - Math.max(...others.map((_, i) => {
              const idx = displayProperties.indexOf(_);
              return scores[idx]?.score || 0;
            })))
          : 0;

        const topPro = pickScore.pros[0] || '';
        const concern = pickScore.cons[0] || '';
        const othersNames = others.map((p) => p.name).join(' and ');

        let verdictText = `Based on your preferences, ${pick.name} stands out with a ${pickScore.score}% match score`;
        if (scoreDiff > 0) {
          verdictText += ` — ${scoreDiff} points ahead of ${othersNames}`;
        }
        verdictText += '.';
        if (topPro) {
          verdictText += ` Key strength: ${topPro.toLowerCase()}.`;
        }
        if (concern) {
          verdictText += ` One thing to watch: ${concern.toLowerCase()}.`;
        }
        verdictText += ` We recommend moving forward with ${pick.name} for the best fit across price, location, and trust factors.`;

        return (
          <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.verdictCard}>
            <View style={styles.verdictHeader}>
              <View style={styles.verdictIconWrap}>
                <Sparkles size={16} color={Colors.white} strokeWidth={2} />
              </View>
              <Text style={styles.verdictTitle}>ALON's Verdict</Text>
            </View>
            <View style={styles.verdictPickRow}>
              <Award size={14} color={Colors.terra500} strokeWidth={2} />
              <Text style={styles.verdictPickName}>{pick.name}</Text>
              <View style={styles.verdictScoreBadge}>
                <Text style={styles.verdictScoreText}>{pickScore.score}% match</Text>
              </View>
            </View>
            <Text style={styles.verdictBody}>{verdictText}</Text>
          </Animated.View>
        );
      })()}

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
  scorePillNA: {
    backgroundColor: Colors.warm200,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  scorePillNAText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 9,
    color: Colors.warm500,
  },
  headerColUser: {
    borderColor: Colors.warm300,
    borderStyle: 'dashed' as any,
  },
  userBadge: {
    backgroundColor: Colors.warm200,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    marginBottom: Spacing.sm,
  },
  userBadgeText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 9,
    color: Colors.warm600,
    letterSpacing: 0.3,
  },
  headerImagePlaceholder: {
    backgroundColor: Colors.warm100,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
  },
  headerImageInitial: {
    fontFamily: 'DMSans-Bold',
    fontSize: 18,
    color: Colors.warm400,
  },
  dataGapBanner: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dataGapText: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
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
  groupHeaderAlon: {
    backgroundColor: Colors.terra50,
    borderColor: Colors.terra200,
  },
  groupTitleAlon: {
    color: Colors.terra600,
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
  // --- Verdict card ---
  verdictCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: 16,
    backgroundColor: Colors.terra50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.terra200,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  verdictIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.terra500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdictTitle: {
    fontFamily: 'DMSans-Bold',
    fontSize: 15,
    color: Colors.terra600,
  },
  verdictPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.terra200,
  },
  verdictPickName: {
    flex: 1,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  verdictScoreBadge: {
    backgroundColor: Colors.navy800,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  verdictScoreText: {
    fontFamily: 'DMSans-Bold',
    fontSize: 10,
    color: Colors.white,
  },
  verdictBody: {
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

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
