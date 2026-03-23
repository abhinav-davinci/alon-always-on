import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Heart,
  Share2,
  MapPin,
  Shield,
  Building2,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Star,
  Ruler,
  Car,
  Trees,
  Dumbbell,
  Waves,
  Users,
  Phone,
  MessageCircle,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Button from '../../components/Button';
import { Colors, Spacing } from '../../constants/theme';
import { useHaptics } from '../../hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Demo property database
const PROPERTIES: Record<string, any> = {
  'godrej-hillside': {
    name: 'Godrej Hillside',
    builder: 'Godrej Properties',
    area: 'Baner, Pune',
    price: '₹1.35 Cr',
    pricePerSqFt: '₹9,310/sq.ft',
    size: '3 BHK',
    sqft: '1,450 sq.ft',
    floor: '12th of 22 floors',
    facing: 'East-facing',
    possession: 'Dec 2026',
    rera: 'P52100012345',
    reraVerified: true,
    builderRating: 4.5,
    builderProjects: 12,
    isNew: true,
    tags: ['RERA ✓', 'Premium', 'Vastu Compliant'],
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop',
    ],
    amenities: [
      { name: 'Parking', icon: Car },
      { name: 'Garden', icon: Trees },
      { name: 'Gym', icon: Dumbbell },
      { name: 'Pool', icon: Waves },
      { name: 'Clubhouse', icon: Users },
    ],
    highlights: [
      'RERA registered and verified',
      'Godrej — Top 5 builder in Pune',
      'Near Balewadi IT hub (3 km)',
      'Ready possession Dec 2026',
    ],
    priceHistory: [
      { period: '6 mo ago', price: '₹1.28 Cr', change: '+5.5%' },
      { period: '1 yr ago', price: '₹1.15 Cr', change: '+17.4%' },
      { period: 'Launch', price: '₹95 L', change: '+42.1%' },
    ],
    alonInsight: 'This property is in the top 3% of your matches. The builder has 100% RERA compliance across 12 projects. Price appreciation in Baner has averaged 12% annually over the past 3 years.',
  },
  'pride-world-city': {
    name: 'Pride World City',
    builder: 'Pride Group',
    area: 'Balewadi, Pune',
    price: '₹1.18 Cr',
    pricePerSqFt: '₹8,940/sq.ft',
    size: '3 BHK',
    sqft: '1,320 sq.ft',
    floor: '8th of 18 floors',
    facing: 'West-facing',
    possession: 'Ready to move',
    rera: 'P52100067890',
    reraVerified: true,
    builderRating: 4.2,
    builderProjects: 8,
    isNew: true,
    tags: ['RERA ✓', 'Ready'],
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop',
    ],
    amenities: [
      { name: 'Parking', icon: Car },
      { name: 'Garden', icon: Trees },
      { name: 'Gym', icon: Dumbbell },
      { name: 'Clubhouse', icon: Users },
    ],
    highlights: [
      'RERA registered and verified',
      'Ready to move — no waiting',
      'Walking distance to Balewadi Stadium',
      'Well-established township with 2000+ families',
    ],
    priceHistory: [
      { period: '6 mo ago', price: '₹1.12 Cr', change: '+5.4%' },
      { period: '1 yr ago', price: '₹1.02 Cr', change: '+15.7%' },
      { period: 'Launch', price: '₹78 L', change: '+51.3%' },
    ],
    alonInsight: 'Ready possession is rare in Balewadi at this price point. The township is well-established which means lower risk. Price has appreciated 15.7% in the last year.',
  },
};

// Fallback property
const DEFAULT_PROPERTY = PROPERTIES['godrej-hillside'];

