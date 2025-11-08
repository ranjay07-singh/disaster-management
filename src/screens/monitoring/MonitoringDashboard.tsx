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
import { ApiService } from '../../services/ApiService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../services/firebase';
import UserManagement from './UserManagement';
import { useIsFocused } from '@react-navigation/native';

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
  const isFocused = useIsFocused(); // Hook to detect when screen is focused
  
  const [stats, setStats] = useState<DashboardStats>({
    activeEmergencies: 0,
    totalVolunteers: 0,
    totalUsers: 0,
    resolvedToday: 0,
  });

  const [activeEmergencies, setActiveEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'userManagement'>('dashboard');

  useEffect(() => {
    if (isFocused) {
      console.log('🎯 Dashboard is now focused, loading data...');
      loadDashboardData();
    }
  }, [isFocused]); // Reload whenever the screen comes into focus

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 MonitoringDashboard: Starting to load dashboard data...');
      
      // Fetch users from Firebase Firestore (same as UserManagement)
      const usersCollection = collection(firestore, 'users');
      const querySnapshot = await getDocs(usersCollection);
      
      console.log('📊 Total Firebase documents:', querySnapshot.size);
      
      let totalVictims = 0;
      let totalVolunteers = 0;
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log('👤 User:', doc.id, 'Role:', userData.role);
        
        // Count only VICTIM and VOLUNTEER roles (case-insensitive)
        const role = userData.role?.toUpperCase();
        if (role === 'VOLUNTEER') {
          totalVolunteers++;
        } else if (role === 'VICTIM') {
          totalVictims++;
        }
      });
      
      const totalUsers = totalVictims + totalVolunteers;
      
      console.log('✅ Counted:', { totalVictims, totalVolunteers, totalUsers });

      // Fetch emergencies from backend
      console.log('🚨 Fetching emergencies from backend...');
      console.log('🔗 API Endpoint:', `${ApiService['baseUrl']}/emergency`);
      const emergenciesResponse = await ApiService.getAllEmergencies();
      console.log('📦 Emergencies response:', emergenciesResponse);
      console.log('📦 Response type:', typeof emergenciesResponse);
      console.log('📦 Is Array?:', Array.isArray(emergenciesResponse));
      
      // Extract emergencies array from response
      const emergencyList = Array.isArray(emergenciesResponse) 
        ? emergenciesResponse 
        : ((emergenciesResponse as any)?.emergencies || (emergenciesResponse as any)?.data || []);
      
      console.log('📋 Emergency list:', emergencyList.length, 'emergencies');
      console.log('📋 Emergency details:', JSON.stringify(emergencyList, null, 2));

      // Calculate stats (case-insensitive status check)
      const activeEmergenciesCount = emergencyList.filter((e: any) => {
        const status = e.status?.toUpperCase();
        return status === 'ACTIVE' || status === 'PENDING';
      }).length;

      const today = new Date().toDateString();
      const resolvedToday = emergencyList.filter((e: any) => {
        const status = e.status?.toUpperCase();
        const isResolved = status === 'COMPLETED' || status === 'RESOLVED';
        const updatedToday = new Date(e.updatedAt || e.resolvedAt).toDateString() === today;
        return isResolved && updatedToday;
      }).length;

      // Update stats
      setStats({
        activeEmergencies: activeEmergenciesCount,
        totalVolunteers: totalVolunteers,
        totalUsers: totalUsers,
        resolvedToday: resolvedToday,
      });
      
      console.log('📊 Final stats set:', {
        activeEmergencies: activeEmergenciesCount,
        totalVolunteers,
        totalUsers,
        resolvedToday
      });

      // Format emergencies for display (case-insensitive status check)
      const formattedEmergencies: EmergencyRequest[] = emergencyList
        .filter((e: any) => {
          const status = e.status?.toUpperCase();
          return status === 'ACTIVE' || status === 'PENDING';
        })
        .slice(0, 5)
        .map((emergency: any) => ({
          id: emergency.id.toString(),
          victimId: emergency.userId?.toString() || 'unknown',
          disasterType: (emergency.caseType || emergency.disasterType) as DisasterType,
          location: {
            latitude: emergency.locationLat || emergency.latitude || 0,
            longitude: emergency.locationLng || emergency.longitude || 0,
            address: emergency.locationAddress || emergency.location || 'Unknown location',
          },
          description: emergency.description || 'No description provided',
          severity: mapSeverityLevel(emergency.severityLevel || emergency.severity),
          status: (emergency.status || 'pending').toLowerCase(),
          assignedVolunteers: emergency.assignedVolunteers || [],
          governmentAgenciesNotified: emergency.governmentAgenciesNotified || [],
          createdAt: new Date(emergency.createdAt),
          updatedAt: new Date(emergency.updatedAt),
        }));

      setActiveEmergencies(formattedEmergencies);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map numeric severity to text
  const mapSeverityLevel = (level: any): string => {
    if (typeof level === 'string') return level;
    switch (level) {
      case 5: return 'critical';
      case 4: return 'high';
      case 3: return 'medium';
      case 2: return 'low';
      case 1: return 'low';
      default: return 'medium';
    }
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
      `${emergency.disasterType?.toUpperCase() || 'UNKNOWN'}\n\nLocation: ${emergency.location.address}\n\nStatus: ${emergency.status}\n\nAssigned Volunteers: ${emergency.assignedVolunteers.length}`,
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
      {/* Show UserManagement if selected */}
      {activeView === 'userManagement' ? (
        <View style={styles.container}>
          {/* Back Button */}
          <View style={styles.backHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setActiveView('dashboard')}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
          <UserManagement user={user} />
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
              <Text style={styles.roleText}>Monitoring Dashboard</Text>
            </View>
            <TouchableOpacity 
              onPress={loadDashboardData}
              style={styles.refreshButton}
            >
              <Ionicons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
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
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveView('userManagement')}
            >
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
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#CCC" />
                <Text style={{ fontSize: 16, color: '#999', marginTop: 12 }}>
                  No active emergencies
                </Text>
                <Text style={{ fontSize: 14, color: '#BBB', marginTop: 4 }}>
                  All emergencies are resolved or no cases reported
                </Text>
              </View>
            }
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
      </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backHeader: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
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