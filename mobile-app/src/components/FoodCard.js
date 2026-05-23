import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';

export function isOutOfStock(item) {
  return item?.availability?.isAvailable === false;
}

export default function FoodCard({ item, onPress, onAdd, onRemove, qty, isOpen, nextAvailableLabel }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const outOfStock = isOutOfStock(item);

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
      {/* Info on left */}
      <View style={styles.foodInfo}>
        <View style={styles.vegBestsellerRow}>
          <View style={[styles.vegBox, { borderColor: item.isVeg !== false ? colors.tagVeg : colors.tagNonVeg }]}>
            <View style={[styles.vegDot, { backgroundColor: item.isVeg !== false ? colors.tagVeg : colors.tagNonVeg }]} />
          </View>
          {item.isBestseller && (
            <View style={styles.bestsellerTag}>
              <Text style={styles.bestsellerTagText}>Bestseller</Text>
            </View>
          )}
        </View>
        <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.foodDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.foodPrice}>₹{item.price}</Text>
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
            <Text style={styles.foodEmoji}>{item.image || '🍕'}</Text>
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
  vegBestsellerRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: vs(4) },
  vegBox: {
    width: rs(14), height: rs(14), borderRadius: rs(2),
    borderWidth: 1.5, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  vegDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  bestsellerTag: { backgroundColor: '#FFF3CD', borderRadius: rs(4), paddingHorizontal: rs(6), paddingVertical: vs(2) },
  bestsellerTagText: { fontSize: ms(10), fontWeight: '700', color: '#B8860B' },
  foodName: { fontSize: ms(14), fontWeight: '700', color: colors.text, marginBottom: vs(4) },
  foodDesc: { fontSize: ms(12), color: colors.placeholder, lineHeight: ms(18), marginBottom: vs(6) },
  foodPrice: { fontSize: ms(15), fontWeight: '800', color: colors.text, marginTop: vs(6) },
  foodImageWrap: { position: 'relative', alignSelf: 'center', marginTop: -vs(10) },
  foodImageBg: {
    width: rs(130), height: rs(130),
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  foodImage: { width: rs(130), height: rs(130) },
  foodEmoji: { fontSize: ms(58) },
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
});
