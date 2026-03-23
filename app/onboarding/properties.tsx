import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Shield, MapPin } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';

const PROPERTIES = [
  { name: 'Godrej Hillside', area: 'Baner, Pune', price: '₹1.35 Cr', size: '3 BHK · 1,450 sq.ft', tags: ['RERA ✓', 'Premium'], isNew: true, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=300&fit=crop' },
  { name: 'Pride World City', area: 'Balewadi, Pune', price: '₹1.18 Cr', size: '3 BHK · 1,320 sq.ft', tags: ['RERA ✓', 'Ready'], isNew: true, image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=300&fit=crop' },
  { name: 'Kolte Patil 24K', area: 'Wakad, Pune', price: '₹98 L', size: '2 BHK · 1,050 sq.ft', tags: ['RERA ✓'], isNew: false, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=300&fit=crop' },
  { name: 'Sobha Dream Acres', area: 'Hinjewadi, Pune', price: '₹1.05 Cr', size: '2 BHK · 1,180 sq.ft', tags: ['RERA ✓', 'New Launch'], isNew: true, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=300&fit=crop' },
  { name: 'Panchshil Towers', area: 'Kharadi, Pune', price: '₹1.42 Cr', size: '3 BHK · 1,520 sq.ft', tags: ['RERA ✓', 'Premium'], isNew: false, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=300&fit=crop' },
];

export default function PropertiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Top matches</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {PROPERTIES.length} properties matched your criteria
        </Text>

        {PROPERTIES.map((p, i) => (
          <Animated.View
            key={p.name}
            entering={FadeInDown.delay(i * 80).duration(300)}
          >
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardImage}>
                <Image source={{ uri: p.image }} style={styles.cardImg} resizeMode="cover" />
                {p.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <Text style={styles.cardPrice}>{p.price}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <MapPin size={12} color={Colors.textTertiary} strokeWidth={1.5} />
                  <Text style={styles.cardArea}>{p.area}</Text>
                  <Text style={styles.cardSize}>{p.size}</Text>
                </View>
                <View style={styles.cardTags}>
                  {p.tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200,
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg },
  subtitle: { fontSize: 13, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginBottom: Spacing.lg },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.warm200,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardImage: {
    height: 160,
    backgroundColor: Colors.warm100,
    position: 'relative' as const,
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute' as const,
    top: 10,
    left: 10,
    backgroundColor: Colors.terra500,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  newBadgeText: { fontSize: 9, fontFamily: 'DMSans-Bold', color: '#fff', letterSpacing: 0.5 },
  cardContent: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontSize: 15, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, flex: 1 },
  cardPrice: { fontSize: 16, fontFamily: 'DMSans-Bold', color: Colors.terra600 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  cardArea: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },
  cardSize: { fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginLeft: 8 },
  cardTags: { flexDirection: 'row', gap: 4, marginTop: 10 },
  tag: { backgroundColor: '#DCFCE7', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  tagText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: '#16A34A' },
});
