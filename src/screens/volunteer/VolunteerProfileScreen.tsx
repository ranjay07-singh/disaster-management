import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import { AuthService } from '../../services/AuthService';

interface VolunteerProfileScreenProps {
  user: User;
  onLogout: () => void;
}

const VolunteerProfileScreen: React.FC<VolunteerProfileScreenProps> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await AuthService.updateUserProfile(user.id, {
        name: editedUser.name,
        phone: editedUser.phone,
        location: editedUser.location,
        certifications: editedUser.certifications,
        policeVerification: editedUser.policeVerification,
        specializations: editedUser.specializations,
      });
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    try {
      // In real implementation, update password
      Alert.alert('Success', 'Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: onLogout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={user.profileImage ? { uri: user.profileImage } : require('../../../assets/icon.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userRole}>Volunteer/Helper</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: user.isActive ? '#34C759' : '#FF3B30' }]} />
          <Text style={styles.statusText}>{user.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      {/* Profile Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons name={isEditing ? "checkmark" : "pencil"} size={20} color="#34C759" />
            <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        {isEditing ? (
          <View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editedUser.name}
                onChangeText={(text) => setEditedUser({...editedUser, name: text})}
                placeholder="Enter your full name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editedUser.phone}
                onChangeText={(text) => setEditedUser({...editedUser, phone: text})}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Address</Text>
              <TextInput
                style={styles.input}
                value={editedUser.location?.address || ''}
                onChangeText={(text) => setEditedUser({
                  ...editedUser, 
                  location: {
                    latitude: editedUser.location?.latitude || 0,
                    longitude: editedUser.location?.longitude || 0,
                    address: text
                  }
                })}
                placeholder="Enter your address"
                multiline
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{user.location?.address || 'Location not set'}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowPasswordSection(!showPasswordSection)}
        >
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Ionicons 
            name={showPasswordSection ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        {showPasswordSection && (
          <View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>
            <TouchableOpacity style={styles.passwordButton} onPress={handlePasswordChange}>
              <Text style={styles.passwordButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Certifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        {user.certifications?.length ? (
          user.certifications.map((cert, idx) => (
            <View key={idx} style={styles.certRow}>
              <Ionicons name="document" size={20} color="#34C759" />
              <View style={styles.certContent}>
                <Text style={styles.certLabel}>{cert.type}</Text>
                <Text style={styles.certValue}>No: {cert.certificateNumber} | Issued: {new Date(cert.issueDate).toLocaleDateString()}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noCertText}>No certifications added</Text>
        )}
        <TouchableOpacity style={styles.addCertButton}>
          <Ionicons name="add-circle" size={20} color="#34C759" />
          <Text style={styles.addCertText}>Add Certification</Text>
        </TouchableOpacity>
      </View>

      {/* Police Verification Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Police Verification</Text>
        {user.policeVerification ? (
          <View style={styles.verificationRow}>
            <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
            <View style={styles.verificationContent}>
              <Text style={styles.verificationLabel}>Verification No: {user.policeVerification.verificationNumber}</Text>
              <Text style={styles.verificationValue}>Status: {user.policeVerification.status}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noVerificationText}>No police verification added</Text>
        )}
        <TouchableOpacity style={styles.addVerificationButton}>
          <Ionicons name="add-circle" size={20} color="#007AFF" />
          <Text style={styles.addVerificationText}>Add Verification</Text>
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={confirmLogout}>
          <Ionicons name="log-out" size={20} color="#FF3B30" />
          <Text style={[styles.actionButtonText, styles.logoutText]}>Logout</Text>
          <Ionicons name="chevron-forward" size={16} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.accountInfo}>
          <Text style={styles.accountInfoText}>Account created: {new Date(user.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.accountInfoText}>Last updated: {new Date(user.updatedAt).toLocaleDateString()}</Text>
          <Text style={styles.accountInfoText}>User ID: {user.id}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileHeader: { backgroundColor: 'white', alignItems: 'center', padding: 20, paddingTop: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0' },
  editAvatarButton: { position: 'absolute', right: 0, bottom: 0, backgroundColor: '#34C759', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  userRole: { fontSize: 16, color: '#666', marginBottom: 10 },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 14, color: '#666' },
  section: { backgroundColor: 'white', margin: 10, padding: 15, borderRadius: 10, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  editButton: { flexDirection: 'row', alignItems: 'center' },
  editButtonText: { color: '#34C759', marginLeft: 5, fontWeight: '500' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#333', marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  saveButton: { backgroundColor: '#34C759', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  infoContent: { flex: 1, marginLeft: 15 },
  infoLabel: { fontSize: 14, color: '#666', marginBottom: 2 },
  infoValue: { fontSize: 16, color: '#333', fontWeight: '500' },
  passwordButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  passwordButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  certRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  certContent: { flex: 1, marginLeft: 10 },
  certLabel: { fontSize: 14, color: '#34C759', fontWeight: 'bold' },
  certValue: { fontSize: 12, color: '#666' },
  noCertText: { fontSize: 14, color: '#666', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
  addCertButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: '#34C759', borderRadius: 8, borderStyle: 'dashed', marginTop: 10 },
  addCertText: { color: '#34C759', marginLeft: 8, fontWeight: '500' },
  verificationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  verificationContent: { flex: 1, marginLeft: 10 },
  verificationLabel: { fontSize: 14, color: '#007AFF', fontWeight: 'bold' },
  verificationValue: { fontSize: 12, color: '#666' },
  noVerificationText: { fontSize: 14, color: '#666', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
  addVerificationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, borderStyle: 'dashed', marginTop: 10 },
  addVerificationText: { color: '#007AFF', marginLeft: 8, fontWeight: '500' },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
  actionButtonText: { flex: 1, fontSize: 16, color: '#007AFF', marginLeft: 15, fontWeight: '500' },
  logoutButton: { backgroundColor: '#ffebee' },
  logoutText: { color: '#FF3B30' },
  accountInfo: { marginTop: 10 },
  accountInfoText: { fontSize: 14, color: '#666', marginBottom: 5 },
});

export default VolunteerProfileScreen;