import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { SimpleMap, SimpleMarker } from '../../components/SimpleMap';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { User, EmergencyRequest, DisasterType } from '../../types/User';

const { width, height } = Dimensions.get('window');

interface VolunteerHomeScreenProps {
  user: User;
}

interface EmergencyNotification {
  id: string;
  request: EmergencyRequest;
  distance: number;
  estimatedTime: string;
}

const VolunteerHomeScreen: React.FC<VolunteerHomeScreenProps> = ({ user }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isAvailable, setIsAvailable] = useState(user.availability || false);
  const [pendingRequests, setPendingRequests] = useState<EmergencyNotification[]>([]);
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);

  useEffect(() => {
    getCurrentLocation();
    // Mock: Listen for emergency requests
    simulateEmergencyRequests();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const simulateEmergencyRequests = () => {
    // Mock emergency requests - In real app, this would be real-time notifications
    const mockRequests: EmergencyNotification[] = [
      {
        id: '1',
        request: {
          id: 'req_1',
          victimId: 'victim_1',
          disasterType: DisasterType.FIRE,
          location: {
            latitude: 28.7041,
            longitude: 77.1025,
            address: 'Connaught Place, New Delhi',
          },
          description: 'Building fire on 3rd floor, people trapped',
          severity: 'high',
          status: 'pending',
          assignedVolunteers: [],
          governmentAgenciesNotified: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        distance: 0.8,
        estimatedTime: '3 mins',
      },
    ];

    // Simulate notification after 3 seconds
    setTimeout(() => {
      if (isAvailable) {
        setPendingRequests(mockRequests);
        // Show notification sound/vibration in real app
        Alert.alert(
          'Emergency Request',
          'New emergency request nearby! Check your notifications.',
          [{ text: 'OK' }]
        );
      }
    }, 3000);
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
    // Update availability in backend
    Alert.alert(
      'Status Updated',
      `You are now ${!isAvailable ? 'available' : 'unavailable'} for emergency requests`
    );
  };

  const handleAcceptRequest = (notification: EmergencyNotification) => {
    Alert.alert(
      'Accept Emergency Request',
      `Are you sure you want to accept this ${notification.request.disasterType} emergency?`,
      [
        { text: 'Decline', style: 'cancel', onPress: () => handleDeclineRequest(notification) },
        { text: 'Accept', onPress: () => acceptRequest(notification) },
      ]
    );
  };

  const acceptRequest = (notification: EmergencyNotification) => {
    setActiveRequest(notification.request);
    setPendingRequests(prev => prev.filter(req => req.id !== notification.id));
    Alert.alert('Request Accepted', 'Navigate to Provide Help tab to see route and details');
  };

  const handleDeclineRequest = (notification: EmergencyNotification) => {
    setPendingRequests(prev => prev.filter(req => req.id !== notification.id));
    // In real app, notify next volunteer
  };

  const handleEmergencyHelp = () => {
    Alert.alert(
      'Emergency Help',
      'You will be redirected to request emergency assistance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => console.log('Navigate to Need Help') },
      ]
    );
  };

  const getDisasterIcon = (type: DisasterType) => {
    const iconMap: { [key in DisasterType]: string } = {
      [DisasterType.FIRE]: 'flame',
      [DisasterType.FLOOD]: 'water',
      [DisasterType.EARTHQUAKE]: 'globe',
      [DisasterType.ROAD_ACCIDENT]: 'car',
      [DisasterType.WOMEN_SAFETY]: 'shield',
      [DisasterType.CYCLONE]: 'refresh',
      [DisasterType.TSUNAMI]: 'water',
      [DisasterType.AVALANCHE]: 'snow',
      [DisasterType.LANDSLIDE]: 'triangle',
      [DisasterType.FOREST_FIRE]: 'leaf',
      [DisasterType.CHEMICAL_EMERGENCY]: 'flask',
    };
    return iconMap[type] || 'alert';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#FF1744';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderEmergencyRequest = ({ item }: { item: EmergencyNotification }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Ionicons 
            name={getDisasterIcon(item.request.disasterType) as any} 
            size={24} 
            color={getSeverityColor(item.request.severity)} 
          />
          <View style={styles.requestDetails}>
            <Text style={styles.requestType}>
              {item.request.disasterType.toUpperCase()}
            </Text>
            <Text style={[styles.severityText, { color: getSeverityColor(item.request.severity) }]}>
              {item.request.severity.toUpperCase()} PRIORITY
            </Text>
          </View>
        </View>
        <View style={styles.distanceInfo}>
          <Text style={styles.distanceText}>{item.distance} km</Text>
          <Text style={styles.timeText}>{item.estimatedTime}</Text>
        </View>
      </View>
      
      <Text style={styles.requestDescription} numberOfLines={2}>
        {item.request.description}
      </Text>
      
      <Text style={styles.requestLocation}>
        📍 {item.request.location.address}
      </Text>
      
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(item)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item)}
        >
          <Text style={styles.acceptButtonText}>Accept & Help</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#34C759' : '#FF3B30' }]} />
            <Text style={styles.statusText}>
              {isAvailable ? 'Available for Emergency' : 'Not Available'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: isAvailable ? '#FF3B30' : '#34C759' }]}
          onPress={toggleAvailability}
        >
          <Ionicons 
            name={isAvailable ? 'pause' : 'play'} 
            size={20} 
            color="white" 
          />
          <Text style={styles.toggleButtonText}>
            {isAvailable ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View>

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
            
            {/* Show emergency markers */}
            {pendingRequests.map((notification) => (
              <SimpleMarker
                key={notification.id}
                coordinate={{
                  latitude: notification.request.location.latitude,
                  longitude: notification.request.location.longitude,
                }}
                title={`${notification.request.disasterType} Emergency`}
                pinColor={getSeverityColor(notification.request.severity)}
              />
            ))}
          </SimpleMap>
        ) : (
          <View style={styles.noLocationContainer}>
            <Ionicons name="location-outline" size={50} color="#ccc" />
            <Text style={styles.noLocationText}>Getting your location...</Text>
          </View>
        )}
      </View>

      {/* Emergency Requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <Text style={styles.requestsTitle}>Emergency Requests Near You</Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderEmergencyRequest}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Statistics */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user.totalRatings || 0}</Text>
          <Text style={styles.statLabel}>Total Helps</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user.rating?.toFixed(1) || '0.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{user.specializations?.length || 0}</Text>
          <Text style={styles.statLabel}>Specializations</Text>
        </View>
      </View>

      {/* Emergency Help Button */}
      <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyHelp}>
        <Ionicons name="alert-circle" size={20} color="white" />
        <Text style={styles.emergencyButtonText}>Need Help?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusHeader: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
  },
  statusInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  mapContainer: {
    height: height * 0.3,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
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
  requestsSection: {
    flex: 1,
    margin: 10,
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestDetails: {
    marginLeft: 10,
  },
  requestType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  distanceInfo: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  requestDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  requestLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  declineButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    padding: 12,
    borderRadius: 25,
    position: 'absolute',
    bottom: 10,
    right: 10,
    elevation: 5,
  },
  emergencyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default VolunteerHomeScreen;