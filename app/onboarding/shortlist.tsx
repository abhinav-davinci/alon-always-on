import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Clock,
  ChevronRight,
  UserPlus,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { SHORTLIST_PROPERTIES } from '../../constants/properties';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';

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

export default function ShortlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { likedPropertyIds, toggleLikedProperty, userProperties } = useOnboardingStore();
  const [activeTab, setActiveTab] = useState<Tab>('all');

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
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your matches</Text>
        <View style={{ width: 36 }} />
      </View>

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

      {/* Property list */}
      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {displayedProperties.length === 0 && activeTab === 'shortlisted' && !isUserTab && (
          <View style={styles.emptyState}>
            <Heart size={32} color={Colors.warm200} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No shortlisted properties yet</Text>
            <Text style={styles.emptySub}>
              Tap the heart icon on any property to add it to your shortlist
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

        {isUserTab && userProperties.map((up, i) => (
          <Animated.View key={up.id} entering={FadeInDown.delay(i * 60).duration(250)}>
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
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
                    {up.source === 'screenshot' ? 'SCREENSHOT' : 'MANUAL'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardName} numberOfLines={1}>{up.name}</Text>
                </View>
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
              <ChevronRight size={16} color={Colors.warm300} strokeWidth={2} style={styles.cardChevron} />
            </TouchableOpacity>
          </Animated.View>
        ))}

        {!isUserTab && displayedProperties.map((p, i) => {
          const isLiked = likedPropertyIds.includes(p.id);
          return (
            <Animated.View
              key={p.id}
              entering={FadeInDown.delay(i * 60).duration(250)}
            >
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/onboarding/property-detail',
                    params: { id: p.id },
                  })
                }
              >
                {/* Image */}
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
                      <AlertTriangle size={10} color="#D97706" strokeWidth={2.5} />
                      <Text style={styles.flagOverlayText}>Flagged</Text>
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.cardInfo}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    {/* Like button */}
                    <TouchableOpacity
                      style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        haptics.light();
                        toggleLikedProperty(p.id);
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Heart
                        size={13}
                        color={isLiked ? '#fff' : Colors.warm400}
                        strokeWidth={2}
                        fill={isLiked ? '#fff' : 'none'}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardArea}>{p.area}</Text>

                  <View style={styles.cardPriceRow}>
                    <Text style={styles.cardPrice}>{p.price}</Text>
                    <Text style={styles.cardSize}>{p.size}</Text>
                  </View>

                  {/* Tags — only for new */}
                  {p.isNew && (
                    <View style={styles.cardTags}>
                      {p.tags.map((tag) => (
                        <View
                          key={tag}
                          style={[styles.cardTag, tag === 'RERA ✓' && styles.cardTagRera]}
                        >
                          {tag === 'RERA ✓' && (
                            <ShieldCheck size={9} color="#16A34A" strokeWidth={2.5} />
                          )}
                          <Text
                            style={[
                              styles.cardTagText,
                              tag === 'RERA ✓' && styles.cardTagTextRera,
                            ]}
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* ALON verdict */}
                  {p.alonVerdict && (
                    <Text style={styles.cardVerdict} numberOfLines={1}>
                      {p.alonVerdict}
                    </Text>
                  )}
                </View>

                <ChevronRight
                  size={16}
                  color={Colors.warm300}
                  strokeWidth={2}
                  style={styles.cardChevron}
                />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
        {/* close !isUserTab guard */}
      </ScrollView>
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
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardImageWrap: {
    width: 90,
    alignSelf: 'stretch',
    backgroundColor: Colors.warm100,
    position: 'relative',
  },
  cardImage: {
    width: 90,
    height: 120,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
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
    bottom: 6,
    left: 6,
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

  // Card info
  cardInfo: {
    flex: 1,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  likeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.warm50,
    borderWidth: 1,
    borderColor: Colors.warm200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtnActive: {
    backgroundColor: Colors.terra500,
    borderColor: Colors.terra500,
  },
  cardArea: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    color: Colors.terra600,
  },
  cardSize: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
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
    backgroundColor: '#DCFCE7',
  },
  cardTagText: {
    fontSize: 9,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  cardTagTextRera: {
    color: '#16A34A',
  },
  cardVerdict: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    fontStyle: 'italic',
    color: Colors.terra500,
    marginTop: 4,
    lineHeight: 14,
  },
  cardChevron: {
    marginRight: 10,
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
});
