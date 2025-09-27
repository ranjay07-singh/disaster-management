import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileInformationProps {
  profileData: {
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    badgeNumber: string;
  };
  editMode: boolean;
  onEditToggle: () => void;
  onProfileDataChange: (key: string, value: string) => void;
}

const ProfileInformation: React.FC<ProfileInformationProps> = ({
  profileData,
  editMode,
  onEditToggle,
  onProfileDataChange,
}) => {
  const ProfileField = ({ label, value, onChangeText, editable = true }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    editable?: boolean;
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          !editMode && styles.fieldInputDisabled,
          !editable && styles.fieldInputReadonly
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editMode && editable}
        placeholderTextColor="#999"
      />
      {!editable && (
        <View style={styles.readonlyIndicator}>
          <Ionicons name="lock-closed" size={16} color="#999" />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <TouchableOpacity
          onPress={onEditToggle}
          style={[styles.editButton, editMode && styles.saveButton]}
        >
          <Ionicons 
            name={editMode ? "checkmark" : "pencil"} 
            size={18} 
            color="white" 
          />
          <Text style={styles.editButtonText}>
            {editMode ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fieldsContainer}>
        <ProfileField
          label="Full Name"
          value={profileData.name}
          onChangeText={(text) => onProfileDataChange('name', text)}
        />
        
        <ProfileField
          label="Email Address"
          value={profileData.email}
          onChangeText={(text) => onProfileDataChange('email', text)}
        />
        
        <ProfileField
          label="Phone Number"
          value={profileData.phone}
          onChangeText={(text) => onProfileDataChange('phone', text)}
        />
        
        <ProfileField
          label="Department"
          value={profileData.department}
          onChangeText={(text) => onProfileDataChange('department', text)}
        />
        
        <ProfileField
          label="Position"
          value={profileData.position}
          onChangeText={(text) => onProfileDataChange('position', text)}
        />
        
        <ProfileField
          label="Badge Number"
          value={profileData.badgeNumber}
          onChangeText={(text) => onProfileDataChange('badgeNumber', text)}
          editable={false}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  editButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  fieldsContainer: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  fieldLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  fieldInput: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  fieldInputDisabled: {
    backgroundColor: '#F8F9FA',
    color: '#666',
    borderColor: '#E5E5E5',
  },
  fieldInputReadonly: {
    backgroundColor: '#F0F8FF',
    borderColor: '#B0D4FF',
  },
  readonlyIndicator: {
    position: 'absolute',
    right: 15,
    top: 45,
  },
});

export default ProfileInformation;