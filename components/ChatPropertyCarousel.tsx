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
import { ShieldCheck, AlertTriangle, Heart } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, Shadows } from '../constants/theme';
import { Property } from '../constants/properties';
import { useHaptics } from '../hooks/useHaptics';
import { useOnboardingStore } from '../store/onboarding';

interface ChatPropertyCarouselProps {
  properties: Property[];
  onViewAll?: () => void;
}

export default function ChatPropertyCarousel({ properties, onViewAll }: ChatPropertyCarouselProps) {
  const router = useRouter();
  const haptics = useHaptics();
  const { likedPropertyIds, toggleLikedProperty } = useOnboardingStore();

  const CARD_WIDTH = 200;
  const CARD_GAP = 10;

  return (
    <Animated.View style={styles.container} entering={FadeInUp.duration(350)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
      >
        {properties.map((p, i) => {
          const isLiked = likedPropertyIds.includes(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.card, { width: CARD_WIDTH, marginRight: i < properties.length - 1 ? CARD_GAP : 0 }]}
              activeOpacity={0.85}
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
                    <AlertTriangle size={8} color="#D97706" strokeWidth={2.5} />
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
                    size={12}
                    color={isLiked ? '#fff' : 'rgba(255,255,255,0.9)'}
                    strokeWidth={2}
                    fill={isLiked ? '#fff' : 'none'}
                  />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.area} numberOfLines={1}>{p.area}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{p.price}</Text>
                  <Text style={styles.size}>{p.size.split(' · ')[0]}</Text>
                </View>

                {/* Tags — only for new properties */}
                {p.isNew && (
                  <View style={styles.tagRow}>
                    {p.tags.slice(0, 2).map((tag) => (
                      <View key={tag} style={[styles.tag, tag === 'RERA ✓' && styles.tagRera]}>
                        {tag === 'RERA ✓' && <ShieldCheck size={8} color="#16A34A" strokeWidth={2.5} />}
                        <Text style={[styles.tagText, tag === 'RERA ✓' && styles.tagTextRera]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ALON verdict */}
                {p.alonVerdict && (
                  <Text style={styles.verdict} numberOfLines={2}>{p.alonVerdict}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Page indicator */}
      <View style={styles.indicatorRow}>
        <View style={styles.dots}>
          {properties.map((_, i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
            <Text style={styles.viewAllLink}>View all {properties.length}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 30,
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: Spacing.xxl,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
    ...Shadows.sm,
  },

  // Image
  imageWrap: {
    height: 100,
    backgroundColor: Colors.warm100,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.terra500,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 8,
    fontFamily: 'DMSans-Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  flagBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtnActive: {
    backgroundColor: Colors.terra500,
  },

  // Content
  content: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
  },
  area: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: Colors.textTertiary,
    marginTop: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  price: {
    fontSize: 14,
    fontFamily: 'DMSans-Bold',
    color: Colors.terra600,
  },
  size: {
    fontSize: 10,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.warm50,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagRera: {
    backgroundColor: '#DCFCE7',
  },
  tagText: {
    fontSize: 9,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
  },
  tagTextRera: {
    color: '#16A34A',
  },

  // Verdict
  verdict: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    fontStyle: 'italic',
    color: Colors.terra500,
    marginTop: 6,
    lineHeight: 14,
  },

  // Indicator
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingRight: Spacing.xxl,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.warm200,
  },
  dotActive: {
    backgroundColor: Colors.terra400,
    width: 12,
    borderRadius: 3,
  },
  viewAllLink: {
    fontSize: 11,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.terra500,
  },
});
