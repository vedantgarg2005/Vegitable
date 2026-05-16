import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, FlatList, ScrollView, StyleSheet, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions, Image,
} from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { menuAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { colors, spacing, shadows, borderRadius, ms, rs, vs, fonts } from '../../utils/theme';

const { width: W } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'Pizza',       icon: '🍕' },
  { name: 'Burgers',     icon: '🍔' },
  { name: 'Pasta',       icon: '🍝' },
  { name: 'Sides',       icon: '🍟' },
  { name: 'Beverages',   icon: '🥤' },
  { name: 'Desserts',    icon: '🍰' },
];

const OFFERS = [
  { id: '1', title: '50% OFF', subtitle: 'On your first order', code: 'FIRST50', bg: '#E31837', emoji: '🍕' },
  { id: '2', title: 'BUY 1 GET 1', subtitle: 'On all large pizzas', code: 'BOGO', bg: '#1A1A2E', emoji: '🎉' },
  { id: '3', title: 'FREE DELIVERY', subtitle: 'On orders above ₹299', code: 'FREEDEL', bg: '#0F3460', emoji: '🛵' },
];

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const { addToCart, itemCount } = useCart();
  const insets = useSafeAreaInsets();
  const bannerRef = useRef(null);

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory.toLowerCase().replace(' ', '_');
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
    const timer = setTimeout(loadMenu, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      const next = (bannerIndex + 1) % OFFERS.length;
      setBannerIndex(next);
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [bannerIndex]);

  const BANNER_W = W - rs(48);

  const renderBanner = ({ item }) => (
    <View style={[styles.bannerCard, { backgroundColor: item.bg, width: BANNER_W }]}>
      <View style={styles.bannerTextBlock}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        <View style={styles.bannerCodePill}>
          <Text style={styles.bannerCode}>USE: {item.code}</Text>
        </View>
      </View>
      <Text style={styles.bannerEmoji}>{item.emoji}</Text>
    </View>
  );

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[styles.foodCard, shadows.medium]}
      onPress={() => navigation.navigate('MenuItemDetail', { item })}
      activeOpacity={0.9}
    >
      {/* Veg/Non-veg indicator */}
      <View style={styles.vegIndicatorTop}>
        <View style={[styles.vegBox, { borderColor: item.isVeg !== false ? colors.tagVeg : colors.tagNonVeg }]}>
          <View style={[styles.vegDot, { backgroundColor: item.isVeg !== false ? colors.tagVeg : colors.tagNonVeg }]} />
        </View>
      </View>

      <View style={styles.emojiBox}>
        <Text style={styles.foodEmoji}>{item.image || '🍕'}</Text>
      </View>

      <View style={styles.foodDetails}>
        <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.foodDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.foodFooter}>
          <Text style={styles.foodPrice}>₹{item.price}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => addToCart(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>ADD</Text>
            <Ionicons name="add" size={rs(14)} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation, addToCart]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.navy} translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(10) }]}>
        <View style={styles.headerTop}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={rs(16)} color={colors.primary} />
            <View>
              <Text style={styles.deliverTo}>DELIVER TO</Text>
              <Text style={styles.locationText} numberOfLines={1}>Home  <Ionicons name="chevron-down" size={rs(12)} color="#fff" /></Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="bag-outline" size={rs(22)} color="#fff" />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <Searchbar
          placeholder="Search for pizzas, burgers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={colors.primary}
          placeholderTextColor={colors.placeholder}
        />
      </View>

      <FlatList
        data={foodItems}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        ListHeaderComponent={
          <>
            {/* Offer Banners */}
            <FlatList
              ref={bannerRef}
              data={OFFERS}
              renderItem={renderBanner}
              keyExtractor={b => b.id}
              horizontal
              pagingEnabled={false}
              snapToInterval={BANNER_W + rs(12)}
              snapToAlignment="start"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              style={styles.bannerList}
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

            {/* Categories */}
            <Text style={styles.sectionLabel}>CATEGORIES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
              style={styles.categoriesScroll}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => setSelectedCategory(prev => prev === cat.name ? '' : cat.name)}
                  style={[styles.categoryTile, selectedCategory === cat.name && styles.categoryTileActive]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryTileIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryTileText, selectedCategory === cat.name && styles.categoryTileTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>
              {selectedCategory || 'ALL ITEMS'}
              <Text style={styles.sectionCount}>  {foodItems.length} items</Text>
            </Text>
          </>
        }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header — Domino's dark navy
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: vs(14),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  deliverTo: { fontSize: ms(10), color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, fontFamily: 'Poppins_700Bold' },
  locationText: { fontSize: ms(14), color: '#FFFFFF', fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  cartBtn: { position: 'relative', padding: rs(4) },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: rs(18),
    height: rs(18),
    borderRadius: rs(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: ms(10), fontWeight: '800' },
  searchBar: {
    borderRadius: borderRadius.sm,
    backgroundColor: '#FFFFFF',
    elevation: 0,
    minHeight: vs(46),
  },
  searchInput: { fontSize: ms(13), color: colors.text, fontFamily: 'Poppins_400Regular' },

  // Banners
  bannerList: { marginTop: vs(16) },
  bannerListContent: { paddingHorizontal: spacing.md, gap: rs(12) },
  bannerCard: {
    borderRadius: borderRadius.md,
    padding: rs(20),
    paddingVertical: vs(22),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: rs(12),
  },
  bannerTextBlock: { flex: 1, marginRight: rs(8) },
  bannerTitle: { fontSize: ms(22), fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, fontFamily: 'Poppins_900Black' },
  bannerSubtitle: { fontSize: ms(13), color: 'rgba(255,255,255,0.85)', marginTop: vs(2), marginBottom: vs(10), fontFamily: 'Poppins_400Regular' },
  bannerCodePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(10),
    paddingVertical: vs(4),
    alignSelf: 'flex-start',
  },
  bannerCode: { color: '#FFFFFF', fontSize: ms(11), fontWeight: '700', letterSpacing: 0.5, fontFamily: 'Poppins_700Bold' },
  bannerEmoji: { fontSize: ms(48) },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: rs(6), marginTop: vs(10) },
  dot: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: rs(18) },

  // Categories
  sectionLabel: {
    fontSize: ms(12),
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    marginTop: vs(18),
    marginBottom: vs(10),
    fontFamily: 'Poppins_800ExtraBold',
  },
  sectionCount: { fontSize: ms(12), fontWeight: '400', color: colors.placeholder, letterSpacing: 0, fontFamily: 'Poppins_400Regular' },
  categoriesScroll: { marginBottom: vs(4) },
  categoriesContent: { paddingHorizontal: spacing.md, gap: rs(10) },
  categoryTile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: rs(16),
    paddingVertical: vs(10),
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: vs(4),
  },
  categoryTileActive: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  categoryTileIcon: { fontSize: ms(22) },
  categoryTileText: { fontSize: ms(11), fontWeight: '700', color: colors.textSecondary, fontFamily: 'Poppins_700Bold' },
  categoryTileTextActive: { color: colors.primary },

  // Food Cards — Domino's 2-column grid
  list: { paddingHorizontal: spacing.sm, paddingBottom: vs(20) },
  foodCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    margin: rs(6),
    overflow: 'hidden',
    paddingBottom: rs(12),
  },
  vegIndicatorTop: { padding: rs(8), alignItems: 'flex-start' },
  vegBox: {
    width: rs(14),
    height: rs(14),
    borderRadius: rs(2),
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: { width: rs(6), height: rs(6), borderRadius: rs(3) },
  emojiBox: {
    backgroundColor: colors.background,
    height: vs(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodEmoji: { fontSize: ms(46) },
  foodDetails: { paddingHorizontal: rs(10), paddingTop: vs(6), paddingBottom: vs(4) },
  foodName: { fontSize: ms(13), fontWeight: '800', color: colors.text, marginBottom: vs(3), fontFamily: 'Poppins_800ExtraBold' },
  foodDescription: { fontSize: ms(11), color: colors.placeholder, lineHeight: ms(17), marginBottom: vs(8), fontFamily: 'Poppins_400Regular' },
  foodFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vs(2) },
  foodPrice: { fontSize: ms(15), fontWeight: '900', color: colors.text, fontFamily: 'Poppins_900Black' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8),
    paddingVertical: vs(5),
    gap: rs(2),
    minHeight: vs(30),
  },
  addBtnText: { fontSize: ms(12), fontWeight: '800', color: colors.primary, fontFamily: 'Poppins_800ExtraBold' },

  loader: { marginVertical: vs(30) },
  emptyContainer: { alignItems: 'center', paddingVertical: vs(60), paddingHorizontal: spacing.md },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(18), fontWeight: '800', color: colors.text, marginBottom: vs(6) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder },
});
