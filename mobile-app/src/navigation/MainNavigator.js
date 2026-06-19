import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from 'react-native-paper';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from '../screens/main/HomeScreen';
import MenuScreen from '../screens/main/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/main/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuItemDetailScreen from '../screens/main/MenuItemDetailScreen';
import SavedAddressesScreen from '../screens/SavedAddressesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import RefundPolicyScreen from '../screens/RefundPolicyScreen';
import ShippingPolicyScreen from '../screens/ShippingPolicyScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import WalletScreen from '../screens/WalletScreen';
import ReviewScreen from '../screens/ReviewScreen';
import LoginScreen from '../screens/LoginScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';

import { useCart } from '../context/CartContext';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ name, color, size, badgeCount, focused }) {
  return (
    <View style={{ alignItems: 'center' }}>
      {focused && (
        <View style={{
          position: 'absolute', top: -10,
          width: 24, height: 3, borderRadius: 2,
          backgroundColor: colors.primary,
        }} />
      )}
      <Ionicons name={name} size={size} color={color} />
      {badgeCount > 0 && (
        <Badge
          style={{
            position: 'absolute',
            top: -6, right: -8,
            backgroundColor: colors.error,
          }}
          size={16}
        >
          {badgeCount}
        </Badge>
      )}
    </View>
  );
}

function MainTabs() {
  const { itemCount } = useCart();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let badgeCount = 0;

          if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'CartTab') {
            iconName = focused ? 'bag' : 'bag-outline';
            badgeCount = itemCount;
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <TabIcon name={iconName} color={color} size={size} badgeCount={badgeCount} focused={focused} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: -2,
          fontFamily: 'Poppins_700Bold',
        },
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Explore" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="CartTab" component={CartScreen} options={{ title: 'Cart' }} />
      <Tab.Screen name="OrdersTab" component={OrdersScreen} options={{ title: 'Orders' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true, gestureResponseDistance: 50 }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
      <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} />
      <Stack.Screen name="ShippingPolicy" component={ShippingPolicyScreen} />
      <Stack.Screen name="MyProfile" component={MyProfileScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}
