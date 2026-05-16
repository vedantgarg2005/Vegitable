import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Alert, TextInput,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import api from '../services/api';

const FREE_DELIVERY_THRESHOLD = 199;
const STANDARD_DELIVERY_FEE = 30;
const getDeliveryFee = (subtotal) => subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;

const CartScreen = ({ navigation }) => {
  const { items: cartItems, total, updateQuantity, removeFromCart } = useCart();
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const insets = useSafeAreaInsets();

  const updateQty = (itemId, qty) => {
    if (qty === 0) { removeFromCart(itemId); return; }
    updateQuantity(itemId, qty);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api.post('/promo/validate', { code: couponCode, orderTotal: total });
      setDiscount(res.data.discount || 0);
      setCouponApplied(true);
      setCouponError('');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
      setDiscount(0);
      setCouponApplied(false);
    }
  };

  const removeCoupon = () => { setCouponCode(''); setDiscount(0); setCouponApplied(false); setCouponError(''); };

  const deliveryFee = getDeliveryFee(total);
  const grandTotal = Math.max(0, total + deliveryFee - discount);

  const proceedToCheckout = () => {
    if (cartItems.length === 0) { Alert.alert('Empty Cart', 'Please add items first'); return; }
    navigation.navigate('Checkout', { instructions, discount, couponCode, grandTotal, deliveryFee });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + vs(8) }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <View style={styles.cartCountBadge}>
          <Text style={styles.cartCountText}>{cartItems.length}</Text>
        </View>
      </LinearGradient>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some delicious items!</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Cart Items */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>🛍️ Items ({cartItems.length})</Text>
              {cartItems.map((item, idx) => (
                <View key={item.id || item._id}>
                  {idx > 0 && <View style={styles.itemDivider} />}
                  <View style={styles.cartItem}>
                    <View style={styles.itemLeft}>
                      <View style={styles.vegIndicator}>
                        <View style={[styles.vegDot, { backgroundColor: colors.tagVeg }]} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
                      </View>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.quantity - 1)}>
                        <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={rs(15)} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={() => updateQty(item.id, item.quantity + 1)}>
                        <Ionicons name="add" size={rs(15)} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Cooking Instructions */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>🍳 Cooking Instructions</Text>
              <TextInput
                style={styles.instructionBox}
                placeholder="E.g. Less spicy, extra sauce..."
                placeholderTextColor={colors.placeholder}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Coupon */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>🏷️ Apply Coupon</Text>
              <View style={styles.couponRow}>
                <TextInput
                  style={[styles.couponInput, couponApplied && styles.couponInputDisabled]}
                  placeholder="Enter coupon code"
                  placeholderTextColor={colors.placeholder}
                  value={couponCode}
                  onChangeText={(t) => { setCouponCode(t); setCouponError(''); }}
                  autoCapitalize="characters"
                  editable={!couponApplied}
                />
                <TouchableOpacity
                  style={[styles.couponBtn, couponApplied && styles.removeCouponBtn]}
                  onPress={couponApplied ? removeCoupon : applyCoupon}
                >
                  <Text style={styles.couponBtnText}>{couponApplied ? 'Remove' : 'Apply'}</Text>
                </TouchableOpacity>
              </View>
              {couponApplied && <Text style={styles.couponSuccess}>✅ Saved ₹{discount.toFixed(2)}</Text>}
              {!!couponError && <Text style={styles.couponError}>{couponError}</Text>}
            </View>

            {/* Bill */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>🧾 Bill Details</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>₹{Number(total).toFixed(2)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                {deliveryFee === 0
                  ? <Text style={styles.freeText}>FREE 🎉</Text>
                  : <Text style={styles.billValue}>₹{deliveryFee}</Text>}
              </View>
              {deliveryFee > 0 && (
                <View style={styles.freeDeliveryHint}>
                  <Ionicons name="information-circle-outline" size={rs(14)} color={colors.info} />
                  <Text style={styles.freeDeliveryText}>
                    Add ₹{(FREE_DELIVERY_THRESHOLD - total).toFixed(0)} more for free delivery
                  </Text>
                </View>
              )}
              {discount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.success }]}>Coupon Discount</Text>
                  <Text style={[styles.billValue, { color: colors.success, fontWeight: '700' }]}>- ₹{discount.toFixed(2)}</Text>
                </View>
              )}
              <Divider style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            <View style={{ height: vs(100) }} />
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + vs(8) }]}>
            <TouchableOpacity style={styles.checkoutButton} onPress={proceedToCheckout} activeOpacity={0.88}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.checkoutGradient}
              >
                <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                <View style={styles.checkoutBadge}>
                  <Text style={styles.checkoutBadgeText}>₹{grandTotal.toFixed(2)}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingBottom: vs(14),
  },
  backBtn: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },
  cartCountBadge: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: { color: '#fff', fontWeight: '800', fontSize: ms(14) },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(32) },
  emptyEmoji: { fontSize: ms(64), marginBottom: vs(16) },
  emptyTitle: { fontSize: ms(20), fontWeight: '700', color: colors.text, marginBottom: vs(8) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder, marginBottom: vs(24) },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: rs(28),
    paddingVertical: vs(12),
    borderRadius: borderRadius.full,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: ms(15) },

  scrollContent: { padding: rs(16) },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(16),
    marginBottom: vs(12),
  },
  sectionTitle: { fontSize: ms(15), fontWeight: '700', color: colors.text, marginBottom: vs(12) },

  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(10),
  },
  itemDivider: { height: 1, backgroundColor: colors.divider },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: rs(10) },
  vegIndicator: {
    width: rs(16),
    height: rs(16),
    borderRadius: rs(2),
    borderWidth: 1.5,
    borderColor: colors.tagVeg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: { width: rs(7), height: rs(7), borderRadius: rs(4) },
  itemInfo: { flex: 1 },
  itemName: { fontSize: ms(14), fontWeight: '600', color: colors.text, marginBottom: vs(2) },
  itemPrice: { fontSize: ms(13), color: colors.textSecondary },

  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  qtyBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  quantity: { fontSize: ms(15), fontWeight: '700', color: colors.text, minWidth: rs(20), textAlign: 'center' },

  instructionBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: rs(12),
    fontSize: ms(14),
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: vs(75),
  },

  couponRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  couponInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(12),
    paddingVertical: vs(10),
    fontSize: ms(14),
    color: colors.text,
    backgroundColor: colors.background,
  },
  couponInputDisabled: { backgroundColor: colors.divider, color: colors.placeholder },
  couponBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: rs(18),
    paddingVertical: vs(11),
    borderRadius: borderRadius.sm,
  },
  removeCouponBtn: { backgroundColor: colors.placeholder },
  couponBtnText: { color: '#fff', fontWeight: '700', fontSize: ms(14) },
  couponSuccess: { marginTop: vs(8), color: colors.success, fontSize: ms(13), fontWeight: '600' },
  couponError: { marginTop: vs(8), color: colors.error, fontSize: ms(13) },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(8) },
  billLabel: { fontSize: ms(14), color: colors.textSecondary },
  billValue: { fontSize: ms(14), color: colors.text },
  freeText: { fontSize: ms(14), color: colors.success, fontWeight: '700' },
  freeDeliveryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    backgroundColor: colors.infoLight,
    padding: rs(8),
    borderRadius: borderRadius.xs,
    marginBottom: vs(8),
  },
  freeDeliveryText: { fontSize: ms(12), color: colors.info, flex: 1 },
  billDivider: { marginVertical: vs(10), backgroundColor: colors.divider },
  grandTotalLabel: { fontSize: ms(16), fontWeight: '700', color: colors.text },
  grandTotalValue: { fontSize: ms(16), fontWeight: '800', color: colors.primary },

  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: rs(16),
    paddingTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    ...shadows.medium,
  },
  checkoutButton: { borderRadius: borderRadius.md, overflow: 'hidden' },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(15),
    paddingHorizontal: rs(20),
  },
  checkoutText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
  checkoutBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: rs(12),
    paddingVertical: vs(4),
    borderRadius: borderRadius.full,
  },
  checkoutBadgeText: { color: '#fff', fontWeight: '800', fontSize: ms(14) },
});

export default CartScreen;
