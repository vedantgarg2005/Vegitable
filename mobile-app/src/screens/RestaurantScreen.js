import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import axios from 'axios';

const RestaurantScreen = ({ route, navigation }) => {
  const { restaurantId } = route.params;
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    fetchRestaurantDetails();
  }, []);

  const fetchRestaurantDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/restaurants/${restaurantId}`);
      setRestaurant(response.data.restaurant);
      setMenuItems(response.data.menuItems);
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
    }
  };

  const addToCart = (item) => {
    navigation.navigate('Cart', { item });
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemPrice}>${item.price}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => addToCart(item)}
      >
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {restaurant && (
        <View style={styles.header}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
        </View>
      )}
      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  restaurantCuisine: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RestaurantScreen;