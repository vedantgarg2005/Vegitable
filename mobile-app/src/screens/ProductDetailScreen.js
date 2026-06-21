import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, Image, Dimensions,
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadows, borderRadius, ms, rs, vs, spacing } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';

const { width: W } = Dimensions.get('window');

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ProductDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(item.variants?.[0]?.label || null);
  const [storeOpen, setStoreOpen] = useState(true);
  const [nextOpenTime, setNextOpenTime] = useState(null);

  const { addToCart } = useCart();
  const { t, getItemName } = useLanguage();
  const insets = useSafeAreaInsets();

  const isOutOfStock = item.availability?.isAvailable === false;
  const selectedVariant = item.variants?.find(v => v.label === selectedSize);
  const displayPrice = Number(selectedVariant?.price ?? item.price ?? 0);
  const mrp = Number(selectedVariant?.marketPrice || item.marketPrice || 0);
  const discount = mrp > displayPrice ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/store-status`)
      .then(r => r.json())
      .then(d => {
        setStoreOpen(d.isOpen ?? true);
        if (d.nextOpenTime) setNextOpenTime(d.nextOpenTime);
      })
      .catch(() => {});
  }, []);

  const handleAddToCart = useCallback(() => {
    for (let i = 0; i < quantity; i++) {
      addToCart(selectedVariant ? { ...item, price: selectedVariant.price, selectedVariant } : item);
    }
    navigation.goBack();
  }, [addToCart, item, quantity, selectedVariant, navigation]);

  const imageUri = item.image?.startsWith('/uploads')
    ? `${API_BASE_URL.replace('/api', '')}${item.image}`
    : null;

return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight, colors.primarySurface]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + vs(8) }]}
      >
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroImageWrap, isOutOfStock && { opacity: 0.45 }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="contain" />
          ) : (
            <Text style={styles.heroEmoji}>{item.image || '🏅'}</Text>
          )}
        </View>

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
        {isOutOfStock && (
          <View style={[styles.discountBadge, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.discountText}>OUT OF STOCK</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Brand + Name + Rating */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              {item.brand && <Text style={styles.brand}>{item.brand.toUpperCase()}</Text>}
              <Text style={styles.name}>{getItemName(item)}</Text>
            </View>
            {item.ratings?.average > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={rs(13)} color={colors.warning} />
                <Text style={styles.ratingText}>{item.ratings.average.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>({item.ratings.count})</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{displayPrice}</Text>
            {mrp > displayPrice && (
              <Text style={styles.originalPrice}>₹{mrp}</Text>
            )}
            {discount > 0 && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>{discount}% OFF · Save ₹{mrp - displayPrice}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}

        {/* Variant / Pack size picker (replaces size/color for grocery) */}
        {item.variants?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pack Size</Text>
            <View style={styles.sizeRow}>
              {item.variants.map(v => {
                const vMrp = Number(v.marketPrice || 0);
                const vPrice = Number(v.price || 0);
                const vDisc = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
                return (
                  <TouchableOpacity
                    key={v.label}
                    style={[styles.sizeChip, selectedSize === v.label && styles.sizeChipActive]}
                    onPress={() => setSelectedSize(v.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sizeChipText, selectedSize === v.label && styles.sizeChipTextActive]}>
                      {v.label}
                    </Text>
                    <Text style={[styles.sizeChipText, selectedSize === v.label && styles.sizeChipTextActive, { fontSize: ms(11) }]}>
                      ₹{v.price}
                    </Text>
                    {vDisc > 0 && (
                      <Text style={[styles.sizeChipText, { fontSize: ms(9), color: colors.tagSale, fontWeight: '800' }]}>
                        {vDisc}% OFF
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Quantity */}
        <View style={[styles.section, styles.qtyCard, shadows.small]}>
          <Text style={styles.sectionLabel}>{t.quantity}</Text>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
              activeOpacity={0.8}
            >
              <Ionicons name={quantity === 1 ? 'trash-outline' : 'remove'} size={rs(18)} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnFilled]}
              onPress={() => setQuantity(q => q + 1)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={rs(18)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: vs(100) }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + vs(12) }]}>
        {isOutOfStock ? (
          <View style={styles.outOfStockBtn}>
            <Ionicons name="close-circle-outline" size={rs(18)} color="#EF4444" />
            <Text style={styles.outOfStockText}>{t.currentlyOutOfStock}</Text>
          </View>
        ) : !storeOpen ? (
          <View style={styles.closedBtn}>
            <Text style={styles.closedText}>
              {nextOpenTime ? `${t.opensAt}: ${formatTime12(nextOpenTime)}` : t.storeCurrentlyClosed}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAddToCart}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.addBtnGradient}
            >
              <Text style={styles.addBtnText}>{t.addToCartLabel}</Text>
              <View style={styles.addBtnBadge}>
                <Text style={styles.addBtnBadgeText}>₹{(displayPrice * quantity).toFixed(0)}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  hero: {
    paddingHorizontal: rs(16),
    paddingBottom: vs(24),
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignSelf: 'stretch', marginBottom: vs(12),
  },
  iconBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroImageWrap: {
    width: W * 0.55, height: W * 0.55,
    justifyContent: 'center', alignItems: 'center',
  },
  heroImage: { width: '100%', height: '100%' },
  heroEmoji: { fontSize: ms(100) },
  discountBadge: {
    position: 'absolute', top: vs(60), right: rs(16),
    backgroundColor: colors.tagSale,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8), paddingVertical: vs(3),
  },
  discountText: { fontSize: ms(11), fontWeight: '800', color: '#fff' },

  scroll: { paddingHorizontal: rs(16), paddingTop: vs(16) },

  titleSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(16),
    marginBottom: vs(12),
    ...shadows.small,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: vs(10) },
  brand: { fontSize: ms(11), fontWeight: '800', color: colors.primary, letterSpacing: 0.8, marginBottom: vs(2) },
  name: { fontSize: ms(20), fontWeight: '800', color: colors.text, lineHeight: ms(26) },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: colors.warningLight,
    paddingHorizontal: rs(8), paddingVertical: vs(4),
    borderRadius: borderRadius.full, marginLeft: rs(8), alignSelf: 'flex-start',
  },
  ratingText: { fontSize: ms(12), fontWeight: '700', color: colors.text },
  ratingCount: { fontSize: ms(11), color: colors.placeholder },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  price: { fontSize: ms(26), fontWeight: '800', color: colors.primary },
  originalPrice: { fontSize: ms(16), color: colors.placeholder, textDecorationLine: 'line-through' },
  saveBadge: {
    backgroundColor: '#E8F5E9', borderRadius: borderRadius.xs,
    paddingHorizontal: rs(6), paddingVertical: vs(2),
  },
  saveText: { fontSize: ms(11), fontWeight: '700', color: colors.success },

  description: {
    fontSize: ms(14), color: colors.textSecondary, lineHeight: ms(22),
    marginBottom: vs(12), paddingHorizontal: rs(4),
  },

  section: { marginBottom: vs(12) },
  sectionLabel: { fontSize: ms(13), fontWeight: '700', color: colors.text, marginBottom: vs(8) },
  sectionValue: { fontWeight: '600', color: colors.primary },
  required: { color: colors.error },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  colorChip: {
    paddingHorizontal: rs(14), paddingVertical: vs(7),
    borderRadius: borderRadius.full,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  colorChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  colorChipText: { fontSize: ms(12), fontWeight: '600', color: colors.textSecondary },
  colorChipTextActive: { color: colors.primary },

  sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  sizeChip: {
    width: rs(52), height: rs(52), borderRadius: borderRadius.sm,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  sizeChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  sizeChipText: { fontSize: ms(13), fontWeight: '700', color: colors.textSecondary },
  sizeChipTextActive: { color: colors.primary },

  specsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(14),
  },
  specRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: vs(6),
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  specKey: { fontSize: ms(13), color: colors.placeholder, fontWeight: '600' },
  specVal: { fontSize: ms(13), color: colors.text, fontWeight: '700' },

  qtyCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(14),
  },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: rs(16) },
  qtyBtn: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    borderWidth: 1.5, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  qtyText: { fontSize: ms(18), fontWeight: '800', color: colors.text, minWidth: rs(24), textAlign: 'center' },

  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: rs(16),
    paddingTop: vs(12),
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  addBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  addBtnDisabled: { opacity: 0.6 },
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
    borderRadius: borderRadius.md, backgroundColor: colors.border,
    paddingVertical: vs(15), alignItems: 'center',
  },
  closedText: { color: colors.textSecondary, fontSize: ms(15), fontWeight: '700' },
  outOfStockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    borderRadius: borderRadius.md, backgroundColor: '#FEF2F2',
    borderWidth: 1.5, borderColor: '#EF4444', paddingVertical: vs(15),
  },
  outOfStockText: { color: '#EF4444', fontSize: ms(15), fontWeight: '700' },
});
