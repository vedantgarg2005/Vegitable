import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, FlatList, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions, Animated, TextInput,
  Modal, Alert,
} from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { menuAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../../utils/theme';
import { API_BASE_URL } from '../../utils/constants';

const TYPE_ICONS = { home: 'home-outline', work: 'briefcase-outline', other: 'location-outline' };

const { width: W } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'All',       emoji: '🍽️' },
  { name: 'Pizza',     emoji: '🍕' },
  { name: 'Burgers',   emoji: '🍔' },
  { name: 'Pasta',     emoji: '🍝' },
  { name: 'Sides',     emoji: '🍟' },
  { name: 'Beverages', emoji: '🥤' },
  { name: 'Desserts',  emoji: '🍰' },
];

const OFFERS = [
  { id: '1', title: '50% OFF up to ₹100', subtitle: 'Use code FIRST50 • First order only', bg: ['#E31837', '#A50E26'], emoji: '🎉' },
  { id: '2', title: 'Buy 1 Get 1 FREE', subtitle: 'On all large pizzas today', bg: ['#0F3460', '#1A1A2E'], emoji: '🍕' },
  { id: '3', title: 'Free Delivery', subtitle: 'On orders above ₹299', bg: ['#2E7D32', '#1B5E20'], emoji: '🛵' },
];

function WelcomeBanner({ user }) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    rotate.value = withRepeat(
      withSequence(
        withDelay(400, withTiming(8, { duration: 600, easing: Easing.inOut(Easing.sin) })),
        withTiming(-8, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 400 }),
      ),
      -1,
      false,
    );
  }, []);

  const glassStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const firstName = user?.name?.split(' ')[0] || 'Guest';

  return (
    <View style={styles.welcomeCard}>
      <View style={styles.welcomeTop}>
        <Text style={styles.welcomeGreeting}>Welcome,</Text>
        <Text style={styles.welcomeName}>{firstName} 👋</Text>
      </View>
      <View style={styles.welcomeBottom}>
        <View>
          <Text style={styles.helloText}>Hello</Text>
          <Text style={styles.summerText}>Summer</Text>
        </View>
        <Reanimated.View style={glassStyle}>
          <Text style={styles.juiceGlass}>🥤</Text>
        </Reanimated.View>
      </View>
    </View>
  );
}

