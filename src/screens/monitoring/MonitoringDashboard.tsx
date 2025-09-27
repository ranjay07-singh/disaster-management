import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, EmergencyRequest, DisasterType } from '../../types/User';

interface MonitoringDashboardProps {
  user: User;
}

interface DashboardStats {
  activeEmergencies: number;
  totalVolunteers: number;
  totalUsers: number;
  resolvedToday: number;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats>({
    activeEmergencies: 5,
    totalVolunteers: 127,
    totalUsers: 2458,
    resolvedToday: 12,
  });

  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyRequest[]>([]);

  useEffect(() => {
    // Mock data - In real app, fetch from backend
    const mockEmergencies: EmergencyRequest[] = [
      {
        id: 'req_1',
        victimId: 'victim_1',
        disasterType: DisasterType.FIRE,
        location: {
          latitude: 28.7041,
          longitude: 77.1025,
          address: 'Connaught Place, New Delhi',
        },
        description: 'Building fire on 3rd floor',
        severity: 'high',
        status: 'in_progress',
        assignedVolunteers: ['vol_1', 'vol_2'],
        governmentAgenciesNotified: ['fire_dept'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'req_2',
        victimId: 'victim_2',
        disasterType: DisasterType.ROAD_ACCIDENT,
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'India Gate, New Delhi',
        },
        description: 'Car accident, two vehicles involved',
        severity: 'medium',
        status: 'pending',
        assignedVolunteers: [],
        governmentAgenciesNotified: ['police'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    setActiveEmergencies(mockEmergencies);
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'assigned': return '#2196F3';
      case 'in_progress': return '#FF5722';
      case 'completed': return '#4CAF50';
      default: return '#666';
    }
  };

  const handleEmergencyPress = (emergency: EmergencyRequest) => {
    Alert.alert(
      'Emergency Details',
      `${emergency.disasterType.toUpperCase()}\n\nLocation: ${emergency.location.address}\n\nStatus: ${emergency.status}\n\nAssigned Volunteers: ${emergency.assignedVolunteers.length}`,
      [
        { text: 'OK' },
        { text: 'View Details', onPress: () => console.log('Navigate to details') },
      ]
    );
  };

  const renderEmergencyItem = ({ item }: { item: EmergencyRequest }) => (
    <TouchableOpacity 
      style={styles.emergencyCard}
      onPress={() => handleEmergencyPress(item)}
    >
      <View style={styles.emergencyHeader}>
        <View style={styles.emergencyInfo}>
          <Ionicons 
            name={getDisasterIcon(item.disasterType) as any} 
            size={20} 
            color={getSeverityColor(item.severity)} 
          />
          <Text style={styles.emergencyType}>{item.disasterType}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.emergencyDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <Text style={styles.emergencyLocation}>
        📍 {item.location.address}
      </Text>
      
      <View style={styles.emergencyFooter}>
        <Text style={styles.emergencyTime}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
        <Text style={styles.volunteersCount}>
          {item.assignedVolunteers.length} volunteers
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
        <Text style={styles.roleText}>Monitoring Dashboard</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#FF5722' }]}>
              <Ionicons name="alert-circle" size={30} color="white" />
              <Text style={styles.statNumber}>{stats.activeEmergencies}</Text>
              <Text style={styles.statLabel}>Active Emergencies</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#34C759' }]}>
              <Ionicons name="people" size={30} color="white" />
              <Text style={styles.statNumber}>{stats.totalVolunteers}</Text>
              <Text style={styles.statLabel}>Total Volunteers</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="person" size={30} color="white" />
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="checkmark-circle" size={30} color="white" />
              <Text style={styles.statNumber}>{stats.resolvedToday}</Text>
              <Text style={styles.statLabel}>Resolved Today</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.quickActionText}>Manage Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="analytics" size={24} color="#FF9500" />
              <Text style={styles.quickActionText}>View Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="notifications" size={24} color="#FF3B30" />
              <Text style={styles.quickActionText}>Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="settings" size={24} color="#8E8E93" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Emergencies */}
        <View style={styles.emergenciesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Emergencies</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={activeEmergencies}
            renderItem={renderEmergencyItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* System Status */}
        <View style={styles.systemStatusSection}>
          <Text style={styles.sectionTitle}>System Status</Text>
          
          <View style={styles.statusItem}>
            <View style={styles.statusInfo}>
              <Ionicons name="server" size={20} color="#34C759" />
              <Text style={styles.statusLabel}>Server Status</Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: '#34C759' }]}>
              <Text style={styles.statusIndicatorText}>Online</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={styles.statusInfo}>
              <Ionicons name="cloud" size={20} color="#34C759" />
              <Text style={styles.statusLabel}>Database</Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: '#34C759' }]}>
              <Text style={styles.statusIndicatorText}>Connected</Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={styles.statusInfo}>
              <Ionicons name="notifications" size={20} color="#FF9800" />
              <Text style={styles.statusLabel}>Notification Service</Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: '#FF9800' }]}>
              <Text style={styles.statusIndicatorText}>Warning</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    padding: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
  },
  quickActionsSection: {
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  emergenciesSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    color: '#FF9500',
    fontWeight: '500',
  },
  emergencyCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  emergencyLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  emergencyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyTime: {
    fontSize: 12,
    color: '#666',
  },
  volunteersCount: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  systemStatusSection: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 30,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MonitoringDashboard;