export default function PropertyDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ id?: string }>();

  const property = PROPERTIES[params.id || ''] || DEFAULT_PROPERTY;
  const [activeImage, setActiveImage] = React.useState(0);
  const [liked, setLiked] = React.useState(false);

  // Progress bar for ALON match score
  const matchWidth = useSharedValue(0);
  useEffect(() => {
    matchWidth.value = withDelay(600, withTiming(92, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, []);
  const matchStyle = useAnimatedStyle(() => ({
    width: `${matchWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Floating top bar over image — respects safe area */}
      <View style={[styles.floatingBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.floatingBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.floatingRight}>
          <TouchableOpacity
            style={styles.floatingBtn}
            onPress={() => { setLiked(!liked); haptics.medium(); }}
            activeOpacity={0.7}
          >
            <Heart size={18} color={liked ? '#EF4444' : '#fff'} fill={liked ? '#EF4444' : 'none'} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn} activeOpacity={0.7}>
            <Share2 size={18} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image gallery */}
        <View style={styles.gallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setActiveImage(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
            }}
          >
            {property.images.map((uri: string, i: number) => (
              <Image key={i} source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
            ))}
          </ScrollView>
          {/* Image dots */}
          <View style={styles.imageDots}>
            {property.images.map((_: string, i: number) => (
              <View key={i} style={[styles.imageDot, activeImage === i && styles.imageDotActive]} />
            ))}
          </View>
          {/* Tags on image */}
          <View style={styles.imageTags}>
            {property.isNew && (
              <View style={styles.imageTagNew}><Text style={styles.imageTagNewText}>NEW</Text></View>
            )}
            {property.reraVerified && (
              <View style={styles.imageTagRera}>
                <Shield size={10} color="#16A34A" strokeWidth={2} />
                <Text style={styles.imageTagReraText}>RERA Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Header info */}
        <View style={styles.headerSection}>
          <Animated.View entering={FadeIn.delay(200).duration(300)}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{property.price}</Text>
              <Text style={styles.pricePerSqft}>{property.pricePerSqFt}</Text>
            </View>
            <Text style={styles.propertyName}>{property.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={13} color={Colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.locationText}>{property.area}</Text>
            </View>
          </Animated.View>

          {/* Quick specs */}
          <Animated.View style={styles.specsRow} entering={FadeIn.delay(300).duration(300)}>
            <View style={styles.specItem}>
              <Text style={styles.specValue}>{property.size}</Text>
              <Text style={styles.specLabel}>Type</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Text style={styles.specValue}>{property.sqft}</Text>
              <Text style={styles.specLabel}>Area</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Text style={styles.specValue}>{property.floor}</Text>
              <Text style={styles.specLabel}>Floor</Text>
            </View>
          </Animated.View>
        </View>

        {/* ALON Insight card */}
        <Animated.View style={styles.section} entering={FadeInDown.delay(400).duration(300)}>
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <View style={styles.insightDot} />
              <Text style={styles.insightLabel}>ALON's take</Text>
            </View>
            <Text style={styles.insightText}>{property.alonInsight}</Text>
            <View style={styles.matchRow}>
              <Text style={styles.matchLabel}>Match score</Text>
              <View style={styles.matchTrack}>
                <Animated.View style={[styles.matchFill, matchStyle]} />
              </View>
              <Text style={styles.matchPercent}>92%</Text>
            </View>
          </View>
        </Animated.View>

        {/* Details grid */}
        <Animated.View style={styles.section} entering={FadeInDown.delay(500).duration(300)}>
          <Text style={styles.sectionTitle}>Property details</Text>
          <View style={styles.detailsGrid}>
            {[
              { label: 'Possession', value: property.possession, icon: Calendar },
              { label: 'Facing', value: property.facing, icon: Building2 },
              { label: 'RERA No.', value: property.rera, icon: Shield },
              { label: 'Appreciation', value: property.priceHistory[0]?.change, icon: TrendingUp },
            ].map((item) => (
              <View key={item.label} style={styles.detailCell}>
                <item.icon size={15} color={Colors.terra500} strokeWidth={1.5} />
                <Text style={styles.detailValue}>{item.value}</Text>
                <Text style={styles.detailLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Amenities */}
        <Animated.View style={styles.section} entering={FadeInDown.delay(600).duration(300)}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesRow}>
            {property.amenities.map((a: any) => (
              <View key={a.name} style={styles.amenityItem}>
                <View style={styles.amenityIcon}>
                  <a.icon size={18} color={Colors.terra500} strokeWidth={1.5} />
                </View>
                <Text style={styles.amenityLabel}>{a.name}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Builder info */}
        <Animated.View style={styles.section} entering={FadeInDown.delay(650).duration(300)}>
          <Text style={styles.sectionTitle}>Builder</Text>
          <View style={styles.builderCard}>
            <View style={styles.builderTop}>
              <View style={styles.builderAvatar}>
                <Building2 size={18} color={Colors.terra500} strokeWidth={1.5} />
              </View>
              <View style={styles.builderInfo}>
                <Text style={styles.builderName}>{property.builder}</Text>
                <Text style={styles.builderMeta}>{property.builderProjects} projects in Pune</Text>
              </View>
              <View style={styles.builderRating}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
                <Text style={styles.builderRatingText}>{property.builderRating}</Text>
              </View>
            </View>
            <View style={styles.builderBadges}>
              <View style={styles.builderBadge}>
                <CheckCircle2 size={11} color="#16A34A" strokeWidth={2} />
                <Text style={styles.builderBadgeText}>100% RERA compliant</Text>
              </View>
              <View style={styles.builderBadge}>
                <CheckCircle2 size={11} color="#16A34A" strokeWidth={2} />
                <Text style={styles.builderBadgeText}>On-time delivery record</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Price history */}
        <Animated.View style={styles.section} entering={FadeInDown.delay(700).duration(300)}>
          <Text style={styles.sectionTitle}>Price history</Text>
          <View style={styles.priceHistoryCard}>
            {property.priceHistory.map((ph: any, i: number) => (
              <View key={ph.period} style={[styles.phRow, i > 0 && styles.phRowBorder]}>
                <Text style={styles.phPeriod}>{ph.period}</Text>
                <Text style={styles.phPrice}>{ph.price}</Text>
                <View style={styles.phChange}>
                  <TrendingUp size={11} color="#16A34A" strokeWidth={2} />
                  <Text style={styles.phChangeText}>{ph.change}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ALON highlights */}
        <Animated.View style={styles.section} entering={FadeInDown.delay(750).duration(300)}>
          <Text style={styles.sectionTitle}>Why ALON picked this</Text>
          {property.highlights.map((h: string, i: number) => (
            <View key={i} style={styles.highlightRow}>
              <CheckCircle2 size={14} color={Colors.terra500} strokeWidth={2} />
              <Text style={styles.highlightText}>{h}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Sticky bottom CTAs */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={() => Linking.openURL('tel:+919876543210')}
          activeOpacity={0.7}
        >
          <Phone size={16} color={Colors.terra500} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaSecondary} activeOpacity={0.7}>
          <MessageCircle size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.ctaSecondaryText}>Ask ALON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaPrimary} activeOpacity={0.85}>
          <Calendar size={16} color="#fff" strokeWidth={2} />
          <Text style={styles.ctaPrimaryText}>Schedule Visit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Floating bar over image
  floatingBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  floatingBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRight: { flexDirection: 'row', gap: 8 },

  // Gallery
  gallery: { height: 280, position: 'relative' },
  galleryImage: { width: SCREEN_WIDTH, height: 280 },
  imageDots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  imageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  imageDotActive: { width: 18, borderRadius: 3, backgroundColor: '#fff' },
  imageTags: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    flexDirection: 'row',
    gap: 6,
  },
  imageTagNew: {
    backgroundColor: Colors.terra500,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  imageTagNewText: { fontSize: 9, fontFamily: 'DMSans-Bold', color: '#fff', letterSpacing: 0.5 },
  imageTagRera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  imageTagReraText: { fontSize: 9, fontFamily: 'DMSans-Medium', color: '#16A34A' },

  // Header
  headerSection: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.warm100 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  price: { fontSize: 26, fontFamily: 'DMSans-Bold', color: Colors.terra600 },
  pricePerSqft: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  propertyName: { fontFamily: 'DMSerifDisplay', fontSize: 22, color: Colors.textPrimary, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.lg },
  locationText: { fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },

  specsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 14,
  },
  specItem: { flex: 1, alignItems: 'center' },
  specValue: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginBottom: 2 },
  specLabel: { fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  specDivider: { width: 1, backgroundColor: Colors.warm200, marginVertical: 2 },

  // Sections
  section: { paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginBottom: Spacing.md },

  // ALON Insight
  insightCard: {
    backgroundColor: Colors.navy800,
    borderRadius: 16,
    padding: 16,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  insightDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.activationGlow },
  insightLabel: { fontSize: 11, fontFamily: 'DMSans-SemiBold', color: Colors.activationGlow, textTransform: 'uppercase', letterSpacing: 0.5 },
  insightText: { fontSize: 13, fontFamily: 'DMSans-Regular', color: 'rgba(255,255,255,0.75)', lineHeight: 20, marginBottom: 14 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchLabel: { fontSize: 11, fontFamily: 'DMSans-Medium', color: 'rgba(255,255,255,0.4)' },
  matchTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  matchFill: { height: '100%', backgroundColor: Colors.activationGlow, borderRadius: 2 },
  matchPercent: { fontSize: 13, fontFamily: 'DMSans-Bold', color: Colors.activationGlow },

  // Details grid
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailCell: {
    width: '47%',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  detailValue: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginTop: 4 },
  detailLabel: { fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },

  // Amenities
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { alignItems: 'center', width: 56 },
  amenityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.terra50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  amenityLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textSecondary, textAlign: 'center' },

  // Builder
  builderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    padding: 14,
  },
  builderTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  builderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.terra50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  builderInfo: { flex: 1 },
  builderName: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  builderMeta: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginTop: 1 },
  builderRating: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  builderRatingText: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: '#D97706' },
  builderBadges: { gap: 6 },
  builderBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  builderBadgeText: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textSecondary },

  // Price history
  priceHistoryCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },
  phRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  phRowBorder: { borderTopWidth: 1, borderTopColor: Colors.warm100 },
  phPeriod: { flex: 1, fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textSecondary },
  phPrice: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginRight: 12 },
  phChange: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.green100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  phChangeText: { fontSize: 11, fontFamily: 'DMSans-Medium', color: '#16A34A' },

  // Highlights
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  highlightText: { flex: 1, fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textSecondary, lineHeight: 19 },

  // Sticky bottom
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
    backgroundColor: Colors.white,
  },
  ctaSecondaryText: { fontSize: 13, fontFamily: 'DMSans-Medium', color: Colors.terra500 },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.terra500,
  },
  ctaPrimaryText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
});
