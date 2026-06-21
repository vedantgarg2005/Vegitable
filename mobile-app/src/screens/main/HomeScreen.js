import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, FlatList, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions, Animated, TextInput,
  Modal, Alert, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Image as RNImage } from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, Easing,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { menuAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../../utils/theme';
import { API_BASE_URL } from '../../utils/constants';
import FoodCard, { isOutOfStock } from '../../components/FoodCard';
import { FoodCardSkeleton } from '../../components/SkeletonLoader';

const SLIDER_IMAGES = [
  require('../../../assets/1.jpeg'),
  require('../../../assets/2.jpeg'),
];

const TYPE_ICONS = { home: 'home-outline', work: 'briefcase-outline', other: 'location-outline' };

const { width: W } = Dimensions.get('window');

const VEGGIE_SUGGESTIONS = ['Tomatoes', 'Carrots', 'Spinach', 'Potatoes', 'Onions', 'Broccoli', 'Peppers', 'Cabbage'];


const CATEGORY_IMAGES = [
  { id: 'vegetables',   label: 'Vegetables',     src: require('../../../assets/Vegetables.webp') },
  { id: 'fruits',       label: 'Fruits',          src: require('../../../assets/Fruits.webp') },
  { id: 'exotic',       label: 'Exotic Veggie',  src: require('../../../assets/ExocticVegetable.webp') },
  { id: 'exoticfruits', label: 'Exotic Fruits',  src: require('../../../assets/ExocticFruits.webp') },
  { id: 'bakery',       label: 'Bakery',          src: require('../../../assets/Bakery.webp') },
];

const CATEGORIES = [
  { name: 'All',        emoji: '🛒' },
  { name: 'Vegetables', emoji: '🥦' },
  { name: 'Fruits',     emoji: '' },
  { name: 'Leafy',      emoji: '' },
  { name: 'Exotic',     emoji: '🥭' },
  { name: 'Herbs',      emoji: '🌿' },
  { name: 'Organic',    emoji: '🌱' },
];

function ImageSlider({ navigation }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sliderRef = useRef(null);
  const sliderW = W - rs(16);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeIdx + 1) % SLIDER_IMAGES.length;
      setActiveIdx(next);
      sliderRef.current?.scrollTo({ x: next * sliderW, animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIdx, sliderW]);

  return (
    <View style={{ marginTop: vs(14), marginHorizontal: rs(8) }}>
      <ScrollView
        ref={sliderRef}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / sliderW))}
        style={{ borderRadius: borderRadius.md, overflow: 'hidden' }}
      >
        {SLIDER_IMAGES.map((src, i) => (
          <TouchableOpacity key={i} activeOpacity={0.95} onPress={() => i === 1 && navigation.navigate('AllProducts', { category: 'Fruits', search: 'watermelon' })}>
            <RNImage source={src} style={{ width: sliderW, height: vs(200) }} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: rs(5), marginTop: vs(6) }}>
        {SLIDER_IMAGES.map((_, i) => (
          <View key={i} style={[{ width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: colors.border }, i === activeIdx && { backgroundColor: colors.primary, width: rs(20) }]} />
        ))}
      </View>
    </View>
  );
}

function formatTime12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}


