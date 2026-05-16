import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Alert, TextInput,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import api from '../services/api';

const FREE_DELIVERY_THRESHOLD = 299;
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
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Dark header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(10) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOUR ORDER</Text>
        <View style={styles.headerRight}>
          <Text style={styles.headerCount}>{cartItems.length} items</Text>
        </View>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🍕</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some delicious items!</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.browseBtnText}>BROWSE MENU</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Free delivery progress */}
            {deliveryFee > 0 && (
              <View style={styles.progressCard}>
                <Ionicons name="bicycle-outline" size={rs(18)} color={colors.primary} />
                <Text style={styles.progressText}>
                  Add <Text style={styles.progressAmount}>₹{(FREE_DELIVERY_THRESHOLD - total).toFixed(0)}</Text> more for FREE delivery
                </Text>
              </View>
            )}

            {/* Cart Items */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>ITEMS IN YOUR ORDER</Text>
              {cartItems.map((item, idx) => (
                <View key={item.id || item._id}>
                  {idx > 0 && <View style={styles.itemDivider} />}
                  <View style={styles.cartItem}>
                    <View style={styles.itemLeft}>
                      <View style={[styles.vegBox, { borderColor: colors.tagVeg }]}>
                        <View style={[styles.vegDot, { backgroundColor: colors.tagVeg }]} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                      </View>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.quantity - 1)}>
                        <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={rs(14)} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={() => updateQty(item.id, item.quantity + 1)}>
                        <Ionicons name="add" size={rs(14)} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Coupon */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>APPLY COUPON</Text>
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
                  <Text style={styles.couponBtnText}>{couponApplied ? 'REMOVE' : 'APPLY'}</Text>
                </TouchableOpacity>
              </View>
              {couponApplied && <Text style={styles.couponSuccess}>✅ Coupon applied! Saved ₹{discount.toFixed(2)}</Text>}
              {!!couponError && <Text style={styles.couponError}>{couponError}</Text>}
            </View>

            {/* Cooking Instructions */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>COOKING INSTRUCTIONS</Text>
              <TextInput
                style={styles.instructionBox}
                placeholder="E.g. Less spicy, extra cheese..."
                placeholderTextColor={colors.placeholder}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Bill */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>BILL DETAILS</Text>
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
              {discount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.success }]}>Coupon Discount</Text>
                  <Text style={[styles.billValue, { color: colors.success, fontWeight: '700' }]}>- ₹{discount.toFixed(2)}</Text>
                </View>
              )}
              <Divider style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.grandTotalLabel}>TO PAY</Text>
                <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            <View style={{ height: vs(100) }} />
          </ScrollView>

          {/* Checkout Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + vs(8) }]}>
            <TouchableOpacity style={styles.checkoutBtn} onPress={proceedToCheckout} activeOpacity={0.88}>
              <View style={styles.checkoutLeft}>
                <Text style={styles.checkoutItemCount}>{cartItems.length} ITEMS</Text>
                <Text style={styles.checkoutTotal}>₹{grandTotal.toFixed(2)}</Text>
              </View>
              <Text style={styles.checkoutBtnText}>PLACE ORDER</Text>
              <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
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
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    paddingBottom: vs(14),
    gap: rs(12),
  },
  backBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: ms(16), fontWeight: '900', color: '#fff', letterSpacing: 1.5, fontFamily: 'Poppins_900Black' },
  headerRight: {},
  headerCount: { fontSize: ms(13), color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(32) },
  emptyEmoji: { fontSize: ms(64), marginBottom: vs(16) },
  emptyTitle: { fontSize: ms(20), fontWeight: '800', color: colors.text, marginBottom: vs(8) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder, marginBottom: vs(24) },
  browseBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: rs(28), paddingVertical: vs(13),
    borderRadius: borderRadius.xs,
  },
  browseBtnText: { color: '#fff', fontWeight: '800', fontSize: ms(14), letterSpacing: 1, fontFamily: 'Poppins_800ExtraBold' },

  scrollContent: { padding: rs(16) },

  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.sm,
    padding: rs(12),
    marginBottom: vs(12),
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  progressText: { fontSize: ms(13), color: colors.text, flex: 1, fontFamily: 'Poppins_400Regular' },
  progressAmount: { fontWeight: '800', color: colors.primary, fontFamily: 'Poppins_800ExtraBold' },

  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: rs(16),
    marginBottom: vs(12),
  },
  sectionTitle: {
    fontSize: ms(11),
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: vs(14),
    fontFamily: 'Poppins_800ExtraBold',
  },

  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: vs(10),
  },
  itemDivider: { height: 1, backgroundColor: colors.divider },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: rs(10) },
  vegBox: {
    width: rs(14), height: rs(14), borderRadius: rs(2),
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  vegDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  itemInfo: { flex: 1 },
  itemName: { fontSize: ms(14), fontWeight: '700', color: colors.text, marginBottom: vs(2), fontFamily: 'Poppins_700Bold' },
  itemPrice: { fontSize: ms(13), color: colors.textSecondary, fontFamily: 'Poppins_400Regular' },

  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  qtyBtn: {
    width: rs(32), height: rs(32), borderRadius: rs(4),
    borderWidth: 1.5, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    minWidth: rs(32), minHeight: rs(32),
  },
  qtyBtnFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  qtyText: { fontSize: ms(15), fontWeight: '800', color: colors.text, minWidth: rs(20), textAlign: 'center', fontFamily: 'Poppins_800ExtraBold' },

  couponRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  couponInput: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.xs, paddingHorizontal: rs(12),
    paddingVertical: vs(10), fontSize: ms(14), color: colors.text,
    backgroundColor: colors.background, fontWeight: '700', letterSpacing: 1,
  },
  couponInputDisabled: { backgroundColor: colors.divider, color: colors.placeholder },
  couponBtn: {
    backgroundColor: colors.primary, paddingHorizontal: rs(16),
    paddingVertical: vs(11), borderRadius: borderRadius.xs,
  },
  removeCouponBtn: { backgroundColor: colors.textSecondary },
  couponBtnText: { color: '#fff', fontWeight: '800', fontSize: ms(13), letterSpacing: 0.5, fontFamily: 'Poppins_800ExtraBold' },
  couponSuccess: { marginTop: vs(8), color: colors.success, fontSize: ms(13), fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  couponError: { marginTop: vs(8), color: colors.error, fontSize: ms(13), fontFamily: 'Poppins_400Regular' },

  instructionBox: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.xs,
    padding: rs(12), fontSize: ms(14), color: colors.text,
    backgroundColor: colors.background, minHeight: vs(75),
  },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10) },
  billLabel: { fontSize: ms(14), color: colors.textSecondary },
  billValue: { fontSize: ms(14), color: colors.text, fontWeight: '600' },
  freeText: { fontSize: ms(14), color: colors.success, fontWeight: '700' },
  billDivider: { marginVertical: vs(10), backgroundColor: colors.divider },
  grandTotalLabel: { fontSize: ms(15), fontWeight: '800', color: colors.text, letterSpacing: 0.5, fontFamily: 'Poppins_800ExtraBold' },
  grandTotalValue: { fontSize: ms(17), fontWeight: '900', color: colors.primary, fontFamily: 'Poppins_900Black' },

  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: rs(16), paddingTop: vs(12),
    borderTopWidth: 1, borderTopColor: colors.divider,
    ...shadows.medium,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xs,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: rs(16),
  },
  checkoutLeft: { flex: 1 },
  checkoutItemCount: { fontSize: ms(11), color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.5, fontFamily: 'Poppins_700Bold' },
  checkoutTotal: { fontSize: ms(16), fontWeight: '900', color: '#fff', fontFamily: 'Poppins_900Black' },
  checkoutBtnText: { fontSize: ms(15), fontWeight: '900', color: '#fff', letterSpacing: 1, marginRight: rs(8), fontFamily: 'Poppins_900Black' },
});

export default CartScreen;
