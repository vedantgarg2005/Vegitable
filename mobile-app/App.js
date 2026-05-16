import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import FlashMessage from 'react-native-flash-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { theme } from './src/utils/theme';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

function AppContent() {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!isReady || loading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <CartProvider>
          <AppContent />
          <FlashMessage position="top" />
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}