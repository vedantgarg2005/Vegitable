import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, shadows, borderRadius, ms, rs, vs } from '../../utils/theme';
import { API_BASE_URL } from '../../services/api';
import { API_BASE_URL as BASE_URL } from '../../utils/constants';

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function MenuItemDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { t, getItemName } = useLanguage();
  const insets = useSafeAreaInsets();
  const [storeOpen, setStoreOpen] = useState(true);
  const [nextOpenTime, setNextOpenTime] = useState(null);
  const isOutOfStock = item.availability?.isAvailable === false;

  useEffect(() => {
    fetch(`${BASE_URL}/admin/store-status`)
      .then(r => r.json())
      .then(d => {
        setStoreOpen(d.isOpen ?? true);
        if (d.nextOpenTime) setNextOpenTime(d.nextOpenTime);
      })
      .catch(() => {});
  }, []);

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
        <View style={[styles.heroEmojiWrap, isOutOfStock && { opacity: 0.45 }]}>
          {item.image && item.image.startsWith('/uploads') ? (
            <Image source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <Text style={styles.heroEmoji}>{item.image || '🏅'}</Text>
          )}
        </View>
        {isOutOfStock && (
          <View style={styles.outOfStockHeroBadge}>
            <Ionicons name="close-circle" size={rs(14)} color="#fff" />
            <Text style={styles.outOfStockHeroText}>{t.outOfStockLabel}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            {item.brand && <Text style={styles.brandLabel}>{item.brand.toUpperCase()}</Text>}
            <Text style={styles.itemName}>{getItemName(item)}</Text>
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
          <View>
            <Text style={styles.price}>₹{item.price}</Text>
            {Number(item.marketPrice) > Number(item.price) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: vs(2) }}>
                <Text style={styles.mrpText}>MRP ₹{item.marketPrice}</Text>
                <Text style={styles.discountText}>
                  {Math.round(((item.marketPrice - item.price) / item.marketPrice) * 100)}% OFF
                </Text>
              </View>
            )}
          </View>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* Quantity selector */}
        <View style={[styles.quantityCard, shadows.small]}>
          <Text style={styles.quantityLabel}>{t.quantity}</Text>
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
        {isOutOfStock ? (
          <View style={styles.outOfStockBtn}>
            <Ionicons name="close-circle-outline" size={rs(18)} color="#EF4444" />
            <Text style={styles.outOfStockBtnText}>{t.currentlyOutOfStock}</Text>
          </View>
        ) : storeOpen ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart} activeOpacity={0.88}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.addBtnGradient}
            >
              <Text style={styles.addBtnText}>{t.addToCartLabel}</Text>
              <View style={styles.addBtnBadge}>
                <Text style={styles.addBtnBadgeText}>₹{(item.price * quantity).toFixed(2)}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.closedBtn}>
            <Text style={styles.closedBtnText}>
              {nextOpenTime ? `${t.opensAt}: ${formatTime12(nextOpenTime)}` : t.storeCurrentlyClosed}
            </Text>
          </View>
        )}
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
  brandLabel: { fontSize: ms(11), fontWeight: '800', color: colors.primary, letterSpacing: 0.5, marginRight: rs(6) },
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
  mrpText: { fontSize: ms(13), color: colors.placeholder, textDecorationLine: 'line-through' },
  discountText: { fontSize: ms(12), fontWeight: '800', color: '#E53935' },
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
  closedBtn: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
    paddingVertical: vs(15),
    alignItems: 'center',
  },
  closedBtnText: { color: colors.textSecondary, fontSize: ms(15), fontWeight: '700' },
  outOfStockHeroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: '#EF4444',
    borderRadius: borderRadius.full,
    paddingHorizontal: rs(12), paddingVertical: vs(5),
    marginTop: vs(10),
  },
  outOfStockHeroText: { color: '#fff', fontSize: ms(12), fontWeight: '700' },
  outOfStockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    borderRadius: borderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5, borderColor: '#EF4444',
    paddingVertical: vs(15),
  },
  outOfStockBtnText: { color: '#EF4444', fontSize: ms(15), fontWeight: '700' },
});
