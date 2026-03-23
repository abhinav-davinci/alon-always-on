import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';

interface PropertyCardProps {
  name: string;
  location: string;
  price: string;
  size: string;
  image: string;
  tags: string[];
  isNew?: boolean;
}

export default function PropertyCard({
  name,
  location,
  price,
  size,
  tags,
  isNew,
}: PropertyCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.imagePlaceholderText}>Property Image</Text>
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.location}>{location}</Text>
        <View style={styles.details}>
          <Text style={styles.price}>{price}</Text>
          <Text style={styles.size}>{size}</Text>
        </View>
        <View style={styles.tags}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.md,
    width: 260,
    marginRight: Spacing.lg,
  },
  imagePlaceholder: {
    height: 140,
    backgroundColor: Colors.warm100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    ...Typography.caption,
    color: Colors.terra400,
  },
  newBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.terra500,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  newBadgeText: {
    ...Typography.small,
    color: Colors.white,
    fontWeight: '700',
  },
  content: {
    padding: Spacing.lg,
  },
  name: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  location: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  price: {
    ...Typography.bodyMedium,
    color: Colors.terra600,
  },
  size: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  tag: {
    backgroundColor: Colors.green100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  tagText: {
    ...Typography.small,
    color: Colors.green500,
  },
});
