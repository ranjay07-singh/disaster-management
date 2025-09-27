import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SimpleMapProps {
  style?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  children?: React.ReactNode;
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
}

export const SimpleMap: React.FC<SimpleMapProps> = ({ style, children }) => {
  return (
    <View style={[styles.mapContainer, style]}>
      <View style={styles.mapHeader}>
        <Ionicons name="location" size={24} color="#007AFF" />
        <Text style={styles.mapTitle}>Interactive Map</Text>
      </View>
      <View style={styles.mapContent}>
        <Text style={styles.mapText}>
          📍 Your location and nearby emergencies will be displayed here
        </Text>
        <Text style={styles.mapSubtext}>
          (Map functionality will be available when deployed)
        </Text>
        {children}
      </View>
    </View>
  );
};

export const SimpleMarker: React.FC<MarkerProps> = ({ coordinate, title, pinColor = '#FF3B30' }) => {
  return (
    <View style={styles.markerContainer}>
      <Ionicons name="location-sharp" size={20} color={pinColor} />
      {title && <Text style={styles.markerTitle}>{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  mapSubtext: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  markerContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  markerTitle: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
});