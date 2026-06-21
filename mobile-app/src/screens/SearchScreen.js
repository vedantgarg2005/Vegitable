import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, TextInput, FlatList, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { menuAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';
import { API_BASE_URL } from '../utils/constants';
import CachedImage from '../components/CachedImage';

const RECENT_KEY = 'recent_searches';
const MAX_RECENT = 8;

const VEGGIE_SUGGESTIONS = ['Tomatoes', 'Carrots', 'Spinach', 'Potatoes', 'Onions', 'Broccoli', 'Peppers', 'Cabbage'];

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const { addToCart } = useCart();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % VEGGIE_SUGGESTIONS.length), 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(v => v && setRecent(JSON.parse(v)));
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const saveRecent = async (term) => {
    const updated = [term, ...recent.filter(r => r !== term)].slice(0, MAX_RECENT);
    setRecent(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const clearRecent = async () => {
    setRecent([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  };

  const search = useCallback(async (term) => {
    if (!term.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await menuAPI.getItems({ search: term });
      setResults(res.data || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 350);
    return () => clearTimeout(t);
  }, [query, search]);

  const onSubmit = () => {
    if (query.trim()) saveRecent(query.trim());
  };

  const pickRecent = (term) => {
    setQuery(term);
    saveRecent(term);
  };

  const renderResult = ({ item }) => (
    <TouchableOpacity
      style={[styles.resultCard, shadows.small]}
      onPress={() => { saveRecent(query); navigation.navigate('ProductDetail', { item }); }}
      activeOpacity={0.85}
    >
      {item.image?.startsWith('/uploads') ? (
        <CachedImage uri={`${API_BASE_URL.replace('/api', '')}${item.image}`} style={styles.resultImage} resizeMode="cover" />
      ) : (
        <View style={styles.resultEmojiWrap}><Text style={styles.resultEmoji}>{item.image || '🥦'}</Text></View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.resultPrice}>₹{item.variants?.length > 0 ? item.variants[0].price : item.price}</Text>
      </View>
      <TouchableOpacity style={styles.resultAddBtn} onPress={() => addToCart(item)} activeOpacity={0.85}>
        <Text style={styles.resultAddText}>ADD</Text>
        <Ionicons name="add" size={rs(12)} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const showRecent = !query && recent.length > 0;
  const showEmpty = !loading && query.trim() && results.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={rs(18)} color={colors.placeholder} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={`Search ${VEGGIE_SUGGESTIONS[placeholderIdx]}...`}
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={rs(18)} color={colors.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Recent Searches */}
      {showRecent && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
            <TouchableOpacity onPress={clearRecent}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chips}>
            {recent.map((term, i) => (
              <TouchableOpacity key={i} style={styles.chip} onPress={() => pickRecent(term)} activeOpacity={0.7}>
                <Ionicons name="time-outline" size={rs(13)} color={colors.placeholder} />
                <Text style={styles.chipText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results */}
      {loading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: vs(32) }} />
      )}

      {!loading && query.trim() && (
        <FlatList
          data={results}
          renderItem={renderResult}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            showEmpty ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>No results for "{query}"</Text>
                <Text style={styles.emptySub}>Try a different search term</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Suggestions when empty */}
      {!query && !showRecent && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🥦</Text>
          <Text style={styles.emptyTitle}>Search for fresh produce</Text>
          <Text style={styles.emptySub}>Vegetables, fruits, herbs and more</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    paddingHorizontal: rs(16), paddingVertical: vs(10),
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  backBtn: { padding: rs(4) },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.md,
    paddingHorizontal: rs(12), paddingVertical: vs(10),
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: ms(14), color: colors.text },
  recentSection: { padding: rs(16) },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(12) },
  sectionLabel: { fontSize: ms(11), fontWeight: '800', color: colors.textSecondary, letterSpacing: 1 },
  clearText: { fontSize: ms(13), color: colors.primary, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.full,
    paddingHorizontal: rs(12), paddingVertical: vs(6),
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontSize: ms(13), color: colors.text },
  list: { padding: rs(16), gap: vs(10) },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: rs(12),
  },
  resultImage: { width: rs(56), height: rs(56), borderRadius: borderRadius.sm },
  resultEmojiWrap: {
    width: rs(56), height: rs(56), borderRadius: borderRadius.sm,
    backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
  },
  resultEmoji: { fontSize: ms(28) },
  resultInfo: { flex: 1 },
  resultName: { fontSize: ms(14), fontWeight: '700', color: colors.text, marginBottom: vs(3) },
  resultPrice: { fontSize: ms(13), fontWeight: '800', color: colors.primary },
  resultAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(2),
    borderWidth: 1.5, borderColor: colors.primary, borderRadius: borderRadius.xs,
    paddingHorizontal: rs(8), paddingVertical: vs(5), backgroundColor: colors.primarySurface,
  },
  resultAddText: { fontSize: ms(11), fontWeight: '800', color: colors.primary },
  empty: { alignItems: 'center', paddingTop: vs(60), paddingHorizontal: rs(32) },
  emptyEmoji: { fontSize: ms(56), marginBottom: vs(12) },
  emptyTitle: { fontSize: ms(16), fontWeight: '700', color: colors.text, marginBottom: vs(6) },
  emptySub: { fontSize: ms(13), color: colors.placeholder, textAlign: 'center' },
});
