import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const PAYMENT_OPTIONS = [
  { id: 'cash', label: 'Cash on Delivery', icon: 'cash-outline', desc: 'Pay when your order arrives' },
];

const ADDRESS_TYPES = ['home', 'work', 'other'];
const TYPE_ICONS = { home: 'home-outline', work: 'briefcase-outline', other: 'location-outline' };
const EMPTY_FORM = { type: 'home', address: '', landmark: '', city: '', pincode: '', isDefault: false };

const CheckoutScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { items: cartItems, clearCart } = useCart();
  const { grandTotal = 0, deliveryFee = 0, discount = 0, couponCode = '', instructions = '', orderType = 'delivery' } = route?.params || {};

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);

  useEffect(() => {
    if (orderType === 'delivery') {
      fetch(`${API_BASE_URL}/admin/delivery-status`)
        .then(r => r.json())
        .then(d => setDeliveryAvailable(d.deliveryEnabled ?? true))
        .catch(() => {});
    }
  }, [orderType]);

  // Saved addresses
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Add address modal
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Order for someone else
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const insets = useSafeAreaInsets();

  const authFetch = useCallback(async (path, options = {}) => {
    const token = await AsyncStorage.getItem('token');
    return fetch(`${API_BASE_URL}/addresses${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await authFetch('/');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      const def = list.find(a => a.isDefault) || list[0];
      if (def) setSelectedAddressId(def._id);
    } catch { setAddresses([]); }
    finally { setAddrLoading(false); }
  }, [authFetch]);

  useEffect(() => { if (user) loadAddresses(); }, [user, loadAddresses]);

  const saveAddress = async () => {
    if (!form.address.trim() || !form.city.trim()) {
      Alert.alert('Required', 'Please fill address and city.'); return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data?.message || 'Could not save address.'); return; }
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      const newest = list[list.length - 1];
      if (newest) setSelectedAddressId(newest._id);
      setModalVisible(false);
      setForm(EMPTY_FORM);
    } catch { Alert.alert('Error', 'Could not save address.'); }
    finally { setSaving(false); }
  };

  const placeOrder = async () => {
    if (orderType === 'delivery') {
      const selectedAddr = addresses.find(a => a._id === selectedAddressId);
      if (!selectedAddr) {
        Alert.alert('No Address', 'Please select or add a delivery address.'); return;
      }
    }
    if (forSomeoneElse) {
      if (!recipientName.trim() || !recipientPhone.trim()) {
        Alert.alert('Missing Info', 'Please fill in the recipient\'s name and phone.'); return;
      }
      if (recipientPhone.length < 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.'); return;
      }
    }
    setLoading(true);
    try {
      const userToken = await AsyncStorage.getItem('token');

      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const payload = {
        orderType,
        items: cartItems.map(item => ({
          menuItem: item._id || item.id,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: instructions || '',
        })),
        pricing: {
          subtotal,
          discount: discount || 0,
        },
        payment: {
          method: paymentMethod,
        },
        ...(orderType === 'delivery' ? {
          delivery: {
            address: {
              street: addresses.find(a => a._id === selectedAddressId)?.address || '',
              landmark: addresses.find(a => a._id === selectedAddressId)?.landmark || '',
              city: addresses.find(a => a._id === selectedAddressId)?.city || '',
              pincode: addresses.find(a => a._id === selectedAddressId)?.pincode || '',
            },
            instructions: instructions || '',
          },
        } : {}),
        ...(couponCode ? { promoCode: { code: couponCode, discount } } : {}),
        ...(forSomeoneElse ? { recipientName, recipientPhone, isGift: true } : {}),
      };

      const res = await axios.post(`${API_BASE_URL}/orders`, payload, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      clearCart();
      navigation.reset({
        index: 1,
        routes: [
          { name: 'MainTabs' },
          { name: 'OrderTracking', params: { orderId: res.data._id } },
        ],
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: rs(24) }}>
        <Ionicons name="lock-closed-outline" size={rs(56)} color={colors.primary} />
        <Text style={{ fontSize: ms(18), fontWeight: '700', color: colors.text, marginTop: vs(16), marginBottom: vs(8) }}>Sign in to Checkout</Text>
        <Text style={{ fontSize: ms(14), color: colors.placeholder, textAlign: 'center', marginBottom: vs(24) }}>Please sign in to place your order</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={{ borderRadius: borderRadius.md, overflow: 'hidden', width: '100%' }}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: vs(14), alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: ms(16), fontWeight: '700' }}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + vs(8) }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: rs(40) }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Delivery unavailable banner */}
        {orderType === 'delivery' && !deliveryAvailable && (
          <View style={styles.deliveryBanner}>
            <Ionicons name="warning" size={rs(18)} color="#fff" />
            <Text style={styles.deliveryBannerText}>
              Delivery is currently unavailable. Please go back and choose Takeaway.
            </Text>
          </View>
        )}

        {/* Order Type Badge */}
        <View style={[styles.section, shadows.small]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name={orderType === 'delivery' ? 'bicycle' : 'storefront'} size={rs(18)} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>{orderType === 'delivery' ? 'Home Delivery' : 'Self Pickup'}</Text>
              <Text style={{ fontSize: ms(12), color: colors.placeholder, marginTop: vs(1) }}>
                {orderType === 'delivery' ? 'Order will be delivered to your address' : 'Collect your order from the restaurant'}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        {orderType === 'delivery' && (
        <View style={[styles.section, shadows.small]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="location" size={rs(18)} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>

          {addrLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: vs(12) }} />
          ) : addresses.length === 0 ? (
            <TouchableOpacity style={styles.addAddrBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={rs(20)} color={colors.primary} />
              <Text style={styles.addAddrText}>Add a delivery address</Text>
            </TouchableOpacity>
          ) : (
            <>
              {addresses.map(addr => (
                <TouchableOpacity
                  key={addr._id}
                  style={[styles.addrCard, selectedAddressId === addr._id && styles.addrCardActive]}
                  onPress={() => setSelectedAddressId(addr._id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.addrIconWrap, selectedAddressId === addr._id && styles.addrIconWrapActive]}>
                    <Ionicons
                      name={TYPE_ICONS[addr.type] || 'location-outline'}
                      size={rs(18)}
                      color={selectedAddressId === addr._id ? '#fff' : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.addrContent}>
                    <View style={styles.addrTitleRow}>
                      <Text style={[styles.addrType, selectedAddressId === addr._id && styles.addrTypeActive]}>
                        {addr.type?.toUpperCase()}
                      </Text>
                      {addr.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addrText} numberOfLines={3}>
                      {addr.address}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city}{addr.pincode ? ` - ${addr.pincode}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.radioOuter, selectedAddressId === addr._id && styles.radioOuterActive]}>
                    {selectedAddressId === addr._id && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addAddrBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={rs(20)} color={colors.primary} />
                <Text style={styles.addAddrText}>Add new address</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        )}

        {/* Order for Someone Else */}
        <View style={[styles.section, shadows.small]}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setForSomeoneElse(v => !v)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="people-outline" size={rs(18)} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Order for Someone Else</Text>
                <Text style={styles.toggleSubtitle}>Deliver to a friend or family member</Text>
              </View>
            </View>
            <View style={[styles.toggle, forSomeoneElse && styles.toggleActive]}>
              <View style={[styles.toggleThumb, forSomeoneElse && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>

          {forSomeoneElse && (
            <View style={styles.recipientFields}>
              <TextInput
                style={styles.input}
                placeholder="Recipient's name"
                placeholderTextColor={colors.placeholder}
                value={recipientName}
                onChangeText={setRecipientName}
              />
              <TextInput
                style={styles.input}
                placeholder="Recipient's 10-digit phone"
                placeholderTextColor={colors.placeholder}
                value={recipientPhone}
                onChangeText={setRecipientPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          )}
        </View>

        {/* Payment */}
        <View style={[styles.section, shadows.small]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="wallet" size={rs(18)} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          {PAYMENT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.paymentOption, paymentMethod === opt.id && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod(opt.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.paymentIconWrap, paymentMethod === opt.id && styles.paymentIconWrapActive]}>
                <Ionicons name={opt.icon} size={rs(20)} color={paymentMethod === opt.id ? '#fff' : colors.textSecondary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentLabel, paymentMethod === opt.id && styles.paymentLabelActive]}>{opt.label}</Text>
                <Text style={styles.paymentDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.radioOuter, paymentMethod === opt.id && styles.radioOuterActive]}>
                {paymentMethod === opt.id && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={[styles.section, shadows.small]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name="receipt" size={rs(18)} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{(grandTotal - deliveryFee + discount).toFixed(2)}</Text>
          </View>
          {orderType === 'delivery' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              {deliveryFee === 0
                ? <Text style={styles.freeText}>FREE</Text>
                : <Text style={styles.summaryValue}>₹{deliveryFee}</Text>}
            </View>
          )}
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>- ₹{discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: vs(20) }} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + vs(12) }]}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, (loading || (orderType === 'delivery' && !deliveryAvailable)) && styles.btnDisabled]}
          onPress={placeOrder}
          disabled={loading || (orderType === 'delivery' && !deliveryAvailable)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.placeOrderGradient}
          >
            <Text style={styles.placeOrderText}>{loading ? 'Placing Order...' : 'Place Order'}</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>₹{grandTotal.toFixed(2)}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Add Address Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setForm(EMPTY_FORM); }}>
                <Ionicons name="close" size={rs(22)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeRow}>
              {ADDRESS_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                  onPress={() => setForm(f => ({ ...f, type: t }))}
                >
                  <Ionicons name={TYPE_ICONS[t]} size={rs(14)} color={form.type === t ? '#fff' : colors.textSecondary} />
                  <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {[
              { key: 'address', placeholder: 'Street / Flat / Building *', multiline: true },
              { key: 'landmark', placeholder: 'Landmark (optional)' },
              { key: 'city', placeholder: 'City *' },
              { key: 'pincode', placeholder: 'Pincode', keyboardType: 'numeric' },
            ].map(({ key, placeholder, multiline, keyboardType }) => (
              <TextInput
                key={key}
                style={[styles.input, multiline && { height: vs(72), textAlignVertical: 'top' }]}
                placeholder={placeholder}
                placeholderTextColor={colors.placeholder}
                value={form[key]}
                onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                multiline={multiline}
                keyboardType={keyboardType}
              />
            ))}

            <TouchableOpacity
              style={styles.defaultToggle}
              onPress={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
            >
              <Ionicons name={form.isDefault ? 'checkbox' : 'square-outline'} size={rs(20)} color={colors.primary} />
              <Text style={styles.defaultToggleText}>Set as default address</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={saveAddress} disabled={saving}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Save Address</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(16), paddingBottom: vs(14),
  },
  backBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(20),
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },

  scrollContent: { padding: rs(16) },

  section: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: rs(16), marginBottom: vs(12),
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(14), gap: rs(10) },
  sectionIconWrap: {
    width: rs(36), height: rs(36), borderRadius: rs(10),
    backgroundColor: colors.primarySurface, justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: ms(15), fontWeight: '700', color: colors.text },
  toggleSubtitle: { fontSize: ms(12), color: colors.placeholder, marginTop: vs(1) },

  // Saved address cards
  addrCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: rs(12),
    marginBottom: vs(10),
    backgroundColor: colors.background,
  },
  addrCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  addrIconWrap: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: rs(10),
    flexShrink: 0,
  },
  addrIconWrapActive: { backgroundColor: colors.primary },
  addrContent: {
    flex: 1,
    minWidth: 0,
    marginRight: rs(8),
  },
  addrTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: rs(6), marginBottom: vs(3) },
  addrType: { fontSize: ms(12), fontWeight: '700', color: colors.text, letterSpacing: 0.5 },
  addrTypeActive: { color: colors.primary },
  addrText: { fontSize: ms(13), color: colors.textSecondary, lineHeight: ms(19), flexShrink: 1 },
  defaultBadge: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: rs(7),
    paddingVertical: vs(1),
  },
  defaultBadgeText: { fontSize: ms(10), fontWeight: '700', color: colors.success },

  addAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    paddingVertical: vs(10),
    paddingHorizontal: rs(4),
  },
  addAddrText: { fontSize: ms(14), color: colors.primary, fontWeight: '600' },

  // Someone else toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: {
    width: rs(46), height: rs(26), borderRadius: rs(13),
    backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: rs(3),
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleThumb: {
    width: rs(20), height: rs(20), borderRadius: rs(10),
    backgroundColor: '#fff', alignSelf: 'flex-start',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },
  recipientFields: { marginTop: vs(14), gap: vs(10) },

  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingHorizontal: rs(14), paddingVertical: vs(12),
    fontSize: ms(14), color: colors.text, backgroundColor: colors.background,
  },

  // Payment
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', padding: rs(12),
    borderRadius: borderRadius.sm, borderWidth: 1.5, borderColor: colors.border,
    marginBottom: vs(10), gap: rs(12), backgroundColor: colors.background,
  },
  paymentOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  paymentIconWrap: {
    width: rs(40), height: rs(40), borderRadius: rs(10),
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },
  paymentIconWrapActive: { backgroundColor: colors.primary },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: ms(14), fontWeight: '600', color: colors.text },
  paymentLabelActive: { color: colors.primary },
  paymentDesc: { fontSize: ms(12), color: colors.placeholder, marginTop: vs(2) },

  radioOuter: {
    width: rs(20), height: rs(20), borderRadius: rs(10),
    borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: colors.primary },

  // Summary
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: vs(8) },
  summaryLabel: { fontSize: ms(14), color: colors.textSecondary },
  summaryValue: { fontSize: ms(14), color: colors.text, fontWeight: '500' },
  freeText: { fontSize: ms(14), color: colors.success, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: vs(10) },
  totalLabel: { fontSize: ms(16), fontWeight: '700', color: colors.text },
  totalValue: { fontSize: ms(16), fontWeight: '800', color: colors.primary },

  footer: {
    backgroundColor: colors.surface, paddingHorizontal: rs(16),
    paddingTop: vs(12), borderTopWidth: 1, borderTopColor: colors.divider,
  },
  placeOrderBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  btnDisabled: { opacity: 0.6 },

  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    padding: rs(14),
    marginBottom: vs(12),
  },
  deliveryBannerText: { flex: 1, fontSize: ms(13), color: '#fff', fontWeight: '600', lineHeight: ms(19) },

  placeOrderGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: vs(15), paddingHorizontal: rs(20),
  },
  placeOrderText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
  totalBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: rs(12),
    paddingVertical: vs(4), borderRadius: borderRadius.full,
  },
  totalBadgeText: { color: '#fff', fontWeight: '800', fontSize: ms(14) },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    padding: rs(20),
    paddingBottom: vs(36),
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(16) },
  modalTitle: { fontSize: ms(17), fontWeight: '700', color: colors.text },

  typeRow: { flexDirection: 'row', gap: rs(10), marginBottom: vs(14) },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.full,
    paddingHorizontal: rs(14), paddingVertical: vs(7),
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: ms(13), fontWeight: '600', color: colors.textSecondary },
  typeChipTextActive: { color: '#fff' },

  defaultToggle: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: vs(16), marginTop: vs(4) },
  defaultToggleText: { fontSize: ms(14), color: colors.text, fontWeight: '500' },

  saveBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: vs(14), alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
});

export default CheckoutScreen;
