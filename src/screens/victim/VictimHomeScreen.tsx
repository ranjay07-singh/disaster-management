import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SimpleMap, SimpleMarker } from '../../components/SimpleMap';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';

const { width, height } = Dimensions.get('window');

interface VictimHomeScreenProps {
  user: User;
}

const VictimHomeScreen: React.FC<VictimHomeScreenProps> = ({ user }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this app');
        setLoading(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);

      // Get address from coordinates
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const { street, city, region, country } = reverseGeocode[0];
        setAddress(`${street || ''}, ${city || ''}, ${region || ''}, ${country || ''}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyHelp = () => {
    // Navigate to Need Help tab
    Alert.alert(
      'Emergency Help',
      'You will be redirected to the Need Help section to request emergency assistance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          // This would trigger navigation to Need Help tab
          console.log('Navigate to Need Help tab');
        }},
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        {location ? (
          <SimpleMap
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <SimpleMarker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Your Location"
            />
          </SimpleMap>
        ) : (
          <View style={styles.noLocationContainer}>
            <Ionicons name="location-outline" size={50} color="#ccc" />
            <Text style={styles.noLocationText}>Location not available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location Info */}
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.locationTitle}>Current Location</Text>
        </View>
        <Text style={styles.locationAddress}>{address || 'Address not available'}</Text>
        <Text style={styles.coordinates}>
          {location 
            ? `Lat: ${location.coords.latitude.toFixed(6)}, Lng: ${location.coords.longitude.toFixed(6)}`
            : 'Coordinates not available'
          }
        </Text>
      </View>

      {/* Emergency Help Button */}
      <View style={styles.helpButtonContainer}>
        <TouchableOpacity style={styles.helpButton} onPress={handleEmergencyHelp}>
          <Ionicons name="alert-circle" size={24} color="white" />
          <Text style={styles.helpButtonText}>EMERGENCY HELP</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Info */}
      <View style={styles.quickInfo}>
        <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
        <Text style={styles.infoText}>
          Your safety is our priority. Press the emergency help button if you need immediate assistance.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: height * 0.4,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  map: {
    flex: 1,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noLocationText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  locationInfo: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
  },
  helpButtonContainer: {
    margin: 10,
  },
  helpButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  helpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  quickInfo: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default VictimHomeScreen;