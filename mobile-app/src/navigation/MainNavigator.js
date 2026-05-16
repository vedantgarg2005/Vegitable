import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from 'react-native-paper';
import { View } from 'react-native';

import HomeScreen from '../screens/main/HomeScreen';
import MenuScreen from '../screens/main/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuItemDetailScreen from '../screens/main/MenuItemDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ReferralScreen from '../screens/ReferralScreen';
import SavedAddressesScreen from '../screens/SavedAddressesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import RefundPolicyScreen from '../screens/RefundPolicyScreen';
import ShippingPolicyScreen from '../screens/ShippingPolicyScreen';
import MyProfileScreen from '../screens/MyProfileScreen';

import { useCart } from '../context/CartContext';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ name, color, size, badgeCount }) {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {badgeCount > 0 && (
        <Badge
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            backgroundColor: colors.error,
          }}
          size={18}
        >
          {badgeCount}
        </Badge>
      )}
    </View>
  );
}

function MainTabs() {
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let badgeCount = 0;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'bag' : 'bag-outline';
            badgeCount = itemCount;
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <TabIcon name={iconName} color={color} size={size} badgeCount={badgeCount} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} />
      <Stack.Screen name="ShippingPolicy" component={ShippingPolicyScreen} />
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
    </Stack.Navigator>
  );
}