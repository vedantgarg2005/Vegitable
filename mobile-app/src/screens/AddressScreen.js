import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, FAB, IconButton } from 'react-native-paper';
import { showMessage } from 'react-native-flash-message';
import { colors } from '../utils/theme';
import { addressService } from '../services/addressService';

export default function AddressScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (error) {
      showMessage({ message: 'Failed to load addresses', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (id) => {
    try {
      await addressService.deleteAddress(id);
      setAddresses(addresses.filter(addr => addr._id !== id));
      showMessage({ message: 'Address deleted', type: 'success' });
    } catch (error) {
      showMessage({ message: 'Failed to delete address', type: 'danger' });
    }
  };

  const renderAddress = ({ item }) => (
    <Card style={styles.addressCard}>
      <Card.Content>
        <View style={styles.addressHeader}>
          <Text variant="titleMedium">{item.type}</Text>
          <IconButton
            icon="delete"
            size={20}
            onPress={() => deleteAddress(item._id)}
          />
        </View>
        <Text>{item.street}</Text>
        <Text>{item.city}, {item.state} {item.zipCode}</Text>
        {item.isDefault && (
          <Text style={styles.defaultLabel}>Default Address</Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>My Addresses</Text>
      
      <FlatList
        data={addresses}
        renderItem={renderAddress}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddAddress')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    marginBottom: 20,
    color: colors.primary,
  },
  list: {
    paddingBottom: 100,
  },
  addressCard: {
    marginBottom: 15,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  defaultLabel: {
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});