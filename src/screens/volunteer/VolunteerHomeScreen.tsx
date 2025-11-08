import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import { SimpleMap, SimpleMarker } from '../../components/SimpleMap';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { User, EmergencyRequest, DisasterType } from '../../types/User';
import { ApiService } from '../../services/ApiService';
import { useEmergency } from '../../contexts/EmergencyContext';

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
  const { setActiveEmergency } = useEmergency();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isAvailable, setIsAvailable] = useState(user.availability || false);
  const [pendingRequests, setPendingRequests] = useState<EmergencyNotification[]>([]);
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
  const [showMapView, setShowMapView] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyNotification | null>(null);

  // Map numeric severity level from backend to string
  const mapSeverityLevel = (level: number | string): string => {
    if (typeof level === 'string') return level;
    switch (level) {
      case 5:
      case 4: return 'critical';
      case 3: return 'high';
      case 2: return 'medium';
      case 1: return 'low';
      default: return 'medium';
    }
  };

  useEffect(() => {
    getCurrentLocation();
    loadEmergencyRequests();
    
    // Set up periodic refresh every 10 seconds to check for new emergencies
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing emergency requests...');
      loadEmergencyRequests();
    }, 10000); // 10 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Reload emergencies when location changes
  useEffect(() => {
    if (location) {
      console.log('Location updated, reloading emergencies with distance calculation...');
      loadEmergencyRequests();
    }
  }, [location]);

  const loadEmergencyRequests = async () => {
    try {
      const emergencies = await ApiService.getAllEmergencies();
      console.log('========== EMERGENCY DATA DEBUG ==========');
      console.log('Loaded emergencies:', emergencies);
      console.log('Current volunteer location:', location);
      
      // Extract emergencies array from API response (handle both array and object with array)
      const emergencyList = Array.isArray(emergencies) ? emergencies : ((emergencies as any)?.emergencies || []);
      console.log('Emergency list count:', emergencyList.length);
      
      // Log each emergency's location data
      emergencyList.forEach((emergency: any, index: number) => {
        console.log(`Emergency ${index + 1}:`, {
          id: emergency.id,
          type: emergency.caseType || emergency.disasterType,
          hasLocationLat: !!emergency.locationLat,
          hasLocationLng: !!emergency.locationLng,
          hasLatitude: !!emergency.latitude,
          hasLongitude: !!emergency.longitude,
          locationLat: emergency.locationLat,
          locationLng: emergency.locationLng,
          latitude: emergency.latitude,
          longitude: emergency.longitude,
          address: emergency.locationAddress || emergency.location,
        });
      });
      console.log('==========================================');
      
      // Convert API response to notification format with distance calculation
      const notifications: EmergencyNotification[] = await Promise.all(
        emergencyList.map(async (emergency: any) => {
          // Backend uses locationLat/locationLng, map to latitude/longitude
          const emergencyLat = emergency.locationLat || emergency.latitude;
          const emergencyLng = emergency.locationLng || emergency.longitude;
          
          let distance = 0; // Default to 0 to show all emergencies if location not available
          let estimatedTime = 'Calculating...';
          
          // Calculate actual distance if volunteer location is available
          if (location && emergencyLat && emergencyLng) {
            distance = calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              emergencyLat,
              emergencyLng
            );
            // Estimate time (assuming average speed of 40 km/h in emergency)
            const timeInHours = distance / 40;
            const timeInMinutes = Math.ceil(timeInHours * 60);
            estimatedTime = timeInMinutes < 60 ? `${timeInMinutes} mins` : `${(timeInHours).toFixed(1)} hrs`;
          }
          
          // Get address if not provided
          let address = emergency.locationAddress || emergency.location;
          if ((!address || address === 'Location not specified') && emergencyLat && emergencyLng) {
            console.log(`🔍 Fetching address for emergency ${emergency.id} at ${emergencyLat}, ${emergencyLng}`);
            address = await getAddressFromCoordinates(emergencyLat, emergencyLng);
          }
          
          return {
            id: emergency.id.toString(),
            request: {
              id: emergency.id.toString(),
              victimId: emergency.victimId?.toString() || emergency.userId?.toString() || 'unknown',
              disasterType: (emergency.caseType || emergency.disasterType) as DisasterType,
              location: {
                latitude: emergencyLat || 0,
                longitude: emergencyLng || 0,
                address: address || 'Address unavailable',
              },
              description: emergency.description || 'Emergency assistance needed',
              severity: mapSeverityLevel(emergency.severityLevel || emergency.severity),
              status: emergency.status,
              assignedVolunteers: [],
              governmentAgenciesNotified: [],
              createdAt: new Date(emergency.createdAt),
              updatedAt: new Date(emergency.updatedAt || emergency.createdAt),
            },
            distance: distance,
            estimatedTime: estimatedTime,
          };
        })
      );
      
      console.log('Notifications after mapping:', notifications);
      
      // Filter for pending emergencies
      // If location is available, filter by 50km radius, otherwise show all
      const RADIUS_KM = 50; // Increased radius to 50km
      const pendingNotifications = notifications
        .filter(n => {
          const statusMatch = n.request.status === 'pending' || n.request.status === 'assigned';
          const distanceMatch = !location || n.distance <= RADIUS_KM; // Show all if no location
          console.log(`Emergency ${n.id}: status=${n.request.status}, statusMatch=${statusMatch}, distance=${n.distance}km, distanceMatch=${distanceMatch}`);
          return statusMatch && distanceMatch;
        })
        .sort((a, b) => a.distance - b.distance) // Sort by distance (nearest first)
        .slice(0, 10); // Show top 10 nearest requests
      
      console.log('Filtered pending notifications:', pendingNotifications);
      setPendingRequests(pendingNotifications);
      
    } catch (error) {
      console.log('Failed to load emergencies:', error);
      // Fall back to mock data on error
      simulateEmergencyRequests();
    }
  };

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
      
      // Reload emergency requests with actual location to calculate distances
      loadEmergencyRequests();
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const address = results[0];
        const parts = [
          address.name,
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode,
          address.country
        ].filter(Boolean);
        return parts.join(', ') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
    } catch (error) {
      console.log('Error reverse geocoding:', error);
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
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

  const toggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      
      // Update availability status
      setIsAvailable(newStatus);
      
      Alert.alert(
        'Status Updated',
        `You are now ${newStatus ? 'available' : 'unavailable'} for emergency requests`
      );
      
      // Reload requests if going online
      if (newStatus) {
        loadEmergencyRequests();
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
      Alert.alert('Error', 'Failed to update availability. Please try again.');
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Open Google Maps with directions
  const openGoogleMapsDirections = (destination: { latitude: number; longitude: number; address: string }) => {
    if (!location) {
      Alert.alert('Error', 'Your location is not available');
      return;
    }

    const origin = `${location.coords.latitude},${location.coords.longitude}`;
    const dest = `${destination.latitude},${destination.longitude}`;
    
    const url = Platform.select({
      ios: `maps://app?saddr=${origin}&daddr=${dest}`,
      android: `google.navigation:q=${dest}&mode=d`,
    });

    const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;

    Linking.canOpenURL(url || webUrl).then((supported) => {
      if (supported) {
        Linking.openURL(url || webUrl);
      } else {
        Linking.openURL(webUrl);
      }
    }).catch((err) => {
      console.log('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  const handleAcceptRequest = (notification: EmergencyNotification) => {
    // Show the map view with directions
    setSelectedEmergency(notification);
    setShowMapView(true);
    setActiveRequest(notification.request);
    
    // Set in shared context so ProvideHelpScreen can access it
    setActiveEmergency(notification.request);
    
    setPendingRequests(prev => prev.filter(req => req.id !== notification.id));
  };

  const handleCompleteEmergency = async () => {
    if (!selectedEmergency) return;

    try {
      // Update status to 'completed' in backend
      await ApiService.updateEmergencyStatus(selectedEmergency.id, 'completed');
      
      // Close map view
      setShowMapView(false);
      setActiveRequest(null);
      setSelectedEmergency(null);
      
      // Clear from shared context
      setActiveEmergency(null);
      
      // Refresh emergency list to remove completed one
      await loadEmergencyRequests();
      
      Alert.alert(
        'Success! 🎉', 
        'Emergency marked as complete. Thank you for helping!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to mark emergency as complete:', error);
      Alert.alert(
        'Error', 
        'Failed to update emergency status. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const acceptRequest = (notification: EmergencyNotification) => {
    setActiveRequest(notification.request);
    setPendingRequests(prev => prev.filter(req => req.id !== notification.id));
    Alert.alert('Request Accepted', 'Opening Google Maps for navigation...');
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

  const renderEmergencyRequest = ({ item }: { item: EmergencyNotification }) => {
    // Check if location data is real or default Delhi coordinates
    const hasRealLocation = item.request.location.latitude !== 28.7041 || item.request.location.longitude !== 77.1025;
    const showDistance = hasRealLocation && location;
    
    return (
      <View style={styles.requestCard}>
        {/* Severity Badge */}
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.request.severity) }]}>
          <Text style={styles.severityBadgeText}>{item.request.severity?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>

        <View style={styles.requestHeader}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getDisasterIcon(item.request.disasterType) as any} 
              size={32} 
              color={getSeverityColor(item.request.severity)} 
            />
          </View>
          
          <View style={styles.requestInfo}>
            <Text style={styles.requestType}>
              {item.request.disasterType?.replace('_', ' ').toUpperCase() || 'EMERGENCY'}
            </Text>
            <Text style={styles.requestTime}>
              {new Date(item.request.createdAt).toLocaleTimeString()} • {new Date(item.request.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationSection}>
          <Ionicons name="location" size={18} color="#666" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText} numberOfLines={2}>
              {item.request.location.address || 'Location not specified'}
            </Text>
            {!hasRealLocation && (
              <Text style={styles.warningText}>⚠️ GPS coordinates not available from victim</Text>
            )}
          </View>
        </View>

        {/* Distance Info - Only show if real location */}
        {showDistance && (
          <View style={styles.distanceSection}>
            <View style={styles.distanceItem}>
              <Ionicons name="navigate" size={16} color="#007AFF" />
              <Text style={styles.distanceLabel}>Distance</Text>
              <Text style={styles.distanceValue}>{item.distance.toFixed(1)} km</Text>
            </View>
            <View style={styles.distanceDivider} />
            <View style={styles.distanceItem}>
              <Ionicons name="time" size={16} color="#007AFF" />
              <Text style={styles.distanceLabel}>ETA</Text>
              <Text style={styles.distanceValue}>{item.estimatedTime}</Text>
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Description:</Text>
          <Text style={styles.descriptionText} numberOfLines={3}>
            {item.request.description || 'No description provided'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDeclineRequest(item)}
          >
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item)}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Professional Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <Text style={styles.welcomeText}>👋 {user.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#34C759' : '#FF3B30' }]} />
            <Text style={styles.statusText}>
              {isAvailable ? '🟢 Available' : '🔴 Offline'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {/* Refresh Button */}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              console.log('Manual refresh triggered');
              loadEmergencyRequests();
            }}
          >
            <Ionicons name="refresh" size={22} color="#007AFF" />
          </TouchableOpacity>
          
          {/* Toggle Status Button */}
          <TouchableOpacity
            style={[styles.toggleButton, { backgroundColor: isAvailable ? '#FF3B30' : '#34C759' }]}
            onPress={toggleAvailability}
          >
            <Ionicons 
              name={isAvailable ? 'pause' : 'play'} 
              size={18} 
              color="white" 
            />
            <Text style={styles.toggleButtonText}>
              {isAvailable ? 'Offline' : 'Online'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Info Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationCardHeader}>
          <Ionicons name="location" size={24} color="#007AFF" />
          <Text style={styles.locationCardTitle}>Your Location</Text>
        </View>
        {location ? (
          <View style={styles.locationCardContent}>
            <View style={styles.locationInfoRow}>
              <Text style={styles.locationLabel}>Latitude:</Text>
              <Text style={styles.locationValue}>{location.coords.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationInfoRow}>
              <Text style={styles.locationLabel}>Longitude:</Text>
              <Text style={styles.locationValue}>{location.coords.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.locationInfoRow}>
              <Text style={styles.locationLabel}>Accuracy:</Text>
              <Text style={styles.locationValue}>{location.coords.accuracy?.toFixed(0)}m</Text>
            </View>
            <View style={styles.locationStatus}>
              <Ionicons name="checkmark-circle" size={16} color="#34C759" />
              <Text style={styles.locationStatusText}>Location Active</Text>
            </View>
          </View>
        ) : (
          <View style={styles.locationCardContent}>
            <View style={styles.locationLoading}>
              <Ionicons name="location-outline" size={40} color="#ccc" />
              <Text style={styles.locationLoadingText}>Getting your location...</Text>
              <Text style={styles.locationLoadingSubtext}>Please enable GPS</Text>
            </View>
          </View>
        )}
      </View>

      {/* Emergency Requests */}
      {pendingRequests.length > 0 ? (
        <View style={styles.requestsSection}>
          <View style={styles.requestsHeader}>
            <Text style={styles.requestsTitle}>🚨 Active Emergencies</Text>
            <View style={styles.requestsBadge}>
              <Text style={styles.requestsCount}>{pendingRequests.length}</Text>
            </View>
          </View>
          <FlatList
            data={pendingRequests}
            renderItem={renderEmergencyRequest}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      ) : (
        <View style={styles.noEmergenciesContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#34C759" />
          <Text style={styles.noEmergenciesTitle}>All Clear! 🎉</Text>
          <Text style={styles.noEmergenciesText}>
            {isAvailable 
              ? "No emergencies nearby. We'll notify you when help is needed."
              : "Set your status to 'Online' to receive emergency requests."}
          </Text>
        </View>
      )}

      {/* Statistics */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done" size={28} color="#34C759" />
          <Text style={styles.statNumber}>{user.totalRatings || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={28} color="#FFD700" />
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

      {/* Map View Modal with Directions */}
      {showMapView && selectedEmergency && location && (
        <View style={styles.mapModal}>
          {/* Map Header */}
          <View style={styles.mapHeader}>
            <View style={styles.mapHeaderInfo}>
              <Text style={styles.mapHeaderTitle}>
                {selectedEmergency.request.disasterType?.toUpperCase() || 'EMERGENCY'}
              </Text>
              <Text style={styles.mapHeaderSubtitle}>
                Distance: {selectedEmergency.distance.toFixed(2)} km • ETA: {selectedEmergency.estimatedTime}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.mapCloseButton}
              onPress={() => setShowMapView(false)}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Map Container */}
          <View style={styles.mapModalContainer}>
            <SimpleMap
              initialRegion={{
                latitude: (location.coords.latitude + selectedEmergency.request.location.latitude) / 2,
                longitude: (location.coords.longitude + selectedEmergency.request.location.longitude) / 2,
                latitudeDelta: Math.abs(location.coords.latitude - selectedEmergency.request.location.latitude) * 2 + 0.01,
                longitudeDelta: Math.abs(location.coords.longitude - selectedEmergency.request.location.longitude) * 2 + 0.01,
              }}
            >
              {/* Volunteer Location Marker */}
              <SimpleMarker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Your Location"
                description="You are here"
                pinColor="#007AFF"
              />

              {/* Victim Location Marker */}
              <SimpleMarker
                coordinate={{
                  latitude: selectedEmergency.request.location.latitude,
                  longitude: selectedEmergency.request.location.longitude,
                }}
                title="Victim Location"
                description={selectedEmergency.request.description}
                pinColor="#FF3B30"
              />
            </SimpleMap>
          </View>

          {/* Emergency Details Card */}
          <View style={styles.mapDetailsCard}>
            <View style={styles.mapDetailRow}>
              <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              <Text style={styles.mapDetailLabel}>Type:</Text>
              <Text style={styles.mapDetailValue}>
                {selectedEmergency.request.disasterType?.toUpperCase() || 'EMERGENCY'}
              </Text>
            </View>
            
            <View style={styles.mapDetailRow}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <Text style={styles.mapDetailLabel}>Address:</Text>
              <Text style={styles.mapDetailValue} numberOfLines={2}>
                {selectedEmergency.request.location.address === 'Location not specified' 
                  ? `Lat: ${selectedEmergency.request.location.latitude.toFixed(6)}, Lng: ${selectedEmergency.request.location.longitude.toFixed(6)}`
                  : selectedEmergency.request.location.address
                }
              </Text>
            </View>

            <View style={styles.mapDetailRow}>
              <Ionicons name="information-circle" size={20} color="#666" />
              <Text style={styles.mapDetailLabel}>Message:</Text>
              <Text style={styles.mapDetailValue} numberOfLines={3}>
                {selectedEmergency.request.description || 'Emergency assistance needed'}
              </Text>
            </View>

            <View style={styles.mapDetailRow}>
              <Ionicons name="time" size={20} color="#FF9500" />
              <Text style={styles.mapDetailLabel}>Distance:</Text>
              <Text style={styles.mapDetailValue}>
                {selectedEmergency.distance.toFixed(2)} km • ETA: {selectedEmergency.estimatedTime}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.mapActionButtons}>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => openGoogleMapsDirections(selectedEmergency.request.location)}
            >
              <Ionicons name="navigate" size={20} color="white" />
              <Text style={styles.navigateButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => {
                Alert.alert(
                  'Mark Complete', 
                  'Has the emergency been resolved?', 
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes, Mark Complete',
                      onPress: handleCompleteEmergency
                    }
                  ]
                );
              }}
            >
              <Ionicons name="checkmark-done" size={20} color="white" />
              <Text style={styles.completeButtonText}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
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
  locationCard: {
    backgroundColor: 'white',
    margin: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  locationCardContent: {
    marginTop: 4,
  },
  locationInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
  },
  locationStatusText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '600',
    marginLeft: 6,
  },
  locationLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  locationLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  locationLoadingSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
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
  noEmergenciesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F8F9FA',
    margin: 10,
    borderRadius: 12,
  },
  noEmergenciesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  noEmergenciesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  requestsSection: {
    flex: 1,
    margin: 10,
  },
  requestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requestsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  requestsBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestsCount: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
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
    backgroundColor: '#FFF0F0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#34C759',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonDisabled: {
    backgroundColor: '#999',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  severityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  severityBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 4,
    fontWeight: '500',
  },
  distanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  distanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 2,
  },
  distanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#DDD',
    marginHorizontal: 12,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  // Map Modal Styles
  mapModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    elevation: 3,
  },
  mapHeaderInfo: {
    flex: 1,
  },
  mapHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  mapHeaderSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mapCloseButton: {
    padding: 8,
  },
  mapModalContainer: {
    height: height * 0.45,
    backgroundColor: '#F5F5F5',
  },
  mapDetailsCard: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  mapDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
    minWidth: 80,
  },
  mapDetailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  mapActionButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default VolunteerHomeScreen;