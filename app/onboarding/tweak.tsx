import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';
import PillSelector from '../../components/PillSelector';
import LocationPicker from '../../components/LocationPicker';
import BudgetSlider from '../../components/BudgetSlider';
import PurposeGrid from '../../components/PurposeGrid';
import Button from '../../components/Button';
import { useOnboardingStore } from '../../store/onboarding';
import {
  PUNE_LOCATIONS,
  PROPERTY_SIZES,
  TIMELINE_OPTIONS,
} from '../../constants/locations';

export default function TweakScreen() {
  const router = useRouter();
  const {
    locations,
    propertyType,
    propertySize,
    budget,
    purpose,
    timeline,
    needsLoan,
    setLocations,
    setPropertyType,
    setPropertySize,
    setBudget,
    setPurpose,
    setTimeline,
    setNeedsLoan,
  } = useOnboardingStore();

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Refine your search</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Location — with search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where in Pune?</Text>
          <LocationPicker
            selected={locations}
            onSelect={setLocations}
          />
        </View>

        {/* Property Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property type</Text>
          <Text style={styles.sectionHint}>Residential</Text>
          <PillSelector
            options={['Apartment', 'Villa', 'Penthouse', 'Row House', 'Duplex']}
            selected={[propertyType]}
            onSelect={(sel) => setPropertyType(sel[0])}
          />
          <Text style={[styles.sectionHint, { marginTop: 14 }]}>Commercial</Text>
          <PillSelector
            options={['Office', 'Shop', 'Showroom', 'Coworking']}
            selected={[propertyType]}
            onSelect={(sel) => setPropertyType(sel[0])}
          />
          <Text style={[styles.sectionHint, { marginTop: 14 }]}>Plots & Land</Text>
          <PillSelector
            options={['Residential Plot', 'Commercial Plot', 'Agricultural Land']}
            selected={[propertyType]}
            onSelect={(sel) => setPropertyType(sel[0])}
          />
        </View>

        {/* Property Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property size</Text>
          <PillSelector
            options={PROPERTY_SIZES}
            selected={propertySize}
            onSelect={setPropertySize}
            multiSelect
          />
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <BudgetSlider
            min={budget.min}
            max={budget.max}
            showLoanToggle
            needsLoan={needsLoan}
            onToggleLoan={setNeedsLoan}
            onChangeMin={(min) => setBudget({ ...budget, min })}
            onChangeMax={(max) => setBudget({ ...budget, max })}
          />
        </View>

        {/* Purpose */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's this for?</Text>
          <PurposeGrid selected={purpose} onSelect={setPurpose} />
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Possession timeline</Text>
          <PillSelector
            options={TIMELINE_OPTIONS}
            selected={[timeline]}
            onSelect={(sel) => setTimeline(sel[0])}
          />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.stickyBottom}>
        <Button
          title="Find my matches →"
          onPress={() => router.push('/onboarding/activation')}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.warm200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionHint: {
    fontSize: 11,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  sectionTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.warm100,
  },
});
