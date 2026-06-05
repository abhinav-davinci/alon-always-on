import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, AlertTriangle, Heart, MapPin } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing, Shadows } from '../constants/theme';
import { SHORTLIST_PROPERTIES } from '../constants/properties';
import { useHaptics } from '../hooks/useHaptics';
import { useOnboardingStore } from '../store/onboarding';

interface SimilarPropertiesProps {
  /** Current property id — excluded from the list */
  currentId?: string;
  /** Optional delay for the entering animation, to chain after the sections above */
  enterDelay?: number;
}

const CARD_WIDTH = 230;
const CARD_GAP = 12;

export default function SimilarProperties({ currentId, enterDelay = 800 }: SimilarPropertiesProps) {
  const router = useRouter();
  const haptics = useHaptics();
  const { likedPropertyIds, toggleLikedProperty } = useOnboardingStore();

  // ALON matches, minus the one we're already looking at
  const similar = SHORTLIST_PROPERTIES.filter((p) => p.id !== currentId);
  if (similar.length === 0) return null;

  return (
    <Animated.View style={styles.wrapper} entering={FadeInDown.delay(enterDelay).duration(300)}>
      {/* Section header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Similar properties</Text>
          <Text style={styles.subtitle}>More homes ALON matched for you</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{similar.length}</Text>
        </View>
      </View>

      {/* Horizontal carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
      >
        {similar.map((p, i) => {
          const isLiked = likedPropertyIds.includes(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.card,
                { width: CARD_WIDTH, marginRight: i < similar.length - 1 ? CARD_GAP : 0 },
              ]}
              activeOpacity={0.9}
              onPress={() => {
                haptics.light();
                router.push({ pathname: '/onboarding/property-detail', params: { id: p.id } });
              }}
            >
              {/* Image */}
              <View style={styles.imageWrap}>
                <Image source={{ uri: p.image }} style={styles.image} resizeMode="cover" />
                {p.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                {p.hasConflict && (
                  <View style={styles.flagBadge}>
                    <AlertTriangle size={10} color="#D97706" strokeWidth={2.5} />
                  </View>
                )}
                {/* Like button */}
                <TouchableOpacity
                  style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation();
                    haptics.light();
                    toggleLikedProperty(p.id);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Heart
                    size={14}
                    color={isLiked ? '#fff' : 'rgba(255,255,255,0.95)'}
                    strokeWidth={2}
                    fill={isLiked ? '#fff' : 'none'}
                  />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <View style={styles.areaRow}>
                  <MapPin size={11} color={Colors.textTertiary} strokeWidth={1.5} />
                  <Text style={styles.area} numberOfLines={1}>{p.area}</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>{p.price}</Text>
                  <Text style={styles.size}>{p.size.split(' · ')[0]}</Text>
                </View>

                {/* Tags */}
                <View style={styles.tagRow}>
                  {p.tags.slice(0, 2).map((tag) => (
                    <View key={tag} style={[styles.tag, tag === 'RERA ✓' && styles.tagRera]}>
                      {tag === 'RERA ✓' && <ShieldCheck size={9} color="#16A34A" strokeWidth={2.5} />}
                      <Text style={[styles.tagText, tag === 'RERA ✓' && styles.tagTextRera]}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* ALON verdict */}
                {p.alonVerdict && (
                  <View style={styles.verdictRow}>
                    <Text style={styles.verdict} numberOfLines={2}>{p.alonVerdict}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Spacing.xxxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  countPill: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: Colors.terra50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 12,
    fontFamily: 'DMSans-Bold',
    color: Colors.terra600,
  },

  scrollContent: {
    paddingHorizontal: Spacing.xxl,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
    ...Shadows.sm,
  },

  // Image
  imageWrap: {
    height: 150,
    backgroundColor: Colors.warm100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.terra500,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  newBadgeText: {
    fontSize: 9,
    fontFamily: 'DMSans-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  flagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtnActive: {
    backgroundColor: Colors.terra500,
  },

  // Content
  content: {
    padding: 14,
  },
  name: {
    fontSize: 15,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  area: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  price: {
    fontSize: 17,
    fontFamily: 'DMSans-Bold',
    color: Colors.terra600,
  },
  size: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warm50,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  tagRera: {
    backgroundColor: '#DCFCE7',
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  tagTextRera: {
    color: '#16A34A',
  },

  // Verdict
  verdictRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  verdict: {
    fontSize: 11,
    fontFamily: 'DMSans-Regular',
    fontStyle: 'italic',
    color: Colors.terra500,
    lineHeight: 16,
  },
});
