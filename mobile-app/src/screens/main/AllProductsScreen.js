import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, SectionList, FlatList, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, Dimensions, Image,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { menuAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { colors, shadows, borderRadius } from '../../utils/theme';
import FoodCard from '../../components/FoodCard';
import { FoodCardSkeleton } from '../../components/SkeletonLoader';
import ItemModal from '../../components/ItemModal';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = 80;
const CARD_W = (SCREEN_W - 80 - 24) / 2;

const CAT_ICONS = {
  vegetables: '🥦',
  fruits: '🍎',
  leafy: '🥬',
  exotic: '🥭',
  herbs: '🌿',
  organic: '🌱',
  dairy: '🥛',
  grains: '🌾',
  spices: '🫙',
  other: '🛒',
};
const CAT_IMAGES = [
  { keys: ['vegetables', 'vegetable'], src: require('../../../assets/Vegetables.webp') },
  { keys: ['fruits', 'fruit'], src: require('../../../assets/Fruits.webp') },
  { keys: ['exotic', 'exotic veggie', 'exotic vegetable', 'exoticvegetable'], src: require('../../../assets/ExocticVegetable.webp') },
  { keys: ['exoticfruits', 'exotic fruits', 'exotic fruit', 'exoticfruit'], src: require('../../../assets/ExocticFruits.webp') },
  { keys: ['bakery'], src: require('../../../assets/Bakery.webp') },
];
const getCatImage = (name) => {
  const lower = name?.toLowerCase().replace(/\s+/g, '') || '';
  const lowerSpaced = name?.toLowerCase() || '';
  const entry = CAT_IMAGES.find(c => c.keys.some(k => k.replace(/\s+/g, '') === lower || k === lowerSpaced));
  return entry?.src || null;
};
const getCatEmoji = (name) => CAT_ICONS[name?.toLowerCase()] || '🛒';

export default function AllProductsScreen({ navigation, route }) {
  const { category: initCategory, search: initSearch } = route.params || {};
  const { addToCart, updateQuantity, items: cartItems, itemCount, total } = useCart();
  const insets = useSafeAreaInsets();

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(initCategory || null);

  const sectionListRef = useRef(null);
  const catListRef = useRef(null);
  const isManualScroll = useRef(false);

  const [selectedItem, setSelectedItem] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await menuAPI.getItems({});
      const raw = res.data || [];
      const data = [...raw.filter(i => i.availability?.isAvailable !== false), ...raw.filter(i => i.availability?.isAvailable === false)];
      setAllItems(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    if (initSearch && allItems.length > 0) {
      const match = allItems.find(i => i.name.toLowerCase().includes(initSearch.toLowerCase()));
      if (match) setSelectedItem(match);
    }
  }, [allItems, initSearch]);

  const getQty = (id) => cartItems.find(i => (i._id || i.id) === id)?.quantity || 0;

  // Build paired sections
  const pairedSections = useMemo(() => {
    const filtered = search
      ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
      : initSearch
      ? allItems.filter(i => i.name.toLowerCase().includes(initSearch.toLowerCase()))
      : allItems;
    const map = {};
    filtered.forEach(item => {
      const cat = item.category
        ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
        : 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return Object.entries(map).map(([title, data]) => {
      const pairs = [];
      for (let i = 0; i < data.length; i += 2) {
        pairs.push({ id: `${title}-${i}`, left: data[i], right: data[i + 1] || null });
      }
      return { title, data: pairs };
    });
  }, [allItems, search]);

  const categories = pairedSections.map(s => s.title);

  const filteredSections = activeCategory
    ? pairedSections.filter(s => s.title === activeCategory)
    : pairedSections;

  useEffect(() => {
    if (!activeCategory && categories.length > 0) setActiveCategory(categories[0]);
  }, [categories.length]);

  const scrollToCategory = useCallback((catName) => {
    setActiveCategory(catName);
    setTimeout(() => {
      sectionListRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: false, viewOffset: 0 });
    }, 50);
  }, []);

  const onViewableItemsChanged = useCallback(() => {}, []);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeaderHidden} />
  );

  const renderPair = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.cardWrap}>
        <FoodCard
          item={item.left}
          qty={getQty(item.left._id)}
          compact
          isOpen
          onPress={() => setSelectedItem(item.left)}
          onAdd={() => {
            if (item.left.variants?.length > 0) setSelectedItem(item.left);
            else addToCart(item.left);
          }}
          onRemove={() => updateQuantity(item.left._id, getQty(item.left._id) - 1)}
        />
      </View>
      {item.right ? (
        <View style={styles.cardWrap}>
          <FoodCard
            item={item.right}
            qty={getQty(item.right._id)}
            compact
            isOpen
            onPress={() => setSelectedItem(item.right)}
            onAdd={() => {
              if (item.right.variants?.length > 0) setSelectedItem(item.right);
              else addToCart(item.right);
            }}
            onRemove={() => updateQuantity(item.right._id, getQty(item.right._id) - 1)}
          />
        </View>
      ) : <View style={styles.cardWrap} />}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3, 4].map(i => <FoodCardSkeleton key={i} />)}
        </View>
      ) : (
        <View style={styles.body}>

          {/* LEFT SIDEBAR */}
          <FlatList
            ref={catListRef}
            data={categories}
            keyExtractor={c => c}
            showsVerticalScrollIndicator={false}
            style={styles.sidebar}
            getItemLayout={(_, i) => ({ length: 70, offset: 70 * i, index: i })}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item: cat }) => {
              const active = cat === activeCategory;
              return (
                <TouchableOpacity
                  style={[styles.catItem, active && styles.catItemActive]}
                  onPress={() => scrollToCategory(cat)}
                  activeOpacity={0.7}
                >
                  {active && <View style={styles.activeBar} />}
                  {getCatImage(cat) ? (
                    <Image source={getCatImage(cat)} style={styles.catImage} resizeMode="cover" />
                  ) : (
                    <Text style={styles.catEmoji}>{getCatEmoji(cat)}</Text>
                  )}
                  <Text style={[styles.catLabel, active && styles.catLabelActive]} numberOfLines={1}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* RIGHT PRODUCTS */}
          {filteredSections.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🥦</Text>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            <SectionList
              ref={sectionListRef}
              sections={filteredSections}
              keyExtractor={item => item.id}
              renderItem={renderPair}
              renderSectionHeader={renderSectionHeader}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productList}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              onScrollToIndexFailed={() => {}}
            />
          )}
        </View>
      )}

      {/* Floating Cart */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { bottom: insets.bottom + 10 }]}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.92}
        >
          <View style={styles.fcLeft}>
            <View style={styles.fcBadge}>
              <Text style={styles.fcBadgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.fcItems}>items</Text>
          </View>
          <View style={styles.fcRight}>
            <Text style={styles.fcTotal}>₹{total}</Text>
            <Text style={styles.fcAction}>View Cart →</Text>
          </View>
        </TouchableOpacity>
      )}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          isOpen
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    ...shadows.small,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: colors.background,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 13, color: colors.text },

  body: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: '#F0F4EF',
    borderRightWidth: 1,
    borderRightColor: colors.divider,
  },
  catItem: {
    width: SIDEBAR_W,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    gap: 5,
    position: 'relative',
  },
  catItemActive: { backgroundColor: '#fff' },
  activeBar: {
    position: 'absolute', left: 0, top: 12, bottom: 12,
    width: 3, borderRadius: 2,
    backgroundColor: colors.primary,
  },
  catImage: {
    width: 40, height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  catEmoji: { fontSize: 26 },
  catLabel: {
    fontSize: 10, fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center', lineHeight: 13,
  },
  catLabelActive: { color: colors.primary, fontWeight: '800' },

  // Products
  productList: { paddingBottom: 20 },
  sectionHeaderHidden: { height: 1 },
  row: { flexDirection: 'row', paddingHorizontal: 6, paddingTop: 6 },
  cardWrap: { width: CARD_W, marginHorizontal: 3, overflow: 'hidden' },

  skeletonWrap: { padding: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 15, color: colors.placeholder, fontWeight: '600' },

  // Floating Cart
  floatingCart: {
    position: 'absolute', left: 14, right: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: 8, ...shadows.large,
  },
  fcLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fcBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  fcBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  fcItems: { color: '#fff', fontSize: 13, fontWeight: '700' },
  fcRight: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 5,
  },
  fcTotal: { color: '#fff', fontSize: 14, fontWeight: '800' },
  fcAction: { color: 'rgba(255,255,255,0.88)', fontSize: 11, fontWeight: '700' },
});
