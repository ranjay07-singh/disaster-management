import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SimpleMap, SimpleMarker } from '../../components/SimpleMap';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import { useNavigation } from '@react-navigation/native';
import { DisasterAlertService, DisasterAlert } from '../../services/DisasterAlertService';

const { width, height } = Dimensions.get('window');

interface VictimHomeScreenProps {
  user: User;
}

const VictimHomeScreen: React.FC<VictimHomeScreenProps> = ({ user }) => {
  const navigation = useNavigation();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userCity, setUserCity] = useState<string>('');
  const [userState, setUserState] = useState<string>('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Fetch alerts when location is available
    if (location) {
      fetchDisasterAlerts();
      
      // Auto-refresh alerts every 5 minutes
      const interval = setInterval(() => {
        fetchDisasterAlerts(true);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [location]);

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
        setUserCity(city || '');
        setUserState(region || '');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisasterAlerts = async (silent: boolean = false) => {
    if (!location) return;
    
    try {
      if (!silent) setLoadingAlerts(true);
      
      console.log('📍 Fetching disaster alerts for location...');
      
      const allAlerts = await DisasterAlertService.getAllAlerts(
        location.coords.latitude,
        location.coords.longitude,
        300 // 300km radius
      );
      
      // Filter to show only nearby and relevant alerts (within 200km)
      const nearbyAlerts = allAlerts.filter(alert => alert.distance! <= 200);
      
      setAlerts(nearbyAlerts.slice(0, 5)); // Show max 5 alerts
      
      console.log(`✅ Found ${nearbyAlerts.length} alerts nearby`);
      
    } catch (error) {
      console.error('❌ Error fetching disaster alerts:', error);
    } finally {
      if (!silent) setLoadingAlerts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      getCurrentLocation(),
      fetchDisasterAlerts(),
    ]);
    setRefreshing(false);
  };

  const handleEmergencyHelp = () => {
    // Navigate to Need Help tab
    Alert.alert(
      'Emergency Help',
      'You will be redirected to the Need Help section to request emergency assistance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Navigate to Need Help tab
            navigation.navigate('Need Help' as never);
          }
        },
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Disaster Alerts Section */}
      {loadingAlerts ? (
        <View style={styles.alertsLoadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.alertsLoadingText}>Loading disaster alerts...</Text>
        </View>
      ) : alerts.length > 0 ? (
        <View style={styles.alertsSection}>
          <View style={styles.alertsHeader}>
            <Ionicons name="warning" size={24} color="#FF3B30" />
            <Text style={styles.alertsHeaderText}>Active Disaster Alerts</Text>
            <TouchableOpacity onPress={() => fetchDisasterAlerts()}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {alerts.map((alert, index) => (
            <View 
              key={alert.id} 
              style={[
                styles.alertCard,
                { borderLeftColor: DisasterAlertService.getSeverityColor(alert.severity) }
              ]}
            >
              <View style={styles.alertCardHeader}>
                <View style={styles.alertCardTitle}>
                  <Text style={styles.alertIcon}>
                    {DisasterAlertService.getCategoryIcon(alert.category)}
                  </Text>
                  <View style={styles.alertCardTitleText}>
                    <Text style={styles.alertCategory}>{alert.category}</Text>
                    <View style={[
                      styles.severityBadge,
                      { backgroundColor: DisasterAlertService.getSeverityColor(alert.severity) }
                    ]}>
                      <Text style={styles.severityText}>{alert.severity?.toUpperCase() || 'UNKNOWN'}</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <Text style={styles.alertTitle} numberOfLines={2}>
                {alert.title}
              </Text>
              
              <View style={styles.alertMeta}>
                <View style={styles.alertMetaItem}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.alertMetaText}>
                    {DisasterAlertService.formatDistance(alert.distance!)}
                  </Text>
                </View>
                <View style={styles.alertMetaItem}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={styles.alertMetaText}>
                    {DisasterAlertService.getTimeAgo(alert.startTime)}
                  </Text>
                </View>
              </View>
              
              {alert.location.address && (
                <Text style={styles.alertLocation} numberOfLines={1}>
                  📍 {alert.location.address}
                </Text>
              )}
              
              <View style={styles.alertFooter}>
                <Text style={styles.alertSource}>Source: {alert.source}</Text>
                <TouchableOpacity 
                  style={styles.alertDetailsButton}
                  onPress={() => {
                    Alert.alert(
                      `${alert.category} Alert`,
                      `${alert.description}\n\nLocation: ${alert.location.address || 'Unknown'}\nDistance: ${DisasterAlertService.formatDistance(alert.distance!)}\nTime: ${DisasterAlertService.getTimeAgo(alert.startTime)}\nSeverity: ${alert.severity?.toUpperCase() || 'Unknown'}\nSource: ${alert.source}`,
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Text style={styles.alertDetailsButtonText}>Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {alerts.length >= 5 && (
            <Text style={styles.moreAlertsText}>
              Showing {alerts.length} most critical alerts nearby
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.noAlertsContainer}>
          <Ionicons name="shield-checkmark" size={48} color="#4CAF50" />
          <Text style={styles.noAlertsTitle}>All Clear</Text>
          <Text style={styles.noAlertsText}>
            No active disaster alerts in your region
          </Text>
          <Text style={styles.noAlertsSubtext}>
            Last checked: {new Date().toLocaleTimeString()}
          </Text>
        </View>
      )}

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
    </ScrollView>
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
  // Disaster Alerts Styles
  alertsLoadingContainer: {
    backgroundColor: 'white',
    margin: 10,
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertsLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  alertsSection: {
    margin: 10,
    marginTop: 15,
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertsHeaderText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  alertCard: {
    backgroundColor: 'white',
    padding: 15,
    borderLeftWidth: 4,
    marginTop: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  alertCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  alertCardTitleText: {
    flex: 1,
  },
  alertCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  alertTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  alertMeta: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 15,
  },
  alertMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertMetaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  alertLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  alertSource: {
    fontSize: 11,
    color: '#999',
  },
  alertDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  alertDetailsButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginRight: 4,
  },
  moreAlertsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    backgroundColor: 'white',
    padding: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noAlertsContainer: {
    backgroundColor: 'white',
    margin: 10,
    marginTop: 15,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noAlertsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 15,
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  noAlertsSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
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