export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [orderType, setOrderType] = useState('delivery');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const { addToCart, updateQuantity, items: cartItems, itemCount, total } = useCart();
  const insets = useSafeAreaInsets();
  const searchRef = useRef(null);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addrModalVisible, setAddrModalVisible] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const authFetch = useCallback(async (path, options = {}) => {
    const token = await AsyncStorage.getItem('token');
    return fetch(`${API_BASE_URL}/addresses${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    });
  }, []);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    try {
      const res = await authFetch('/');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAddresses(list);
      if (!selectedAddress) {
        const def = list.find(a => a.isDefault) || list[0];
        if (def) setSelectedAddress(def);
      }
    } catch {}
  }, [user, authFetch]);

  const [restaurantOpen, setRestaurantOpen] = useState(true);
  const [restaurantHours, setRestaurantHours] = useState(null);
  const [nextOpenTime, setNextOpenTime] = useState(null);

  useEffect(() => {
    const fetchStoreHours = () => {
      fetch(`${API_BASE_URL}/admin/store-status`)
        .then(r => r.json())
        .then(d => {
          setRestaurantOpen(d.isOpen ?? true);
          setRestaurantHours(d.hours ?? null);
          setNextOpenTime(d.nextOpenTime ?? null);
        })
        .catch(() => {});
    };
    fetchStoreHours();
    const unsubscribe = navigation.addListener('focus', fetchStoreHours);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!deliveryAvailable && orderType === 'delivery') setOrderType('pickup');
  }, [deliveryAvailable]);

  // Re-fetch delivery status on focus
  useEffect(() => {
    const fetchStatus = () => {
      fetch(`${API_BASE_URL}/admin/store-status`)
        .then(r => r.json())
        .then(d => setDeliveryAvailable(d.deliveryEnabled ?? true))
        .catch(() => {});
    };
    fetchStatus();
    const unsubscribe = navigation.addListener('focus', fetchStatus);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadAddresses);
    return unsubscribe;
  }, [navigation, loadAddresses]);

  const useCurrentLocation = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to use this feature.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (place) {
        const label = [place.name, place.street, place.district, place.city].filter(Boolean).join(', ');
        setSelectedAddress({ _id: 'current', type: 'other', address: label, city: place.city || '', isCurrentLocation: true });
        setAddrModalVisible(false);
      }
    } catch {
      Alert.alert('Error', 'Could not fetch your location.');
    } finally {
      setLocLoading(false);
      isFetchingRef.current = false;
    }
  };

  const deliveryLabel = selectedAddress
    ? selectedAddress.address
    : 'Select address';

  const getQty = (itemId) => cartItems.find(i => (i._id || i.id) === itemId)?.quantity || 0;

  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQty, setItemQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [refreshing, setRefreshing] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % VEGGIE_SUGGESTIONS.length), 1500);
    return () => clearInterval(t);
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await menuAPI.getItems({});
      // filter out of stock globally
      const raw = res.data || [];
      setFoodItems([...raw.filter(i => i.availability?.isAvailable !== false), ...raw.filter(i => i.availability?.isAvailable === false)]);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMenu(), loadAddresses()]);
    setRefreshing(false);
  }, [loadMenu, loadAddresses]);

  useEffect(() => {
    const t = setTimeout(loadMenu, 400);
    return () => clearTimeout(t);
  }, [loadMenu]);


  const menuSectionHeader = null; // removed, now inline

  const filteredItems = foodItems.filter(item =>
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build category sections
  const categorySections = (() => {
    const map = {};
    filteredItems.forEach(item => {
      const cat = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return Object.entries(map).map(([name, items]) => ({ name, items }));
  })();

  const renderCard = (item) => {
    const qty = getQty(item._id);
    return (
      <View key={item._id} style={{ marginRight: rs(10) }}>
        <FoodCard
          item={item}
          qty={qty}
          compact
          cardWidth={rs(148)}
          isOpen={restaurantOpen}
          nextAvailableLabel={nextOpenTime ? `Opens at ${formatTime12(nextOpenTime)}` : 'Closed'}
          onPress={() => { setSelectedItem(item); setItemQty(1); setSelectedVariant(item.variants?.[0] ?? null); }}
          onAdd={() => {
            if (item.variants?.length > 0) { setSelectedItem(item); setItemQty(1); setSelectedVariant(item.variants[0]); }
            else addToCart(item);
          }}
          onRemove={() => updateQuantity(item._id || item.id, qty - 1)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(10) }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.7} onPress={() => setAddrModalVisible(true)}>
            <Ionicons name="location" size={rs(18)} color={colors.primary} />
            <View>
              <Text style={styles.deliverTo}>{t.deliverTo}</Text>
              <View style={styles.locationValueRow}>
                <Text style={styles.locationText} numberOfLines={1}>{deliveryLabel || t.selectAddress}</Text>
                <Ionicons name="chevron-down" size={rs(14)} color={colors.text} />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={rs(22)} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Cart', { orderType })}>
              <Ionicons name="bag-outline" size={rs(22)} color={colors.text} />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.deliveryByRow}>
          <Ionicons name="bicycle-outline" size={rs(14)} color={colors.primary} />
          <Text style={styles.deliveryByText}>Delivery by <Text style={styles.deliveryByBold}>30–45 min</Text></Text>
          <View style={styles.deliveryByDot} />
          <Text style={styles.deliveryByText}>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={rs(18)} color={colors.placeholder} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder={`Search ${VEGGIE_SUGGESTIONS[placeholderIdx]}...`}
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={rs(18)} color={colors.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, itemCount > 0 && styles.listWithCart]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <ImageSlider navigation={navigation} />

        {/* Category image strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: rs(16), paddingVertical: vs(14), gap: rs(12) }}>
          {CATEGORY_IMAGES.map(cat => (
            <TouchableOpacity key={cat.id} activeOpacity={0.85}
              onPress={() => navigation.navigate('AllProducts', { category: cat.label })}
              style={{ alignItems: 'center' }}
            >
              <View style={styles.catImageWrap}>
                <RNImage source={cat.src} style={styles.catImage} resizeMode="cover" />
              </View>
              <Text style={styles.catImageLabel} numberOfLines={1}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {!restaurantOpen && (
          <View style={styles.closedBanner}>
            <Ionicons name="time-outline" size={rs(16)} color="#fff" />
            <Text style={styles.closedBannerText}>We're currently closed{restaurantHours ? `. Hours: ${restaurantHours}` : ''}</Text>
          </View>
        )}



        {/* Category-wise sections */}
        {loading ? (
          <View style={{ paddingHorizontal: rs(8) }}>
            {[1,2,3].map(i => <FoodCardSkeleton key={i} />)}
          </View>
        ) : categorySections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🥦</Text>
            <Text style={styles.emptyTitle}>{t.nothingFound}</Text>
            <Text style={styles.emptySubtitle}>{t.tryDifferent}</Text>
          </View>
        ) : (
          categorySections.map(({ name, items }) => (
            <View key={name} style={styles.catSection}>
              <View style={styles.catSectionHeader}>
                <Text style={styles.catSectionTitle}>{name}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AllProducts', { category: name })} activeOpacity={0.7}>
                  <Text style={styles.showMoreText}>Show More</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {items.slice(0, 10).map(renderCard)}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating cart bar — like Swiggy */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart', { orderType })}
          activeOpacity={0.92}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>{t.items}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.floatingCartTotal}>₹{total}</Text>
            <Text style={styles.floatingCartAction}>{t.viewCart} →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Item Detail Modal — Blinkit style */}
      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.itemModalOverlay}>
          <TouchableOpacity style={styles.itemModalDismiss} onPress={() => setSelectedItem(null)} />
          <View style={styles.itemModalSheet}>
            {selectedItem && (
              <>
                <View style={styles.itemModalHandle} />

                {/* Close button */}
                <TouchableOpacity style={styles.itemModalClose} onPress={() => setSelectedItem(null)}>
                  <Ionicons name="close" size={rs(18)} color={colors.text} />
                </TouchableOpacity>

                {/* Image + name/description side by side */}
                <View style={styles.itemModalTopRow}>
                  {selectedItem.image && selectedItem.image.startsWith('/uploads') ? (
                    <Image
                      source={{ uri: `${API_BASE_URL.replace('/api', '')}${selectedItem.image}` }}
                      style={styles.itemModalThumb}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.itemModalThumbPlaceholder}>
                      <Text style={styles.itemModalBigEmoji}>{selectedItem.image || '🥦'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemModalName}>{selectedItem.name}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.itemModalDivider} />

                {/* Variant rows — each is a full-width selectable row */}
                {selectedItem?.variants?.length > 0 ? (
                  <View style={styles.itemModalVariantList}>
                    {selectedItem.variants.map((v, idx) => {
                      const isSelected = selectedVariant?.label === v.label;
                      const mrp = Number(v.marketPrice || 0);
                      const disc = mrp > v.price ? Math.round(((mrp - v.price) / mrp) * 100) : 0;
                      return (
                        <TouchableOpacity
                          key={v.label}
                          style={[styles.variantRow, isSelected && styles.variantRowActive, idx < selectedItem.variants.length - 1 && styles.variantRowBorder]}
                          onPress={() => setSelectedVariant(v)}
                          activeOpacity={0.8}
                        >
                          {/* Radio */}
                          <View style={[styles.variantRadio, isSelected && styles.variantRadioActive]}>
                            {isSelected && <View style={styles.variantRadioDot} />}
                          </View>
                          {/* Label + discount badge */}
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.variantRowLabel, isSelected && styles.variantRowLabelActive]}>{v.label}</Text>
                            <View style={styles.variantDiscountBadge}>
                              <Text style={styles.variantDiscountBadgeText}>{disc > 0 ? `${disc}% OFF` : ''}</Text>
                            </View>
                          </View>
                          {/* Price + MRP on right */}
                          <View style={{ alignItems: 'flex-end' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(6) }}>
                              {mrp > v.price && <Text style={styles.variantRowMrp}>₹{mrp}</Text>}
                              <Text style={[styles.variantRowPrice, isSelected && styles.variantRowPriceActive]}>₹{v.price}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.itemModalSinglePrice}>
                    <Text style={styles.itemModalSinglePriceText}>₹{selectedItem.price}</Text>
                    {Number(selectedItem.marketPrice) > Number(selectedItem.price) && (
                      <Text style={styles.itemModalSingleMrp}>MRP ₹{selectedItem.marketPrice}</Text>
                    )}
                  </View>
                )}

                {/* Sticky footer: qty + add button */}
                <View style={styles.itemModalFooter}>
                  {isOutOfStock(selectedItem) ? (
                    <View style={styles.itemModalOutOfStockBtn}>
                      <Ionicons name="close-circle-outline" size={rs(18)} color="#EF4444" />
                      <Text style={styles.itemModalOutOfStockText}>{t.currentlyOutOfStock}</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.itemModalQtyRow}>
                        <TouchableOpacity style={styles.itemModalQtyBtn} onPress={() => setItemQty(q => Math.max(1, q - 1))}>
                          <Ionicons name="remove" size={rs(16)} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.itemModalQtyText}>{itemQty}</Text>
                        <TouchableOpacity style={[styles.itemModalQtyBtn, styles.itemModalQtyBtnFilled]} onPress={() => setItemQty(q => q + 1)}>
                          <Ionicons name="add" size={rs(16)} color="#fff" />
                        </TouchableOpacity>
                      </View>
                      {restaurantOpen ? (
                        <TouchableOpacity
                          style={styles.itemModalAddBtn}
                          activeOpacity={0.88}
                          onPress={() => {
                            const cartItem = selectedVariant
                              ? { ...selectedItem, price: selectedVariant.price, selectedVariant }
                              : selectedItem;
                            for (let i = 0; i < itemQty; i++) addToCart(cartItem);
                            setSelectedItem(null);
                          }}
                        >
                          <Text style={styles.itemModalAddBtnText}>
                            {t.addToCartLabel}  ₹{((selectedVariant?.price ?? selectedItem.price) * itemQty).toFixed(0)}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.itemModalClosedBtn}>
                          <Text style={styles.itemModalClosedText}>
                            {nextOpenTime ? `${t.currentlyClosed}: ${formatTime12(nextOpenTime)}` : t.currentlyClosed}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Address Picker Modal */}
      <Modal visible={addrModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.chooseDeliveryAddress}</Text>
              <TouchableOpacity onPress={() => setAddrModalVisible(false)}>
                <Ionicons name="close" size={rs(22)} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.locBtn} onPress={useCurrentLocation} disabled={locLoading} activeOpacity={0.8}>
              <View style={styles.locIconWrap}>
                {locLoading
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Ionicons name="navigate" size={rs(18)} color={colors.primary} />}
              </View>
              <View>
                <Text style={styles.locBtnTitle}>{t.useCurrentLocation}</Text>
                <Text style={styles.locBtnSub}>{t.autoDetectGPS}</Text>
              </View>
            </TouchableOpacity>

            {addresses.length > 0 && (
              <>
                <Text style={styles.savedLabel}>{t.savedAddressesLabel}</Text>
                {addresses.map(addr => (
                  <TouchableOpacity
                    key={addr._id}
                    style={[styles.addrOption, selectedAddress?._id === addr._id && styles.addrOptionActive]}
                    onPress={() => { setSelectedAddress(addr); setAddrModalVisible(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.addrOptionIcon, selectedAddress?._id === addr._id && styles.addrOptionIconActive]}>
                      <Ionicons name={TYPE_ICONS[addr.type] || 'location-outline'} size={rs(16)} color={selectedAddress?._id === addr._id ? '#fff' : colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addrOptionType}>{addr.type?.toUpperCase()}</Text>
                      <Text style={styles.addrOptionText} numberOfLines={2}>
                        {addr.address}{addr.city ? `, ${addr.city}` : ''}
                      </Text>
                    </View>
                    {selectedAddress?._id === addr._id && <Ionicons name="checkmark-circle" size={rs(20)} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </>
            )}

            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => { setAddrModalVisible(false); navigation.navigate('SavedAddresses'); }}
            >
              <Ionicons name="add-circle-outline" size={rs(18)} color={colors.primary} />
              <Text style={styles.manageBtnText}>{t.manageAddAddresses}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: rs(16),
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    ...shadows.small,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(10),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    flex: 1,
    minWidth: 0,
    marginRight: rs(8),
  },
  deliverTo: { fontSize: ms(10), color: colors.placeholder, fontWeight: '600', letterSpacing: 0.5 },
  locationValueRow: { flexDirection: 'row', alignItems: 'center', gap: rs(3) },
  locationText: { fontSize: ms(14), color: colors.text, fontWeight: '700', maxWidth: rs(190) },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: rs(2) },
  outletChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    paddingHorizontal: rs(10), paddingVertical: vs(5),
  },
  outletChipText: { fontSize: ms(11), fontWeight: '700', color: colors.text, maxWidth: rs(70) },
  headerIconBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartBadge: {
    position: 'absolute', top: rs(4), right: rs(4),
    backgroundColor: colors.primary,
    width: rs(16), height: rs(16), borderRadius: rs(8),
    justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: ms(9), fontWeight: '800' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: rs(12),
    paddingVertical: vs(11),
    gap: rs(8),
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: ms(13), color: colors.text },


  // Welcome Banner
  welcomeCard: {
    backgroundColor: colors.navy,
    paddingHorizontal: rs(16),
    paddingTop: vs(20),
    paddingBottom: vs(16),
    marginHorizontal: rs(16),
    marginTop: vs(14),
    marginBottom: vs(4),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginBottom: vs(2) },
  welcomeGreeting: { fontSize: ms(14), color: 'rgba(255,255,255,0.86)', fontWeight: '600' },
  waveEmoji: { fontSize: ms(16) },
  welcomeTextBlock: { flex: 1, justifyContent: 'center' },
  logoImg: { width: rs(130), height: vs(36), marginBottom: vs(3) },
  tagline: { fontSize: ms(12), color: 'rgba(255,255,255,0.72)', fontWeight: '500' },
  heroBadge: {
    width: rs(74),
    height: rs(74),
    borderRadius: rs(22),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  heroBadgeEmoji: { fontSize: ms(38) },
  statsRow: { flexDirection: 'row', gap: rs(8) },
  statChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md,
    paddingHorizontal: rs(10),
    paddingVertical: vs(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  statIcon: { fontSize: ms(14) },
  statLabel: { fontSize: ms(11), color: '#fff', fontWeight: '700', flexShrink: 1 },

  // Banners
  bannerListContent: { paddingHorizontal: rs(16), gap: rs(12), paddingTop: vs(12), paddingBottom: vs(8) },
  bannerCard: { borderRadius: borderRadius.lg, overflow: 'hidden', marginRight: rs(12), ...shadows.small },
  bannerGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: rs(18), paddingVertical: vs(20), borderRadius: borderRadius.lg,
  },
  bannerContent: { flex: 1, marginRight: rs(8) },
  bannerPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: rs(8), paddingVertical: vs(3),
    marginBottom: vs(6),
  },
  bannerPillText: { fontSize: ms(9), fontWeight: '800', color: '#fff', letterSpacing: 0.8 },
  bannerTitle: { fontSize: ms(17), fontWeight: '900', color: '#fff', marginBottom: vs(5), lineHeight: ms(22) },
  bannerSubtitle: { fontSize: ms(12), color: 'rgba(255,255,255,0.85)', lineHeight: ms(17) },
  bannerEmoji: { fontSize: ms(50) },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: rs(5), marginTop: vs(2), marginBottom: vs(8) },
  dot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: rs(20), borderRadius: rs(3) },

  // Categories
  sectionHeader: { paddingHorizontal: rs(16), marginTop: vs(8), marginBottom: vs(10), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: ms(16), fontWeight: '800', color: colors.text },
  categoriesContent: { paddingHorizontal: rs(16), gap: rs(12), paddingBottom: vs(6) },
  categoryChip: {
    width: rs(74),
    alignItems: 'center',
    gap: vs(6),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.md,
    paddingVertical: vs(10),
    ...shadows.small,
  },
  categoryChipActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  categoryEmojiWrap: {
    width: rs(44), height: rs(44), borderRadius: rs(14),
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  categoryEmojiWrapActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  categoryEmoji: { fontSize: ms(24) },
  categoryLabel: { fontSize: ms(11), fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  categoryLabelActive: { color: colors.primary, fontWeight: '800' },

  // Menu section header
  menuSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: rs(16), marginTop: vs(14), marginBottom: vs(8),
  },
  menuSectionTitle: { fontSize: ms(16), fontWeight: '800', color: colors.text },
  menuSectionCount: { fontSize: ms(13), color: colors.placeholder },

  // Food list
  list: { paddingBottom: vs(24) },
  listWithCart: { paddingBottom: vs(80) },

  catSection: { marginTop: vs(16) },
  catSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: rs(16), marginBottom: vs(10),
  },
  catSectionTitle: { fontSize: ms(16), fontWeight: '800', color: colors.text },
  catSectionCount: { fontSize: ms(12), color: colors.placeholder },
  showMoreText: { fontSize: ms(13), fontWeight: '700', color: colors.primary },
  catRow: { paddingHorizontal: rs(16), paddingBottom: vs(4) },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: vs(8) },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: colors.success,
    paddingHorizontal: rs(6), paddingVertical: vs(2),
    borderRadius: borderRadius.xs,
  },
  ratingText: { fontSize: ms(11), fontWeight: '700', color: '#fff' },
  ratingCount: { fontSize: ms(11), color: colors.placeholder },

  // Item detail modal — Blinkit style
  itemModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  itemModalDismiss: { flex: 1 },
  itemModalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20),
    paddingBottom: vs(28),
    overflow: 'hidden',
  },
  itemModalHandle: {
    width: rs(36), height: vs(4), borderRadius: rs(2),
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: vs(10), marginBottom: vs(4),
  },
  itemModalClose: {
    position: 'absolute', top: vs(12), right: rs(16),
    width: rs(30), height: rs(30), borderRadius: rs(15),
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 10,
  },
  itemModalTopRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(14),
    paddingHorizontal: rs(20), paddingTop: vs(14), paddingBottom: vs(10),
  },
  itemModalThumb: {
    width: rs(80), height: rs(80),
    borderRadius: borderRadius.md,
    backgroundColor: '#F7F9F2',
    flexShrink: 0,
  },
  itemModalThumbPlaceholder: {
    width: rs(80), height: rs(80),
    borderRadius: borderRadius.md,
    backgroundColor: '#F7F9F2',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  itemModalBigEmoji: { fontSize: ms(44) },
  itemModalName: { fontSize: ms(16), fontWeight: '800', color: colors.text, marginBottom: vs(4) },
  itemModalDesc: { fontSize: ms(12), color: colors.placeholder, lineHeight: ms(18) },
  itemModalDivider: { height: 1, backgroundColor: colors.divider, marginHorizontal: rs(20), marginBottom: vs(4) },
  itemModalVariantList: { paddingHorizontal: rs(20) },
  variantRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    paddingVertical: vs(13),
  },
  variantRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  variantRowActive: { backgroundColor: 'transparent' },
  variantRadio: {
    width: rs(20), height: rs(20), borderRadius: rs(10),
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  variantRadioActive: { borderColor: colors.primary },
  variantRadioDot: {
    width: rs(10), height: rs(10), borderRadius: rs(5),
    backgroundColor: colors.primary,
  },
  variantRowLabel: { fontSize: ms(14), fontWeight: '700', color: colors.text },
  variantRowLabelActive: { color: colors.primary },
  variantDiscountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(6), paddingVertical: vs(2),
    marginTop: vs(3),
  },
  variantDiscountBadgeText: { fontSize: ms(10), fontWeight: '800', color: '#E65100' },
  variantRowMrp: { fontSize: ms(11), color: colors.placeholder, textDecorationLine: 'line-through' },
  variantRowPrice: { fontSize: ms(15), fontWeight: '800', color: colors.text },
  variantRowPriceActive: { color: colors.primary },
  itemModalSinglePrice: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    paddingHorizontal: rs(20), paddingVertical: vs(10),
  },
  itemModalSinglePriceText: { fontSize: ms(18), fontWeight: '900', color: colors.text },
  itemModalSingleMrp: { fontSize: ms(13), color: colors.placeholder, textDecorationLine: 'line-through' },
  itemModalFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(20), paddingTop: vs(12), gap: rs(12),
    borderTopWidth: 1, borderTopColor: colors.divider, marginTop: vs(4),
  },
  itemModalQtyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs, overflow: 'hidden',
  },
  itemModalQtyBtn: {
    width: rs(36), height: rs(36),
    justifyContent: 'center', alignItems: 'center',
  },
  itemModalQtyBtnFilled: { backgroundColor: colors.primary },
  itemModalQtyText: {
    fontSize: ms(15), fontWeight: '800', color: colors.primary,
    paddingHorizontal: rs(14),
  },
  itemModalAddBtn: {
    flex: 1, backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: vs(13),
    alignItems: 'center',
  },
  itemModalAddBtnText: { color: '#fff', fontSize: ms(15), fontWeight: '800' },

  // Address modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    padding: rs(20),
    paddingBottom: vs(36),
    maxHeight: '82%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(16) },
  modalTitle: { fontSize: ms(17), fontWeight: '700', color: colors.text },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    padding: rs(14), borderRadius: borderRadius.md,
    backgroundColor: colors.primarySurface,
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  locIconWrap: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  locBtnTitle: { fontSize: ms(14), fontWeight: '700', color: colors.primary },
  locBtnSub: { fontSize: ms(12), color: colors.textSecondary, marginTop: vs(1) },
  savedLabel: { fontSize: ms(12), fontWeight: '700', color: colors.placeholder, letterSpacing: 0.5, marginBottom: vs(8) },
  addrOption: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    padding: rs(12), borderRadius: borderRadius.sm,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, marginBottom: vs(8),
  },
  addrOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  addrOptionIcon: {
    width: rs(36), height: rs(36), borderRadius: rs(10),
    backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center',
  },
  addrOptionIconActive: { backgroundColor: colors.primary },
  addrOptionType: { fontSize: ms(11), fontWeight: '700', color: colors.text, letterSpacing: 0.5 },
  addrOptionText: { fontSize: ms(13), color: colors.textSecondary, marginTop: vs(1) },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    paddingVertical: vs(13),
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginTop: vs(8),
    backgroundColor: colors.surface,
  },
  manageBtnText: { fontSize: ms(14), color: colors.primary, fontWeight: '700' },

  deliveryByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginBottom: vs(10),
  },
  deliveryByText: { fontSize: ms(12), color: colors.textSecondary, fontWeight: '500' },
  deliveryByBold: { fontWeight: '700', color: colors.primary },
  deliveryByDot: {
    width: rs(3), height: rs(3), borderRadius: rs(2),
    backgroundColor: colors.placeholder,
  },
  loader: { marginVertical: vs(30) },
  closedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: colors.error,
    paddingHorizontal: rs(16), paddingVertical: vs(10),
    marginHorizontal: rs(16), marginTop: vs(8),
    borderRadius: borderRadius.sm,
  },
  closedBannerText: { color: '#fff', fontSize: ms(13), fontWeight: '600', flex: 1 },
  closedTag: {
    borderWidth: 1.5, borderColor: colors.placeholder,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8), paddingVertical: vs(5),
    backgroundColor: colors.background,
  },
  closedTagText: { fontSize: ms(10), fontWeight: '700', color: colors.placeholder, textAlign: 'center' },
  itemModalClosedBtn: {
    flex: 1, backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingVertical: vs(12),
    alignItems: 'center',
  },
  itemModalClosedText: { color: colors.textSecondary, fontSize: ms(13), fontWeight: '700' },
itemModalOutOfStockBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    borderRadius: borderRadius.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5, borderColor: '#EF4444',
    paddingVertical: vs(12),
  },
  itemModalOutOfStockText: { color: '#EF4444', fontSize: ms(14), fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: vs(60), paddingHorizontal: rs(32) },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(18), fontWeight: '800', color: colors.text, marginBottom: vs(6) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder },

  // Floating cart bar — Swiggy style
  floatingCart: {
    position: 'absolute',
    left: rs(14),
    right: rs(14),
    bottom: vs(10),
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: vs(11),
    paddingHorizontal: rs(14),
    borderRadius: borderRadius.sm,
    ...shadows.large,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  floatingCartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: rs(26), height: rs(26), borderRadius: rs(13),
    justifyContent: 'center', alignItems: 'center',
  },
  floatingCartBadgeText: { color: '#fff', fontSize: ms(12), fontWeight: '800' },
  floatingCartLabel: { color: '#fff', fontSize: ms(13), fontWeight: '700' },
  floatingCartRight: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(12),
    paddingVertical: vs(5),
  },
  floatingCartTotal: { color: '#fff', fontSize: ms(14), fontWeight: '800' },
  floatingCartAction: { color: 'rgba(255,255,255,0.88)', fontSize: ms(11), fontWeight: '700' },

  catImageWrap: {
    width: rs(72), height: rs(72),
    borderRadius: rs(16),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  catImage: { width: '100%', height: '100%' },
  catImageLabel: { fontSize: ms(11), fontWeight: '700', color: colors.text, marginTop: vs(5), textAlign: 'center', maxWidth: rs(72), numberOfLines: 1 },
});
