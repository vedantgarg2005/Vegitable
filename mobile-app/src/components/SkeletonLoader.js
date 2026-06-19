import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { rs, vs, borderRadius } from '../utils/theme';

function SkeletonBox({ width, height, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[styles.box, { width, height, opacity }, style]}
    />
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={[styles.card, { flexDirection: 'column', padding: rs(16), marginVertical: vs(6), borderRadius: 12 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10) }}>
        <SkeletonBox width={rs(80)} height={vs(18)} style={{ borderRadius: 99 }} />
        <SkeletonBox width={rs(90)} height={vs(18)} style={{ borderRadius: 99 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: rs(6), marginBottom: vs(12) }}>
        <SkeletonBox width={rs(60)} height={vs(13)} style={{ borderRadius: 99 }} />
        <SkeletonBox width={rs(50)} height={vs(13)} style={{ borderRadius: 99 }} />
        <SkeletonBox width={rs(70)} height={vs(13)} style={{ borderRadius: 99 }} />
      </View>
      <SkeletonBox width="100%" height={vs(12)} style={{ borderRadius: 4, marginBottom: vs(8) }} />
      <SkeletonBox width="70%" height={vs(12)} style={{ borderRadius: 4, marginBottom: vs(14) }} />
      <SkeletonBox width="100%" height={vs(38)} style={{ borderRadius: 8 }} />
    </View>
  );
}

export function FoodCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox width={rs(80)} height={rs(80)} style={{ borderRadius: borderRadius.md, marginRight: rs(12) }} />
      <View style={{ flex: 1, gap: vs(8) }}>
        <SkeletonBox width="80%" height={vs(14)} style={{ borderRadius: borderRadius.xs }} />
        <SkeletonBox width="50%" height={vs(11)} style={{ borderRadius: borderRadius.xs }} />
        <SkeletonBox width="60%" height={vs(13)} style={{ borderRadius: borderRadius.xs }} />
        <SkeletonBox width="100%" height={vs(32)} style={{ borderRadius: borderRadius.sm }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#D1D5DB' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: rs(10),
    marginVertical: vs(6),
    borderRadius: borderRadius.lg,
    padding: rs(10),
    alignItems: 'center',
  },
});
