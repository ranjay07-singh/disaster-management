import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';

interface ProfileHeaderProps {
  user: User;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle" size={100} color="#007AFF" />
      </View>
      <Text style={styles.userName}>{user.name}</Text>
      <Text style={styles.userRole}>System Administrator</Text>
      <Text style={styles.userDepartment}>Emergency Management Division</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    marginHorizontal: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginBottom: 15,
    backgroundColor: '#F0F8FF',
    borderRadius: 60,
    padding: 10,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  userRole: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 4,
    fontWeight: '600',
  },
  userDepartment: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ProfileHeader;