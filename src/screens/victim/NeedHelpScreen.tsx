import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { AudioRecording, useAudioRecorder, useAudioPlayer } from 'expo-audio';
import * as Location from 'expo-location';
import { User, DisasterType, EmergencyRequest } from '../../types/User';

interface NeedHelpScreenProps {
  user: User;
}

const NeedHelpScreen: React.FC<NeedHelpScreenProps> = ({ user }) => {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType | null>(null);
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
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
    { type: DisasterType.FLOOD, label: 'Flood', icon: 'water', color: '#4A90E2' },
    { type: DisasterType.EARTHQUAKE, label: 'Earthquake', icon: 'globe', color: '#8B4513' },
    { type: DisasterType.FIRE, label: 'Fire', icon: 'flame', color: '#FF6B35' },
    { type: DisasterType.ROAD_ACCIDENT, label: 'Road Accident', icon: 'car', color: '#FF3B30' },
    { type: DisasterType.WOMEN_SAFETY, label: 'Women Safety', icon: 'shield', color: '#FF2D92' },
    { type: DisasterType.CYCLONE, label: 'Cyclone', icon: 'refresh', color: '#5856D6' },
    { type: DisasterType.TSUNAMI, label: 'Tsunami', icon: 'water', color: '#007AFF' },
    { type: DisasterType.AVALANCHE, label: 'Avalanche', icon: 'snow', color: '#E5E5EA' },
    { type: DisasterType.LANDSLIDE, label: 'Landslide', icon: 'triangle', color: '#8E8E93' },
    { type: DisasterType.FOREST_FIRE, label: 'Forest Fire', icon: 'leaf', color: '#FF9500' },
    { type: DisasterType.CHEMICAL_EMERGENCY, label: 'Chemical Emergency', icon: 'flask', color: '#34C759' },
  ];

  const startRecording = async () => {
    try {
      // Placeholder for audio recording functionality
      // TODO: Implement with expo-audio when needed
      setIsRecording(true);
      setRecording({ uri: 'placeholder-audio-recording' });
      
      // Simulate recording for 3 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 3000);
      
      Alert.alert('Recording Started', 'Voice recording simulation started (3 seconds)');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    const uri = 'simulated-audio-recording.wav';
    setAudioUri(uri);
    setRecording(null);

    Alert.alert('Recording Stopped', 'Voice recording completed successfully!');
    
    // Process audio with AI (mock implementation)
    processAudioWithAI(uri);
  };

  const processAudioWithAI = async (audioUri: string | null) => {
    if (!audioUri) return;

    setIsProcessing(true);

    // Mock AI processing - In real implementation, send to AI service
    setTimeout(() => {
      const mockKeywords = ['fire', 'emergency', 'help'];
      const detectedDisaster = detectDisasterFromKeywords(mockKeywords);
      
      if (detectedDisaster) {
        setSelectedDisaster(detectedDisaster);
        Alert.alert(
          'Disaster Detected',
          `AI detected: ${detectedDisaster}. Please confirm if this is correct.`
        );
      }
      
      setIsProcessing(false);
    }, 2000);
  };

  const detectDisasterFromKeywords = (keywords: string[]): DisasterType | null => {
    // Simple keyword mapping - In real implementation, use more sophisticated AI
    const keywordMap: { [key: string]: DisasterType } = {
      'fire': DisasterType.FIRE,
      'flood': DisasterType.FLOOD,
      'earthquake': DisasterType.EARTHQUAKE,
      'accident': DisasterType.ROAD_ACCIDENT,
      'help': DisasterType.WOMEN_SAFETY, // Context-dependent
      'cyclone': DisasterType.CYCLONE,
      'tsunami': DisasterType.TSUNAMI,
    };

    for (const keyword of keywords) {
      if (keywordMap[keyword.toLowerCase()]) {
        return keywordMap[keyword.toLowerCase()];
      }
    }

    return null;
  };

  const processTextWithAI = (text: string) => {
    const keywords = text.toLowerCase().split(' ');
    const detectedDisaster = detectDisasterFromKeywords(keywords);
    
    if (detectedDisaster) {
      setSelectedDisaster(detectedDisaster);
      Alert.alert(
        'Disaster Detected',
        `AI detected: ${detectedDisaster} from your description. Please confirm if this is correct.`
      );
    }
  };

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
      // Get address from coordinates
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseGeocode.length > 0 
        ? `${reverseGeocode[0].street || ''}, ${reverseGeocode[0].city || ''}, ${reverseGeocode[0].region || ''}`
        : 'Address not available';

      const emergencyRequest: Partial<EmergencyRequest> = {
        victimId: user.id,
        disasterType: selectedDisaster,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address,
        },
        description: description,
        voiceRecording: audioUri || undefined,
        severity: determineSeverity(selectedDisaster),
        status: 'pending',
        createdAt: new Date(),
      };

      // In real implementation, send to backend
      console.log('Emergency Request:', emergencyRequest);

      // Mock volunteer assignment and government notification
      await assignVolunteersAndNotifyAuthorities(emergencyRequest);

      Alert.alert(
        'Help Request Sent',
        'Your emergency request has been sent to nearby volunteers and relevant authorities. Help is on the way!',
        [{ text: 'OK', onPress: () => {
          setSelectedDisaster(null);
          setDescription('');
          setAudioUri(null);
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

  const assignVolunteersAndNotifyAuthorities = async (request: Partial<EmergencyRequest>) => {
    // Mock implementation - In real app, this would be handled by backend
    console.log('Assigning volunteers and notifying authorities for:', request.disasterType);
    
    // Simulate API calls to AWS Lambda for notifications
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={40} color="#FF3B30" />
        <Text style={styles.title}>Need Emergency Help?</Text>
        <Text style={styles.subtitle}>Select disaster type or use voice/text detection</Text>
      </View>

      {/* AI Detection Section */}
      <View style={styles.aiSection}>
        <Text style={styles.sectionTitle}>AI Detection</Text>
        
        {/* Voice Recording */}
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <Ionicons 
            name={isRecording ? 'stop-circle' : 'mic'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.voiceButtonText}>
            {isRecording ? 'Stop Recording' : 'Start Voice Recording'}
          </Text>
        </TouchableOpacity>

        {/* Text Input for AI Analysis */}
        <TextInput
          style={styles.textInput}
          placeholder="Describe your emergency (AI will analyze)..."
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            if (text.length > 10) {
              processTextWithAI(text);
            }
          }}
          multiline
          numberOfLines={3}
        />

        {isProcessing && (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>AI is analyzing your request...</Text>
          </View>
        )}
      </View>

      {/* Disaster Type Selection */}
      <View style={styles.disasterSection}>
        <Text style={styles.sectionTitle}>Select Disaster Type</Text>
        <View style={styles.disasterGrid}>
          {disasterTypes.map((disaster) => (
            <TouchableOpacity
              key={disaster.type}
              style={[
                styles.disasterCard,
                { backgroundColor: disaster.color },
                selectedDisaster === disaster.type && styles.selectedCard,
              ]}
              onPress={() => setSelectedDisaster(disaster.type)}
            >
              <Ionicons name={disaster.icon as any} size={30} color="white" />
              <Text style={styles.disasterLabel}>{disaster.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, (!selectedDisaster || isProcessing) && styles.submitButtonDisabled]}
        onPress={submitEmergencyRequest}
        disabled={!selectedDisaster || isProcessing}
      >
        <Ionicons name="send" size={24} color="white" />
        <Text style={styles.submitButtonText}>
          {isProcessing ? 'Sending Help Request...' : 'Send Emergency Request'}
        </Text>
      </TouchableOpacity>

      {/* Emergency Contacts */}
      <View style={styles.emergencyContacts}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <Text style={styles.contactText}>National Emergency: 112</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <Text style={styles.contactText}>Police: 100</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <Text style={styles.contactText}>Fire Brigade: 101</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <Text style={styles.contactText}>Ambulance: 108</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  aiSection: {
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
  voiceButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  processingText: {
    color: '#007AFF',
    fontStyle: 'italic',
  },
  disasterSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  disasterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  disasterCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  disasterLabel: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  emergencyContacts: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 30,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  contactText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 10,
    fontWeight: '500',
  },
});

export default NeedHelpScreen;