import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/theme';
import StageStrip from './StageStrip';

export default function StageNavigator() {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StageStrip />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm200,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
});
