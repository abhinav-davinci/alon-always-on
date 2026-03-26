import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ImagePlus,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Penthouse', 'Row House'];
const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '4+ BHK'];

export default function AddPropertyManualScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { addUserProperty } = useOnboardingStore();

  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [locality, setLocality] = useState('');
  const [price, setPrice] = useState('');
  const [sqft, setSqft] = useState('');
  const [bhk, setBhk] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = name.trim() && locality.trim() && (price.trim() || sqft.trim());

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
      haptics.light();
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((i) => i !== uri));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    haptics.success();

    const formattedPrice = price ? `₹${parseFloat(price) >= 100 ? (parseFloat(price) / 100).toFixed(1) + ' Cr' : price + ' L'}` : '';
    const formattedSize = [bhk, sqft ? `${sqft} sq.ft` : ''].filter(Boolean).join(' · ');

    addUserProperty({
      id: `user-${Date.now()}`,
      name: name.trim(),
      area: locality.trim(),
      price: formattedPrice,
      size: formattedSize,
      bhk,
      propertyType,
      images,
      source: 'manual',
      addedAt: Date.now(),
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View style={styles.successWrap} entering={FadeIn.duration(400)}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={48} color="#22C55E" strokeWidth={1.8} />
          </View>
          <Text style={styles.successTitle}>Property added!</Text>
          <Text style={styles.successSub}>
            {name} has been added to your list. ALON will now verify RERA records, builder history, and market data for this property.
          </Text>
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.successBtnPrimary}
              activeOpacity={0.85}
              onPress={() => router.replace('/onboarding/shortlist')}
            >
              <Text style={styles.successBtnPrimaryText}>View my list</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.successBtnSecondary}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Text style={styles.successBtnSecondaryText}>Back to dashboard</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add property</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Building Name */}
        <Animated.View entering={FadeInDown.delay(0).duration(250)}>
          <Text style={styles.label}>Building / Project name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lodha Belmondo"
            placeholderTextColor={Colors.warm300}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </Animated.View>

        {/* Property Type */}
        <Animated.View entering={FadeInDown.delay(50).duration(250)}>
          <Text style={styles.label}>Property type</Text>
          <View style={styles.pillRow}>
            {PROPERTY_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.pill, propertyType === t && styles.pillActive]}
                onPress={() => { setPropertyType(t); haptics.selection(); }}
              >
                <Text style={[styles.pillText, propertyType === t && styles.pillTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Locality */}
        <Animated.View entering={FadeInDown.delay(100).duration(250)}>
          <Text style={styles.label}>Locality / Area *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Baner, Pune"
            placeholderTextColor={Colors.warm300}
            value={locality}
            onChangeText={setLocality}
          />
        </Animated.View>

        {/* Price */}
        <Animated.View entering={FadeInDown.delay(150).duration(250)}>
          <Text style={styles.label}>Price (in Lakhs)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputPrefix}>₹</Text>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="e.g. 135 for ₹1.35 Cr"
              placeholderTextColor={Colors.warm300}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
        </Animated.View>

        {/* Size */}
        <Animated.View entering={FadeInDown.delay(200).duration(250)}>
          <Text style={styles.label}>Area (sq.ft)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1450"
            placeholderTextColor={Colors.warm300}
            keyboardType="numeric"
            value={sqft}
            onChangeText={setSqft}
          />
        </Animated.View>

        {/* BHK */}
        <Animated.View entering={FadeInDown.delay(250).duration(250)}>
          <Text style={styles.label}>Configuration</Text>
          <View style={styles.pillRow}>
            {BHK_OPTIONS.map((b) => (
              <Pressable
                key={b}
                style={[styles.pill, bhk === b && styles.pillActive]}
                onPress={() => { setBhk(b); haptics.selection(); }}
              >
                <Text style={[styles.pillText, bhk === b && styles.pillTextActive]}>{b}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Images */}
        <Animated.View entering={FadeInDown.delay(300).duration(250)}>
          <Text style={styles.label}>Photos (optional)</Text>
          <Text style={styles.labelSub}>Add up to 5 photos of the property</Text>
          <View style={styles.imageGrid}>
            {images.map((uri) => (
              <View key={uri} style={styles.imageThumb}>
                <Image source={{ uri }} style={styles.imageThumbImg} />
                <TouchableOpacity
                  style={styles.imageRemove}
                  onPress={() => removeImage(uri)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <X size={10} color="#fff" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.imageAddBtn} onPress={pickImage} activeOpacity={0.7}>
                <ImagePlus size={20} color={Colors.terra400} strokeWidth={1.5} />
                <Text style={styles.imageAddText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          activeOpacity={0.85}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          <Text style={styles.submitBtnText}>Add to my list</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.warm100,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },

  form: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg, gap: 20 },

  label: { fontSize: 13, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary, marginBottom: 6 },
  labelSub: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary, marginBottom: 8, marginTop: -4 },

  input: {
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.warm200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: 'DMSans-Regular',
    color: Colors.textPrimary,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputPrefix: {
    fontSize: 16, fontFamily: 'DMSans-Bold', color: Colors.textPrimary,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm200,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, borderRightWidth: 0,
  },
  inputFlex: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.warm50, borderWidth: 1, borderColor: Colors.warm100,
  },
  pillActive: { backgroundColor: Colors.terra500, borderColor: Colors.terra500 },
  pillText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
  pillTextActive: { color: '#fff' },

  // Images
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageThumb: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imageThumbImg: { width: '100%', height: '100%' },
  imageRemove: {
    position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  imageAddBtn: {
    width: 72, height: 72, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.terra200, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: Colors.terra50,
  },
  imageAddText: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.terra400 },

  // Sticky
  stickyBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.xxl, paddingTop: 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.warm100,
  },
  submitBtn: {
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.terra500,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },

  // Success
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 22, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  successSub: {
    fontSize: 14, fontFamily: 'DMSans-Regular', color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 20,
  },
  successActions: { marginTop: 16, gap: 10, width: '100%' },
  successBtnPrimary: {
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.terra500,
    alignItems: 'center',
  },
  successBtnPrimaryText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  successBtnSecondary: {
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.warm200, alignItems: 'center',
  },
  successBtnSecondaryText: { fontSize: 14, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },
});
