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
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { User, UserRole } from '../../types/User';
import { AuthService } from '../../services/AuthService';
import { AuthenticationService } from '../../services/AuthenticationService';
import { ProfileImageService } from '../../services/ProfileImageService';
import { auth } from '../../services/firebase';
import { API_CONFIG } from '../../config/ApiConfig';

interface VictimProfileScreenProps {
  user: User;
  onLogout: () => void;
}

const VictimProfileScreen: React.FC<VictimProfileScreenProps> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(user.profileImage || null);
  const [emergencyContacts, setEmergencyContacts] = useState<string[]>(user.emergencyContacts || []);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Request permissions for camera and gallery
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and gallery permissions are needed to update your profile photo.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
    return true;
  };

  // Handle profile photo selection
  const handleSelectPhoto = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => handleTakePhoto(),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => handleChooseFromGallery(),
        },
        {
          text: 'Remove Photo',
          onPress: () => handleRemovePhoto(),
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduce quality to 50% for camera photos (they're usually very large)
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  // Choose photo from gallery
  const handleChooseFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6, // Reduce quality to 60% for gallery photos
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  // Upload profile image to S3
  const uploadProfileImage = async (imageUri: string) => {
    setIsUploadingImage(true);
    
    try {
      // Validate image
      const validation = ProfileImageService.validateImage(imageUri);
      if (!validation.valid) {
        Alert.alert('Invalid Image', validation.error || 'Please select a valid image');
        setIsUploadingImage(false);
        return;
      }

      // Upload to S3 via backend
      console.log('📤 Starting upload for user:', user.id);
      
      // Get Firebase ID token for authentication
      let token: string | undefined;
      try {
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
          console.log('🔑 Got Firebase ID token');
        } else {
          console.warn('⚠️ No Firebase user logged in, uploading without token');
        }
      } catch (error) {
        console.error('❌ Failed to get Firebase token:', error);
      }
      
      const uploadResult = await ProfileImageService.uploadProfileImage(
        user.id,
        imageUri,
        token
      );

      console.log('📊 Upload result:', uploadResult);

      if (uploadResult.success && uploadResult.imageUrl) {
        console.log('✅ Upload successful! Image URL:', uploadResult.imageUrl);
        
        // IMMEDIATELY display the image
        setProfileImageUri(uploadResult.imageUrl);
        setEditedUser({ ...editedUser, profileImage: uploadResult.imageUrl });
        
        // Save to Firebase (Firestore + AsyncStorage) - this persists across logins!
        try {
          await AuthService.updateUserProfile(user.id, {
            profileImage: uploadResult.imageUrl,
          });
          
          // Update local user object
          user.profileImage = uploadResult.imageUrl;
          
          console.log('✅ Profile image saved to Firebase successfully!');
          Alert.alert('Success', 'Profile photo updated successfully! 🎉');
          
        } catch (err) {
          console.error('❌ Failed to save image URL to Firebase:', err);
          Alert.alert('Partial Success', 'Image uploaded but may not persist. Please save your profile.');
        }
        
      } else {
        console.error('❌ Upload failed:', uploadResult.error);
        Alert.alert('Upload Failed', uploadResult.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'An error occurred while uploading the image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove profile photo
  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingImage(true);
            try {
              // Delete from S3 (optional - keeps S3 clean)
              if (profileImageUri) {
                try {
                  await ProfileImageService.deleteProfileImage(profileImageUri);
                } catch (err) {
                  console.warn('⚠️ Failed to delete from S3:', err);
                }
              }
              
              // Remove from Firebase (Firestore + AsyncStorage)
              await AuthService.updateUserProfile(user.id, {
                profileImage: undefined,
              });

              // Update local state
              setProfileImageUri(null);
              setEditedUser({ ...editedUser, profileImage: undefined });
              user.profileImage = undefined;
              
              console.log('✅ Profile photo removed from Firebase');
              Alert.alert('Success', 'Profile photo removed');
              
            } catch (error) {
              console.error('❌ Error removing photo:', error);
              Alert.alert('Error', 'Failed to remove profile photo');
            } finally {
              setIsUploadingImage(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      console.log('💾 Saving profile updates...');
      console.log('📝 Updated data:', {
        name: editedUser.name,
        phone: editedUser.phone,
        location: editedUser.location,
        emergencyContacts: emergencyContacts,
      });

      // Update profile using AuthService (saves to Firestore + AsyncStorage)
      await AuthService.updateUserProfile(user.id, {
        name: editedUser.name,
        phone: editedUser.phone,
        location: editedUser.location,
        emergencyContacts: emergencyContacts,
      });

      console.log('✅ Profile saved to Firebase and local storage');

      // Update local user object
      Object.assign(user, {
        name: editedUser.name,
        phone: editedUser.phone,
        location: editedUser.location,
        emergencyContacts: emergencyContacts,
      });

      Alert.alert('Success', 'Profile updated successfully! 🎉');
      setIsEditing(false);

    } catch (error) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
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

    setIsSaving(true);
    try {
      console.log('🔐 Updating password...');
      
      // Update password in Firebase
      if (auth.currentUser) {
        const { updatePassword } = await import('firebase/auth');
        await updatePassword(auth.currentUser, newPassword);
        
        console.log('✅ Password updated in Firebase');
        Alert.alert('Success', 'Password updated successfully! 🔒');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      } else {
        Alert.alert('Error', 'You must be logged in to change your password');
      }
    } catch (error: any) {
      console.error('❌ Password update error:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Session Expired',
          'For security reasons, please log out and log back in before changing your password.'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to update password');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Add Emergency Contact
  const handleAddEmergencyContact = () => {
    if (emergencyContacts.length >= 3) {
      Alert.alert('Limit Reached', 'You can only add up to 3 emergency contacts');
      return;
    }
    setShowAddContactDialog(true);
  };

  const handleSaveEmergencyContact = async () => {
    if (!newContactName.trim()) {
      Alert.alert('Error', 'Please enter contact name');
      return;
    }

    if (!newContactPhone.trim()) {
      Alert.alert('Error', 'Please enter contact phone number');
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(newContactPhone.replace(/\D/g, '').slice(-10))) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsSaving(true);
    try {
      const contactString = `${newContactName.trim()} - ${newContactPhone.trim()}`;
      const updatedContacts = [...emergencyContacts, contactString];
      
      // Update local state
      setEmergencyContacts(updatedContacts);
      
      // Save to Firebase immediately
      await AuthService.updateUserProfile(user.id, {
        emergencyContacts: updatedContacts,
      });
      
      // Update user object
      user.emergencyContacts = updatedContacts;
      
      setNewContactName('');
      setNewContactPhone('');
      setShowAddContactDialog(false);
      
      console.log('✅ Emergency contact saved to Firebase');
      Alert.alert('Success', 'Emergency contact added and saved! ✅');
      
    } catch (error) {
      console.error('❌ Error saving emergency contact:', error);
      Alert.alert('Error', 'Failed to save emergency contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmergencyContact = (index: number) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const updated = emergencyContacts.filter((_, i) => i !== index);
              
              // Update local state
              setEmergencyContacts(updated);
              
              // Save to Firebase immediately
              await AuthService.updateUserProfile(user.id, {
                emergencyContacts: updated,
              });
              
              // Update user object
              user.emergencyContacts = updated;
              
              console.log('✅ Emergency contact removed and saved to Firebase');
              Alert.alert('Success', 'Contact removed! ✅');
              
            } catch (error) {
              console.error('❌ Error removing contact:', error);
              Alert.alert('Error', 'Failed to remove contact');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  // Call emergency contact
  const handleCallContact = async (contactString: string) => {
    // Extract phone number from "Name - Phone" format
    const phoneMatch = contactString.match(/[\d\s\-\+\(\)]+$/);
    if (!phoneMatch) {
      Alert.alert('Error', 'Invalid phone number format');
      return;
    }

    const phoneNumber = phoneMatch[0].replace(/\D/g, ''); // Remove non-digits
    const phoneUrl = `tel:${phoneNumber}`;

    Alert.alert(
      'Call Emergency Contact',
      `Do you want to call ${contactString}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          onPress: async () => {
            try {
              await Linking.openURL(phoneUrl);
            } catch (error) {
              console.error('Error making call:', error);
              Alert.alert(
                'Unable to Call',
                'Please ensure you have phone calling permissions enabled and you are using a real mobile device.'
              );
            }
          },
        },
      ]
    );
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
          {isUploadingImage ? (
            <View style={styles.avatarLoadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : (
            <>
              <Image
                source={
                  profileImageUri
                    ? { uri: profileImageUri }
                    : require('../../../assets/icon.png')
                }
                style={styles.avatar}
              />
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={handleSelectPhoto}
                disabled={isUploadingImage}
              >
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userRole}>Victim/End User</Text>
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
            <Ionicons name={isEditing ? "checkmark" : "pencil"} size={20} color="#007AFF" />
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

            <TouchableOpacity 
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
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
                <Text style={styles.infoValue}>
                  {user.location?.address || 'Location not set'}
                </Text>
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

            <TouchableOpacity 
              style={[styles.passwordButton, isSaving && styles.saveButtonDisabled]} 
              onPress={handlePasswordChange}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.passwordButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts ({emergencyContacts.length}/3)</Text>
        <View style={styles.emergencyContacts}>
          {emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactRow}>
              <Ionicons name="person-circle" size={24} color="#007AFF" />
              <Text style={styles.contactText}>{contact}</Text>
              <View style={styles.contactActions}>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handleCallContact(contact)}
                >
                  <Ionicons name="call" size={20} color="#34C759" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.removeContactButton}
                  onPress={() => handleRemoveEmergencyContact(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {emergencyContacts.length === 0 && (
            <Text style={styles.noContactsText}>No emergency contacts added</Text>
          )}
          {emergencyContacts.length < 3 && (
            <TouchableOpacity 
              style={styles.addContactButton}
              onPress={handleAddEmergencyContact}
            >
              <Ionicons name="add-circle" size={20} color="#007AFF" />
              <Text style={styles.addContactText}>Add Emergency Contact</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Add Contact Modal */}
      {showAddContactDialog && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={newContactName}
                onChangeText={setNewContactName}
                placeholder="Enter contact name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setShowAddContactDialog(false);
                  setNewContactName('');
                  setNewContactPhone('');
                }}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSaveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveEmergencyContact}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Contact</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
          <View style={styles.accountInfoRow}>
            <Ionicons name="finger-print" size={20} color="#007AFF" />
            <View style={styles.accountInfoContent}>
              <Text style={styles.accountInfoLabel}>USER ID</Text>
              <Text style={[styles.accountInfoValue, styles.userIdText]} numberOfLines={1} selectable>
                {user.id}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  avatarLoadingContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 5,
    fontWeight: '500',
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#007AFF',
    marginLeft: 5,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  passwordButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  passwordButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emergencyContacts: {
    marginTop: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    padding: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
  },
  noContactsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  addContactText: {
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 15,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#ffebee',
  },
  logoutText: {
    color: '#FF3B30',
  },
  accountInfo: {
    marginTop: 10,
  },
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  accountInfoContent: {
    marginLeft: 12,
    flex: 1,
  },
  accountInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  accountInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  accountInfoTime: {
    fontSize: 14,
    color: '#666',
  },
  userIdText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 13,
    color: '#007AFF',
  },
  accountInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  removeContactButton: {
    padding: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalSaveButton: {
    backgroundColor: '#007AFF',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VictimProfileScreen;