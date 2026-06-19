import React, { useRef, useState } from 'react';
import {
  View, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, borderRadius, ms, rs, vs } from '../utils/theme';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🥦',
    title: 'Farm Fresh Veggies',
    subtitle: 'Get the freshest vegetables delivered straight from local farms to your door.',
    bg: '#E8F5E9',
  },
  {
    emoji: '⚡',
    title: 'Lightning Fast Delivery',
    subtitle: 'Order now and get your groceries delivered in record time, every single day.',
    bg: '#FFF3E0',
  },
  {
    emoji: '🛒',
    title: 'Easy Ordering',
    subtitle: 'Browse, add to cart, and checkout in seconds. It\'s that simple.',
    bg: '#E3F2FD',
  },
];

export default function OnboardingScreen({ onDone }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  const next = async () => {
    if (index < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      await AsyncStorage.setItem('onboarding_done', 'true');
      onDone();
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem('onboarding_done', 'true');
    onDone();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={e => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / W));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: W, backgroundColor: item.bg }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.88}>
          <Text style={styles.nextBtnText}>
            {index === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skipBtn: { position: 'absolute', top: vs(52), right: rs(20), zIndex: 10, padding: rs(8) },
  skipText: { fontSize: ms(14), color: colors.placeholder, fontWeight: '600' },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(40),
    paddingTop: vs(80),
    paddingBottom: vs(20),
  },
  emoji: { fontSize: ms(100), marginBottom: vs(32) },
  title: { fontSize: ms(26), fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: vs(16) },
  subtitle: { fontSize: ms(15), color: colors.textSecondary, textAlign: 'center', lineHeight: ms(24) },
  footer: {
    paddingHorizontal: rs(24),
    paddingBottom: vs(48),
    paddingTop: vs(24),
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: vs(20),
  },
  dots: { flexDirection: 'row', gap: rs(8) },
  dot: { width: rs(8), height: rs(8), borderRadius: rs(4), backgroundColor: colors.border },
  dotActive: { width: rs(24), backgroundColor: colors.primary },
  nextBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: vs(15),
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '800' },
});
