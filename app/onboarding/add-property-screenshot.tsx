import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Upload,
  Sparkles,
  CheckCircle2,
  Pencil,
  ScanLine,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboarding';
import { useHaptics } from '../../hooks/useHaptics';

type Phase = 'upload' | 'extracting' | 'review' | 'done';

// Simulated extraction result
const DEMO_EXTRACTION = {
  name: 'Lodha Belmondo',
  area: 'Gahunje, Pune',
  price: '₹1.85 Cr',
  size: '1,680 sq.ft',
  bhk: '3 BHK',
  propertyType: 'Apartment',
};

export default function AddPropertyScreenshotScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { addUserProperty } = useOnboardingStore();

  const [phase, setPhase] = useState<Phase>('upload');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  // Editable fields for review phase
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [bhk, setBhk] = useState('');

  // Scan animation
  const scanY = useSharedValue(0);
  const scanOpacity = useSharedValue(0);

  const scanBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: scanOpacity.value,
  }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      haptics.light();
      // Start extraction automatically
      setTimeout(() => startExtraction(), 600);
    }
  };

  const startExtraction = () => {
    setPhase('extracting');
    haptics.light();

    // Animate the scan bar
    scanOpacity.value = withTiming(1, { duration: 300 });
    scanY.value = withRepeat(
      withTiming(220, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      4, true
    );

    // Simulate progress
    const steps = ['Reading text...', 'Extracting property name...', 'Finding price & location...', 'Almost done...'];
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setScanProgress(Math.min(step * 25, 100));
      if (step >= 4) {
        clearInterval(interval);
        // Done — transition to review
        scanOpacity.value = withTiming(0, { duration: 200 });
        setTimeout(() => {
          setName(DEMO_EXTRACTION.name);
          setArea(DEMO_EXTRACTION.area);
          setPrice(DEMO_EXTRACTION.price);
          setSize(DEMO_EXTRACTION.size);
          setBhk(DEMO_EXTRACTION.bhk);
          setPhase('review');
          haptics.success();
        }, 400);
      }
    }, 900);
  };

  const handleConfirm = () => {
    haptics.success();
    addUserProperty({
      id: `user-${Date.now()}`,
      name: name.trim(),
      area: area.trim(),
      price: price.trim(),
      size: [bhk, size].filter(Boolean).join(' · '),
      bhk,
      propertyType: DEMO_EXTRACTION.propertyType,
      images: imageUri ? [imageUri] : [],
      source: 'screenshot',
      extractedFrom: imageUri || undefined,
      addedAt: Date.now(),
    });
    setPhase('done');
  };

  // ── Upload Phase ──
  const renderUpload = () => (
    <View style={styles.centerWrap}>
      <TouchableOpacity style={styles.uploadZone} onPress={pickImage} activeOpacity={0.7}>
        <View style={styles.uploadIconWrap}>
          <Upload size={28} color={Colors.terra400} strokeWidth={1.5} />
        </View>
        <Text style={styles.uploadTitle}>Upload a screenshot</Text>
        <Text style={styles.uploadSub}>
          Share a screenshot from 99acres, MagicBricks, Housing.com or any listing — ALON reads it for you
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── Extracting Phase ──
  const renderExtracting = () => (
    <View style={styles.centerWrap}>
      <Animated.View style={styles.extractWrap} entering={FadeIn.duration(300)}>
        {/* Screenshot preview with scan overlay */}
        <View style={styles.scanPreview}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.scanImage} resizeMode="cover" />}
          <Animated.View style={[styles.scanBar, scanBarStyle]} />
          <View style={styles.scanOverlay}>
            <ScanLine size={24} color={Colors.terra500} strokeWidth={1.5} />
          </View>
        </View>

        <View style={styles.extractInfo}>
          <Sparkles size={16} color={Colors.terra500} strokeWidth={2} />
          <Text style={styles.extractText}>ALON is reading the screenshot...</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: `${scanProgress}%` }]} />
        </View>
        <Text style={styles.progressText}>{scanProgress}% extracted</Text>
      </Animated.View>
    </View>
  );

  // ── Review Phase ──
  const renderReview = () => (
    <ScrollView contentContainerStyle={[styles.reviewContent, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
      {/* Extracted card preview */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <View style={styles.reviewHeader}>
          <Sparkles size={14} color="#22C55E" strokeWidth={2} />
          <Text style={styles.reviewHeaderText}>Details extracted — review & confirm</Text>
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.reviewImage} resizeMode="cover" />
        )}

        <View style={styles.fieldsCard}>
          <ReviewField label="Building name" value={name} onChangeText={setName} />
          <ReviewField label="Locality" value={area} onChangeText={setArea} />
          <ReviewField label="Price" value={price} onChangeText={setPrice} />
          <ReviewField label="Size" value={size} onChangeText={setSize} />
          <ReviewField label="Configuration" value={bhk} onChangeText={setBhk} />
        </View>

        <View style={styles.editNote}>
          <Pencil size={11} color={Colors.textTertiary} strokeWidth={2} />
          <Text style={styles.editNoteText}>Tap any field to edit before confirming</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );

  // ── Done Phase ──
  const renderDone = () => (
    <Animated.View style={styles.centerWrap} entering={FadeIn.duration(400)}>
      <View style={styles.doneIcon}>
        <CheckCircle2 size={48} color="#22C55E" strokeWidth={1.8} />
      </View>
      <Text style={styles.doneTitle}>Property added!</Text>
      <Text style={styles.doneSub}>
        {name} has been added to your list. ALON will verify RERA records and builder history.
      </Text>
      <View style={styles.doneActions}>
        <TouchableOpacity
          style={styles.doneBtnPrimary}
          activeOpacity={0.85}
          onPress={() => router.replace('/onboarding/shortlist')}
        >
          <Text style={styles.doneBtnPrimaryText}>View my list</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.doneBtnSecondary}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Text style={styles.doneBtnSecondaryText}>Back to dashboard</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {phase === 'upload' ? 'Screenshot' : phase === 'extracting' ? 'Extracting...' : phase === 'review' ? 'Review details' : 'Done'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {phase === 'upload' && renderUpload()}
      {phase === 'extracting' && renderExtracting()}
      {phase === 'review' && renderReview()}
      {phase === 'done' && renderDone()}

      {/* Sticky confirm for review */}
      {phase === 'review' && (
        <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.confirmBtn} activeOpacity={0.85} onPress={handleConfirm}>
            <CheckCircle2 size={16} color="#fff" strokeWidth={2} />
            <Text style={styles.confirmBtnText}>Confirm & add to my list</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Editable review field
function ReviewField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (t: string) => void }) {
  return (
    <View style={rfStyles.container}>
      <Text style={rfStyles.label}>{label}</Text>
      <TextInput style={rfStyles.input} value={value} onChangeText={onChangeText} />
    </View>
  );
}

