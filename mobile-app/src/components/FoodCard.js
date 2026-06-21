import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';

export function isOutOfStock(item) {
  return item?.availability?.isAvailable === false;
}

export function getDiscountPercent(item) {
  const base = item?.variants?.length > 0 ? Number(item.variants[0].price) : Number(item.price || 0);
  const mrp = item?.variants?.length > 0 ? Number(item.variants[0].marketPrice || 0) : Number(item.marketPrice || 0);
  if (!mrp || mrp <= base) return 0;
  return Math.round(((mrp - base) / mrp) * 100);
}

export default function FoodCard({ item, onPress, onAdd, onRemove, qty, isOpen, nextAvailableLabel, compact }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const outOfStock = isOutOfStock(item);
  const basePrice = item?.variants?.length > 0 ? Number(item.variants[0].price) : Number(item.price || 0);
  const actualPrice = item?.variants?.length > 0 ? Number(item.variants[0].marketPrice || 0) : Number(item.marketPrice || 0);
  const discount = getDiscountPercent(item);
  const { t, getItemName } = useLanguage();

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onAdd();
  };

  const packSize = item?.variants?.length > 0 ? item.variants[0].label : (item.unit || null);

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, outOfStock && styles.foodCardOutOfStock]}
        onPress={() => !outOfStock && onPress()}
        activeOpacity={outOfStock ? 1 : 0.93}
        disabled={outOfStock}
      >
        {/* Image area with ADD/qty floated at bottom-right — Blinkit style */}
        <View style={styles.compactImageBg}>
          {item.image && item.image.startsWith('/uploads') ? (
            <Image
              source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.compactEmoji}>{item.image || '🥦'}</Text>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
          {item.isNewArrival && !discount && (
            <View style={[styles.discountBadge, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.discountText}>NEW</Text>
            </View>
          )}
          {/* ADD / qty button anchored to bottom-right of image */}
          <Animated.View style={[styles.compactAddAnchor, { transform: [{ scale: scaleAnim }] }]}>
            {outOfStock ? (
              <View style={styles.compactOutOfStock}>
                <Text style={styles.compactOutOfStockText}>OUT</Text>
              </View>
            ) : !isOpen ? (
              <View style={styles.compactClosedBtn}>
                <Text style={styles.compactClosedText}>Closed</Text>
              </View>
            ) : qty > 0 ? (
              <View style={styles.compactQtyControl}>
                <TouchableOpacity style={styles.compactQtyBtn} onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="remove" size={rs(14)} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.compactQtyText}>{qty}</Text>
                <TouchableOpacity style={styles.compactQtyBtn} onPress={handleAdd} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="add" size={rs(14)} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.compactAddBtn} onPress={handleAdd} activeOpacity={0.85}>
                <Ionicons name="add" size={rs(16)} color={colors.primary} />
                <Text style={styles.compactAddText}>ADD</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* Info below image */}
        <View style={styles.compactInfo}>
          {packSize ? <Text style={styles.compactPackSize}>{packSize}</Text> : null}
          <Text style={styles.compactName} numberOfLines={2}>{getItemName(item)}</Text>
          <View style={styles.compactPriceRow}>
            <Text style={styles.compactPrice}>₹{basePrice}</Text>
            {actualPrice > basePrice && <Text style={styles.compactMrp}>₹{actualPrice}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.foodCard, outOfStock && styles.foodCardOutOfStock]}
      onPress={() => !outOfStock && onPress()}
      activeOpacity={outOfStock ? 1 : 0.93}
      disabled={outOfStock}
    >
      {/* Image section */}
      <View style={styles.foodImageBg}>
        {item.image && item.image.startsWith('/uploads') ? (
          <Image
            source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.foodEmoji}>{item.image || '🥦'}</Text>
        )}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        {item.isNewArrival && !discount && (
          <View style={[styles.discountBadge, { backgroundColor: '#2E7D32' }]}>
            <Text style={styles.discountText}>NEW</Text>
          </View>
        )}
      </View>

      {/* Info section */}
      <View style={styles.foodRight}>
        <Text style={styles.foodName} numberOfLines={2} ellipsizeMode="tail">{getItemName(item)}</Text>

        {packSize ? (
          <View style={styles.packSizeChip}>
            <Text style={styles.packSize}>{packSize}</Text>
          </View>
        ) : null}

        {/* Price row */}
        <View style={styles.priceRow}>
          <Text style={styles.foodPrice}>₹{basePrice}</Text>
          <Text style={styles.originalPrice}>₹{actualPrice}</Text>
          {discount > 0 && actualPrice > basePrice && <Text style={styles.savingsText}>Save ₹{actualPrice - basePrice}</Text>}
        </View>

        {/* Controls */}
        <Animated.View style={[styles.addBtnWrap, { transform: [{ scale: scaleAnim }] }]}>
          {outOfStock ? (
            <View style={styles.outOfStockTag}>
              <Ionicons name="close-circle-outline" size={rs(11)} color="#EF4444" />
              <Text style={styles.outOfStockText}>{t.outOfStockLabel}</Text>
            </View>
          ) : qty > 0 ? (
            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={onRemove}>
                <Ionicons name="remove" size={rs(15)} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={handleAdd}>
                <Ionicons name="add" size={rs(15)} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : isOpen ? (
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Ionicons name="add" size={rs(14)} color="#fff" />
              <Text style={styles.addBtnText}>{t.addLabel}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.closedTag}>
              <Text style={styles.closedTagText} numberOfLines={1}>{nextAvailableLabel}</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Compact (grid) card — Blinkit / BigBasket style
  compactCard: {
    flex: 1,
    backgroundColor: colors.surface,
    marginHorizontal: rs(5),
    marginVertical: vs(5),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  compactImageBg: {
    width: '100%',
    height: rs(148),
    backgroundColor: '#F7F9F2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  compactEmoji: { fontSize: ms(64) },
  compactInfo: { paddingHorizontal: rs(10), paddingTop: vs(8), paddingBottom: vs(10) },
  compactPackSize: { fontSize: ms(10), color: colors.textSecondary, fontWeight: '500', marginBottom: vs(2) },
  compactName: { fontSize: ms(13), fontWeight: '700', color: colors.text, lineHeight: ms(18), marginBottom: vs(5) },
  compactPriceRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  compactPrice: { fontSize: ms(14), fontWeight: '800', color: colors.text },
  compactMrp: { fontSize: ms(11), color: colors.placeholder, textDecorationLine: 'line-through' },

  // ADD button anchored to bottom-right of image
  compactAddAnchor: {
    position: 'absolute',
    bottom: rs(8),
    right: rs(8),
  },
  compactAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(2),
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(10),
    paddingVertical: vs(5),
    ...shadows.small,
  },
  compactAddText: { fontSize: ms(12), fontWeight: '800', color: colors.primary },
  compactQtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    ...shadows.small,
  },
  compactQtyBtn: {
    width: rs(28),
    height: rs(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactQtyText: {
    fontSize: ms(13),
    fontWeight: '800',
    color: colors.primary,
    paddingHorizontal: rs(4),
    minWidth: rs(20),
    textAlign: 'center',
  },
  compactOutOfStock: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(8),
    paddingVertical: vs(4),
  },
  compactOutOfStockText: { fontSize: ms(10), fontWeight: '800', color: '#EF4444' },
  compactClosedBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.placeholder,
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(8),
    paddingVertical: vs(4),
  },
  compactClosedText: { fontSize: ms(10), fontWeight: '700', color: colors.placeholder },

  multiQtyRow: { gap: vs(3) },
  moreQtyText: { fontSize: ms(10), fontWeight: '700', color: colors.primary, textAlign: 'center' },

  foodCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    flex: 1,
    marginHorizontal: rs(12),
    marginVertical: vs(5),
    borderRadius: borderRadius.xl,
    padding: rs(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  foodCardOutOfStock: { opacity: 0.45 },
  foodImageBg: {
    width: rs(90),
    height: rs(90),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: rs(14),
    flexShrink: 0,
  },
  foodImage: { width: '100%', height: '100%' },
  foodEmoji: { fontSize: ms(44) },
  foodRight: {
    flex: 1,
    justifyContent: 'space-between',
    gap: vs(4),
  },
  packSizeChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: rs(8),
    paddingVertical: vs(2),
    marginBottom: vs(2),
  },
  packSize: {
    fontSize: ms(10),
    color: colors.textSecondary,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute', top: rs(6), left: rs(6),
    backgroundColor: '#E53935',
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(6), paddingVertical: vs(3),
  },
  discountText: { fontSize: ms(9), fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  foodName: { fontSize: ms(14), fontWeight: '700', color: colors.text, lineHeight: ms(20) },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: vs(4) },
  foodPrice: { fontSize: ms(16), fontWeight: '900', color: colors.primary },
  originalPrice: { fontSize: ms(11), color: colors.placeholder, textDecorationLine: 'line-through' },
  savingsText: { fontSize: ms(10), fontWeight: '700', color: '#2E7D32', backgroundColor: '#E8F5E9', paddingHorizontal: rs(5), paddingVertical: vs(1), borderRadius: borderRadius.xs },
  addBtnWrap: { alignSelf: 'stretch' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    borderRadius: borderRadius.md,
    paddingVertical: vs(8),
    paddingHorizontal: rs(10),
    backgroundColor: colors.primary,
    ...shadows.small,
  },
  addBtnText: { fontSize: ms(12), fontWeight: '800', color: '#fff' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.md, overflow: 'hidden',
    borderWidth: 1.5, borderColor: colors.primary,
    justifyContent: 'space-between',
  },
  qtyBtn: { width: rs(34), height: rs(34), justifyContent: 'center', alignItems: 'center' },
  qtyBtnFilled: { backgroundColor: colors.primary },
  qtyText: { fontSize: ms(15), fontWeight: '900', color: colors.primary, flex: 1, textAlign: 'center' },
  closedTag: {
    borderWidth: 1.5, borderColor: colors.placeholder,
    borderRadius: borderRadius.sm, paddingHorizontal: rs(8), paddingVertical: vs(5),
    backgroundColor: colors.background,
  },
  closedTagText: { fontSize: ms(10), fontWeight: '700', color: colors.placeholder, textAlign: 'center' },
  outOfStockTag: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4), justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#EF4444',
    borderRadius: borderRadius.sm, paddingHorizontal: rs(8), paddingVertical: vs(5),
    backgroundColor: '#FEF2F2',
  },
  outOfStockText: { fontSize: ms(10), fontWeight: '700', color: '#EF4444' },
});
