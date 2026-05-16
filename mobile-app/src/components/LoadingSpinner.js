import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { colors, spacing, typography } from '../utils/theme';

const { width } = Dimensions.get('window');

export const LoadingSpinner = ({ size = 'large', text }) => (
  <View style={styles.container}>
    <ActivityIndicator size={size} color={colors.primary} />
    {text && <Text style={styles.text}>{text}</Text>}
  </View>
);

export const LoadingSkeleton = ({ height = 80, width: itemWidth = width - 32 }) => (
  <View style={[styles.skeleton, { height, width: itemWidth }]} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  skeleton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    margin: spacing.sm,
  },
});

export default LoadingSpinner;