import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, UserRole } from '../../types/User';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../services/firebase';

interface UserManagementProps {
  user: User;
}

interface UserWithLocation extends User {
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: Date;
}

const UserManagement: React.FC<UserManagementProps> = ({ user }) => {
  const [users, setUsers] = useState<UserWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithLocation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());

  useEffect(() => {
    loadUsers(true); // Initial full load
    // Auto-refresh every 5 minutes (fetch only updates)
    const interval = setInterval(() => loadUsers(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async (fullLoad: boolean = false) => {
    try {
      if (fullLoad) {
        setLoading(true);
      }
      
      // Fetch all users from Firebase Firestore
      const usersCollection = collection(firestore, 'users');
      const querySnapshot = await getDocs(usersCollection);
      
      const userList: UserWithLocation[] = [];
      const currentTime = new Date();
      
      querySnapshot.forEach((doc) => {
        // Skip the monitor user itself
        if (doc.id === user.id) {
          return;
        }
        
        const userData = doc.data();
        
        // If not a full load, only add users updated after last fetch
        if (!fullLoad && userData.updatedAt) {
          const userUpdateTime = new Date(userData.updatedAt);
          if (userUpdateTime <= lastFetchTime) {
            return; // Skip unchanged users
          }
        }
        
        userList.push({
          id: doc.id,
          ...userData,
        } as UserWithLocation);
      });
      
      if (fullLoad) {
        // Full load: replace all users
        console.log('Full load: Loaded', userList.length, 'users from Firebase (excluding monitor)');
        setUsers(userList);
      } else {
        // Incremental update: merge with existing users
        console.log('Incremental update: Found', userList.length, 'updated users');
        setUsers(prev => {
          const updatedIds = new Set(userList.map(u => u.id));
          const unchanged = prev.filter(u => !updatedIds.has(u.id));
          return [...unchanged, ...userList];
        });
      }
      
      setLastFetchTime(currentTime);
    } catch (error) {
      console.log('Failed to load users from Firebase:', error);
      if (fullLoad) {
        Alert.alert('Error', 'Failed to load users. Please try again.');
      }
    } finally {
      if (fullLoad) {
        setLoading(false);
      }
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.phone?.includes(searchQuery);
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleUserPress = (selectedUser: UserWithLocation) => {
    setSelectedUser(selectedUser);
    setModalVisible(true);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      Alert.alert(
        currentStatus ? 'Block User' : 'Unblock User',
        `Are you sure you want to ${currentStatus ? 'block' : 'unblock'} this user? ${currentStatus ? 'They will not be able to use the app.' : 'They will regain access to the app.'}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: currentStatus ? 'Block' : 'Unblock',
            style: currentStatus ? 'destructive' : 'default',
            onPress: async () => {
              try {
                // Update user status in Firebase Firestore
                const userRef = doc(firestore, 'users', userId);
                await updateDoc(userRef, {
                  isActive: !currentStatus,
                  updatedAt: new Date().toISOString(),
                });
                
                // Update local state
                setUsers(prev => prev.map(u => 
                  u.id === userId ? { ...u, isActive: !currentStatus } : u
                ));
                
                setModalVisible(false);
                Alert.alert('Success', `User ${currentStatus ? 'blocked' : 'unblocked'} successfully`);
                
                // Reload users to get fresh data
                loadUsers(true);
              } catch (error) {
                console.log('Toggle user status error:', error);
                Alert.alert('Error', 'Failed to update user status. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const viewUserLocation = async (userId: string, userName: string) => {
    try {
      // Fetch user location from Firebase Firestore
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const latitude = userData.currentLatitude || userData.latitude;
        const longitude = userData.currentLongitude || userData.longitude;
        
        if (latitude && longitude) {
          Alert.alert(
            `${userName}'s Location`,
            `📍 Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}\n\nOpen in Maps?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Maps',
                onPress: () => {
                  const url = Platform.select({
                    ios: `maps:0,0?q=${latitude},${longitude}`,
                    android: `geo:0,0?q=${latitude},${longitude}(${userName})`,
                  });
                  const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                  
                  Linking.canOpenURL(url || webUrl).then((supported) => {
                    if (supported) {
                      Linking.openURL(url || webUrl);
                    } else {
                      Linking.openURL(webUrl);
                    }
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert('Location Unavailable', `${userName}'s current location is not available.`);
        }
      } else {
        Alert.alert('Error', 'User not found.');
      }
    } catch (error) {
      console.log('View location error:', error);
      Alert.alert('Error', 'Failed to fetch user location. User may not have shared location yet.');
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.VICTIM: return '#007AFF';
      case UserRole.VOLUNTEER: return '#34C759';
      case UserRole.MONITORING: return '#FF9500';
      default: return '#666';
    }
  };

  const renderUserItem = ({ item }: { item: UserWithLocation }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => handleUserPress(item)}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{item.name || 'Unknown User'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
        </View>
        <Text style={styles.userEmail}>📧 {item.email || 'No email'}</Text>
        <Text style={styles.userPhone}>📱 {item.phone || 'No phone'}</Text>
        {item.role === UserRole.VOLUNTEER && item.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)} ({item.totalRatings || 0} reviews)</Text>
          </View>
        )}
        {item.currentLatitude && item.currentLongitude && (
          <Text style={styles.locationIndicator}>📍 Location Available</Text>
        )}
      </View>
      <View style={styles.userActions}>
        <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#34C759' : '#FF3B30' }]} />
        <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Blocked'}</Text>
        <Ionicons name="chevron-forward" size={20} color="#999" style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#34C759' }]}>
              {users.filter(u => u.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
              {users.filter(u => !u.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Blocked</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterChip, filterRole === 'all' && styles.filterChipActive]}
          onPress={() => setFilterRole('all')}
        >
          <Text style={[styles.filterText, filterRole === 'all' && styles.filterTextActive]}>
            All ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filterRole === UserRole.VICTIM && styles.filterChipActive]}
          onPress={() => setFilterRole(UserRole.VICTIM)}
        >
          <Text style={[styles.filterText, filterRole === UserRole.VICTIM && styles.filterTextActive]}>
            Victims ({users.filter(u => u.role === UserRole.VICTIM).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterChip, filterRole === UserRole.VOLUNTEER && styles.filterChipActive]}
          onPress={() => setFilterRole(UserRole.VOLUNTEER)}
        >
          <Text style={[styles.filterText, filterRole === UserRole.VOLUNTEER && styles.filterTextActive]}>
            Volunteers ({users.filter(u => u.role === UserRole.VOLUNTEER).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* User List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#CCC" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={() => loadUsers(true)}
        />
      )}

      {/* User Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>User Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                  <Text style={styles.modalUserRole}>{selectedUser.role}</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedUser.email}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedUser.phone}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: selectedUser.isActive ? '#34C759' : '#FF3B30' }]}>
                      {selectedUser.isActive ? 'Active' : 'Blocked'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Joined:</Text>
                    <Text style={styles.detailValue}>{new Date(selectedUser.createdAt).toLocaleDateString()}</Text>
                  </View>

                  {selectedUser.role === UserRole.VOLUNTEER && selectedUser.rating && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rating:</Text>
                      <Text style={styles.detailValue}>{selectedUser.rating.toFixed(1)} stars</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.blockButton, { backgroundColor: selectedUser.isActive ? '#FF3B30' : '#34C759' }]}
                    onPress={() => toggleUserStatus(selectedUser.id, selectedUser.isActive || false)}
                  >
                    <Ionicons 
                      name={selectedUser.isActive ? 'ban' : 'checkmark-circle'} 
                      size={20} 
                      color="white" 
                    />
                    <Text style={styles.actionButtonText}>
                      {selectedUser.isActive ? 'Block User' : 'Unblock User'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.locationButton]}
                    onPress={() => viewUserLocation(selectedUser.id, selectedUser.name)}
                  >
                    <Ionicons name="location" size={20} color="white" />
                    <Text style={styles.actionButtonText}>View Location</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
  },
  listContainer: {
    padding: 10,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  locationIndicator: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
    fontWeight: '500',
  },
  userActions: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalUserName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  modalUserRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  blockButton: {
    // Background color set dynamically
  },
  locationButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default UserManagement;