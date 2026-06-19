import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, FlatList, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions, Animated, TextInput,
  Modal, Alert, Image, RefreshControl,
} from 'react-native';
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

const TYPE_ICONS = { home: 'home-outline', work: 'briefcase-outline', other: 'location-outline' };

const { width: W } = Dimensions.get('window');

const VEGGIE_SUGGESTIONS = ['Tomatoes', 'Carrots', 'Spinach', 'Potatoes', 'Onions', 'Broccoli', 'Peppers', 'Cabbage'];


const CATEGORIES = [
  { name: 'All',        emoji: '🛒' },
  { name: 'Vegetables', emoji: '🥦' },
  { name: 'Fruits',     emoji: '🍎' },
  { name: 'Leafy',      emoji: '🥬' },
  { name: 'Exotic',     emoji: '🥭' },
  { name: 'Herbs',      emoji: '🌿' },
  { name: 'Organic',    emoji: '🌱' },
];

const OFFERS = [
  { id: '1', title: '20% OFF on Fresh Veggies', subtitle: 'Use code FRESH20 • Limited time', bg: ['#2E7D32', '#1B5E20'], emoji: '🥦' },
  { id: '2', title: 'Buy 1 Get 1 FREE', subtitle: 'On all seasonal fruits today', bg: ['#E65100', '#BF360C'], emoji: '🍎' },
  { id: '3', title: 'Free Delivery', subtitle: 'On orders above ₹299', bg: ['#1B3A1F', '#254D2A'], emoji: '🚚' },
];

const STATS = [
  { icon: '🌿', label: 'Farm Fresh' },
  { icon: '⚡', label: 'Fast Delivery' },
  { icon: '✅', label: 'Quality Check' },
];

