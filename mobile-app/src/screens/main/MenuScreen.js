import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MenuItemCard from '../../components/MenuItemCard';
import { colors, spacing, borderRadius, ms, rs, vs } from '../../utils/theme';
import { menuAPI } from '../../services/api';

const CATEGORIES = ['All', 'Sweets', 'Snacks', 'Beverages', 'Main Course', 'Desserts'];
const CATEGORY_ICONS = { All: '🍽️', Sweets: '🍯', Snacks: '🥟', Beverages: '☕', 'Main Course': '🍛', Desserts: '🍦' };

export default function MenuScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    menuAPI.getItems()
      .then(res => setMenuItems(res.data))
      .catch(() => {});
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleItemPress = useCallback((item) => {
    navigation.navigate('MenuItemDetail', { item });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} translucent />

      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + vs(12) }]}
      >
        <Text style={styles.title}>Our Menu</Text>
        <Searchbar
          placeholder="Search delicious food..."
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
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
            activeOpacity={0.8}
          >
            <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredItems}
        renderItem={({ item }) => (
          <MenuItemCard item={item} onPress={() => handleItemPress(item)} />
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'All' ? 'All Items' : selectedCategory}
            <Text style={styles.sectionCount}> ({filteredItems.length})</Text>
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
  title: { fontSize: ms(22), fontWeight: '800', color: '#fff', letterSpacing: -0.3, marginBottom: vs(14) },
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

  list: { padding: spacing.sm, paddingTop: vs(8) },
  sectionTitle: { fontSize: ms(16), fontWeight: '700', color: colors.text, marginBottom: vs(12), paddingHorizontal: rs(8) },
  sectionCount: { fontSize: ms(14), fontWeight: '400', color: colors.textSecondary },

  emptyContainer: { alignItems: 'center', paddingVertical: vs(60) },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(18), fontWeight: '700', color: colors.text, marginBottom: vs(6) },
  emptySubtitle: { fontSize: ms(14), color: colors.placeholder },
});
