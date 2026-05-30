import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';
import { useWishlist } from '../context/WishlistContext';

export function isOutOfStock(item) {
  return item?.availability?.isAvailable === false;
}

export function getDiscountPercent(item) {
  if (item?.originalPrice && item.originalPrice > item.price) {
    return Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
  }
  return 0;
}

export default function FoodCard({ item, onPress, onAdd, onRemove, qty, isOpen, nextAvailableLabel }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const outOfStock = isOutOfStock(item);
  const discount = getDiscountPercent(item);
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(item._id);

  const handleAdd = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onAdd();
  };

  return (
    <TouchableOpacity
      style={[styles.foodCard, shadows.small, outOfStock && styles.foodCardOutOfStock]}
      onPress={() => !outOfStock && onPress()}
      activeOpacity={outOfStock ? 1 : 0.92}
      disabled={outOfStock}
    >
      {/* Wishlist heart */}
      <TouchableOpacity style={styles.heartBtn} onPress={() => toggle(item)} activeOpacity={0.8}>
        <Ionicons
          name={wishlisted ? 'heart' : 'heart-outline'}
          size={rs(18)}
          color={wishlisted ? colors.error : colors.placeholder}
        />
      </TouchableOpacity>

      {/* Info on left */}
      <View style={styles.foodInfo}>
        <View style={styles.tagRow}>
          {item.brand && <Text style={styles.brandLabel}>{item.brand.toUpperCase()}</Text>}
          {item.isBestseller && (
            <View style={styles.bestsellerTag}>
              <Text style={styles.bestsellerTagText}>Bestseller</Text>
            </View>
          )}
        </View>
        <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.foodDesc} numberOfLines={2}>{item.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.foodPrice}>₹{item.price}</Text>
          {item.originalPrice > item.price && (
            <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
          )}
        </View>
      </View>

      {/* Image + button on right */}
      <View style={styles.foodImageWrap}>
        <View style={styles.foodImageBg}>
          {item.image && item.image.startsWith('/uploads') ? (
            <Image
              source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.foodEmoji}>{item.image || '👟'}</Text>
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
        {item.ratings?.average >= 4.2 && !outOfStock && (
          <View style={styles.bestsellerBadge}>
            <Text style={styles.bestsellerText}>⭐ BESTSELLER</Text>
          </View>
        )}
        <Animated.View style={[styles.addBtnWrap, { transform: [{ scale: scaleAnim }] }]}>
          {outOfStock ? (
            <View style={styles.outOfStockTag}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
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
          ) : isOpen ? (
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>ADD</Text>
              <Ionicons name="add" size={rs(13)} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.closedTag}>
              <Text style={styles.closedTagText}>{nextAvailableLabel}</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  foodCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    marginHorizontal: rs(16),
    marginBottom: vs(36),
    borderRadius: borderRadius.md,
    paddingTop: vs(14),
    paddingHorizontal: rs(20),
    paddingBottom: vs(26),
    gap: rs(12),
    overflow: 'visible',
    ...shadows.small,
  },
  foodCardOutOfStock: { opacity: 0.45 },
  foodInfo: { flex: 1, justifyContent: 'flex-start', alignSelf: 'flex-start' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: vs(4) },
  brandLabel: { fontSize: ms(10), fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  bestsellerTag: { backgroundColor: '#FFF3CD', borderRadius: rs(4), paddingHorizontal: rs(6), paddingVertical: vs(2) },
  bestsellerTagText: { fontSize: ms(10), fontWeight: '700', color: '#B8860B' },
  foodName: { fontSize: ms(14), fontWeight: '700', color: colors.text, marginBottom: vs(4) },
  foodDesc: { fontSize: ms(12), color: colors.placeholder, lineHeight: ms(18), marginBottom: vs(6) },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: vs(6) },
  foodPrice: { fontSize: ms(15), fontWeight: '800', color: colors.text },
  originalPrice: { fontSize: ms(12), color: colors.placeholder, textDecorationLine: 'line-through' },
  discountBadge: {
    position: 'absolute', top: rs(6), left: rs(6),
    backgroundColor: colors.tagSale,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(5), paddingVertical: vs(2),
  },
  discountText: { fontSize: ms(9), fontWeight: '800', color: '#fff' },
  foodImageWrap: { position: 'relative', alignSelf: 'center', marginTop: -vs(10) },
  foodImageBg: {
    width: rs(130), height: rs(130),
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  foodImage: { width: rs(130), height: rs(130) },
  foodEmoji: { fontSize: ms(52) },
  bestsellerBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: vs(3), alignItems: 'center',
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  bestsellerText: { fontSize: ms(8), fontWeight: '800', color: '#FFD700', letterSpacing: 0.3 },
  addBtnWrap: { position: 'absolute', bottom: -vs(16), left: 0, right: 0, alignItems: 'center' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(2),
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(14), paddingVertical: vs(6),
    backgroundColor: colors.primarySurface,
  },
  addBtnText: { fontSize: ms(13), fontWeight: '800', color: colors.primary },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs, overflow: 'hidden',
  },
  qtyBtn: { width: rs(30), height: rs(30), justifyContent: 'center', alignItems: 'center' },
  qtyBtnFilled: { backgroundColor: colors.primary },
  qtyText: { fontSize: ms(13), fontWeight: '800', color: colors.primary, paddingHorizontal: rs(10) },
  closedTag: {
    borderWidth: 1.5, borderColor: colors.placeholder,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8), paddingVertical: vs(5),
    backgroundColor: colors.background,
  },
  closedTagText: { fontSize: ms(10), fontWeight: '700', color: colors.placeholder, textAlign: 'center' },
  outOfStockTag: {
    borderWidth: 1.5, borderColor: '#EF4444',
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8), paddingVertical: vs(5),
    backgroundColor: '#FEF2F2',
  },
  outOfStockText: { fontSize: ms(10), fontWeight: '700', color: '#EF4444', textAlign: 'center' },
  heartBtn: {
    position: 'absolute', top: vs(10), right: rs(10),
    zIndex: 10,
    width: rs(30), height: rs(30), borderRadius: rs(15),
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
    ...shadows.small,
  },
});
