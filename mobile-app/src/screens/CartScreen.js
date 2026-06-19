import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, Alert, TextInput,
  TouchableOpacity, StatusBar, Modal, FlatList, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Text, Divider } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import api, { menuAPI } from '../services/api';
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE, getDeliveryFee, API_BASE_URL, STORE_ADDRESS, MIN_ORDER_VALUE } from '../utils/constants';

const ADDRESS_TYPES = ['home', 'work', 'other'];
const TYPE_ICONS = { home: 'home-outline', work: 'briefcase-outline', other: 'location-outline' };
const EMPTY_FORM = { type: 'home', address: '', landmark: '', city: '', pincode: '', isDefault: false };

const CartScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { items: cartItems, total, updateQuantity, removeFromCart, addToCart, clearCart } = useCart();
  const { balance, fetchWallet } = useWallet();
  const { t } = useLanguage();
  const orderType = 'delivery';
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [offersVisible, setOffersVisible] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [modalCode, setModalCode] = useState('');
  const [modalError, setModalError] = useState('');
  const [showInstruction, setShowInstruction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const mapRef = useRef(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({ latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  const [pinCoords, setPinCoords] = useState({ latitude: 28.6139, longitude: 77.2090 });
  const [locLoading, setLocLoading] = useState(false);
  const [addressPickerVisible, setAddressPickerVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [saving, setSaving] = useState(false);

  const instructionRef = useRef(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/delivery-status`)
      .then(r => r.json())
      .then(d => setDeliveryAvailable(d.deliveryEnabled ?? true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    menuAPI.getItems()
      .then(res => setSuggestedItems(res.data || []))
      .catch(() => {});
  }, []);

  const authFetch = useCallback(async (path, options = {}) => {
    const token = await AsyncStorage.getItem('token');
    return fetch(`${API_BASE_URL}/addresses${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
  }, []);

  const loadAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setAddrLoading(false);
      return;
    }

    setAddrLoading(true);
    try {
      const res = await authFetch('/');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      const def = list.find(a => a.isDefault) || list[0];
      if (def) setSelectedAddressId(def._id);
    } catch {
      setAddresses([]);
    } finally {
      setAddrLoading(false);
    }
  }, [authFetch, user]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

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

  const deliveryFee = getDeliveryFee(total);
  const grandTotal = Math.max(0, total + deliveryFee - discount);
  const hasOutOfStockItems = cartItems.some(i => i.availability?.isAvailable === false);
  const selectedAddress = addresses.find(a => a._id === selectedAddressId);
  const isBelowMinimumOrder = total < MIN_ORDER_VALUE;
  const minimumOrderShortfall = Math.max(0, MIN_ORDER_VALUE - total);

  const goToCurrentLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const region = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
      setPinCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 600);
    } catch {}
    finally { setLocLoading(false); }
  };

  const openAddMap = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    setEditingAddressId(null);
    setForm(EMPTY_FORM);
    setAddressPickerVisible(false);
    setMapVisible(true);
    setTimeout(goToCurrentLocation, 300);
  };

  const openEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setForm({
      type: addr.type || 'home',
      address: addr.address || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      pincode: addr.pincode || '',
      isDefault: !!addr.isDefault,
    });
    setAddressPickerVisible(false);
    setAddressModalVisible(true);
  };

  const selectAddress = (addr) => {
    setSelectedAddressId(addr._id);
    setAddressPickerVisible(false);
  };

  const deleteAddress = (id) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await authFetch(`/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
              Alert.alert('Error', data?.message || 'Could not delete address.');
              return;
            }
            const list = Array.isArray(data) ? data : [];
            setAddresses(list);
            if (selectedAddressId === id) {
              const next = list.find(a => a.isDefault) || list[0];
              setSelectedAddressId(next?._id || null);
            }
          } catch {
            Alert.alert('Error', 'Could not delete address.');
          }
        },
      },
    ]);
  };

  const confirmMapLocation = async () => {
    setLocLoading(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: pinCoords.latitude, longitude: pinCoords.longitude });
      if (place) {
        const street = [place.name, place.street].filter(Boolean).join(', ');
        setForm(f => ({
          ...f,
          address: street || '',
          city: place.city || place.district || '',
          pincode: place.postalCode || '',
          latitude: pinCoords.latitude,
          longitude: pinCoords.longitude,
        }));
      } else {
        setForm(f => ({ ...f, latitude: pinCoords.latitude, longitude: pinCoords.longitude }));
      }
    } catch {}
    finally {
      setLocLoading(false);
      setMapVisible(false);
      setAddressModalVisible(true);
    }
  };

  const saveAddress = async () => {
    if (!form.address.trim() || !form.city.trim()) {
      Alert.alert('Required', 'Please fill address and city.');
      return;
    }
    setSaving(true);
    try {
      const res = editingAddressId
        ? await authFetch(`/${editingAddressId}`, { method: 'PUT', body: JSON.stringify(form) })
        : await authFetch('/', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data?.message || 'Could not save address.');
        return;
      }
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      const saved = editingAddressId ? list.find(a => a._id === editingAddressId) : list[list.length - 1];
      if (saved) setSelectedAddressId(saved._id);
      setAddressModalVisible(false);
      setForm(EMPTY_FORM);
      setEditingAddressId(null);
    } catch {
      Alert.alert('Error', 'Could not save address.');
    } finally {
      setSaving(false);
    }
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) { Alert.alert('Empty Cart', 'Please add items first'); return; }
    if (total < MIN_ORDER_VALUE) { Alert.alert('Minimum Order', `Minimum order value is ₹${MIN_ORDER_VALUE}`); return; }
    if (hasOutOfStockItems) { Alert.alert('Items Unavailable', 'Please remove out-of-stock items before placing your order.'); return; }
    if (!user) { navigation.navigate('Login'); return; }
    const selectedAddr = addresses.find(a => a._id === selectedAddressId);
    if (!selectedAddr) { Alert.alert('No Address', 'Please select or add a delivery address.'); return; }

    setLoading(true);
    try {
      const userToken = await AsyncStorage.getItem('token');
      const payload = {
        orderType,
        items: cartItems.map(item => ({
          menuItem: item._id || item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: instructions || '',
        })),
        pricing: {
          subtotal: total,
          discount: discount || 0,
        },
        payment: {
          method: 'cash',
        },
        delivery: {
          address: {
            street: selectedAddr.address || '',
            landmark: selectedAddr.landmark || '',
            city: selectedAddr.city || '',
            pincode: selectedAddr.pincode || '',
          },
          instructions: instructions || '',
        },
        ...(couponCode ? { promoCode: { code: couponCode, discount } } : {}),

      };

      const res = await axios.post(`${API_BASE_URL}/orders`, payload, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      clearCart();
      navigation.reset({
        index: 1,
        routes: [{ name: 'MainTabs' }, { name: 'OrderTracking', params: { orderId: res.data._id } }],
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>{t.yourOrder}</Text>
          <Text style={styles.headerCount}>{cartItems.length} {t.items}</Text>
        </View>

      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>{t.cartEmpty}</Text>
          <Text style={styles.emptySubtitle}>{t.addFreshVeggies}</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}>
            <Text style={styles.browseBtnText}>Start Shopping</Text>
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
                  {t.deliveryUnavailable}
                </Text>
              </View>
            )}

            {/* Free delivery progress bar */}
            {deliveryFee > 0 && (
              <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <Ionicons name="bicycle-outline" size={rs(16)} color={colors.primary} />
                  <Text style={styles.progressText}>
                    Add <Text style={styles.progressAmount}>₹{(FREE_DELIVERY_THRESHOLD - total).toFixed(0)}</Text> {t.addMoreForFree}
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
                <Text style={styles.savingsText}>{t.saving} <Text style={styles.savingsAmount}>₹{discount.toFixed(0)}</Text> {t.onThisOrder}</Text>
              </View>
            )}

            {/* Cart Items */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>{t.itemsInOrder}</Text>
              {cartItems.map((item, idx) => (
                <View key={item.id || item._id}>
                  {idx > 0 && <View style={styles.itemDivider} />}
                  <View style={[styles.cartItem, item.availability?.isAvailable === false && { opacity: 0.5 }]}>
                    <View style={styles.itemLeft}>
                      <Ionicons name="pricetag-outline" size={rs(14)} color={colors.primary} />
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
                      <Text style={styles.unavailableBannerText}>{t.outOfStock}</Text>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                        <Text style={styles.unavailableRemoveText}>{t.remove}</Text>
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
                  <Text style={styles.addMoreBtnText}>{t.addMore}</Text>
                </TouchableOpacity>
                <View style={styles.cartBottomDivider} />
                <TouchableOpacity style={styles.addInstructionBtn} onPress={() => setShowInstruction(v => !v)}>
                  <Ionicons name="create-outline" size={rs(15)} color={colors.textSecondary} />
                  <Text style={styles.addInstructionBtnText}>{t.addInstruction}</Text>
                </TouchableOpacity>
              </View>
              {showInstruction && (
                <TextInput
                  ref={instructionRef}
                  style={styles.instructionInlineInput}
                  placeholder={t.instructionPlaceholder}
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
                <Text style={styles.sectionTitle}>{t.youMightLike}</Text>
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
                            <Text style={styles.suggestEmoji}>{item.image || '👟'}</Text>
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
                              <Text style={styles.suggestAddBtnText}>{t.addLabel}</Text>
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
              <Text style={styles.sectionTitle}>{t.applyCoupon}</Text>
              <View style={styles.couponRow}>
                <TextInput
                  style={[styles.couponInput, couponApplied && styles.couponInputDisabled]}
                  placeholder={t.enterCoupon}
                  placeholderTextColor={colors.placeholder}
                  value={couponCode}
                  onChangeText={(v) => { setCouponCode(v); setCouponError(''); }}
                  autoCapitalize="characters"
                  editable={!couponApplied}
                />
                <TouchableOpacity
                  style={[styles.couponBtn, couponApplied && styles.removeCouponBtn]}
                  onPress={couponApplied ? removeCoupon : applyCoupon}
                >
                  <Text style={styles.couponBtnText}>{couponApplied ? t.remove : t.apply}</Text>
                </TouchableOpacity>
              </View>
              {couponApplied && <Text style={styles.couponSuccess}>✅ Coupon applied! Saved ₹{discount.toFixed(2)}</Text>}
              {!!couponError && <Text style={styles.couponError}>{couponError}</Text>}
              {!couponApplied && (
                <TouchableOpacity style={styles.viewOffersBtn} onPress={openOffers}>
                  <Ionicons name="pricetag-outline" size={rs(14)} color={colors.primary} />
                  <Text style={styles.viewOffersBtnText}>{t.viewAllOffers}</Text>
                  <Ionicons name="chevron-forward" size={rs(14)} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>


            {/* Bill */}
            <View style={[styles.sectionCard, shadows.small]}>
              <Text style={styles.sectionTitle}>{t.billDetails}</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{t.itemTotal}</Text>
                <Text style={styles.billValue}>₹{Number(total).toFixed(2)}</Text>
              </View>
              {orderType === 'delivery' && (
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{t.deliveryFee}</Text>
                  {deliveryFee === 0
                    ? <Text style={styles.freeText}>{t.freeDelivery}</Text>
                    : <Text style={styles.billValue}>₹{deliveryFee}</Text>}
                </View>
              )}
              {discount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: colors.success }]}>{t.couponDiscount}</Text>
                  <Text style={[styles.billValue, { color: colors.success, fontWeight: '700' }]}>- ₹{discount.toFixed(2)}</Text>
                </View>
              )}
              <Divider style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.grandTotalLabel}>{t.toPay}</Text>
                <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
              </View>
            </View>

          </ScrollView>

          {/* Place Order Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + vs(8) }]}>
            {hasOutOfStockItems && (
              <View style={styles.outOfStockFooterBanner}>
                <Ionicons name="alert-circle" size={rs(14)} color="#EF4444" />
                <Text style={styles.outOfStockFooterText}>{t.removeUnavailable}</Text>
              </View>
            )}
            <View style={styles.deliverySummaryCard}>
              {addrLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: vs(8) }} />
              ) : selectedAddress ? (
                <>
                  <View style={styles.deliverySummaryTop}>
                    <View style={styles.deliverySummaryTitleRow}>
                      <View style={styles.sectionIconWrap}>
                        <Ionicons name={TYPE_ICONS[selectedAddress.type] || 'location-outline'} size={rs(18)} color={colors.primary} />
                      </View>
                      <Text style={styles.deliverToLine} numberOfLines={1}>
                        Deliver to {(selectedAddress.type || 'other').charAt(0).toUpperCase() + (selectedAddress.type || 'other').slice(1)}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.changeAddressBtn} onPress={() => setAddressPickerVisible(true)}>
                      <Text style={styles.changeAddressText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.deliverySummaryAddress} numberOfLines={2}>
                    {selectedAddress.address}{selectedAddress.landmark ? `, Near ${selectedAddress.landmark}` : ''}, {selectedAddress.city}{selectedAddress.pincode ? ` - ${selectedAddress.pincode}` : ''}
                  </Text>
                </>
              ) : (
                <TouchableOpacity style={styles.addAddrBtn} onPress={openAddMap}>
                  <Ionicons name="add-circle-outline" size={rs(20)} color={colors.primary} />
                  <Text style={styles.addAddrText}>{t.addDeliveryAddress}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, (loading || !deliveryAvailable || hasOutOfStockItems || isBelowMinimumOrder) && styles.checkoutBtnDisabled]}
              onPress={placeOrder}
              activeOpacity={0.88}
              disabled={loading || !deliveryAvailable || isBelowMinimumOrder}
            >
              <View style={styles.checkoutLeft}>
                <Text style={styles.checkoutItemCount}>
                  {isBelowMinimumOrder ? `Add item of â‚¹${minimumOrderShortfall.toFixed(0)} more` : `${cartItems.length} ${t.itemCount}`}
                </Text>
                <Text style={styles.checkoutTotal}>₹{grandTotal.toFixed(2)}</Text>
              </View>
              <Text style={styles.checkoutBtnText}>
                {isBelowMinimumOrder ? 'Below Minimum Order' : loading ? t.placingOrder : t.placeOrder}
              </Text>
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
          <Text style={styles.modalTitle}>{t.viewAllOffers}</Text>

          {/* Manual entry */}
          <View style={styles.modalInputRow}>
            <TextInput
              style={styles.modalInput}
              placeholder={t.enterCoupon}
              placeholderTextColor={colors.placeholder}
              value={modalCode}
              onChangeText={v => { setModalCode(v.toUpperCase()); setModalError(''); }}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.modalApplyBtn} onPress={() => applyFromModal()}>
              <Text style={styles.modalApplyBtnText}>{t.apply}</Text>
            </TouchableOpacity>
          </View>
          {!!modalError && <Text style={styles.modalError}>{modalError}</Text>}

          <FlatList
            data={availableCoupons}
            keyExtractor={item => item._id || item.code}
            style={{ marginTop: vs(12) }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.noOffersText}>{t.viewAllOffers}</Text>}
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
                  <Text style={styles.offerApplyBtnText}>{t.apply}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Address Picker */}
      <Modal visible={addressPickerVisible} animationType="slide" transparent onRequestClose={() => setAddressPickerVisible(false)}>
        <TouchableOpacity style={styles.addressPickerBackdrop} activeOpacity={1} onPress={() => setAddressPickerVisible(false)} />
        <View style={[styles.addressPickerSheet, { paddingBottom: insets.bottom + vs(16) }]}>
          <View style={styles.modalHandle} />
          <View style={styles.addressPickerHeader}>
            <Text style={styles.addressPickerTitle}>Select delivery address</Text>
            <TouchableOpacity onPress={() => setAddressPickerVisible(false)} style={styles.addressPickerClose}>
              <Ionicons name="close" size={rs(20)} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.addressPickerList}>
            {addresses.map(addr => {
              const isSelected = selectedAddressId === addr._id;
              return (
                <TouchableOpacity
                  key={addr._id}
                  style={[styles.pickerAddrCard, isSelected && styles.pickerAddrCardActive]}
                  onPress={() => selectAddress(addr)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.addrIconWrap, isSelected && styles.addrIconWrapActive]}>
                    <Ionicons
                      name={TYPE_ICONS[addr.type] || 'location-outline'}
                      size={rs(18)}
                      color={isSelected ? '#fff' : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.addrContent}>
                    <View style={styles.addrTitleRow}>
                      <Text style={[styles.addrType, isSelected && styles.addrTypeActive]}>
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
                    <View style={styles.addressActions}>
                      <TouchableOpacity
                        style={styles.addressActionBtn}
                        onPress={(event) => {
                          event.stopPropagation();
                          openEditAddress(addr);
                        }}
                      >
                        <Ionicons name="create-outline" size={rs(14)} color={colors.primary} />
                        <Text style={styles.addressActionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.addressActionBtn}
                        onPress={(event) => {
                          event.stopPropagation();
                          deleteAddress(addr._id);
                        }}
                      >
                        <Ionicons name="trash-outline" size={rs(14)} color={colors.error} />
                        <Text style={[styles.addressActionText, { color: colors.error }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.addAddressFullBtn} onPress={openAddMap}>
            <Ionicons name="add-circle-outline" size={rs(18)} color="#fff" />
            <Text style={styles.addAddressFullText}>{t.addNewAddress}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Map Picker */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={region => setPinCoords({ latitude: region.latitude, longitude: region.longitude })}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker coordinate={pinCoords} draggable onDragEnd={e => setPinCoords(e.nativeEvent.coordinate)}>
              <View style={styles.pinWrapper}>
                <View style={styles.pinBubble}>
                  <Ionicons name="location" size={rs(22)} color="#fff" />
                </View>
                <View style={styles.pinTail} />
              </View>
            </Marker>
          </MapView>
          <View style={[styles.mapTopBar, { top: insets.top + vs(10) }]}>
            <TouchableOpacity style={styles.mapBackBtn} onPress={() => setMapVisible(false)}>
              <Ionicons name="arrow-back" size={rs(22)} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.mapTopTitle}>{t.pinLocation}</Text>
            <View style={{ width: rs(36) }} />
          </View>
          <TouchableOpacity
            style={[styles.mapLocFab, { bottom: insets.bottom + vs(110) }]}
            onPress={goToCurrentLocation}
            disabled={locLoading}
            activeOpacity={0.85}
          >
            {locLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="navigate" size={rs(22)} color={colors.primary} />}
          </TouchableOpacity>
          <View style={[styles.mapBottomBar, { paddingBottom: insets.bottom + vs(12) }]}>
            <Text style={styles.mapHint}>{t.dragToAdjust}</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmMapLocation} disabled={locLoading}>
              {locLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>{t.confirmLocation}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Address Form */}
      <Modal visible={addressModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.addressModalOverlay}>
            <View style={styles.addressModalSheet}>
              <View style={styles.addressModalHeader}>
                <TouchableOpacity onPress={() => {
                  setAddressModalVisible(false);
                  if (editingAddressId) {
                    setEditingAddressId(null);
                    setAddressPickerVisible(true);
                  } else {
                    setMapVisible(true);
                  }
                }}>
                  <Ionicons name="arrow-back" size={rs(22)} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.addressModalTitle}>{editingAddressId ? 'Edit Address' : t.addressDetails}</Text>
                <TouchableOpacity onPress={() => { setAddressModalVisible(false); setForm(EMPTY_FORM); setEditingAddressId(null); }}>
                  <Ionicons name="close" size={rs(22)} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.typeRow}>
                {ADDRESS_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, form.type === type && styles.typeChipActive]}
                    onPress={() => setForm(f => ({ ...f, type }))}
                  >
                    <Ionicons name={TYPE_ICONS[type]} size={rs(14)} color={form.type === type ? '#fff' : colors.textSecondary} />
                    <Text style={[styles.typeChipText, form.type === type && styles.typeChipTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
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
                  style={[styles.checkoutInput, multiline && { height: vs(72), textAlignVertical: 'top' }]}
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
                <Text style={styles.defaultToggleText}>{t.setAsDefault}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveAddrBtn} onPress={saveAddress} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveAddrBtnText}>{t.saveAddress}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  checkoutSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(14), gap: rs(10) },
  checkoutSectionHeaderNoMargin: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1 },
  sectionIconWrap: {
    width: rs(28), height: rs(28), borderRadius: rs(8),
    backgroundColor: colors.primarySurface, justifyContent: 'center', alignItems: 'center',
  },
  checkoutSectionTitle: { fontSize: ms(15), fontWeight: '700', color: colors.text },
  deliverySummaryCard: {
    backgroundColor: colors.primarySurface,
    borderRadius: borderRadius.md,
    paddingHorizontal: rs(12),
    paddingVertical: vs(7),
    marginBottom: vs(10),
    borderWidth: 1,
    borderColor: colors.primary,
  },
  deliverySummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: rs(8),
  },
  deliverySummaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), flex: 1, minWidth: 0 },
  deliverToLine: { flex: 1, fontSize: ms(15), color: colors.text, fontWeight: '800' },
  changeAddressBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(12),
    paddingVertical: vs(7),
  },
  changeAddressText: { fontSize: ms(12), color: colors.primary, fontWeight: '800' },
  deliverySummaryAddress: {
    fontSize: ms(13),
    color: colors.textSecondary,
    lineHeight: ms(19),
    marginTop: vs(2),
    marginLeft: rs(36),
  },
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
  addrContent: { flex: 1, minWidth: 0, marginRight: rs(8) },
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(12) },
  toggleSubtitle: { fontSize: ms(12), color: colors.placeholder, marginTop: vs(1) },
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
  checkoutInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingHorizontal: rs(14), paddingVertical: vs(12), marginBottom: vs(10),
    fontSize: ms(14), color: colors.text, backgroundColor: colors.background,
  },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', padding: rs(12),
    borderRadius: borderRadius.sm, borderWidth: 1.5, borderColor: colors.border,
    marginBottom: vs(10), gap: rs(12), backgroundColor: colors.background,
  },
  paymentOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  paymentOptionDisabled: { opacity: 0.5 },
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
  addressPickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  addressPickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingHorizontal: rs(16),
    paddingTop: vs(12),
    maxHeight: '82%',
  },
  addressPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(12),
  },
  addressPickerTitle: { fontSize: ms(16), fontWeight: '800', color: colors.text },
  addressPickerClose: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressPickerList: { maxHeight: vs(380) },
  pickerAddrCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: rs(12),
    marginBottom: vs(10),
    backgroundColor: colors.background,
  },
  pickerAddrCardActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  addressActions: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginTop: vs(10) },
  addressActionBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(4), paddingVertical: vs(3) },
  addressActionText: { fontSize: ms(12), fontWeight: '700', color: colors.primary },
  addAddressFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: vs(13),
    marginTop: vs(8),
  },
  addAddressFullText: { fontSize: ms(14), fontWeight: '800', color: '#fff' },

  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: vs(10),
  },
  itemDivider: { height: 1, backgroundColor: colors.divider },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: rs(10), flexShrink: 1 },
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

  mapContainer: { flex: 1 },
  map: { flex: 1 },
  pinWrapper: { alignItems: 'center' },
  pinBubble: {
    width: rs(42), height: rs(42), borderRadius: rs(21),
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  pinTail: {
    width: 0, height: 0,
    borderLeftWidth: rs(7), borderRightWidth: rs(7), borderTopWidth: rs(12),
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  mapTopBar: {
    position: 'absolute', left: rs(12), right: rs(12),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: borderRadius.md,
    paddingHorizontal: rs(12), paddingVertical: vs(10),
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  mapBackBtn: { padding: rs(4) },
  mapTopTitle: { fontSize: ms(15), fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },
  mapLocFab: {
    position: 'absolute', right: rs(16),
    width: rs(48), height: rs(48), borderRadius: rs(24),
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  mapBottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20),
    padding: rs(20),
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: -2 },
  },
  mapHint: { fontSize: ms(13), color: colors.placeholder, marginBottom: vs(14), textAlign: 'center' },
  confirmBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: vs(14), alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
  addressModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  addressModalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    padding: rs(20),
    paddingBottom: vs(36),
    maxHeight: '90%',
  },
  addressModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(16) },
  addressModalTitle: { fontSize: ms(17), fontWeight: '700', color: colors.text },
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
  saveAddrBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: vs(14), alignItems: 'center' },
  saveAddrBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },

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
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
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
