import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';
import { isOutOfStock } from './FoodCard';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ItemModal({ item, onClose, isOpen = true, nextOpenTime = null }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [itemQty, setItemQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(item?.variants?.[0] ?? null);

  if (!item) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={rs(18)} color={colors.text} />
          </TouchableOpacity>

          {/* Image + name */}
          <View style={styles.topRow}>
            {item.image && item.image.startsWith('/uploads') ? (
              <Image
                source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }}
                style={styles.thumb}
                contentFit="contain"
                transition={150}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Text style={styles.bigEmoji}>{item.image || '🥦'}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Variants */}
          {item.variants?.length > 0 ? (
            <View style={styles.variantList}>
              {item.variants.map((v, idx) => {
                const isSelected = selectedVariant?.label === v.label;
                const mrp = Number(v.marketPrice || 0);
                const disc = mrp > v.price ? Math.round(((mrp - v.price) / mrp) * 100) : 0;
                return (
                  <TouchableOpacity
                    key={v.label}
                    style={[styles.variantRow, isSelected && styles.variantRowActive, idx < item.variants.length - 1 && styles.variantRowBorder]}
                    onPress={() => setSelectedVariant(v)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radio, isSelected && styles.radioActive]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.variantLabel, isSelected && styles.variantLabelActive]}>{v.label}</Text>
                      {disc > 0 && (
                        <View style={styles.discBadge}>
                          <Text style={styles.discText}>{disc}% OFF</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                        {mrp > v.price && <Text style={styles.mrp}>₹{mrp}</Text>}
                        <Text style={[styles.price, isSelected && styles.priceActive]}>₹{v.price}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.singlePrice}>
              <Text style={styles.singlePriceText}>₹{item.price}</Text>
              {Number(item.marketPrice) > Number(item.price) && (
                <Text style={styles.singleMrp}>MRP ₹{item.marketPrice}</Text>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            {isOutOfStock(item) ? (
              <View style={styles.outOfStockBtn}>
                <Ionicons name="close-circle-outline" size={rs(18)} color="#EF4444" />
                <Text style={styles.outOfStockText}>{t.currentlyOutOfStock}</Text>
              </View>
            ) : (
              <>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setItemQty(q => Math.max(1, q - 1))}>
                    <Ionicons name="remove" size={rs(16)} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{itemQty}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={() => setItemQty(q => q + 1)}>
                    <Ionicons name="add" size={rs(16)} color="#fff" />
                  </TouchableOpacity>
                </View>
                {isOpen ? (
                  <TouchableOpacity
                    style={styles.addBtn}
                    activeOpacity={0.88}
                    onPress={() => {
                      const cartItem = selectedVariant
                        ? { ...item, price: selectedVariant.price, selectedVariant }
                        : item;
                      for (let i = 0; i < itemQty; i++) addToCart(cartItem);
                      onClose();
                    }}
                  >
                    <Text style={styles.addBtnText}>
                      {t.addToCartLabel}  ₹{((selectedVariant?.price ?? item.price) * itemQty).toFixed(0)}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.closedBtn}>
                    <Text style={styles.closedText}>
                      {nextOpenTime ? `${t.currentlyClosed}: ${formatTime12(nextOpenTime)}` : t.currentlyClosed}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20),
    paddingBottom: vs(28), overflow: 'hidden',
  },
  handle: {
    width: rs(36), height: vs(4), borderRadius: rs(2),
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: vs(10), marginBottom: vs(4),
  },
  closeBtn: {
    position: 'absolute', top: vs(12), right: rs(16),
    width: rs(30), height: rs(30), borderRadius: rs(15),
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(14),
    paddingHorizontal: rs(20), paddingTop: vs(14), paddingBottom: vs(10),
  },
  thumb: {
    width: rs(80), height: rs(80), borderRadius: borderRadius.md,
    backgroundColor: '#F7F9F2', flexShrink: 0,
  },
  thumbPlaceholder: {
    width: rs(80), height: rs(80), borderRadius: borderRadius.md,
    backgroundColor: '#F7F9F2', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  bigEmoji: { fontSize: ms(44) },
  name: { fontSize: ms(16), fontWeight: '800', color: colors.text, marginBottom: vs(4) },
  divider: { height: 1, backgroundColor: colors.divider, marginHorizontal: rs(20), marginBottom: vs(4) },
  variantList: { paddingHorizontal: rs(20) },
  variantRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), paddingVertical: vs(13) },
  variantRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  variantRowActive: { backgroundColor: 'transparent' },
  radio: {
    width: rs(20), height: rs(20), borderRadius: rs(10),
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: colors.primary },
  variantLabel: { fontSize: ms(14), fontWeight: '700', color: colors.text },
  variantLabelActive: { color: colors.primary },
  discBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FFF3E0',
    borderRadius: borderRadius.xs, paddingHorizontal: rs(6), paddingVertical: vs(2), marginTop: vs(3),
  },
  discText: { fontSize: ms(10), fontWeight: '800', color: '#E65100' },
  mrp: { fontSize: ms(11), color: colors.placeholder, textDecorationLine: 'line-through' },
  price: { fontSize: ms(15), fontWeight: '800', color: colors.text },
  priceActive: { color: colors.primary },
  singlePrice: { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingHorizontal: rs(20), paddingVertical: vs(10) },
  singlePriceText: { fontSize: ms(18), fontWeight: '900', color: colors.text },
  singleMrp: { fontSize: ms(13), color: colors.placeholder, textDecorationLine: 'line-through' },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(20), paddingTop: vs(12), gap: rs(12),
    borderTopWidth: 1, borderTopColor: colors.divider, marginTop: vs(4),
  },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs, overflow: 'hidden',
  },
  qtyBtn: { width: rs(36), height: rs(36), justifyContent: 'center', alignItems: 'center' },
  qtyBtnFilled: { backgroundColor: colors.primary },
  qtyText: { fontSize: ms(15), fontWeight: '800', color: colors.primary, paddingHorizontal: rs(14) },
  addBtn: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: borderRadius.sm, paddingVertical: vs(13), alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '800' },
  closedBtn: {
    flex: 1, backgroundColor: colors.border,
    borderRadius: borderRadius.sm, paddingVertical: vs(12), alignItems: 'center',
  },
  closedText: { color: colors.textSecondary, fontSize: ms(13), fontWeight: '700' },
  outOfStockBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    borderRadius: borderRadius.sm, backgroundColor: '#FEF2F2',
    borderWidth: 1.5, borderColor: '#EF4444', paddingVertical: vs(12),
  },
  outOfStockText: { color: '#EF4444', fontSize: ms(14), fontWeight: '700' },
});
