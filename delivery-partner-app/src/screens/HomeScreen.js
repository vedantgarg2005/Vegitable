import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuth } from '../services/AuthContext';
import { fleetService, locationService } from '../services/api';

export default function HomeScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState(null);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayDeliveries: 0,
    rating: 0,
  });
  const { user } = useAuth();

  useEffect(() => {
    requestLocationPermission();
    loadStats();
  }, []);

  useEffect(() => {
    let locationSubscription;
    
    if (isOnline) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isOnline]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to work');
    }
  };

  const startLocationTracking = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      await locationService.updateLocation(location);
      await fleetService.updateStatus('available');
      
      // Start watching position
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 100, // Update every 100 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          locationService.updateLocation(newLocation);
        }
      );
    } catch (error) {
      console.error('Location tracking failed:', error);
      Alert.alert('Error', 'Failed to start location tracking');
      setIsOnline(false);
    }
  };

  const stopLocationTracking = async () => {
    try {
      await fleetService.updateStatus('offline');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fleetService.getPerformance();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.status}>
          Status: {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Go Online</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#767577', true: '#FF6B35' }}
            thumbColor={isOnline ? '#fff' : '#f4f3f4'}
          />
        </View>
        {location && (
          <Text style={styles.locationText}>
            Location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{stats.todayEarnings}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.todayDeliveries}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadStats}>
        <Text style={styles.refreshButtonText}>Refresh Stats</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});