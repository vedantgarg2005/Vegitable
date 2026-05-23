import React, { useState, useEffect, useRef } from 'react';
import {
  View, ScrollView, StyleSheet, Alert, TextInput,
  TouchableOpacity, StatusBar, Modal, FlatList, Image,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import api, { menuAPI } from '../services/api';
import { useOutlet } from '../context/OutletContext';
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE, getDeliveryFee, API_BASE_URL, PICKUP_ADDRESS } from '../utils/constants';

const CartScreen = ({ navigation, route }) => {
  const { items: cartItems, total, updateQuantity, removeFromCart, addToCart } = useCart();
  const { selectedOutlet } = useOutlet();
  const [orderType, setOrderType] = useState(route?.params?.orderType || 'delivery');
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);

  useEffect(() => {
    if (!deliveryAvailable && orderType === 'delivery') setOrderType('pickup');
  }, [deliveryAvailable]);
  const [offersVisible, setOffersVisible] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [modalCode, setModalCode] = useState('');
  const [modalError, setModalError] = useState('');
  const [showInstruction, setShowInstruction] = useState(false);
  const instructionRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (selectedOutlet) {
      setDeliveryAvailable(selectedOutlet.deliveryEnabled ?? true);
    } else {
      fetch(`${API_BASE_URL}/admin/delivery-status`)
        .then(r => r.json())
        .then(d => setDeliveryAvailable(d.deliveryEnabled ?? true))
        .catch(() => {});
    }
  }, [selectedOutlet]);

  useEffect(() => {
    menuAPI.getItems()
      .then(res => setSuggestedItems(res.data || []))
      .catch(() => {});
  }, []);

  const openOffers = async () => {
    setModalCode('');
    setModalError('');
    try {
      const res = await api.get('/promo/active');
      setAvailableCoupons(res.data || []);
    } catch { setAvailableCoupons([]); }
    setOffersVisible(true);
  };

  const applyFromModal = async (code) => {
    const codeToApply = (code || modalCode).trim();
    if (!codeToApply) return;
    try {
      const res = await api.post('/promo/validate', { code: codeToApply, orderTotal: total });
      setDiscount(res.data.discount || 0);
      setCouponApplied(true);
      setCouponError('');
      setCouponCode(codeToApply);
      setOffersVisible(false);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Invalid or expired coupon');
    }
  };

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

  const deliveryFee = orderType === 'pickup' ? 0 : getDeliveryFee(total);
  const grandTotal = Math.max(0, total + deliveryFee - discount);
  const hasOutOfStockItems = cartItems.some(i => i.availability?.isAvailable === false);

  const proceedToCheckout = () => {
    if (cartItems.length === 0) { Alert.alert('Empty Cart', 'Please add items first'); return; }
    if (hasOutOfStockItems) { Alert.alert('Items Unavailable', 'Please remove out-of-stock items before placing your order.'); return; }
    navigation.navigate('Checkout', { instructions, discount, couponCode, grandTotal, deliveryFee, orderType });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} />

      {/* Dark header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(10) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>YOUR ORDER</Text>
          <Text style={styles.headerCount}>{cartItems.length} items</Text>
        </View>
        <View style={styles.orderTypeToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === 'delivery' && styles.toggleBtnActive, !deliveryAvailable && styles.toggleBtnDisabled]}
            onPress={() => deliveryAvailable && setOrderType('delivery')}
            activeOpacity={deliveryAvailable ? 0.8 : 1}
          >
            <Ionicons name="bicycle-outline" size={rs(14)} color={orderType === 'delivery' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.toggleBtnText, orderType === 'delivery' && styles.toggleBtnTextActive]}>Delivery</Text>
              {!deliveryAvailable && <Text style={styles.toggleBtnUnavailable}>Unavailable</Text>}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === 'pickup' && styles.toggleBtnActive]}
            onPress={() => setOrderType('pickup')}
          >
            <Ionicons name="bag-handle-outline" size={rs(14)} color={orderType === 'pickup' ? '#fff' : 'rgba(255,255,255,0.6)'} />
            <Text style={[styles.toggleBtnText, orderType === 'pickup' && styles.toggleBtnTextActive]}>Pickup</Text>
          </TouchableOpacity>
        </View>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🌿</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some delicious items!</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.browseBtnText}>BROWSE MENU</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Delivery unavailable banner */}
            {orderType === 'delivery' && !deliveryAvailable && (
              <View style={styles.deliveryBanner}>
                <Ionicons name="warning" size={rs(18)} color="#fff" />
                <Text style={styles.deliveryBannerText}>
                  Delivery is currently unavailable. You can still place a Takeaway order.
                </Text>
              </View>
            )}

            {/* Free delivery progress bar */}
            {deliveryFee > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <Ionicons name="bicycle-outline" size={rs(16)} color={colors.primary} />
                  <Text style={styles.progressText}>
                    Add <Text style={styles.progressAmount}>₹{(FREE_DELIVERY_THRESHOLD - total).toFixed(0)}</Text> more for FREE delivery
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min((total / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }]} />
                </View>
              </View>
            )}

            {/* Savings banner */}
            {discount > 0 && (
              <View style={styles.savingsBanner}>
                <Ionicons name="pricetag" size={rs(14)} color={colors.success} />
                <Text style={styles.savingsText}>You're saving <Text style={styles.savingsAmount}>₹{discount.toFixed(0)}</Text> on this order 🎉</Text>
              </View>
            )}

            {/* Cart Items */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>ITEMS IN YOUR ORDER</Text>
              {cartItems.map((item, idx) => (
                <View key={item.id || item._id}>
                  {idx > 0 && <View style={styles.itemDivider} />}
                  <View style={[styles.cartItem, item.availability?.isAvailable === false && { opacity: 0.5 }]}>
                    <View style={styles.itemLeft}>
                      <View style={[styles.vegBox, { borderColor: colors.tagVeg }]}>
                        <View style={[styles.vegDot, { backgroundColor: colors.tagVeg }]} />
                      </View>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.quantity - 1)}>
                        <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={rs(14)} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={() => updateQty(item.id, item.quantity + 1)}>
                        <Ionicons name="add" size={rs(14)} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                  </View>
                  {item.availability?.isAvailable === false && (
                    <View style={styles.unavailableBanner}>
                      <Ionicons name="alert-circle" size={rs(13)} color="#EF4444" />
                      <Text style={styles.unavailableBannerText}>This item is not available right now</Text>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                        <Text style={styles.unavailableRemoveText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}

              {/* Add more items | Instructions — side by side */}
              <View style={styles.itemDivider} />
              <View style={styles.cartBottomRow}>
                <TouchableOpacity style={styles.addMoreBtn} onPress={() => navigation.navigate('Menu')}>
                  <Ionicons name="add-circle-outline" size={rs(15)} color={colors.primary} />
                  <Text style={styles.addMoreBtnText}>ADD MORE</Text>
                </TouchableOpacity>
                <View style={styles.cartBottomDivider} />
                <TouchableOpacity style={styles.addInstructionBtn} onPress={() => setShowInstruction(v => !v)}>
                  <Ionicons name="create-outline" size={rs(15)} color={colors.textSecondary} />
                  <Text style={styles.addInstructionBtnText}>Add instruction</Text>
                </TouchableOpacity>
              </View>
              {showInstruction && (
                <TextInput
                  ref={instructionRef}
                  style={styles.instructionInlineInput}
                  placeholder="E.g. less spicy, extra sauce..."
                  placeholderTextColor={colors.placeholder}
                  value={instructions}
                  onChangeText={setInstructions}
                  autoFocus
                />
              )}
            </View>

            {/* Craving More */}
            {suggestedItems.filter(i => !cartItems.find(c => c.id === (i._id || i.id)) && i.availability?.isAvailable !== false).length > 0 && (
              <View style={[styles.sectionCard, shadows.small]}>
                <Text style={styles.sectionTitle}>CRAVING MORE? 🤤</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestList}>
                  {suggestedItems
                    .filter(i => !cartItems.find(c => c.id === (i._id || i.id)) && i.availability?.isAvailable !== false)
                    .slice(0, 10)
                    .map(item => {
                      const cartItem = cartItems.find(c => c.id === (item._id || item.id));
                      return (
                        <View key={item._id || item.id} style={[styles.suggestCard, shadows.small]}>
                          {item.image && item.image.startsWith('/uploads') ? (
                            <Image
                              source={{ uri: `${API_BASE_URL.replace('/api', '')}${item.image}` }}
                              style={styles.suggestImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.suggestEmoji}>{item.image || '🍕'}</Text>
                          )}
                          <Text style={styles.suggestName} numberOfLines={2}>{item.name}</Text>
                          <Text style={styles.suggestPrice}>₹{item.price}</Text>
                          {cartItem ? (
                            <View style={styles.suggestStepper}>
                              <TouchableOpacity onPress={() => updateQty(cartItem.id, cartItem.quantity - 1)}>
                                <Ionicons name="remove" size={rs(14)} color={colors.primary} />
                              </TouchableOpacity>
                              <Text style={styles.suggestStepperCount}>{cartItem.quantity}</Text>
                              <TouchableOpacity onPress={() => addToCart(item)}>
                                <Ionicons name="add" size={rs(14)} color={colors.primary} />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity style={styles.suggestAddBtn} onPress={() => addToCart(item)}>
                              <Text style={styles.suggestAddBtnText}>ADD</Text>
                              <Ionicons name="add" size={rs(12)} color={colors.primary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                </ScrollView>
              </View>
            )}

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
              {!couponApplied && (
                <TouchableOpacity style={styles.viewOffersBtn} onPress={openOffers}>
                  <Ionicons name="pricetag-outline" size={rs(14)} color={colors.primary} />
                  <Text style={styles.viewOffersBtnText}>VIEW ALL OFFERS</Text>
                  <Ionicons name="chevron-forward" size={rs(14)} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>


            {/* Pickup address card */}
            {orderType === 'pickup' && (
              <View style={[styles.sectionCard, styles.pickupCard, shadows.small]}>
                <View style={styles.pickupHeader}>
                  <Ionicons name="location" size={rs(18)} color={colors.primary} />
                  <Text style={styles.pickupSectionTitle}>PICKUP FROM</Text>
                </View>
                <Text style={styles.pickupName}>{PICKUP_ADDRESS.name}</Text>
                <Text style={styles.pickupLine}>{PICKUP_ADDRESS.line1}</Text>
                <Text style={styles.pickupLine}>{PICKUP_ADDRESS.line2}</Text>
                <Text style={styles.pickupLandmark}>📍 {PICKUP_ADDRESS.landmark}</Text>
                <View style={styles.pickupPhoneRow}>
                  <Ionicons name="call-outline" size={rs(13)} color={colors.textSecondary} />
                  <Text style={styles.pickupPhone}>{PICKUP_ADDRESS.phone}</Text>
                </View>
              </View>
            )}

            {/* Bill */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>BILL DETAILS</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>₹{Number(total).toFixed(2)}</Text>
              </View>
              {orderType === 'delivery' && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  {deliveryFee === 0
                    ? <Text style={styles.freeText}>FREE 🎉</Text>
                    : <Text style={styles.billValue}>₹{deliveryFee}</Text>}
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
                <Text style={styles.grandTotalLabel}>TO PAY</Text>
                <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            <View style={{ height: vs(20) }} />
          </ScrollView>

          {/* Checkout Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + vs(8) }]}>
            {hasOutOfStockItems && (
              <View style={styles.outOfStockFooterBanner}>
                <Ionicons name="alert-circle" size={rs(14)} color="#EF4444" />
                <Text style={styles.outOfStockFooterText}>Remove unavailable items to place order</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.checkoutBtn, (orderType === 'delivery' && !deliveryAvailable || hasOutOfStockItems) && styles.checkoutBtnDisabled]}
              onPress={proceedToCheckout}
              activeOpacity={0.88}
              disabled={orderType === 'delivery' && !deliveryAvailable}
            >
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
      {/* Offers Modal */}
      <Modal visible={offersVisible} animationType="slide" transparent onRequestClose={() => setOffersVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOffersVisible(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + vs(16) }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>AVAILABLE OFFERS</Text>

          {/* Manual entry */}
          <View style={styles.modalInputRow}>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter coupon code"
              placeholderTextColor={colors.placeholder}
              value={modalCode}
              onChangeText={t => { setModalCode(t.toUpperCase()); setModalError(''); }}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => applyFromModal()}>
              <Text style={styles.modalApplyBtnText}>APPLY</Text>
            </TouchableOpacity>
          </View>
          {!!modalError && <Text style={styles.modalError}>{modalError}</Text>}

          <FlatList
            data={availableCoupons}
            keyExtractor={item => item._id || item.code}
            style={{ marginTop: vs(12) }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.noOffersText}>No offers available right now</Text>}
            renderItem={({ item }) => (
              <View style={styles.offerCard}>
                <View style={styles.offerLeft}>
                  <View style={styles.offerCodeBadge}>
                    <Text style={styles.offerCode}>{item.code}</Text>
                  </View>
                  <Text style={styles.offerDesc}>
                    {item.discountType === 'percentage'
                      ? `${item.discountValue}% off${item.maxDiscount ? ` up to ₹${item.maxDiscount}` : ''}`
                      : `Flat ₹${item.discountValue} off`}
                    {item.minOrderAmount > 0 ? `  •  Min ₹${item.minOrderAmount}` : ''}
                  </Text>
                </View>
                <TouchableOpacity style={styles.offerApplyBtn} onPress={() => applyFromModal(item.code)}>
                  <Text style={styles.offerApplyBtnText}>APPLY</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: rs(16),
    paddingBottom: vs(14),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    marginBottom: vs(12),
  },
  backBtn: {
    width: rs(38), height: rs(38), borderRadius: rs(19),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, fontSize: ms(16), fontWeight: '900', color: '#fff', letterSpacing: 1.5, fontFamily: 'Poppins_900Black' },
  headerCount: { fontSize: ms(13), color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  orderTypeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.full,
    padding: vs(3),
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(6), paddingVertical: vs(7),
    borderRadius: borderRadius.full,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleBtnDisabled: { opacity: 0.45 },
  toggleBtnText: { fontSize: ms(13), fontWeight: '700', color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins_700Bold' },
  toggleBtnTextActive: { color: '#fff' },
  toggleBtnUnavailable: { fontSize: ms(10), fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: vs(1) },

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
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.sm,
    padding: rs(12),
    marginBottom: vs(12),
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginBottom: vs(8),
  },
  progressText: { fontSize: ms(13), color: colors.text, flex: 1 },
  progressAmount: { fontWeight: '800', color: colors.primary },
  progressBarBg: {
    height: vs(4), backgroundColor: colors.border,
    borderRadius: borderRadius.full, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  savingsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    padding: rs(12),
    marginBottom: vs(12),
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  savingsText: { fontSize: ms(13), color: colors.text, flex: 1 },
  savingsAmount: { fontWeight: '800', color: colors.success },

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
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: rs(10), flexShrink: 1 },
  vegBox: {
    width: rs(14), height: rs(14), borderRadius: rs(2),
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  vegDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  itemName: { fontSize: ms(14), fontWeight: '700', color: colors.text, fontFamily: 'Poppins_700Bold', flexShrink: 1 },
  itemPrice: { fontSize: ms(13), fontWeight: '700', color: colors.primary, fontFamily: 'Poppins_700Bold', minWidth: rs(52), textAlign: 'right' },

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

  viewOffersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    marginTop: vs(12), paddingVertical: vs(10),
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  viewOffersBtnText: { flex: 1, fontSize: ms(13), fontWeight: '700', color: colors.primary, fontFamily: 'Poppins_700Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingHorizontal: rs(16),
    paddingTop: vs(12),
    maxHeight: '75%',
  },
  modalHandle: {
    width: rs(40), height: vs(4), borderRadius: borderRadius.full,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: vs(16),
  },
  modalTitle: {
    fontSize: ms(13), fontWeight: '800', color: colors.textSecondary,
    letterSpacing: 1, marginBottom: vs(14), fontFamily: 'Poppins_800ExtraBold',
  },
  modalInputRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  modalInput: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.xs, paddingHorizontal: rs(12),
    paddingVertical: vs(10), fontSize: ms(14), color: colors.text,
    backgroundColor: colors.background, fontWeight: '700', letterSpacing: 1,
  },
  modalApplyBtn: {
    backgroundColor: colors.primary, paddingHorizontal: rs(16),
    paddingVertical: vs(11), borderRadius: borderRadius.xs,
  },
  modalApplyBtnText: { color: '#fff', fontWeight: '800', fontSize: ms(13), letterSpacing: 0.5, fontFamily: 'Poppins_800ExtraBold' },
  modalError: { marginTop: vs(6), color: colors.error, fontSize: ms(12), fontFamily: 'Poppins_400Regular' },

  offerCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: colors.divider,
    gap: rs(12),
  },
  offerLeft: { flex: 1, gap: vs(4) },
  offerCodeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySurface,
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(10), paddingVertical: vs(3),
    borderStyle: 'dashed',
  },
  offerCode: { fontSize: ms(13), fontWeight: '800', color: colors.primary, letterSpacing: 1, fontFamily: 'Poppins_800ExtraBold' },
  offerDesc: { fontSize: ms(12), color: colors.textSecondary, fontFamily: 'Poppins_400Regular' },
  offerApplyBtn: {
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(14), paddingVertical: vs(7),
  },
  offerApplyBtnText: { fontSize: ms(12), fontWeight: '800', color: colors.primary, fontFamily: 'Poppins_800ExtraBold' },
  noOffersText: { textAlign: 'center', color: colors.placeholder, fontSize: ms(13), paddingVertical: vs(24), fontFamily: 'Poppins_400Regular' },

  cartBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(4),
  },
  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingVertical: vs(10), paddingRight: rs(12),
  },
  addMoreBtnText: {
    fontSize: ms(12), fontWeight: '800', color: colors.primary,
    fontFamily: 'Poppins_800ExtraBold',
  },
  cartBottomDivider: {
    width: 1, height: vs(28), backgroundColor: colors.divider, marginHorizontal: rs(4),
  },
  addInstructionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingVertical: vs(10), paddingLeft: rs(4), flex: 1,
  },
  addInstructionBtnText: {
    fontSize: ms(12), fontWeight: '600', color: colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
  },
  instructionInlineInput: {
    borderTopWidth: 1, borderTopColor: colors.divider,
    paddingVertical: vs(10), paddingHorizontal: rs(4),
    fontSize: ms(13), color: colors.text,
    fontFamily: 'Poppins_400Regular',
  },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(10) },
  billLabel: { fontSize: ms(14), color: colors.textSecondary },
  billValue: { fontSize: ms(14), color: colors.text, fontWeight: '600' },
  freeText: { fontSize: ms(14), color: colors.success, fontWeight: '700' },
  billDivider: { marginVertical: vs(10), backgroundColor: colors.divider },

  suggestList: { gap: rs(10), paddingBottom: vs(4) },
  suggestCard: {
    width: rs(110),
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: rs(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestEmoji: { fontSize: ms(32), marginBottom: vs(4) },
  suggestImage: { width: rs(110), height: rs(70), borderRadius: borderRadius.sm, marginBottom: vs(4) },
  suggestName: { fontSize: ms(11), fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: vs(3), fontFamily: 'Poppins_700Bold' },
  suggestPrice: { fontSize: ms(12), fontWeight: '800', color: colors.primary, marginBottom: vs(6), fontFamily: 'Poppins_800ExtraBold' },
  suggestAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(2),
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8), paddingVertical: vs(4),
  },
  suggestAddBtnText: { fontSize: ms(11), fontWeight: '800', color: colors.primary, fontFamily: 'Poppins_800ExtraBold' },
  suggestStepper: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(6), paddingVertical: vs(4),
  },
  suggestStepperCount: { fontSize: ms(12), fontWeight: '800', color: colors.primary, fontFamily: 'Poppins_800ExtraBold', minWidth: rs(12), textAlign: 'center' },
  pickupCard: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  pickupHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: vs(8) },
  pickupSectionTitle: { fontSize: ms(11), fontWeight: '800', color: colors.textSecondary, letterSpacing: 1, fontFamily: 'Poppins_800ExtraBold' },
  pickupName: { fontSize: ms(14), fontWeight: '800', color: colors.text, marginBottom: vs(2), fontFamily: 'Poppins_800ExtraBold' },
  pickupLine: { fontSize: ms(13), color: colors.textSecondary, lineHeight: vs(20) },
  pickupLandmark: { fontSize: ms(12), color: colors.textSecondary, marginTop: vs(4) },
  pickupPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: vs(8) },
  pickupPhone: { fontSize: ms(13), color: colors.textSecondary, fontWeight: '600' },

  unavailableBanner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(10), paddingVertical: vs(6),
    marginBottom: vs(6),
  },
  unavailableBannerText: { flex: 1, fontSize: ms(11), color: '#EF4444', fontWeight: '600' },
  unavailableRemoveText: { fontSize: ms(11), fontWeight: '800', color: '#EF4444', textDecorationLine: 'underline' },
  outOfStockFooterBanner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(10), paddingVertical: vs(7),
    marginBottom: vs(8),
    borderWidth: 1, borderColor: '#FECACA',
  },
  outOfStockFooterText: { flex: 1, fontSize: ms(12), color: '#EF4444', fontWeight: '600' },
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
    paddingVertical: vs(6),
    paddingHorizontal: rs(16),
  },
  checkoutBtnDisabled: { backgroundColor: colors.placeholder },

  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    padding: rs(12),
    marginBottom: vs(12),
  },
  deliveryBannerText: { flex: 1, fontSize: ms(13), color: '#fff', fontWeight: '600' },

  checkoutLeft: { flex: 1 },
  checkoutItemCount: { fontSize: ms(10), color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.5, fontFamily: 'Poppins_700Bold' },
  checkoutTotal: { fontSize: ms(14), fontWeight: '900', color: '#fff', fontFamily: 'Poppins_900Black' },
  checkoutBtnText: { fontSize: ms(13), fontWeight: '900', color: '#fff', letterSpacing: 1, marginRight: rs(8), fontFamily: 'Poppins_900Black' },
});

export default CartScreen;