const rfStyles = StyleSheet.create({
  container: { gap: 3 },
  label: { fontSize: 10, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },
  input: {
    fontSize: 14, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: Colors.warm200,
    paddingVertical: 6, paddingHorizontal: 0,
  },
});

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

  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },

  // Upload
  uploadZone: {
    width: '100%', alignItems: 'center', paddingVertical: 50,
    borderWidth: 2, borderColor: Colors.terra200, borderStyle: 'dashed',
    borderRadius: 20, backgroundColor: Colors.terra50, gap: 12,
  },
  uploadIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.terra200,
  },
  uploadTitle: { fontSize: 16, fontFamily: 'DMSans-SemiBold', color: Colors.textPrimary },
  uploadSub: {
    fontSize: 12, fontFamily: 'DMSans-Regular', color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 18, maxWidth: 260,
  },

  // Extracting
  extractWrap: { width: '100%', alignItems: 'center', gap: 16 },
  scanPreview: {
    width: '100%', height: 240, borderRadius: 16, overflow: 'hidden',
    backgroundColor: Colors.warm100, position: 'relative',
  },
  scanImage: { width: '100%', height: '100%' },
  scanBar: {
    position: 'absolute', left: 0, right: 0, height: 3,
    backgroundColor: Colors.terra500, top: 0,
  },
  scanOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  extractInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  extractText: { fontSize: 14, fontFamily: 'DMSans-Medium', color: Colors.textPrimary },
  progressTrack: {
    width: '80%', height: 4, borderRadius: 2,
    backgroundColor: Colors.warm100, overflow: 'hidden',
  },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: Colors.terra500 },
  progressText: { fontSize: 11, fontFamily: 'DMSans-Medium', color: Colors.textTertiary },

  // Review
  reviewContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.lg },
  reviewHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  reviewHeaderText: { fontSize: 12, fontFamily: 'DMSans-Medium', color: '#16A34A' },
  reviewImage: {
    width: '100%', height: 180, borderRadius: 14,
    backgroundColor: Colors.warm100, marginBottom: 16,
  },
  fieldsCard: {
    backgroundColor: Colors.cream, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.warm200,
    padding: 16, gap: 14,
  },
  editNote: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingHorizontal: 4,
  },
  editNoteText: { fontSize: 11, fontFamily: 'DMSans-Regular', color: Colors.textTertiary },

  // Done
  doneIcon: { marginBottom: 12 },
  doneTitle: { fontSize: 22, fontFamily: 'DMSans-Bold', color: Colors.textPrimary },
  doneSub: {
    fontSize: 14, fontFamily: 'DMSans-Regular', color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 20, maxWidth: 280, marginTop: 4,
  },
  doneActions: { marginTop: 20, gap: 10, width: '100%', paddingHorizontal: 20 },
  doneBtnPrimary: {
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.terra500,
    alignItems: 'center',
  },
  doneBtnPrimaryText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
  doneBtnSecondary: {
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.warm200, alignItems: 'center',
  },
  doneBtnSecondaryText: { fontSize: 14, fontFamily: 'DMSans-Medium', color: Colors.textSecondary },

  // Sticky
  stickyBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.xxl, paddingTop: 12,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.warm100,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.terra500,
  },
  confirmBtnText: { fontSize: 14, fontFamily: 'DMSans-SemiBold', color: '#fff' },
});
