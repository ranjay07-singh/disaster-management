import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SimpleMap, SimpleMarker } from '../../components/SimpleMap';
import { Ionicons } from '@expo/vector-icons';
import { User, EmergencyRequest, DisasterType } from '../../types/User';
import { ApiService } from '../../services/ApiService';
import { useEmergency } from '../../contexts/EmergencyContext';

interface ProvideHelpScreenProps {
  user: User;
}

const ProvideHelpScreen: React.FC<ProvideHelpScreenProps> = ({ user }) => {
  const { activeEmergency } = useEmergency();
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(activeEmergency || null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [helpStatus, setHelpStatus] = useState<'en-route' | 'arrived' | 'helping' | 'completed'>('en-route');

  useEffect(() => {
    // Update when context changes
    if (activeEmergency) {
      setActiveRequest(activeEmergency);
    } else {
      // Load active emergency from API if not in context
      loadActiveEmergency();
    }
  }, [activeEmergency]);

  const loadActiveEmergency = async () => {
    if (activeEmergency) {
      setActiveRequest(activeEmergency);
      return;
    }

    try {
      // Fetch emergencies assigned to this volunteer
      const emergencies = await ApiService.getAllEmergencies();
      const emergencyList = Array.isArray(emergencies) 
        ? emergencies 
        : ((emergencies as any)?.emergencies || []);
      
      // Find emergency assigned to this volunteer that's not completed
      const myActiveEmergency = emergencyList.find((e: any) => 
        (e.status === 'assigned' || e.status === 'in_progress') &&
        e.assignedVolunteers?.includes(user.id)
      );

      if (myActiveEmergency) {
        const formattedEmergency: EmergencyRequest = {
          id: myActiveEmergency.id.toString(),
          victimId: myActiveEmergency.victimId?.toString() || 'unknown',
          disasterType: (myActiveEmergency.caseType || myActiveEmergency.disasterType) as DisasterType,
          location: {
            latitude: myActiveEmergency.locationLat || myActiveEmergency.latitude || 0,
            longitude: myActiveEmergency.locationLng || myActiveEmergency.longitude || 0,
            address: myActiveEmergency.locationAddress || myActiveEmergency.location || 'Address unavailable',
          },
          description: myActiveEmergency.description || 'Emergency assistance needed',
          severity: mapSeverityLevel(myActiveEmergency.severityLevel || myActiveEmergency.severity),
          status: myActiveEmergency.status,
          assignedVolunteers: myActiveEmergency.assignedVolunteers || [user.id],
          governmentAgenciesNotified: myActiveEmergency.governmentAgenciesNotified || [],
          createdAt: new Date(myActiveEmergency.createdAt),
          updatedAt: new Date(myActiveEmergency.updatedAt || myActiveEmergency.createdAt),
        };
        setActiveRequest(formattedEmergency);
      }
    } catch (error) {
      console.error('Failed to load active emergency:', error);
    }
  };

  const mapSeverityLevel = (level: any): 'low' | 'medium' | 'high' | 'critical' => {
    if (typeof level === 'string') {
      const normalizedLevel = level.toLowerCase();
      if (['low', 'medium', 'high', 'critical'].includes(normalizedLevel)) {
        return normalizedLevel as 'low' | 'medium' | 'high' | 'critical';
      }
      return 'medium';
    }
    switch (level) {
      case 5: return 'critical';
      case 4: return 'high';
      case 3: return 'medium';
      case 2: return 'low';
      case 1: return 'low';
      default: return 'medium';
    }
  };

  const openGoogleMaps = () => {
    if (!activeRequest) return;

    const { latitude, longitude } = activeRequest.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps');
    });
    
    setIsNavigating(true);
  };

  const updateHelpStatus = (newStatus: typeof helpStatus) => {
    setHelpStatus(newStatus);
    
    const statusMessages = {
      'en-route': 'Status updated: En route to emergency location',
      'arrived': 'Status updated: Arrived at location',
      'helping': 'Status updated: Providing assistance',
      'completed': 'Emergency assistance completed'
    };
    
    Alert.alert('Status Updated', statusMessages[newStatus]);
    
    if (newStatus === 'completed') {
      // Show rating/feedback option
      showCompletionOptions();
    }
  };

  const showCompletionOptions = () => {
    Alert.alert(
      'Mission Completed',
      'Thank you for your service! The victim will be able to rate your assistance.',
      [
        { text: 'OK', onPress: () => setActiveRequest(null) }
      ]
    );
  };

  const handleQuickCall = async (phoneNumber: string, serviceName: string) => {
    Alert.alert(
      'Make Call',
      `Call ${serviceName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call',
          onPress: async () => {
            const phoneUrl = `tel:${phoneNumber}`;
            const canOpen = await Linking.canOpenURL(phoneUrl);
            
            if (canOpen) {
              await Linking.openURL(phoneUrl);
            } else {
              Alert.alert('Error', 'Cannot make phone calls on this device');
            }
          },
        },
      ]
    );
  };

  const contactOtherVolunteers = () => {
    Alert.alert(
      'Contact Volunteers',
      'Connect with other volunteers responding to this emergency',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join Group Chat', onPress: () => console.log('Open group chat') },
        { text: 'Call Coordinator', onPress: () => console.log('Call coordinator') },
      ]
    );
  };

  const contactAuthorities = () => {
    Alert.alert(
      'Contact Authorities',
      'Contact relevant emergency services',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Fire Department', onPress: () => Linking.openURL('tel:101') },
        { text: 'Ambulance', onPress: () => Linking.openURL('tel:108') },
        { text: 'Police', onPress: () => Linking.openURL('tel:100') },
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

  const getStatusColor = (status: typeof helpStatus) => {
    switch (status) {
      case 'en-route': return '#FF9800';
      case 'arrived': return '#2196F3';
      case 'helping': return '#FF5722';
      case 'completed': return '#4CAF50';
      default: return '#666';
    }
  };

  if (!activeRequest) {
    return (
      <View style={styles.noRequestContainer}>
        <Ionicons name="medical-outline" size={80} color="#ccc" />
        <Text style={styles.noRequestTitle}>No Active Emergency</Text>
        <Text style={styles.noRequestText}>
          You will see emergency requests here when you accept them from the Home tab.
        </Text>
        <TouchableOpacity style={styles.goBackButton}>
          <Text style={styles.goBackButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Emergency Header */}
      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyInfo}>
          <Ionicons 
            name={getDisasterIcon(activeRequest.disasterType) as any} 
            size={30} 
            color={getSeverityColor(activeRequest.severity)} 
          />
          <View style={styles.emergencyDetails}>
            <Text style={styles.emergencyType}>
              {activeRequest.disasterType?.toUpperCase() || 'UNKNOWN'} EMERGENCY
            </Text>
            <Text style={[styles.severityText, { color: getSeverityColor(activeRequest.severity) }]}>
              {activeRequest.severity?.toUpperCase() || 'UNKNOWN'} PRIORITY
            </Text>
          </View>
        </View>
        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>
            {new Date(activeRequest.createdAt).toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {/* Status Tracker */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Your Status</Text>
        <View style={styles.statusTracker}>
          {(['en-route', 'arrived', 'helping', 'completed'] as const).map((status, index) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusStep,
                helpStatus === status && styles.activeStep,
                ['en-route', 'arrived', 'helping'].includes(helpStatus) && 
                ['en-route', 'arrived', 'helping'].indexOf(helpStatus) >= index && 
                styles.completedStep
              ]}
              onPress={() => index <= ['en-route', 'arrived', 'helping', 'completed'].indexOf(helpStatus) + 1 && updateHelpStatus(status)}
            >
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(status) },
                helpStatus === status && styles.activeDot
              ]} />
              <Text style={[
                styles.statusLabel,
                helpStatus === status && styles.activeLabel
              ]}>
                {status?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map and Navigation */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionTitle}>Location & Navigation</Text>
        <View style={styles.mapContainer}>
          <SimpleMap
            style={styles.map}
            initialRegion={{
              latitude: activeRequest.location.latitude,
              longitude: activeRequest.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <SimpleMarker
              coordinate={{
                latitude: activeRequest.location.latitude,
                longitude: activeRequest.location.longitude,
              }}
              title="Emergency Location"
              pinColor={getSeverityColor(activeRequest.severity)}
            />
          </SimpleMap>
        </View>
        
        <TouchableOpacity style={styles.navigationButton} onPress={openGoogleMaps}>
          <Ionicons name="navigate" size={20} color="white" />
          <Text style={styles.navigationButtonText}>Open in Google Maps</Text>
        </TouchableOpacity>
        
        <Text style={styles.addressText}>📍 {activeRequest.location.address}</Text>
      </View>

      {/* Emergency Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Emergency Details</Text>
        <View style={styles.detailsCard}>
          <Text style={styles.descriptionTitle}>Description:</Text>
          <Text style={styles.descriptionText}>{activeRequest.description}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color="#666" />
              <Text style={styles.detailText}>
                Reported: {new Date(activeRequest.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.detailText}>
                {activeRequest.assignedVolunteers.length} Volunteers
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Communication */}
      <View style={styles.communicationSection}>
        <Text style={styles.sectionTitle}>Communication</Text>
        
        <TouchableOpacity style={styles.communicationButton} onPress={contactOtherVolunteers}>
          <Ionicons name="people" size={20} color="#007AFF" />
          <Text style={styles.communicationButtonText}>Contact Other Volunteers</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.communicationButton} onPress={contactAuthorities}>
          <Ionicons name="shield" size={20} color="#007AFF" />
          <Text style={styles.communicationButtonText}>Contact Authorities</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.communicationButton}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <Text style={styles.communicationButtonText}>Contact Victim</Text>
          <Ionicons name="chevron-forward" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickCall('112', 'Emergency Services (112)')}
          >
            <Ionicons name="call" size={24} color="white" />
            <Text style={styles.quickActionText}>Call 112</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickCall('108', 'Ambulance (108)')}
          >
            <Ionicons name="medical" size={24} color="white" />
            <Text style={styles.quickActionText}>Medical</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleQuickCall('102', 'Transport Ambulance (102)')}
          >
            <Ionicons name="car" size={24} color="white" />
            <Text style={styles.quickActionText}>Transport</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Report Issue', 'Report additional details about this emergency.')}
          >
            <Ionicons name="warning" size={24} color="white" />
            <Text style={styles.quickActionText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  noRequestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noRequestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  noRequestText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  goBackButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  goBackButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emergencyHeader: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyDetails: {
    marginLeft: 15,
  },
  emergencyType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  statusSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statusTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusStep: {
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  activeDot: {
    borderWidth: 3,
    borderColor: 'white',
    elevation: 3,
  },
  statusLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#333',
    fontWeight: 'bold',
  },
  activeStep: {
    opacity: 1,
  },
  completedStep: {
    opacity: 0.7,
  },
  mapSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    flex: 1,
  },
  navigationButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  navigationButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  detailsCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  communicationSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  communicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
  },
  communicationButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 15,
    fontWeight: '500',
  },
  quickActionsSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#34C759',
    width: '22%',
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  quickActionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default ProvideHelpScreen;