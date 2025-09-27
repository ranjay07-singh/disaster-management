import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonsProps {
  loading: boolean;
  onExportData: () => void;
  onLogout: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  loading,
  onExportData,
  onLogout,
}) => {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: onLogout
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Export Data Button */}
      <TouchableOpacity 
        style={[styles.exportButton, loading && styles.buttonDisabled]} 
        onPress={onExportData}
        disabled={loading}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Ionicons 
            name={loading ? "hourglass" : "download"} 
            size={22} 
            color="white" 
          />
          <Text style={styles.exportButtonText}>
            {loading ? 'Exporting...' : 'Export Data'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="log-out" size={22} color="#FF3B30" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingBottom: 30,
    paddingTop: 10,
  },
  exportButton: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutButton: {
    backgroundColor: 'white',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF3B30',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
});

export default ActionButtons;