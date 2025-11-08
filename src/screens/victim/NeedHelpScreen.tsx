import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { User, DisasterType } from '../../types/User';
import { ApiService } from '../../services/ApiService';

interface NeedHelpScreenProps {
  user: User;
}

const NeedHelpScreen: React.FC<NeedHelpScreenProps> = ({ user }) => {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType | null>(null);
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const disasterTypes = [
    { type: DisasterType.ROAD_ACCIDENT, label: 'Road Accident', icon: 'car', color: '#FF3B30' },
    { type: DisasterType.FLOOD, label: 'Flood', icon: 'water', color: '#4A90E2' },
    { type: DisasterType.EARTHQUAKE, label: 'Earthquake', icon: 'globe', color: '#8B4513' },
    { type: DisasterType.FIRE, label: 'Fire', icon: 'flame', color: '#FF6B35' },
    { type: DisasterType.WOMEN_SAFETY, label: 'Women Safety', icon: 'shield', color: '#FF2D92' },
    { type: DisasterType.CYCLONE, label: 'Cyclone', icon: 'refresh', color: '#5856D6' },
    { type: DisasterType.TSUNAMI, label: 'Tsunami', icon: 'water', color: '#007AFF' },
    { type: DisasterType.AVALANCHE, label: 'Avalanche', icon: 'snow', color: '#7c7c93ff' },
    { type: DisasterType.LANDSLIDE, label: 'Landslide', icon: 'triangle', color: '#8E8E93' },
    { type: DisasterType.FOREST_FIRE, label: 'Forest Fire', icon: 'leaf', color: '#FF9500' },
    { type: DisasterType.CHEMICAL_EMERGENCY, label: 'Chemical Emergency', icon: 'flask', color: '#34C759' },
  ];

  const submitEmergencyRequest = async () => {
    if (!selectedDisaster) {
      Alert.alert('Error', 'Please select a disaster type');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location not available. Please enable location services.');
      return;
    }

    setIsProcessing(true);

    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseGeocode.length > 0 
        ? `${reverseGeocode[0].street || ''}, ${reverseGeocode[0].city || ''}, ${reverseGeocode[0].region || ''}`
        : 'Address not available';

      const emergencyData = {
        caseType: selectedDisaster,
        disasterType: selectedDisaster,
        description: description || `Emergency: ${selectedDisaster}`,
        severityLevel: getSeverityLevel(selectedDisaster),
        severity: determineSeverity(selectedDisaster),
        locationLat: location.coords.latitude,
        locationLng: location.coords.longitude,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        locationAddress: address,
        location: address,
        victimId: user.id,
      };

      console.log('📤 Submitting emergency request:', emergencyData);

      const response = await ApiService.createEmergencyAuthenticated(emergencyData);
      console.log('✅ Emergency created successfully:', response);
      console.log('✅ Emergency Created:', response);

      Alert.alert(
        'Help Request Sent',
        'Your emergency request has been sent to nearby volunteers and relevant authorities. Help is on the way!',
        [{ text: 'OK', onPress: () => {
          setSelectedDisaster(null);
          setDescription('');
        }}]
      );

    } catch (error) {
      console.error('Error submitting emergency request:', error);
      Alert.alert('Error', 'Failed to send help request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const determineSeverity = (disasterType: DisasterType): 'low' | 'medium' | 'high' | 'critical' => {
    const criticalDisasters = [DisasterType.EARTHQUAKE, DisasterType.TSUNAMI, DisasterType.CHEMICAL_EMERGENCY];
    const highDisasters = [DisasterType.FIRE, DisasterType.FLOOD, DisasterType.CYCLONE];
    const mediumDisasters = [DisasterType.ROAD_ACCIDENT, DisasterType.WOMEN_SAFETY];

    if (criticalDisasters.includes(disasterType)) return 'critical';
    if (highDisasters.includes(disasterType)) return 'high';
    if (mediumDisasters.includes(disasterType)) return 'medium';
    return 'low';
  };

  const getSeverityLevel = (disasterType: DisasterType): number => {
    const criticalDisasters = [DisasterType.EARTHQUAKE, DisasterType.TSUNAMI, DisasterType.CHEMICAL_EMERGENCY];
    const highDisasters = [DisasterType.FIRE, DisasterType.FLOOD, DisasterType.CYCLONE];
    const mediumDisasters = [DisasterType.ROAD_ACCIDENT, DisasterType.WOMEN_SAFETY];

    if (criticalDisasters.includes(disasterType)) return 5;
    if (highDisasters.includes(disasterType)) return 4;
    if (mediumDisasters.includes(disasterType)) return 3;
    return 2;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.title}>Need Emergency Help?</Text>
        <Text style={styles.subtitle}>Select the type of emergency</Text>
      </View>

      <View style={styles.disasterSection}>
        <TouchableOpacity
          style={[
            styles.featuredCard,
            { backgroundColor: disasterTypes[0].color },
            selectedDisaster === disasterTypes[0].type && styles.selectedCard,
          ]}
          onPress={() => setSelectedDisaster(disasterTypes[0].type)}
        >
          <Ionicons name={disasterTypes[0].icon as any} size={40} color="white" />
          <Text style={styles.featuredLabel}>{disasterTypes[0].label}</Text>
          {selectedDisaster === disasterTypes[0].type && (
            <Ionicons name="checkmark-circle" size={28} color="#FFD700" style={styles.checkmark} />
          )}
        </TouchableOpacity>

        <View style={styles.disasterGrid}>
          {disasterTypes.slice(1).map((disaster) => (
            <TouchableOpacity
              key={disaster.type}
              style={[
                styles.disasterCard,
                { backgroundColor: disaster.color },
                selectedDisaster === disaster.type && styles.selectedCard,
              ]}
              onPress={() => setSelectedDisaster(disaster.type)}
            >
              <Ionicons name={disaster.icon as any} size={32} color="white" />
              <Text style={styles.disasterLabel}>{disaster.label}</Text>
              {selectedDisaster === disaster.type && (
                <Ionicons name="checkmark-circle" size={24} color="#FFD700" style={styles.checkmark} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedDisaster && (
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Additional Details (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe the situation..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!selectedDisaster || isProcessing) && styles.submitButtonDisabled]}
        onPress={submitEmergencyRequest}
        disabled={!selectedDisaster || isProcessing}
      >
        <Ionicons name="send" size={24} color="white" />
        <Text style={styles.submitButtonText}>
          {isProcessing ? 'Sending...' : 'Send Emergency Request'}
        </Text>
      </TouchableOpacity>

      <View style={styles.emergencyContacts}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <TouchableOpacity style={[styles.contactButton, { backgroundColor: '#FF3B30' }]}>
          <Ionicons name="call" size={24} color="white" />
          <Text style={styles.contactText}>Police: 100</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.contactButton, { backgroundColor: '#FF6B35' }]}>
          <Ionicons name="medkit" size={24} color="white" />
          <Text style={styles.contactText}>Ambulance: 102</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.contactButton, { backgroundColor: '#FF9500' }]}>
          <Ionicons name="flame" size={24} color="white" />
          <Text style={styles.contactText}>Fire: 101</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  disasterSection: {
    padding: 15,
  },
  featuredCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  featuredLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
    marginLeft: 15,
    flex: 1,
  },
  disasterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  disasterCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: 10,
  },
  selectedCard: {
    borderWidth: 4,
    borderColor: '#FFD700',
    transform: [{ scale: 0.98 }],
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  disasterLabel: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },
  descriptionSection: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 15,
    marginTop: 5,
    padding: 18,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  emergencyContacts: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 5,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  contactText: {
    fontSize: 17,
    color: 'white',
    marginLeft: 12,
    fontWeight: '600',
  },
});

export default NeedHelpScreen;