function WelcomeBanner({ user }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const firstName = user?.name?.split(' ')[0] || 'Guest';

  return (
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeRow}>
        <View style={styles.welcomeTextBlock}>
          <View style={styles.greetingRow}>
            <Text style={styles.welcomeGreeting}>Hey, {firstName}!</Text>
            <Text style={styles.waveEmoji}>👋</Text>
          </View>
          <Text style={styles.summerText}>FreshBasket</Text>
          <Text style={styles.tagline}>Farm to your door, fresh every day</Text>
        </View>
        <Reanimated.View style={[floatStyle, styles.heroBadge]}>
          <Text style={styles.heroBadgeEmoji}>🛒</Text>
        </Reanimated.View>
      </View>
      <View style={styles.statsRow}>
        {STATS.map((s, i) => (
          <View key={i} style={styles.statChip}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [orderType, setOrderType] = useState('delivery');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const { addToCart, updateQuantity, items: cartItems, itemCount, total } = useCart();
  const insets = useSafeAreaInsets();
  const bannerRef = useRef(null);
  const searchRef = useRef(null);
  const BANNER_W = W - rs(32);

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
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory.toLowerCase().replace(' ', '_');
      if (searchQuery) params.search = searchQuery;
      const res = await menuAPI.getItems(params);
      setFoodItems(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMenu(), loadAddresses()]);
    setRefreshing(false);
  }, [loadMenu, loadAddresses]);

  useEffect(() => {
    const t = setTimeout(loadMenu, 400);
    return () => clearTimeout(t);
  }, [loadMenu]);

  // Auto-scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      const next = (bannerIndex + 1) % OFFERS.length;
      setBannerIndex(next);
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3500);
    return () => clearInterval(interval);
  }, [bannerIndex]);

  const renderBanner = ({ item }) => (
    <View style={[styles.bannerCard, { width: BANNER_W }]}>
      <View style={[styles.bannerGradient, { backgroundColor: item.bg[0] }]}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillText}>LIMITED OFFER</Text>
          </View>
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        </View>
        <Text style={styles.bannerEmoji}>{item.emoji}</Text>
      </View>
    </View>
  );

  const ListHeader = () => (
    <>
      <WelcomeBanner user={user} />

      {/* Restaurant closed banner */}
      {!restaurantOpen && (
        <View style={styles.closedBanner}>
          <Ionicons name="time-outline" size={rs(16)} color="#fff" />
          <Text style={styles.closedBannerText}>
            We're currently closed{restaurantHours ? `. Hours: ${restaurantHours}` : ''}
          </Text>
        </View>
      )}

      {/* Offer Banners */}
      <FlatList
        ref={bannerRef}
        data={OFFERS}
        renderItem={renderBanner}
        keyExtractor={b => b.id}
        horizontal
        pagingEnabled
        snapToInterval={BANNER_W + rs(12)}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerListContent}
        getItemLayout={(_, index) => ({
          length: BANNER_W + rs(12),
          offset: (BANNER_W + rs(12)) * index,
          index,
        })}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + rs(12)));
          setBannerIndex(Math.min(idx, OFFERS.length - 1));
        }}
      />
      {/* Banner dots */}
      <View style={styles.bannerDots}>
        {OFFERS.map((_, i) => (
          <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
        ))}
      </View>


      {/* Shop by Sport — category scroll */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.shopByCategory}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.name}
            onPress={() => setSelectedCategory(cat.name)}
            style={[styles.categoryChip, selectedCategory === cat.name && styles.categoryChipActive]}
            activeOpacity={0.8}
          >
            <View style={[styles.categoryEmojiWrap, selectedCategory === cat.name && styles.categoryEmojiWrapActive]}>
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            </View>
            <Text style={[styles.categoryLabel, selectedCategory === cat.name && styles.categoryLabelActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section label */}
      <View style={styles.menuSectionHeader}>
        <Text style={styles.menuSectionTitle}>
          {selectedCategory === 'All' ? t.allItems : selectedCategory}
        </Text>
        <Text style={styles.menuSectionCount}>{foodItems.length} {t.items}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(10) }]}>
        {/* Location row */}
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
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={rs(22)} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Cart', { orderType })}
            >
              <Ionicons name="bag-outline" size={rs(22)} color={colors.text} />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery by row */}
        <View style={styles.deliveryByRow}>
          <Ionicons name="bicycle-outline" size={rs(14)} color={colors.primary} />
          <Text style={styles.deliveryByText}>
            Delivery by <Text style={styles.deliveryByBold}>30–45 min</Text>
          </Text>
          <View style={styles.deliveryByDot} />
          <Text style={styles.deliveryByText}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
        </View>

        {/* Search bar */}
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

      <FlatList
        data={foodItems}
        numColumns={2}
        key="grid"
        renderItem={({ item }) => {
          const qty = getQty(item._id);
          return (
            <View style={{ flex: 1 }}>
              <FoodCard
                item={item}
                qty={qty}
                compact
                isOpen={restaurantOpen}
                nextAvailableLabel={nextOpenTime ? `Next available at: ${formatTime12(nextOpenTime)}` : 'Currently closed'}
                onPress={() => navigation.navigate('ProductDetail', { item })}
                onAdd={() => {
                  if (item.variants?.length > 0) {
                    setSelectedItem(item);
                    setItemQty(1);
                    setSelectedVariant(item.variants[0]);
                  } else {
                    addToCart(item);
                  }
                }}
                onRemove={() => updateQuantity(item._id || item.id, qty - 1)}
              />
            </View>
          );
        }}
        keyExtractor={item => item._id}
        contentContainerStyle={[styles.list, itemCount > 0 && styles.listWithCart]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🥦</Text>
              <Text style={styles.emptyTitle}>{t.nothingFound}</Text>
              <Text style={styles.emptySubtitle}>{t.tryDifferent}</Text>
            </View>
          )
        }
        ListFooterComponent={null}
        ListEmptyComponent={
          loading ? (
            <View>
              {[1,2,3,4,5].map(i => <FoodCardSkeleton key={i} />)}
            </View>
          ) : (
            !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🥦</Text>
                <Text style={styles.emptyTitle}>{t.nothingFound}</Text>
                <Text style={styles.emptySubtitle}>{t.tryDifferent}</Text>
              </View>
            )
          )
        }
      />

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
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartTotal}>₹{total}</Text>
            <Text style={styles.floatingCartAction}>{t.viewCart} →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Item Detail Modal */}
      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.itemModalOverlay}>
          <TouchableOpacity style={styles.itemModalDismiss} onPress={() => setSelectedItem(null)} />
          <View style={styles.itemModalSheet}>
            {selectedItem && (
              <>
                {/* Handle bar */}
                <View style={styles.itemModalHandle} />

                {/* Top row: image left, info right */}
                <View style={styles.itemModalTopRow}>
                  {/* Image */}
                  {selectedItem.image && selectedItem.image.startsWith('/uploads') ? (
                    <Image
                      source={{ uri: `${API_BASE_URL.replace('/api', '')}${selectedItem.image}` }}
                      style={styles.itemModalThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.itemModalThumbPlaceholder}>
                      <Text style={styles.itemModalEmoji}>{selectedItem.image || '🥦'}</Text>
                    </View>
                  )}

                  {/* Info: name, pack size, price */}
                  <View style={styles.itemModalInfo}>
                    <Text style={styles.itemModalName} numberOfLines={2}>{selectedItem.name}</Text>
                    {(selectedItem.unit || (selectedItem.variants?.length > 0 && selectedItem.variants[0].label)) ? (
                      <Text style={styles.itemModalPackSize}>
                        {selectedItem.variants?.length > 0 ? selectedItem.variants[0].label : selectedItem.unit}
                      </Text>
                    ) : null}
                    <Text style={styles.itemModalPrice}>₹{selectedVariant?.price ?? selectedItem.price}</Text>
                    {selectedItem.description ? (
                      <Text style={styles.itemModalDesc} numberOfLines={2}>{selectedItem.description}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Variant / Pack size picker */}
                {selectedItem?.variants?.length > 1 && (
                  <View style={styles.itemModalVariantWrap}>
                    <Text style={styles.itemModalBrand}>{t.selectPackSize}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: vs(8) }}>
                      {selectedItem.variants.map(v => (
                        <TouchableOpacity
                          key={v.label}
                          onPress={() => setSelectedVariant(v)}
                          style={[
                            styles.variantChip,
                            selectedVariant?.label === v.label && styles.variantChipActive,
                          ]}
                        >
                          <Text style={[styles.variantChipText, selectedVariant?.label === v.label && styles.variantChipTextActive]}>
                            {v.label}
                          </Text>
                          <Text style={[styles.variantChipPrice, selectedVariant?.label === v.label && styles.variantChipTextActive]}>
                            ₹{v.price}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Quantity + Add */}
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
  summerText: {
    fontSize: ms(28),
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: ms(34),
    marginBottom: vs(3),
  },
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
  list: { paddingHorizontal: rs(6), paddingBottom: vs(90) },
  listWithCart: { paddingBottom: vs(132) },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: vs(8) },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: colors.success,
    paddingHorizontal: rs(6), paddingVertical: vs(2),
    borderRadius: borderRadius.xs,
  },
  ratingText: { fontSize: ms(11), fontWeight: '700', color: '#fff' },
  ratingCount: { fontSize: ms(11), color: colors.placeholder },

  // Item detail modal
  itemModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  itemModalDismiss: { flex: 1 },
  itemModalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    paddingBottom: vs(32),
    overflow: 'hidden',
  },
  itemModalHandle: {
    width: rs(40), height: vs(4), borderRadius: rs(2),
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: vs(10), marginBottom: vs(12),
  },
  itemModalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: rs(20),
    gap: rs(14),
    marginBottom: vs(4),
  },
  itemModalThumb: {
    width: rs(100), height: rs(100),
    borderRadius: borderRadius.md,
    flexShrink: 0,
  },
  itemModalThumbPlaceholder: {
    width: rs(100), height: rs(100),
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    flexShrink: 0,
  },
  itemModalEmoji: { fontSize: ms(52) },
  itemModalInfo: { flex: 1, justifyContent: 'center', gap: vs(4) },
  itemModalBrand: { fontSize: ms(10), fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  itemModalName: { fontSize: ms(16), fontWeight: '800', color: colors.text, lineHeight: ms(22) },
  itemModalPackSize: { fontSize: ms(12), color: colors.textSecondary, fontWeight: '500' },
  itemModalDesc: { fontSize: ms(12), color: colors.placeholder, lineHeight: ms(18), marginTop: vs(2) },
  itemModalPrice: { fontSize: ms(18), fontWeight: '800', color: colors.primary },
  itemModalVariantWrap: { paddingHorizontal: rs(20), paddingTop: vs(12) },
  itemModalFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(20), paddingTop: vs(16), gap: rs(12),
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
    paddingVertical: vs(12),
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
  variantChip: {
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(12), paddingVertical: vs(6),
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  variantChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  variantChipText: { fontSize: ms(12), fontWeight: '700', color: colors.textSecondary },
  variantChipPrice: { fontSize: ms(11), fontWeight: '600', color: colors.placeholder, marginTop: vs(1) },
  variantChipTextActive: { color: colors.primary },
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
});
