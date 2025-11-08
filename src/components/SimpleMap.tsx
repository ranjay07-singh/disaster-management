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

export const SimpleMap: React.FC<SimpleMapProps> = ({ style, initialRegion, children }) => {
  return (
    <View style={[styles.mapContainer, style]}>
      <View style={styles.mapHeader}>
        <Ionicons name="location" size={24} color="#007AFF" />
        <Text style={styles.mapTitle}>Interactive Map</Text>
        {initialRegion && (
          <Text style={styles.coordinates}>
            📍 {initialRegion.latitude.toFixed(4)}, {initialRegion.longitude.toFixed(4)}
          </Text>
        )}
      </View>
      <View style={styles.mapContent}>
        {initialRegion ? (
          <>
            <Text style={styles.mapText}>
              ✅ Your location is being tracked
            </Text>
            <View style={styles.markersContainer}>
              {children}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.mapText}>
              📍 Getting your location...
            </Text>
            <Text style={styles.mapSubtext}>
              (Please enable location permissions)
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

export const SimpleMarker: React.FC<MarkerProps> = ({ coordinate, title, pinColor = '#FF3B30' }) => {
  return (
    <View style={styles.markerContainer}>
      <View style={styles.markerPin}>
        <Ionicons name="location-sharp" size={32} color={pinColor} />
      </View>
      {title && (
        <View style={styles.markerInfo}>
          <Text style={styles.markerTitle}>{title}</Text>
          <Text style={styles.markerCoords}>
            {coordinate.latitude.toFixed(4)}, {coordinate.longitude.toFixed(4)}
          </Text>
        </View>
      )}
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
    flexWrap: 'wrap',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
    flex: 1,
  },
  coordinates: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 10,
  },
  mapContent: {
    flex: 1,
    padding: 20,
  },
  mapText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
    fontWeight: '600',
  },
  mapSubtext: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  markersContainer: {
    marginTop: 15,
    width: '100%',
  },
  markerContainer: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerPin: {
    alignItems: 'center',
    marginBottom: 5,
  },
  markerInfo: {
    alignItems: 'center',
  },
  markerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  markerCoords: {
    fontSize: 11,
    color: '#666',
  },
});