// Swiggy-style horizontal food card
function FoodCard({ item, onPress, onAdd, qty }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleAdd = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onAdd();
  };

  return (
    <TouchableOpacity style={[styles.foodCard, shadows.small]} onPress={onPress} activeOpacity={0.92}>
      {/* Image / Emoji area */}
      <View style={styles.foodImageWrap}>
        <View style={styles.foodImageBg}>
          <Text style={styles.foodEmoji}>{item.image || '🍕'}</Text>
        </View>
        {/* Bestseller badge */}
        {item.ratings?.average >= 4.2 && (
          <View style={styles.bestsellerBadge}>
            <Text style={styles.bestsellerText}>⭐ BESTSELLER</Text>
          </View>
        )}
        {/* Veg/Non-veg dot */}
        <View style={[styles.vegBox, { borderColor: item.isVeg !== false ? colors.tagVeg : colors.tagNonVeg }]}>
          <View style={[styles.vegDot, { backgroundColor: item.isVeg !== false ? colors.tagVeg : colors.tagNonVeg }]} />
        </View>
      </View>

      {/* Info */}
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.foodDesc} numberOfLines={2}>{item.description}</Text>

        {item.ratings?.average != null && (
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={rs(10)} color="#fff" />
              <Text style={styles.ratingText}>{item.ratings.average.toFixed(1)}</Text>
            </View>
            {item.ratings?.count > 0 && (
              <Text style={styles.ratingCount}>{item.ratings.count} ratings</Text>
            )}
          </View>
        )}

        <View style={styles.foodFooter}>
          <Text style={styles.foodPrice}>₹{item.price}</Text>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {qty > 0 ? (
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => onAdd(-1)}>
                  <Ionicons name="remove" size={rs(14)} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnFilled]} onPress={handleAdd}>
                  <Ionicons name="add" size={rs(14)} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>ADD</Text>
                <Ionicons name="add" size={rs(13)} color={colors.primary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [orderType, setOrderType] = useState('delivery');
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

  useEffect(() => { loadMenu(); }, [selectedCategory]);
  useEffect(() => {
    const t = setTimeout(loadMenu, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

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
          <Text style={styles.bannerTitle}>{item.title}</Text>
          <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        </View>
        <Text style={styles.bannerEmoji}>{item.emoji}</Text>
      </View>
    </View>
  );

  const ListHeader = () => (
    <>
      {/* Welcome + Summer Banner */}
      <WelcomeBanner user={user} />

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

      {/* "What's on your mind?" — category scroll */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>What's on your mind?</Text>
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
          {selectedCategory === 'All' ? 'All Items' : selectedCategory}
        </Text>
        <Text style={styles.menuSectionCount}>{foodItems.length} items</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} translucent />

      {/* Sticky Header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(10) }]}>
        {/* Location row */}
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.7} onPress={() => setAddrModalVisible(true)}>
            <Ionicons name="location" size={rs(18)} color={colors.primary} />
            <View>
              <Text style={styles.deliverTo}>DELIVER TO</Text>
              <View style={styles.locationValueRow}>
                <Text style={styles.locationText} numberOfLines={1}>{deliveryLabel}</Text>
                <Ionicons name="chevron-down" size={rs(14)} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications-outline" size={rs(22)} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Cart', { orderType })}
            >
              <Ionicons name="bag-outline" size={rs(22)} color="#fff" />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery / Pickup toggle */}
        <View style={styles.orderTypeRow}>
          {['delivery', 'pickup'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.orderTypeBtn, orderType === type && styles.orderTypeBtnActive]}
              onPress={() => setOrderType(type)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={type === 'delivery' ? 'bicycle-outline' : 'storefront-outline'}
                size={rs(14)}
                color={orderType === type ? colors.primary : 'rgba(255,255,255,0.7)'}
              />
              <Text style={[styles.orderTypeBtnText, orderType === type && styles.orderTypeBtnTextActive]}>
                {type === 'delivery' ? 'Delivery' : 'Pickup'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={rs(18)} color={colors.placeholder} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search for pizzas, burgers..."
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
        renderItem={({ item }) => {
          const qty = getQty(item._id);
          return (
            <FoodCard
              item={item}
              qty={qty}
              onPress={() => navigation.navigate('MenuItemDetail', { item })}
              onAdd={(delta = 1) => {
                if (delta > 0) addToCart(item);
                else updateQuantity(item._id || item.id, qty - 1);
              }}
            />
          );
        }}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍕</Text>
              <Text style={styles.emptyTitle}>Nothing found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or category</Text>
            </View>
          )
        }
        ListFooterComponent={loading ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : null}
      />

      {/* Floating cart bar — like Swiggy */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: 0 }]}
          onPress={() => navigation.navigate('Cart', { orderType })}
          activeOpacity={0.92}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>item{itemCount > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartTotal}>₹{total}</Text>
            <Text style={styles.floatingCartAction}>View Cart →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Address Picker Modal */}
      <Modal visible={addrModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Address</Text>
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
                <Text style={styles.locBtnTitle}>Use Current Location</Text>
                <Text style={styles.locBtnSub}>Auto-detect via GPS</Text>
              </View>
            </TouchableOpacity>

            {addresses.length > 0 && (
              <>
                <Text style={styles.savedLabel}>Saved Addresses</Text>
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
              <Text style={styles.manageBtnText}>Manage / Add Addresses</Text>
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
    backgroundColor: colors.navy,
    paddingHorizontal: rs(16),
    paddingBottom: vs(14),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  deliverTo: { fontSize: ms(10), color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1 },
  locationValueRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  locationText: { fontSize: ms(15), color: '#fff', fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: rs(4) },
  headerIconBtn: { padding: rs(8), position: 'relative' },
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
    backgroundColor: '#fff',
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(12),
    paddingVertical: vs(10),
    gap: rs(8),
  },
  searchInput: { flex: 1, fontSize: ms(13), color: colors.text },

  // Order type toggle
  orderTypeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.full,
    padding: rs(3),
    marginBottom: vs(10),
    alignSelf: 'flex-start',
  },
  orderTypeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingHorizontal: rs(14), paddingVertical: vs(6),
    borderRadius: borderRadius.full,
  },
  orderTypeBtnActive: { backgroundColor: '#fff' },
  orderTypeBtnText: { fontSize: ms(13), fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  orderTypeBtnTextActive: { color: colors.primary },

  // Welcome Banner
  welcomeCard: {
    marginHorizontal: rs(16),
    marginTop: vs(16),
    marginBottom: vs(4),
    backgroundColor: colors.navy,
    borderRadius: borderRadius.lg,
    padding: rs(18),
    ...shadows.medium,
  },
  welcomeTop: {
    marginBottom: vs(10),
  },
  welcomeGreeting: {
    fontSize: ms(13),
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  welcomeName: {
    fontSize: ms(20),
    fontWeight: '800',
    color: '#fff',
    marginTop: vs(2),
  },
  welcomeBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helloText: {
    fontSize: ms(14),
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  summerText: {
    fontSize: ms(28),
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  juiceGlass: {
    fontSize: ms(64),
  },

  // Banners
  bannerListContent: { paddingHorizontal: rs(16), gap: rs(12), paddingVertical: vs(16) },
  bannerCard: { borderRadius: borderRadius.md, overflow: 'hidden', marginRight: rs(12) },
  bannerGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: rs(20), paddingVertical: vs(22), borderRadius: borderRadius.md,
  },
  bannerContent: { flex: 1, marginRight: rs(8) },
  bannerTitle: { fontSize: ms(18), fontWeight: '900', color: '#fff', marginBottom: vs(4) },
  bannerSubtitle: { fontSize: ms(12), color: 'rgba(255,255,255,0.85)' },
  bannerEmoji: { fontSize: ms(44) },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: rs(6), marginBottom: vs(4) },
  dot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: rs(18) },

  // Categories
  sectionHeader: { paddingHorizontal: rs(16), marginTop: vs(8), marginBottom: vs(12) },
  sectionTitle: { fontSize: ms(16), fontWeight: '800', color: colors.text },
  categoriesContent: { paddingHorizontal: rs(16), gap: rs(14), paddingBottom: vs(4) },
  categoryChip: { alignItems: 'center', gap: vs(6) },
  categoryEmojiWrap: {
    width: rs(60), height: rs(60), borderRadius: rs(30),
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
    ...shadows.small,
  },
  categoryEmojiWrapActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  categoryEmoji: { fontSize: ms(26) },
  categoryLabel: { fontSize: ms(11), fontWeight: '600', color: colors.textSecondary },
  categoryLabelActive: { color: colors.primary, fontWeight: '700' },

  // Menu section header
  menuSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: rs(16), marginTop: vs(16), marginBottom: vs(8),
  },
  menuSectionTitle: { fontSize: ms(16), fontWeight: '800', color: colors.text },
  menuSectionCount: { fontSize: ms(13), color: colors.placeholder },

  // Food list
  list: { paddingBottom: vs(100) },

  // Swiggy-style horizontal food card
  foodCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: rs(16),
    marginBottom: vs(1),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: vs(16),
    gap: rs(12),
  },
  foodImageWrap: { position: 'relative' },
  foodImageBg: {
    width: rs(110), height: rs(110),
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  foodEmoji: { fontSize: ms(52) },
  bestsellerBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: vs(3),
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  bestsellerText: { fontSize: ms(8), fontWeight: '800', color: '#FFD700', letterSpacing: 0.3 },
  vegBox: {
    position: 'absolute', top: rs(6), left: rs(6),
    width: rs(14), height: rs(14), borderRadius: rs(2),
    borderWidth: 1.5, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  vegDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },

  foodInfo: { flex: 1, justifyContent: 'space-between' },
  foodName: { fontSize: ms(14), fontWeight: '700', color: colors.text, marginBottom: vs(4) },
  foodDesc: { fontSize: ms(12), color: colors.placeholder, lineHeight: ms(18), marginBottom: vs(6) },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: vs(8) },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: colors.success,
    paddingHorizontal: rs(6), paddingVertical: vs(2),
    borderRadius: borderRadius.xs,
  },
  ratingText: { fontSize: ms(11), fontWeight: '700', color: '#fff' },
  ratingCount: { fontSize: ms(11), color: colors.placeholder },

  foodFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodPrice: { fontSize: ms(15), fontWeight: '800', color: colors.text },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(2),
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(14), paddingVertical: vs(6),
    backgroundColor: colors.primarySurface,
  },
  addBtnText: { fontSize: ms(13), fontWeight: '800', color: colors.primary },

  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: borderRadius.xs, overflow: 'hidden',
  },
  qtyBtn: {
    width: rs(30), height: rs(30),
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnFilled: { backgroundColor: colors.primary },
  qtyText: {
    fontSize: ms(13), fontWeight: '800', color: colors.primary,
    paddingHorizontal: rs(10),
  },

  // Address modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    padding: rs(20), paddingBottom: vs(36), maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(16) },
  modalTitle: { fontSize: ms(17), fontWeight: '700', color: colors.text },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    padding: rs(14), borderRadius: borderRadius.md,
    backgroundColor: colors.primarySurface, marginBottom: vs(16),
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
    borderWidth: 1.5, borderColor: colors.border,
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
    paddingVertical: vs(14), justifyContent: 'center',
    borderTopWidth: 1, borderTopColor: colors.divider, marginTop: vs(4),
  },
  manageBtnText: { fontSize: ms(14), color: colors.primary, fontWeight: '700' },

  loader: { marginVertical: vs(30) },
  emptyContainer: { alignItems: 'center', paddingVertical: vs(60), paddingHorizontal: rs(32) },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(18), fontWeight: '800', color: colors.text, marginBottom: vs(6) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder },

  // Floating cart bar — Swiggy style
  floatingCart: {
    position: 'absolute', left: 0, right: 0,
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: vs(8), paddingHorizontal: rs(16),
    ...shadows.large,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  floatingCartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: rs(26), height: rs(26), borderRadius: rs(13),
    justifyContent: 'center', alignItems: 'center',
  },
  floatingCartBadgeText: { color: '#fff', fontSize: ms(12), fontWeight: '800' },
  floatingCartLabel: { color: '#fff', fontSize: ms(14), fontWeight: '600' },
  floatingCartRight: { alignItems: 'flex-end' },
  floatingCartTotal: { color: '#fff', fontSize: ms(14), fontWeight: '800' },
  floatingCartAction: { color: 'rgba(255,255,255,0.8)', fontSize: ms(11), fontWeight: '600' },
});
