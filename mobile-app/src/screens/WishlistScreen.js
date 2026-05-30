import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { colors, shadows, borderRadius, ms, rs, vs, spacing } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';

export default function WishlistScreen({ navigation }) {
  const { items, toggle } = useWishlist();
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }) => {
    const outOfStock = item.availability?.isAvailable === false;
    const discount = item.originalPrice > item.price
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={[styles.card, shadows.small]}
        onPress={() => navigation.navigate('MenuItemDetail', { item })}
        activeOpacity={0.9}
      >
        {/* Image */}
        <View style={styles.imageWrap}>
          {item.image?.startsWith('/uploads') ? (
            <Image
              source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.emoji}>{item.image || '🏅'}</Text>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          {item.brand && <Text style={styles.brand}>{item.brand.toUpperCase()}</Text>}
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.originalPrice > item.price && (
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.removeBtn} onPress={() => toggle(item)}>
            <Ionicons name="heart" size={rs(20)} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, outOfStock && styles.addBtnDisabled]}
            onPress={() => !outOfStock && addToCart(item)}
            disabled={outOfStock}
          >
            <Text style={[styles.addBtnText, outOfStock && styles.addBtnTextDisabled]}>
              {outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(12) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🤍</Text>
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySub}>Tap the heart icon on any product to save it here</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Explore')}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingBottom: vs(14),
    gap: rs(12),
  },
  backBtn: {
    width: rs(40), height: rs(40), borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: ms(18), fontWeight: '800', color: '#fff' },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: rs(10), paddingVertical: vs(3),
  },
  countText: { fontSize: ms(12), fontWeight: '800', color: '#fff' },

  list: { padding: rs(16), gap: vs(12) },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(12),
    gap: rs(12),
  },
  imageWrap: {
    width: rs(80), height: rs(80),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  image: { width: rs(80), height: rs(80) },
  emoji: { fontSize: ms(36) },
  discountBadge: {
    position: 'absolute', top: rs(4), left: rs(4),
    backgroundColor: colors.tagSale,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(4), paddingVertical: vs(1),
  },
  discountText: { fontSize: ms(8), fontWeight: '800', color: '#fff' },

  info: { flex: 1 },
  brand: { fontSize: ms(10), fontWeight: '800', color: colors.primary, letterSpacing: 0.5, marginBottom: vs(2) },
  name: { fontSize: ms(13), fontWeight: '700', color: colors.text, marginBottom: vs(4) },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  price: { fontSize: ms(15), fontWeight: '800', color: colors.text },
  originalPrice: { fontSize: ms(12), color: colors.placeholder, textDecorationLine: 'line-through' },

  actions: { alignItems: 'center', gap: vs(8) },
  removeBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    backgroundColor: colors.errorLight,
    justifyContent: 'center', alignItems: 'center',
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(10), paddingVertical: vs(6),
  },
  addBtnDisabled: { backgroundColor: colors.border },
  addBtnText: { fontSize: ms(11), fontWeight: '800', color: '#fff' },
  addBtnTextDisabled: { color: colors.placeholder },

  empty: { alignItems: 'center', paddingTop: vs(80), paddingHorizontal: rs(32) },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(18), fontWeight: '800', color: colors.text, marginBottom: vs(6) },
  emptySub: { fontSize: ms(13), color: colors.placeholder, textAlign: 'center', marginBottom: vs(24) },
  shopBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(28), paddingVertical: vs(12),
  },
  shopBtnText: { fontSize: ms(14), fontWeight: '700', color: '#fff' },
});
