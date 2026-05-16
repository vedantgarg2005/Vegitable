import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, ScrollView, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { menuAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { colors, spacing, shadows, borderRadius, ms, rs, vs } from '../../utils/theme';

const CATEGORIES = [
  { name: 'Sweets',      icon: '🍯' },
  { name: 'Snacks',      icon: '🥟' },
  { name: 'Main Course', icon: '🍛' },
  { name: 'Beverages',   icon: '☕' },
  { name: 'Desserts',    icon: '🍦' },
];

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();

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

  const handleCategoryPress = useCallback((name) => {
    setSelectedCategory(prev => (prev === name ? '' : name));
  }, []);

  const handleAddToCart = useCallback((item) => { addToCart(item); }, [addToCart]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[styles.foodCard, shadows.medium]}
      onPress={() => navigation.navigate('MenuItemDetail', { item })}
      activeOpacity={0.88}
    >
      <View style={styles.emojiBox}>
        <Text style={styles.foodEmoji}>{item.image || '🍽️'}</Text>
      </View>
      <View style={styles.foodDetails}>
        <View style={styles.foodTitleRow}>
          <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
          {item.ratings?.average != null && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={rs(10)} color={colors.warning} />
              <Text style={styles.ratingText}>{item.ratings.average.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.foodDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.foodFooter}>
          <Text style={styles.foodPrice}>₹{item.price}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(item)} activeOpacity={0.8}>
            <Ionicons name="add" size={rs(18)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation, handleAddToCart]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent />

      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + vs(12) }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good day! 👋</Text>
            <Text style={styles.title}>What's your craving?</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="bag-outline" size={rs(22)} color="#fff" />
          </TouchableOpacity>
        </View>
        <Searchbar
          placeholder="Search food..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={colors.primary}
          placeholderTextColor={colors.placeholder}
        />
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.name}
            onPress={() => handleCategoryPress(cat.name)}
            style={[styles.categoryPill, selectedCategory === cat.name && styles.categoryPillActive]}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryText, selectedCategory === cat.name && styles.categoryTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={foodItems}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {selectedCategory || 'All Items'}
              <Text style={styles.sectionCount}> ({foodItems.length})</Text>
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>Nothing found</Text>
              <Text style={styles.emptySubtitle}>Try a different search or category</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: vs(20),
    borderBottomLeftRadius: rs(28),
    borderBottomRightRadius: rs(28),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(14),
  },
  greeting: { fontSize: ms(13), color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginBottom: 2 },
  title: { fontSize: ms(22), fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  cartBtn: {
    width: rs(42), height: rs(42), borderRadius: rs(21),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: { borderRadius: borderRadius.lg, backgroundColor: '#fff', elevation: 0, height: vs(46) },
  searchInput: { fontSize: ms(14), color: colors.text },

  categoriesScroll: { maxHeight: vs(64), backgroundColor: colors.surface },
  categoriesContent: { paddingHorizontal: spacing.md, paddingVertical: vs(10), gap: rs(8), alignItems: 'center' },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(14), paddingVertical: vs(6),
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: colors.border,
    gap: rs(5),
  },
  categoryPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryIcon: { fontSize: ms(13) },
  categoryText: { fontSize: ms(13), fontWeight: '600', color: colors.textSecondary },
  categoryTextActive: { color: '#fff' },

  loader: { marginTop: vs(40) },
  list: { padding: spacing.md, paddingTop: vs(8) },
  sectionTitle: { fontSize: ms(16), fontWeight: '700', color: colors.text, marginBottom: vs(12) },
  sectionCount: { fontSize: ms(14), fontWeight: '400', color: colors.textSecondary },

  foodCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: vs(12),
    padding: rs(14),
    alignItems: 'center',
  },
  emojiBox: {
    width: rs(72), height: rs(72),
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: rs(14),
  },
  foodEmoji: { fontSize: ms(36) },
  foodDetails: { flex: 1 },
  foodTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(3) },
  foodName: { fontSize: ms(15), fontWeight: '700', color: colors.text, flex: 1, marginRight: rs(8) },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: rs(6), paddingVertical: vs(2),
    borderRadius: borderRadius.full, gap: rs(2),
  },
  ratingText: { fontSize: ms(11), fontWeight: '700', color: colors.text },
  foodDescription: { fontSize: ms(12), color: colors.placeholder, lineHeight: ms(17), marginBottom: vs(10) },
  foodFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodPrice: { fontSize: ms(16), fontWeight: '800', color: colors.primary },
  addBtn: {
    backgroundColor: colors.primary,
    width: rs(32), height: rs(32), borderRadius: rs(16),
    justifyContent: 'center', alignItems: 'center',
  },

  emptyContainer: { alignItems: 'center', paddingVertical: vs(60) },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(18), fontWeight: '700', color: colors.text, marginBottom: vs(6) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder },
});
