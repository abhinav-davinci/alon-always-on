import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';
import StageStrip from './StageStrip';

export default function StageNavigator() {
  return (
    <View style={styles.container}>
      <StageStrip />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warm200,
  },
});
