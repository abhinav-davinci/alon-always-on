import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Pressable,
  TextInput,
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
  Car,
  Trees,
  Dumbbell,
  Waves,
  Users,
  Phone,
  MessageCircle,
  Zap,
  X,
  Clock,
  ChevronDown,
  CalendarPlus,
  Pencil,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import BottomSheet from '../../components/BottomSheet';
import { Colors, Spacing } from '../../constants/theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useOnboardingStore } from '../../store/onboarding';

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

  const { addScheduledVisit } = useOnboardingStore();
  const property = PROPERTIES[params.id || ''] || DEFAULT_PROPERTY;
  const [activeImage, setActiveImage] = React.useState(0);
  const [liked, setLiked] = React.useState(false);
  const [connectExpanded, setConnectExpanded] = useState(false);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visitBooked, setVisitBooked] = useState(false);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customHour, setCustomHour] = useState('');
  const [customMinute, setCustomMinute] = useState('');
  const [customAmPm, setCustomAmPm] = useState<'AM' | 'PM'>('AM');
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [customDay, setCustomDay] = useState('');

  // Progress bar for ALON match score
  const matchWidth = useSharedValue(0);
  useEffect(() => {
    matchWidth.value = withDelay(600, withTiming(92, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, []);
  const matchStyle = useAnimatedStyle(() => ({
    width: `${matchWidth.value}%`,
  }));

  // Zap icon pulse on Instant Connect button
  const zapPulse = useSharedValue(1);
  useEffect(() => {
    zapPulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, true
    );
  }, []);
  const zapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zapPulse.value }],
  }));

  // Generate next 7 days for scheduling
  const upcomingDates = React.useMemo(() => {
    const dates: { label: string; day: string; date: string; full: string }[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        label: i === 1 ? 'Tomorrow' : days[d.getDay()],
        day: `${d.getDate()}`,
        date: `${d.getDate()} ${months[d.getMonth()]}`,
        full: `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`,
      });
    }
    return dates;
  }, []);

  const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const applyCustomDate = () => {
    const dayNum = parseInt(customDay, 10);
    if (!dayNum || dayNum < 1 || dayNum > 31) return;
    const d = new Date(new Date().getFullYear(), customMonth, dayNum);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    setSelectedDate(`${days[d.getDay()]}, ${dayNum} ${MONTHS[customMonth]}`);
    setShowCustomDate(false);
    haptics.selection();
  };

  const applyCustomTime = () => {
    const h = parseInt(customHour, 10);
    const m = parseInt(customMinute || '0', 10);
    if (!h || h < 1 || h > 12) return;
    const mm = m < 10 ? `0${m}` : `${m}`;
    setSelectedTime(`${h}:${mm} ${customAmPm}`);
    setShowCustomTime(false);
    haptics.selection();
  };

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
        {connectExpanded ? (
          /* ── Expanded: full-width Call | Message | Close ── */
          <View style={styles.connectExpandedRow}>
            <TouchableOpacity
              style={styles.connectOption}
              activeOpacity={0.7}
              onPress={() => { haptics.medium(); Linking.openURL('tel:+919876543210'); }}
            >
              <View style={[styles.connectOptionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Phone size={18} color="#22C55E" strokeWidth={2} />
              </View>
              <Text style={styles.connectOptionLabel}>Call</Text>
              <Text style={styles.connectOptionSub}>Direct line</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.connectOption}
              activeOpacity={0.7}
              onPress={() => { haptics.light(); Linking.openURL('sms:+919876543210'); }}
            >
              <View style={[styles.connectOptionIcon, { backgroundColor: Colors.terra50 }]}>
                <MessageCircle size={18} color={Colors.terra500} strokeWidth={2} />
              </View>
              <Text style={styles.connectOptionLabel}>Message</Text>
              <Text style={styles.connectOptionSub}>Via SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.connectCloseBtn}
              activeOpacity={0.7}
              onPress={() => setConnectExpanded(false)}
            >
              <X size={16} color={Colors.textTertiary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Default: Instant Connect + Schedule Visit ── */
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaConnect}
              activeOpacity={0.85}
              onPress={() => { haptics.light(); setConnectExpanded(true); }}
            >
              <Animated.View style={zapStyle}>
                <Zap size={15} color={Colors.terra500} strokeWidth={2.2} fill={Colors.terra100} />
              </Animated.View>
              <Text style={styles.ctaConnectText}>Instant Connect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaPrimary}
              activeOpacity={0.85}
              onPress={() => { haptics.light(); setScheduleSheetOpen(true); }}
            >
              <Calendar size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.ctaPrimaryText}>Schedule Visit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Schedule Visit Sheet */}
      <BottomSheet
        visible={scheduleSheetOpen}
        title="Schedule a visit"
        onClose={() => setScheduleSheetOpen(false)}
      >
        {visitBooked ? (
          <Animated.View style={styles.bookedConfirm} entering={FadeIn.duration(300)}>
            <View style={styles.bookedCheckWrap}>
              <CheckCircle2 size={36} color="#22C55E" strokeWidth={2} />
            </View>
            <Text style={styles.bookedTitle}>Visit scheduled!</Text>
            <Text style={styles.bookedSub}>
              {selectedDate} at {selectedTime}
            </Text>
            <Text style={styles.bookedNote}>
              Your number stays hidden — the builder only gets a reference ID. ALON will send you a reminder.
            </Text>
            <TouchableOpacity
              style={styles.bookedDone}
              activeOpacity={0.85}
              onPress={() => { setScheduleSheetOpen(false); setVisitBooked(false); }}
            >
              <Text style={styles.bookedDoneText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View>
            {/* Date selection */}
            <Text style={styles.schedLabel}>Pick a date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll} contentContainerStyle={styles.dateScrollContent}>
              {upcomingDates.map((d) => {
                const isSelected = selectedDate === d.full;
                return (
                  <Pressable
                    key={d.full}
                    style={[styles.dateChip, isSelected && styles.dateChipActive]}
                    onPress={() => { haptics.selection(); setSelectedDate(d.full); setShowCustomDate(false); }}
                  >
                    <Text style={[styles.dateChipLabel, isSelected && styles.dateChipLabelActive]}>{d.label}</Text>
                    <Text style={[styles.dateChipDay, isSelected && styles.dateChipDayActive]}>{d.day}</Text>
                    <Text style={[styles.dateChipDate, isSelected && styles.dateChipDateActive]}>{d.date.split(' ')[1]}</Text>
                  </Pressable>
                );
              })}
              {/* Custom date chip */}
              <Pressable
                style={[styles.dateChip, styles.dateChipCustom, showCustomDate && styles.dateChipActive]}
                onPress={() => { haptics.selection(); setShowCustomDate(!showCustomDate); }}
              >
                <CalendarPlus size={14} color={showCustomDate ? '#fff' : Colors.terra500} strokeWidth={2} />
                <Text style={[styles.dateChipLabel, showCustomDate && styles.dateChipLabelActive, { marginTop: 2 }]}>Custom</Text>
              </Pressable>
            </ScrollView>

            {/* Custom date picker */}
            {showCustomDate && (
              <Animated.View style={styles.customDateRow} entering={FadeInUp.duration(200)}>
                <View style={styles.customFieldGroup}>
                  <Text style={styles.customFieldLabel}>Day</Text>
                  <TextInput
                    style={styles.customInput}
                    placeholder="DD"
                    placeholderTextColor={Colors.warm300}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={customDay}
                    onChangeText={setCustomDay}
                  />
                </View>
                <View style={styles.customFieldGroup}>
                  <Text style={styles.customFieldLabel}>Month</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
                    <View style={styles.monthRow}>
                      {MONTHS.map((m, i) => (
                        <Pressable
                          key={m}
                          style={[styles.monthChip, customMonth === i && styles.monthChipActive]}
                          onPress={() => { setCustomMonth(i); haptics.selection(); }}
                        >
                          <Text style={[styles.monthChipText, customMonth === i && styles.monthChipTextActive]}>{m}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <TouchableOpacity
                  style={[styles.customApplyBtn, !customDay && styles.customApplyBtnDisabled]}
                  onPress={applyCustomDate}
                  disabled={!customDay}
                  activeOpacity={0.85}
                >
                  <Text style={styles.customApplyText}>Set date</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Time selection */}
            <Text style={[styles.schedLabel, { marginTop: 20 }]}>Pick a time</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((t) => {
                const isSelected = selectedTime === t;
                return (
                  <Pressable
                    key={t}
                    style={[styles.timeChip, isSelected && styles.timeChipActive]}
                    onPress={() => { haptics.selection(); setSelectedTime(t); setShowCustomTime(false); }}
                  >
                    <Clock size={12} color={isSelected ? '#fff' : Colors.textTertiary} strokeWidth={2} />
                    <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>{t}</Text>
                  </Pressable>
                );
              })}
              {/* Custom time chip */}
              <Pressable
                style={[styles.timeChip, showCustomTime && styles.timeChipActive]}
                onPress={() => { haptics.selection(); setShowCustomTime(!showCustomTime); }}
              >
                <Pencil size={12} color={showCustomTime ? '#fff' : Colors.textTertiary} strokeWidth={2} />
                <Text style={[styles.timeChipText, showCustomTime && styles.timeChipTextActive]}>Custom</Text>
              </Pressable>
            </View>

            {/* Custom time input */}
            {showCustomTime && (
              <Animated.View style={styles.customTimeRow} entering={FadeInUp.duration(200)}>
                <View style={styles.customTimeInputs}>
                  <View style={styles.customFieldGroup}>
                    <Text style={styles.customFieldLabel}>Hour</Text>
                    <TextInput
                      style={styles.customInputSmall}
                      placeholder="HH"
                      placeholderTextColor={Colors.warm300}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={customHour}
                      onChangeText={setCustomHour}
                    />
                  </View>
                  <Text style={styles.customTimeSep}>:</Text>
                  <View style={styles.customFieldGroup}>
                    <Text style={styles.customFieldLabel}>Min</Text>
                    <TextInput
                      style={styles.customInputSmall}
                      placeholder="MM"
                      placeholderTextColor={Colors.warm300}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={customMinute}
                      onChangeText={setCustomMinute}
                    />
                  </View>
                  <View style={styles.customFieldGroup}>
                    <Text style={styles.customFieldLabel}>{' '}</Text>
                    <View style={styles.amPmToggle}>
                      <Pressable
                        style={[styles.amPmBtn, customAmPm === 'AM' && styles.amPmBtnActive]}
                        onPress={() => { setCustomAmPm('AM'); haptics.selection(); }}
                      >
                        <Text style={[styles.amPmText, customAmPm === 'AM' && styles.amPmTextActive]}>AM</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.amPmBtn, customAmPm === 'PM' && styles.amPmBtnActive]}
                        onPress={() => { setCustomAmPm('PM'); haptics.selection(); }}
                      >
                        <Text style={[styles.amPmText, customAmPm === 'PM' && styles.amPmTextActive]}>PM</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.customApplyBtn, !customHour && styles.customApplyBtnDisabled]}
                  onPress={applyCustomTime}
                  disabled={!customHour}
                  activeOpacity={0.85}
                >
                  <Text style={styles.customApplyText}>Set time</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Privacy note */}
            <View style={styles.privacyNote}>
              <Shield size={12} color={Colors.textTertiary} strokeWidth={2} />
              <Text style={styles.privacyNoteText}>Your phone number stays hidden from the builder</Text>
            </View>

            {/* Confirm button */}
            <TouchableOpacity
              style={[styles.schedConfirm, (!selectedDate || !selectedTime) && styles.schedConfirmDisabled]}
              activeOpacity={0.85}
              disabled={!selectedDate || !selectedTime}
              onPress={() => {
                haptics.success();
                addScheduledVisit({
                  propertyId: params.id || 'godrej-hillside',
                  propertyName: property.name,
                  date: selectedDate!,
                  time: selectedTime!,
                });
                setVisitBooked(true);
              }}
            >
              <Calendar size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.schedConfirmText}>
                {selectedDate && selectedTime
                  ? `Confirm · ${selectedDate?.split(', ')[0]}, ${selectedTime}`
                  : 'Select date & time'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
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
    paddingHorizontal: Spacing.xxl,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },

  // Default CTA row
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Instant Connect — collapsed
  ctaConnect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.terra200,
    backgroundColor: Colors.terra50,
  },
  ctaConnectText: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.terra600 },

  // Instant Connect — expanded (full width)
  connectExpandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  connectOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  connectOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  connectOptionLabel: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  connectOptionSub: { fontSize: 9, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  connectCloseBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.warm100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Schedule Visit CTA
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

  // ── Schedule Visit Sheet ──
  schedLabel: {
    fontSize: 13,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  dateScroll: { marginHorizontal: -Spacing.xxl },
  dateScrollContent: { paddingHorizontal: Spacing.xxl, gap: 8 },
  dateChip: {
    width: 64,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.warm50,
    borderWidth: 1,
    borderColor: Colors.warm100,
    gap: 2,
  },
  dateChipActive: {
    backgroundColor: Colors.terra500,
    borderColor: Colors.terra500,
  },
  dateChipLabel: { fontSize: 9, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
  dateChipLabelActive: { color: 'rgba(255,255,255,0.7)' },
  dateChipDay: { fontSize: 20, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  dateChipDayActive: { color: '#fff' },
  dateChipDate: { fontSize: 10, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  dateChipDateActive: { color: 'rgba(255,255,255,0.7)' },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.warm50,
    borderWidth: 1,
    borderColor: Colors.warm100,
  },
  timeChipActive: {
    backgroundColor: Colors.terra500,
    borderColor: Colors.terra500,
  },
  timeChipText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
  timeChipTextActive: { color: '#fff' },

  // Custom date chip
  dateChipCustom: {
    justifyContent: 'center',
    borderStyle: 'dashed' as any,
    borderColor: Colors.terra300,
  },

  // Custom date row
  customDateRow: {
    marginTop: 12,
    backgroundColor: Colors.warm50,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  customFieldGroup: { gap: 4 },
  customFieldLabel: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
  customInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'DMSans-SemiBold',
    color: Colors.textPrimary,
    width: 70,
    textAlign: 'center',
  },
  monthScroll: { marginTop: 2 },
  monthRow: { flexDirection: 'row', gap: 6 },
  monthChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
  },
  monthChipActive: { backgroundColor: Colors.terra500, borderColor: Colors.terra500 },
  monthChipText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
  monthChipTextActive: { color: '#fff' },
  customApplyBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.terra500,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  customApplyBtnDisabled: { opacity: 0.4 },
  customApplyText: { fontSize: 12, fontFamily: 'DMSans-SemiBold', color: '#fff' },

  // Custom time row
  customTimeRow: {
    marginTop: 10,
    backgroundColor: Colors.warm50,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  customTimeInputs: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  customInputSmall: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 18,
    fontFamily: 'DMSans-Bold',
    color: Colors.textPrimary,
    width: 56,
    textAlign: 'center',
  },
  customTimeSep: {
    fontSize: 22,
    fontFamily: 'DMSans-Bold',
    color: Colors.textTertiary,
    marginBottom: 10,
  },
  amPmToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
  },
  amPmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.white,
  },
  amPmBtnActive: { backgroundColor: Colors.terra500 },
  amPmText: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textTertiary },
  amPmTextActive: { color: '#fff' },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: Colors.warm50,
    borderRadius: 8,
  },
  privacyNoteText: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, flex: 1 },

  schedConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.terra500,
  },
  schedConfirmDisabled: { opacity: 0.4 },
  schedConfirmText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },

  // Booked confirmation
  bookedConfirm: { alignItems: 'center', paddingVertical: 10, gap: 8 },
  bookedCheckWrap: { marginBottom: 4 },
  bookedTitle: { fontSize: 18, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  bookedSub: { fontSize: 14, fontFamily: 'DMSans-Medium', color: Colors.terra500 },
  bookedNote: {
    fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 18, maxWidth: 280, marginTop: 4,
  },
  bookedDone: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    backgroundColor: Colors.terra500,
  },
  bookedDoneText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
});
