import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Clock,
  Calendar,
  UserPlus,
  GitCompareArrows,
  Check,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Shadows } from '../../constants/theme';
import { SHORTLIST_PROPERTIES } from '../../constants/properties';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';
import CompareSelectionBar from '../../components/CompareSelectionBar';
import { SkeletonPropertyList } from '../../components/skeleton';
import { Handshake } from 'lucide-react-native';

type Tab = 'all' | 'shortlisted' | 'byYou';

function formatLastUpdated(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const mm = m < 10 ? `0${m}` : m;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${h12}:${mm} ${ampm}`;
}

/**
 * Compare toggle that lives on the property image's bottom edge. Frosted
 * navy glass at rest so it recedes into the photo; solid terracotta with a
 * check once added — the only "loud" state on the card, and only when earned.
 */
function CompareChip({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.compareChip, active && styles.compareChipActive]}
      activeOpacity={0.8}
      onPress={(e) => {
        e.stopPropagation();
        onPress();
      }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      {active ? (
        <Check size={11} color={Colors.white} strokeWidth={3} />
      ) : (
        <GitCompareArrows size={11} color={Colors.white} strokeWidth={2.2} />
      )}
      <Text style={styles.compareChipText}>{active ? 'Added' : 'Compare'}</Text>
    </TouchableOpacity>
  );
}

export default function ShortlistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string; selectMode?: string; nudge?: string }>();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { likedPropertyIds, toggleLikedProperty, userProperties, comparePropertyIds, toggleCompareProperty, clearCompareProperties } = useOnboardingStore();
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'all');
  const nudgeType = params.nudge; // 'shortlist' | 'negotiate' | undefined
  const [showNudge, setShowNudge] = useState(!!nudgeType);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Deep-linked "compare my shortlist" — land on the shortlisted tab with a
  // clean compare tray. The per-card Compare toggles drive selection now, so
  // there's no separate "select mode" to enter.
  useEffect(() => {
    if (params.selectMode === '1') {
      setActiveTab('shortlisted');
      clearCompareProperties();
    }
  }, []);

  // Sort: NEW properties first
  const allProperties = [...SHORTLIST_PROPERTIES].sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return 0;
  });

  const shortlistedProperties = allProperties.filter((p) =>
    likedPropertyIds.includes(p.id)
  );

  const displayedProperties = activeTab === 'all' ? allProperties : shortlistedProperties;
  const isUserTab = activeTab === 'byYou';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your matches</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <SkeletonPropertyList count={5} />
      ) : (
      <>
      {/* Tabs */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => { setActiveTab('all'); haptics.selection(); }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({allProperties.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'shortlisted' && styles.tabActive]}
          onPress={() => { setActiveTab('shortlisted'); haptics.selection(); }}
        >
          <Heart
            size={12}
            color={activeTab === 'shortlisted' ? Colors.terra500 : Colors.textTertiary}
            strokeWidth={2}
            fill={activeTab === 'shortlisted' ? Colors.terra500 : 'none'}
          />
          <Text style={[styles.tabText, activeTab === 'shortlisted' && styles.tabTextActive]}>
            Shortlisted ({shortlistedProperties.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'byYou' && styles.tabActive]}
          onPress={() => { setActiveTab('byYou'); haptics.selection(); }}
        >
          <UserPlus
            size={12}
            color={activeTab === 'byYou' ? Colors.terra500 : Colors.textTertiary}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, activeTab === 'byYou' && styles.tabTextActive]}>
            By You ({userProperties.length})
          </Text>
        </Pressable>
      </View>

      {/* Last updated */}
      <Animated.View style={styles.updatedRow} entering={FadeIn.duration(200)}>
        <Clock size={11} color={Colors.textTertiary} strokeWidth={2} />
        <Text style={styles.updatedText}>Last updated {formatLastUpdated()}</Text>
      </Animated.View>

      {/* Compare nudge — arrived from Compare Now with 0 shortlisted */}
      {showNudge && nudgeType === 'shortlist' && shortlistedProperties.length === 0 && (
        <Animated.View style={styles.nudgeBanner} entering={FadeIn.duration(250)}>
          <GitCompareArrows size={12} color={Colors.terra400} strokeWidth={2} />
          <Text style={styles.nudgeBannerText}>Tap ♡ on at least 2 properties to start comparing</Text>
        </Animated.View>
      )}

      {/* Negotiate nudge — arrived from Negotiate with 0 shortlisted AND 0 user-added */}
      {showNudge && nudgeType === 'negotiate' && shortlistedProperties.length === 0 && userProperties.length === 0 && (
        <Animated.View style={styles.nudgeBanner} entering={FadeIn.duration(250)}>
          <Handshake size={12} color={Colors.terra400} strokeWidth={2} />
          <Text style={styles.nudgeBannerText}>Pick at least one property to start negotiating</Text>
        </Animated.View>
      )}

      {/* Compare nudge for shortlisted tab — 1 property */}
      {activeTab === 'shortlisted' && shortlistedProperties.length === 1 && (
        <View style={styles.nudgeBanner}>
          <Heart size={12} color={Colors.terra400} strokeWidth={2} fill={Colors.terra400} />
          <Text style={styles.nudgeBannerText}>Like one more property to start comparing</Text>
        </View>
      )}

      {/* Property list */}
      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + (comparePropertyIds.length > 0 ? 140 : 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {displayedProperties.length === 0 && activeTab === 'shortlisted' && !isUserTab && (
          <View style={styles.emptyState}>
            <Heart size={32} color={Colors.warm200} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No shortlisted properties yet</Text>
            <Text style={styles.emptySub}>
              Tap Shortlist on any property to save it here
            </Text>
          </View>
        )}

        {/* By You tab — user-added properties */}
        {isUserTab && userProperties.length === 0 && (
          <View style={styles.emptyState}>
            <UserPlus size={32} color={Colors.warm200} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No properties added yet</Text>
            <Text style={styles.emptySub}>
              Tap "+ Add now" on the dashboard to add your own finds
            </Text>
          </View>
        )}

        {isUserTab && userProperties.map((up, i) => {
          const isComparing = comparePropertyIds.includes(up.id);
          return (
          <Animated.View key={up.id} entering={FadeInDown.delay(i * 60).duration(250)}>
            <View style={styles.card}>
              <View style={styles.cardImageWrap}>
                {up.images[0] ? (
                  <Image source={{ uri: up.images[0] }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Text style={styles.cardImagePlaceholderText}>{up.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.userAddedBadge}>
                  <Text style={styles.userAddedBadgeText}>
                    {up.source === 'screenshot' ? 'SCREENSHOT' : up.source === 'voice' ? 'VOICE' : 'MANUAL'}
                  </Text>
                </View>
                <CompareChip
                  active={isComparing}
                  onPress={() => {
                    if (!isComparing && comparePropertyIds.length >= 3) return;
                    haptics.selection();
                    toggleCompareProperty(up.id);
                  }}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{up.name}</Text>
                <Text style={styles.cardArea}>{up.area}</Text>
                <View style={styles.cardPriceRow}>
                  <Text style={styles.cardPrice}>{up.price || 'Price TBD'}</Text>
                  <Text style={styles.cardSize}>{up.size || up.bhk}</Text>
                </View>
                <View style={styles.cardTags}>
                  <View style={styles.cardTagUser}>
                    <Text style={styles.cardTagTextUser}>Added by you</Text>
                  </View>
                  {up.propertyType && (
                    <View style={styles.cardTag}>
                      <Text style={styles.cardTagText}>{up.propertyType}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardAddedAt}>
                  Added {new Date(up.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </View>
          </Animated.View>
          );
        })}

        {!isUserTab && displayedProperties.map((p, i) => {
          const isLiked = likedPropertyIds.includes(p.id);
          const isComparing = comparePropertyIds.includes(p.id);
          const hasRera = p.tags.includes('RERA ✓');
          return (
            <Animated.View
              key={p.id}
              entering={FadeInDown.delay(i * 60).duration(250)}
            >
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  router.push({
                    pathname: '/onboarding/property-detail',
                    params: { id: p.id },
                  })
                }
              >
                {/* Image — anchors the card; carries status badges + the
                    Compare toggle pinned to its bottom edge. */}
                <View style={styles.cardImageWrap}>
                  <Image
                    source={{ uri: p.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  {p.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                  {p.hasConflict && (
                    <View style={styles.flagOverlay}>
                      <AlertTriangle size={9} color="#D97706" strokeWidth={2.5} />
                      <Text style={styles.flagOverlayText}>Flagged</Text>
                    </View>
                  )}
                  <CompareChip
                    active={isComparing}
                    onPress={() => {
                      if (!isComparing && comparePropertyIds.length >= 3) return;
                      haptics.selection();
                      toggleCompareProperty(p.id);
                    }}
                  />
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.cardArea}>{p.area}</Text>

                  <View style={styles.cardPriceRow}>
                    <Text style={styles.cardPrice}>{p.price}</Text>
                    <Text style={styles.cardSize}>{p.size}</Text>
                  </View>

                  {/* Possession + RERA — trust + timing on one quiet line */}
                  <View style={styles.cardMetaRow}>
                    <View style={styles.cardPossessionRow}>
                      <Calendar size={10} color={Colors.textTertiary} strokeWidth={1.8} />
                      <Text style={styles.cardPossession}>{p.possession}</Text>
                    </View>
                    {hasRera && (
                      <View style={styles.cardTagRera}>
                        <ShieldCheck size={9} color="#16A34A" strokeWidth={2.5} />
                        <Text style={styles.cardTagTextRera}>RERA</Text>
                      </View>
                    )}
                  </View>

                  {/* ALON verdict — the signature insight line */}
                  {p.alonVerdict && (
                    <Text style={styles.cardVerdict} numberOfLines={1}>
                      {p.alonVerdict}
                    </Text>
                  )}

                  {/* Shortlist — secondary/outline at rest, terracotta when active */}
                  <TouchableOpacity
                    style={[styles.shortlistBtn, isLiked && styles.shortlistBtnActive]}
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      haptics.light();
                      toggleLikedProperty(p.id);
                    }}
                  >
                    <Heart
                      size={13}
                      color={isLiked ? Colors.terra500 : Colors.textSecondary}
                      strokeWidth={2.2}
                      fill={isLiked ? Colors.terra500 : 'none'}
                    />
                    <Text style={[styles.shortlistBtnText, isLiked && styles.shortlistBtnTextActive]}>
                      {isLiked ? 'Shortlisted' : 'Shortlist'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        {/* close !isUserTab guard */}
      </ScrollView>
      </>
      )}

      {/* Compare tray — slides up the moment the first property is added,
          and "Compare Now" unlocks at 2. Replaces the old FAB + select mode. */}
      {comparePropertyIds.length > 0 && (
        <CompareSelectionBar
          selectedIds={comparePropertyIds}
          onRemove={(id) => toggleCompareProperty(id)}
          onCompare={() => router.push('/onboarding/compare')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.warm50,
    borderWidth: 1,
    borderColor: Colors.warm100,
  },
  tabActive: {
    backgroundColor: Colors.terra50,
    borderColor: Colors.terra200,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.terra500,
    fontFamily: 'DMSans-SemiBold',
  },

  // Updated
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  updatedText: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 240,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    ...Shadows.sm,
  },
  cardImageWrap: {
    width: 104,
    alignSelf: 'stretch',
    backgroundColor: Colors.warm100,
    position: 'relative',
    overflow: 'hidden',
  },
  // Absolutely fills the wrap so the photo never drives the row height —
  // the info column defines the card height and the image just covers it.
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  newBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: Colors.terra500,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 8,
    fontFamily: 'DMSans-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  flagOverlay: {
    position: 'absolute',
    top: 7,
    right: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flagOverlayText: {
    fontSize: 8,
    fontFamily: 'DMSans-SemiBold',
    color: '#D97706',
  },

  // Compare toggle — pinned to the image's bottom edge
  compareChip: {
    position: 'absolute',
    left: 7,
    right: 7,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: 'rgba(13,31,74,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  compareChipActive: {
    backgroundColor: Colors.terra500,
    borderColor: Colors.terra500,
  },
  compareChipText: {
    fontSize: 10,
    fontFamily: 'DMSans-SemiBold',
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Card info
  cardInfo: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  cardName: {
    fontSize: 15,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  cardArea: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  cardPrice: {
    fontSize: 15,
    fontFamily: 'DMSans-Bold',
    color: Colors.terra600,
  },
  cardSize: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  cardPossessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardPossession: {
    fontSize: 10,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  cardTags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  cardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.warm50,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTagRera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTagText: {
    fontSize: 9,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  cardTagTextRera: {
    fontSize: 9,
    fontFamily: 'DMSans-SemiBold',
    color: '#16A34A',
  },
  cardVerdict: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.terra500,
    marginTop: 7,
    lineHeight: 15,
  },

  // Shortlist — secondary/outline button; brand color only when active
  shortlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 11,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.warm300,
    backgroundColor: Colors.white,
  },
  shortlistBtnActive: {
    borderColor: Colors.terra200,
    backgroundColor: Colors.terra50,
  },
  shortlistBtnText: {
    fontSize: 13,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  shortlistBtnTextActive: {
    color: Colors.terra500,
  },

  // User-added property styles
  cardImagePlaceholder: {
    backgroundColor: Colors.terra50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: 24,
    fontFamily: 'DMSans-Bold',
    color: Colors.terra300,
  },
  userAddedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userAddedBadgeText: {
    fontSize: 7,
    fontFamily: 'DMSans-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  cardTagUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTagTextUser: {
    fontSize: 9,
    fontFamily: 'DMSans-Medium',
    color: '#2563EB',
  },
  cardAddedAt: {
    fontSize: 9,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginTop: 4,
  },

  // --- Compare nudge banners ---
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.xxl,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.terra50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.terra200,
  },
  nudgeBannerText: {
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    color: Colors.terra600,
  },
});
