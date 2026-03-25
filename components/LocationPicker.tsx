import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Search, MapPin, X, Plus, Check } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useHaptics } from '../hooks/useHaptics';

const ALL_LOCATIONS = [
  'West Pune', 'Baner', 'Balewadi', 'Wakad', 'Hinjewadi', 'Kharadi',
  'Viman Nagar', 'Hadapsar', 'Magarpatta', 'Koregaon Park', 'Kalyani Nagar',
  'Aundh', 'Pimple Saudagar', 'PCMC', 'Undri', 'Wagholi', 'Tathawade',
  'Bavdhan', 'Pashan', 'Sus Road',
  'Kothrud', 'Shivaji Nagar', 'Deccan', 'Sinhagad Road', 'Warje',
  'Karve Nagar', 'Dhankawadi', 'Katraj', 'Kondhwa', 'NIBM Road',
  'Camp', 'Yerawada', 'Vishrantwadi', 'Dhanori', 'Moshi',
  'Chakan', 'Talegaon', 'Lonavala', 'Ravet', 'Akurdi',
  'Chinchwad', 'Nigdi', 'Bhosari', 'Dighi', 'Alandi',
  'Manjri', 'Lohegaon', 'Mundhwa', 'Keshav Nagar', 'Phursungi',
];

const TEMPLATE_LOCATIONS = [
  'West Pune', 'Baner', 'Balewadi', 'Wakad', 'Hinjewadi', 'Kharadi',
  'Viman Nagar', 'Hadapsar', 'Koregaon Park', 'Kalyani Nagar',
  'Aundh', 'Pimple Saudagar', 'PCMC', 'Undri', 'Wagholi',
  'Tathawade', 'Bavdhan', 'Pashan', 'Sus Road',
];

interface LocationPickerProps {
  selected: string[];
  onSelect: (locations: string[]) => void;
}

export default function LocationPicker({ selected, onSelect }: LocationPickerProps) {
  const haptics = useHaptics();
  const [searchText, setSearchText] = useState('');
  const [focused, setFocused] = useState(false);

  const query = searchText.trim().toLowerCase();
  const showSuggestions = query.length >= 1;

  // Suggestions: filter locations matching query, exclude already selected
  const suggestions = useMemo(() => {
    if (!showSuggestions) return [];
    return ALL_LOCATIONS.filter(
      (loc) => loc.toLowerCase().includes(query) && !selected.includes(loc)
    ).slice(0, 6);
  }, [query, selected, showSuggestions]);

  // Can add as custom if no exact match exists
  const canAddCustom = useMemo(() => {
    if (query.length < 2) return false;
    const exactMatch = ALL_LOCATIONS.some((loc) => loc.toLowerCase() === query);
    const alreadySelected = selected.some((s) => s.toLowerCase() === query);
    return !exactMatch && !alreadySelected;
  }, [query, selected]);

  const addLocation = (location: string) => {
    haptics.selection();
    if (!selected.includes(location)) {
      onSelect([...selected, location]);
    }
    setSearchText('');
  };

  const removeLocation = (location: string) => {
    haptics.selection();
    onSelect(selected.filter((s) => s !== location));
  };

  const toggleTemplate = (location: string) => {
    haptics.selection();
    if (selected.includes(location)) {
      onSelect(selected.filter((s) => s !== location));
    } else {
      onSelect([...selected, location]);
    }
  };

  const addCustom = () => {
    const custom = searchText.trim();
    if (custom.length >= 2) {
      haptics.medium();
      if (!selected.includes(custom)) {
        onSelect([...selected, custom]);
      }
      setSearchText('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <Search size={16} color={focused ? Colors.terra500 : Colors.textTertiary} strokeWidth={1.8} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search area or locality..."
          placeholderTextColor={Colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')} hitSlop={8}>
            <X size={16} color={Colors.textTertiary} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* Suggestions — shown whenever there's search text (not tied to focus) */}
      {showSuggestions && (suggestions.length > 0 || canAddCustom) && (
        <View style={styles.suggestionsWrap}>
          {suggestions.map((loc) => {
            const isAlreadySelected = selected.includes(loc);
            return (
              <Pressable
                key={loc}
                style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionRowPressed]}
                onPress={() => addLocation(loc)}
              >
                <MapPin size={14} color={Colors.terra400} strokeWidth={1.5} />
                <Text style={styles.suggestionText}>{loc}</Text>
                {isAlreadySelected ? (
                  <Check size={14} color={Colors.terra500} strokeWidth={2} />
                ) : (
                  <Plus size={14} color={Colors.terra500} strokeWidth={2} />
                )}
              </Pressable>
            );
          })}
          {canAddCustom && (
            <Pressable
              style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionRowPressed]}
              onPress={addCustom}
            >
              <Plus size={14} color={Colors.terra500} strokeWidth={2} />
              <Text style={styles.suggestionCustom}>Add "{searchText.trim()}"</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <View style={styles.selectedWrap}>
          <Text style={styles.sectionLabel}>Selected</Text>
          <View style={styles.chips}>
            {selected.map((loc) => (
              <Pressable
                key={loc}
                style={styles.chip}
                onPress={() => removeLocation(loc)}
              >
                <Text style={styles.chipText}>{loc}</Text>
                <X size={12} color={Colors.terra500} strokeWidth={2} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Template pills */}
      {!showSuggestions && (
        <View>
          <Text style={styles.sectionLabel}>Popular areas</Text>
          <View style={styles.pills}>
            {TEMPLATE_LOCATIONS.map((loc) => {
              const isSelected = selected.includes(loc);
              return (
                <Pressable
                  key={loc}
                  style={[styles.pill, isSelected && styles.pillSelected]}
                  onPress={() => toggleTemplate(loc)}
                >
                  <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                    {loc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Spacing.md,
  },
  searchBarFocused: {
    borderColor: Colors.terra500,
    backgroundColor: Colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
    padding: 0,
  },

  suggestionsWrap: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.warm200,
    borderRadius: 12,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm100,
  },
  suggestionRowPressed: {
    backgroundColor: Colors.cream,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: Colors.textPrimary,
  },
  suggestionCustom: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans-Medium',
    color: Colors.terra500,
  },

  selectedWrap: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Medium',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.terra50,
    borderWidth: 1,
    borderColor: Colors.terra200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: Colors.terra600,
  },

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.warm200,
  },
  pillSelected: {
    backgroundColor: Colors.terra50,
    borderColor: Colors.terra500,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'DMSans-Medium',
    color: Colors.textSecondary,
  },
  pillTextSelected: {
    color: Colors.terra600,
  },
});
