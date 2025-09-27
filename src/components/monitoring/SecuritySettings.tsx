import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SecuritySettingsProps {
  onChangePassword: () => void;
  onSecuritySettings: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onChangePassword,
  onSecuritySettings,
}) => {
  const SecurityOption = ({ 
    icon, 
    title, 
    description, 
    onPress, 
    color = '#007AFF' 
  }: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.optionButton} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Security & Privacy</Text>
        <Text style={styles.sectionSubtitle}>Protect your account and data</Text>
      </View>
      
      <View style={styles.optionsList}>
        <SecurityOption
          icon="key"
          title="Change Password"
          description="Update your account password"
          onPress={onChangePassword}
          color="#007AFF"
        />
        
        <SecurityOption
          icon="shield-checkmark"
          title="Security Settings"
          description="Two-factor authentication, session management"
          onPress={onSecuritySettings}
          color="#34C759"
        />
        
        <SecurityOption
          icon="lock-closed"
          title="Privacy Settings"
          description="Manage data privacy and access permissions"
          onPress={onSecuritySettings}
          color="#FF9500"
        />
        
        <SecurityOption
          icon="document-text"
          title="Access Logs"
          description="View recent account activity"
          onPress={onSecuritySettings}
          color="#5856D6"
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
  optionsList: {
    padding: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});

export default SecuritySettings;