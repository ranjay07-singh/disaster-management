import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';

interface SystemInfoProps {
  user: User;
}

const SystemInfo: React.FC<SystemInfoProps> = ({ user }) => {
  const InfoRow = ({ label, value, icon }: {
    label: string;
    value: string;
    icon: string;
  }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={20} color="#666" style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  const formatLastLogin = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <Text style={styles.sectionSubtitle}>Application and account details</Text>
      </View>
      
      <View style={styles.infoList}>
        <InfoRow
          label="App Version"
          value="1.0.0"
          icon="phone-portrait"
        />
        
        <InfoRow
          label="Platform"
          value={Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
          icon="hardware-chip"
        />
        
        <InfoRow
          label="Last Login"
          value={formatLastLogin()}
          icon="time"
        />
        
        <InfoRow
          label="User ID"
          value={user.id}
          icon="person"
        />
        
        <InfoRow
          label="Account Status"
          value="Active"
          icon="checkmark-circle"
        />
        
        <InfoRow
          label="Data Sync"
          value="Up to date"
          icon="sync"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginBottom: 15,
    marginHorizontal: 15,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  infoList: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    maxWidth: '50%',
  },
});

export default SystemInfo;