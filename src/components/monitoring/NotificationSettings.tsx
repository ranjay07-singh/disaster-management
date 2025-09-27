import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

interface NotificationSettingsProps {
  notifications: {
    emergencyAlerts: boolean;
    systemUpdates: boolean;
    userReports: boolean;
    dailyReports: boolean;
    weeklyAnalytics: boolean;
  };
  onNotificationChange: (key: string, value: boolean) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  notifications,
  onNotificationChange,
}) => {
  const NotificationToggle = ({ label, description, value, onValueChange }: {
    label: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.toggleContainer}>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
        thumbColor={value ? '#ffffff' : '#ffffff'}
        ios_backgroundColor="#E5E5E5"
        style={styles.switch}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <Text style={styles.sectionSubtitle}>Manage your notification preferences</Text>
      </View>
      
      <View style={styles.togglesList}>
        <NotificationToggle
          label="Emergency Alerts"
          description="Critical emergency notifications"
          value={notifications.emergencyAlerts}
          onValueChange={(value) => onNotificationChange('emergencyAlerts', value)}
        />
        
        <NotificationToggle
          label="System Updates"
          description="App updates and maintenance notifications"
          value={notifications.systemUpdates}
          onValueChange={(value) => onNotificationChange('systemUpdates', value)}
        />
        
        <NotificationToggle
          label="User Reports"
          description="New user registration and activity reports"
          value={notifications.userReports}
          onValueChange={(value) => onNotificationChange('userReports', value)}
        />
        
        <NotificationToggle
          label="Daily Reports"
          description="Daily summary of system activity"
          value={notifications.dailyReports}
          onValueChange={(value) => onNotificationChange('dailyReports', value)}
        />
        
        <NotificationToggle
          label="Weekly Analytics"
          description="Weekly performance and analytics reports"
          value={notifications.weeklyAnalytics}
          onValueChange={(value) => onNotificationChange('weeklyAnalytics', value)}
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
  togglesList: {
    padding: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  toggleContent: {
    flex: 1,
    marginRight: 15,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
});

export default NotificationSettings;