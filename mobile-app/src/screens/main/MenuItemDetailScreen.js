import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { colors, spacing, shadows, borderRadius, ms, rs, vs } from '../../utils/theme';
import { API_BASE_URL } from '../../services/api';

export default function MenuItemDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();

  const increment = useCallback(() => setQuantity(q => q + 1), []);
  const decrement = useCallback(() => setQuantity(q => Math.max(1, q - 1)), []);

  const handleAddToCart = useCallback(() => {
    addToCart({ ...item, quantity });
    navigation.goBack();
  }, [addToCart, item, quantity, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero image / emoji area */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + vs(8) }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroEmojiWrap}>
          {item.image && item.image.startsWith('/uploads') ? (
            <Image source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <Text style={styles.heroEmoji}>{item.image || '🍽️'}</Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            {item.isVeg !== undefined && (
              <View style={[styles.vegBadge, { borderColor: item.isVeg ? colors.tagVeg : colors.tagNonVeg }]}>
                <View style={[styles.vegDot, { backgroundColor: item.isVeg ? colors.tagVeg : colors.tagNonVeg }]} />
              </View>
            )}
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          {item.rating != null && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={rs(13)} color={colors.warning} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>

        <Text style={styles.description}>{item.description}</Text>

        {/* Price & category */}
        <View style={styles.metaRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* Quantity selector */}
        <View style={[styles.quantityCard, shadows.small]}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity style={styles.qtyBtn} onPress={decrement} activeOpacity={0.8}>
              <Ionicons name={quantity === 1 ? 'trash-outline' : 'remove'} size={rs(18)} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={increment} activeOpacity={0.8}>
              <Ionicons name="add" size={rs(18)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: vs(100) }} />
      </ScrollView>

      {/* Add to cart footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + vs(12) }]}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} activeOpacity={0.88}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.addBtnGradient}
          >
            <Text style={styles.addBtnText}>Add to Cart</Text>
            <View style={styles.addBtnBadge}>
              <Text style={styles.addBtnBadgeText}>₹{(item.price * quantity).toFixed(2)}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: vs(24),
    borderBottomLeftRadius: rs(32),
    borderBottomRightRadius: rs(32),
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(16),
  },
  heroEmojiWrap: {
    width: rs(120), height: rs(120), borderRadius: rs(60),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  heroEmoji: { fontSize: ms(64) },
  heroImage: { width: rs(120), height: rs(120), borderRadius: rs(60) },

  scrollContent: { padding: spacing.md },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(10) },
  titleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: rs(8) },
  vegBadge: {
    width: rs(18), height: rs(18), borderRadius: rs(3),
    borderWidth: 1.5, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  vegDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  itemName: { fontSize: ms(22), fontWeight: '800', color: colors.text, flex: 1 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: rs(8), paddingVertical: vs(4),
    borderRadius: borderRadius.full, gap: rs(3),
  },
  ratingText: { fontSize: ms(13), fontWeight: '700', color: colors.text },

  description: { fontSize: ms(15), color: colors.textSecondary, lineHeight: ms(23), marginBottom: vs(16) },

  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(20) },
  price: { fontSize: ms(26), fontWeight: '800', color: colors.primary },
  categoryBadge: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: rs(12), paddingVertical: vs(5),
    borderRadius: borderRadius.full,
  },
  categoryText: { fontSize: ms(13), fontWeight: '600', color: colors.primary },

  quantityCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(16),
  },
  quantityLabel: { fontSize: ms(15), fontWeight: '700', color: colors.text },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: rs(16) },
  qtyBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    borderWidth: 1.5, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  quantityText: { fontSize: ms(18), fontWeight: '800', color: colors.text, minWidth: rs(24), textAlign: 'center' },

  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: vs(12),
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  addBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  addBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: vs(15), paddingHorizontal: rs(20),
  },
  addBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
  addBtnBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: rs(12), paddingVertical: vs(4),
    borderRadius: borderRadius.full,
  },
  addBtnBadgeText: { color: '#fff', fontWeight: '800', fontSize: ms(14) },
});
