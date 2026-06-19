import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';
import { colors, shadows, borderRadius, ms, rs, vs } from '../utils/theme';

const ADDRESS_TYPES = ['home', 'work', 'other'];
const TYPE_ICONS = { home: 'home-outline', work: 'briefcase-outline', other: 'location-outline' };
const EMPTY_FORM = { type: 'home', address: '', landmark: '', city: '', pincode: '', isDefault: false };

export default function SavedAddressesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1: map modal
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({ latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  const [pinCoords, setPinCoords] = useState({ latitude: 28.6139, longitude: 77.2090 });
  const [locLoading, setLocLoading] = useState(false);

  // Step 2: form modal
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

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
      setAddresses(Array.isArray(data) ? data : []);
    } catch { setAddresses([]); }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  // Go to user's current location on map open
  const goToCurrentLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setPinCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setMapRegion(region);
      mapRef.current?.animateToRegion(region, 600);
    } catch {}
    finally { setLocLoading(false); }
  };

  const openAddMap = async () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setMapVisible(true);
    // auto-fetch location when opening
    setTimeout(goToCurrentLocation, 300);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({ type: item.type, address: item.address, landmark: item.landmark || '', city: item.city, pincode: item.pincode || '', isDefault: item.isDefault });
    // skip map for edits, go straight to form
    setFormVisible(true);
  };

  // Reverse geocode when pin is confirmed
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
      setFormVisible(true);
    }
  };

  const saveAddress = async () => {
    if (!form.address.trim() || !form.city.trim()) {
      Alert.alert('Required', 'Please fill address and city.'); return;
    }
    setSaving(true);
    try {
      const res = editingId
        ? await authFetch(`/${editingId}`, { method: 'PUT', body: JSON.stringify(form) })
        : await authFetch('/', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data?.message || 'Could not save address.'); return; }
      setAddresses(Array.isArray(data) ? data : []);
      setFormVisible(false);
    } catch { Alert.alert('Error', 'Could not save address.'); }
    finally { setSaving(false); }
  };

  const deleteAddress = (id) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const res = await authFetch(`/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) { Alert.alert('Error', data?.message || 'Could not delete.'); return; }
            setAddresses(Array.isArray(data) ? data : []);
          } catch { Alert.alert('Error', 'Could not delete address.'); }
        },
      },
    ]);
  };

  const setDefault = async (id) => {
    try {
      const res = await authFetch(`/${id}`, { method: 'PUT', body: JSON.stringify({ isDefault: true }) });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', data?.message || 'Could not update.'); return; }
      setAddresses(Array.isArray(data) ? data : []);
    } catch { Alert.alert('Error', 'Could not update address.'); }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + vs(12) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity onPress={openAddMap} style={styles.addBtn}>
          <Ionicons name="add" size={rs(24)} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: vs(40) }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {addresses.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={rs(56)} color={colors.border} />
              <Text style={styles.emptyText}>No saved addresses yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={openAddMap}>
                <Text style={styles.emptyBtnText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          )}
          {addresses.map((item) => (
            <View key={item._id} style={[styles.card, shadows.small]}>
              <View style={styles.cardLeft}>
                <View style={styles.typeIcon}>
                  <Ionicons name={TYPE_ICONS[item.type] || 'location-outline'} size={rs(20)} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardType}>{item.type?.toUpperCase()}</Text>
                    {item.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardAddress}>{item.address}</Text>
                  {item.landmark ? <Text style={styles.cardSub}>Near {item.landmark}</Text> : null}
                  <Text style={styles.cardSub}>{item.city}{item.pincode ? ` - ${item.pincode}` : ''}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                {!item.isDefault && (
                  <TouchableOpacity onPress={() => setDefault(item._id)} style={styles.actionBtn}>
                    <Ionicons name="star-outline" size={rs(18)} color={colors.accent} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={rs(18)} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteAddress(item._id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={rs(18)} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* STEP 1: Map Picker Modal */}
      <Modal visible={mapVisible} animationType="slide">
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={region => {
              setPinCoords({ latitude: region.latitude, longitude: region.longitude });
            }}
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

          {/* Top bar */}
          <View style={[styles.mapTopBar, { top: insets.top + vs(10) }]}>
            <TouchableOpacity style={styles.mapBackBtn} onPress={() => setMapVisible(false)}>
              <Ionicons name="arrow-back" size={rs(22)} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.mapTopTitle}>Pin Your Location</Text>
            <View style={{ width: rs(36) }} />
          </View>

          {/* Current location FAB */}
          <TouchableOpacity
            style={[styles.mapLocFab, { bottom: insets.bottom + vs(110) }]}
            onPress={goToCurrentLocation}
            disabled={locLoading}
            activeOpacity={0.85}
          >
            {locLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="navigate" size={rs(22)} color={colors.primary} />}
          </TouchableOpacity>

          {/* Bottom confirm */}
          <View style={[styles.mapBottomBar, { paddingBottom: insets.bottom + vs(12) }]}>
            <Text style={styles.mapHint}>Drag the map or pin to adjust location</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmMapLocation} disabled={locLoading}>
              {locLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.confirmBtnText}>Confirm Location →</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* STEP 2: Address Form Modal */}
      <Modal visible={formVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setFormVisible(false); if (!editingId) setMapVisible(true); }}>
                <Ionicons name="arrow-back" size={rs(22)} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Address Details'}</Text>
              <TouchableOpacity onPress={() => setFormVisible(false)}>
                <Ionicons name="close" size={rs(22)} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Type selector */}
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
                  : <Text style={styles.saveBtnText}>{editingId ? 'Update Address' : 'Save Address'}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(16), paddingBottom: vs(16),
  },
  backBtn: { padding: rs(4) },
  addBtn: { padding: rs(4) },
  headerTitle: { fontSize: ms(18), fontWeight: '700', color: '#fff' },

  list: { padding: rs(16), gap: vs(12), paddingBottom: vs(32) },
  empty: { alignItems: 'center', marginTop: vs(60), gap: vs(12) },
  emptyText: { fontSize: ms(15), color: colors.placeholder },
  emptyBtn: {
    backgroundColor: colors.primarySurface, borderRadius: borderRadius.sm,
    paddingHorizontal: rs(20), paddingVertical: vs(10),
  },
  emptyBtnText: { color: colors.primary, fontWeight: '700', fontSize: ms(14) },

  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: rs(14), flexDirection: 'row', alignItems: 'flex-start',
  },
  cardLeft: { flex: 1, flexDirection: 'row', gap: rs(12) },
  typeIcon: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: colors.primarySurface, justifyContent: 'center', alignItems: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: vs(2) },
  cardType: { fontSize: ms(12), fontWeight: '700', color: colors.text, letterSpacing: 0.5 },
  defaultBadge: {
    backgroundColor: colors.successLight, borderRadius: borderRadius.full,
    paddingHorizontal: rs(8), paddingVertical: vs(2),
  },
  defaultBadgeText: { fontSize: ms(10), fontWeight: '700', color: colors.success },
  cardAddress: { fontSize: ms(14), color: colors.text, lineHeight: ms(20) },
  cardSub: { fontSize: ms(12), color: colors.textSecondary, marginTop: vs(2) },
  cardActions: { flexDirection: 'row', gap: rs(4), marginLeft: rs(8) },
  actionBtn: { padding: rs(6) },

  // Map
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
    ...shadows.small,
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
    backgroundColor: '#fff',
    borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20),
    padding: rs(20),
    ...shadows.large,
  },
  mapHint: { fontSize: ms(13), color: colors.placeholder, marginBottom: vs(14), textAlign: 'center' },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: vs(14),
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },

  // Form modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24),
    padding: rs(20), paddingBottom: vs(36),
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

  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingHorizontal: rs(14), paddingVertical: vs(11),
    fontSize: ms(14), color: colors.text, marginBottom: vs(10),
    backgroundColor: colors.background,
  },
  defaultToggle: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: vs(16) },
  defaultToggleText: { fontSize: ms(14), color: colors.text, fontWeight: '500' },

  saveBtn: { borderRadius: borderRadius.md, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: vs(14), alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: ms(16), fontWeight: '700' },
});
