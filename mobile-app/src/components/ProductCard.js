import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';

export function isOutOfStock(item) {
  return item?.availability?.isAvailable === false;
}

export function getBasePrice(item) {
  return item?.variants?.length > 0 ? Number(item.variants[0].price) : Number(item.price || 0);
}

export function getMRP(item) {
  if (item?.variants?.length > 0) return Number(item.variants[0].marketPrice || 0);
  return Number(item?.marketPrice || 0);
}

export function getDiscountPercent(item) {
  const price = getBasePrice(item);
  const mrp = getMRP(item);
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export default function ProductCard({ item, onPress, onAdd, onRemove, qty }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { t, getItemName } = useLanguage();
  const outOfStock = isOutOfStock(item);
  const basePrice = getBasePrice(item);
  const actualPrice = getMRP(item);
  const discount = getDiscountPercent(item);

  const handleAdd = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onAdd();
  };

  return (
    <TouchableOpacity
      style={[styles.card, shadows.small, outOfStock && styles.cardOutOfStock]}
      onPress={() => !outOfStock && onPress()}
      activeOpacity={outOfStock ? 1 : 0.92}
      disabled={outOfStock}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {item.image && item.image.startsWith('/uploads') ? (
          <Image
            source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.emoji}>{item.image || '🥦'}</Text>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        {item.isNewArrival && !discount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.tagNew }]}>
            <Text style={styles.discountText}>NEW</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{getItemName(item)}</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.price}>₹{basePrice}</Text>
          </View>
          {actualPrice > basePrice && (
            <>
              <Text style={styles.originalPrice}>₹{actualPrice}</Text>
              <Text style={styles.discountLabel}>{discount}% OFF</Text>
            </>
          )}
        </View>
        {item.ratings?.average > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={rs(11)} color="#FFD600" />
            <Text style={styles.ratingText}>{item.ratings.average.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({item.ratings.count})</Text>
          </View>
        )}
      </View>

      {/* Add button */}
      <Animated.View style={[styles.addBtnWrap, { transform: [{ scale: scaleAnim }] }]}>
        {outOfStock ? (
          <View style={styles.outOfStockTag}>
            <Text style={styles.outOfStockText}>{t.outOfStockLabel}</Text>
          </View>
        ) : qty > 0 ? (
          <View style={styles.qtyControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}>
              <Ionicons name="remove" size={rs(14)} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={handleAdd}>
              <Ionicons name="add" size={rs(14)} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>{t.addLabel}</Text>
            <Ionicons name="add" size={rs(13)} color={colors.primary} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: rs(8),
    marginBottom: vs(16),
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    width: rs(170),
    ...shadows.small,
  },
  cardOutOfStock: { opacity: 0.5 },
  imageWrap: {
    width: '100%', height: rs(160),
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  image: { width: '100%', height: rs(160) },
  emoji: { fontSize: ms(64) },
  discountBadge: {
    position: 'absolute', top: rs(8), left: rs(8),
    backgroundColor: colors.tagSale,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(6), paddingVertical: vs(2),
  },
  discountText: { fontSize: ms(10), fontWeight: '800', color: '#fff' },
  info: { padding: rs(10), paddingBottom: vs(4) },
  brand: { fontSize: ms(10), fontWeight: '800', color: colors.primary, letterSpacing: 0.5, marginBottom: vs(2) },
  name: { fontSize: ms(13), fontWeight: '700', color: colors.text, marginBottom: vs(4), lineHeight: ms(18) },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: vs(4) },
  price: { fontSize: ms(15), fontWeight: '800', color: colors.primary },
  priceBox: {
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(6), paddingVertical: vs(2),
  },
  originalPrice: { fontSize: ms(13), color: colors.placeholder, textDecorationLine: 'line-through' },
  discountLabel: { fontSize: ms(11), fontWeight: '800', color: colors.tagSale },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: rs(3) },
  ratingText: { fontSize: ms(11), fontWeight: '700', color: colors.text },
  ratingCount: { fontSize: ms(10), color: colors.placeholder },
  addBtnWrap: { paddingHorizontal: rs(10), paddingBottom: vs(10), alignItems: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(2),
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(14), paddingVertical: vs(6),
    backgroundColor: colors.primarySurface,
    width: '100%', justifyContent: 'center',
  },
  addBtnText: { fontSize: ms(13), fontWeight: '800', color: colors.primary },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs, overflow: 'hidden',
    width: '100%', justifyContent: 'space-between',
  },
  qtyBtn: { width: rs(36), height: rs(32), justifyContent: 'center', alignItems: 'center' },
  qtyBtnFilled: { backgroundColor: colors.primary },
  qtyText: { fontSize: ms(13), fontWeight: '800', color: colors.primary },
  outOfStockTag: {
    borderWidth: 1.5, borderColor: '#EF4444',
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8), paddingVertical: vs(5),
    backgroundColor: '#FEF2F2', width: '100%', alignItems: 'center',
  },
  outOfStockText: { fontSize: ms(10), fontWeight: '700', color: '#EF4444' },
});
