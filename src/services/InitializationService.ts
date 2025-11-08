import { FirebaseUserService } from './FirebaseUserService';

export class InitializationService {
  // Initialize default users for the application
  static async initializeDefaultUsers(): Promise<void> {
    try {
      console.log('🔧 Initializing default users for application...');

      // Default system users for different roles
      const defaultUsers = [
        {
          name: 'System Administrator',
          email: 'admin@disastermanagement.com',
          password: 'SecureAdmin2024!',
          confirmPassword: 'SecureAdmin2024!',
          phone: '+1-800-DISASTER',
          role: 'monitoring' as const,
        },
      ];

      for (const userData of defaultUsers) {
        // Check if user already exists
        const emailExists = await FirebaseUserService.isEmailExists(userData.email);
        
        if (!emailExists) {
          const result = await FirebaseUserService.registerUser(userData);
          if (result.success) {
            console.log(`✅ System user created: ${userData.email} (${userData.role})`);
          } else {
            console.log(`⚠️ Failed to create system user ${userData.email}: ${result.message}`);
          }
        } else {
          console.log(`ℹ️ System user already exists: ${userData.email}`);
        }
      }

      console.log('🎯 System initialization completed!');
      console.log('📱 Default system users are now available.');

    } catch (error) {
      console.error('❌ Failed to initialize system users:', error);
    }
  }



  // Get sample emergency data for demonstration
  static getSampleEmergencies() {
    return [
      {
        id: '1',
        type: 'Fire',
        description: 'Building fire on Main Street',
        location: 'Main Street, Downtown',
        severity: 'High',
        status: 'Active',
        reportedBy: 'user@example.com',
        reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: '2', 
        type: 'Flood',
        description: 'Flash flood in residential area',
        location: 'Oak Avenue, Suburb',
        severity: 'Medium',
        status: 'Responding',
        reportedBy: 'victim@example.com',
        reportedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      },
      {
        id: '3',
        type: 'Medical Emergency',
        description: 'Person injured in accident',
        location: 'Highway 101, Mile Marker 15',
        severity: 'Critical',
        status: 'Resolved',
        reportedBy: 'volunteer@example.com', 
        reportedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      }
    ];
  }

  // Get sample volunteer data for demonstration
  static getSampleVolunteers() {
    return [
      {
        id: '1',
        name: 'Volunteer Helper',
        email: 'volunteer@example.com',
        phone: '+1234567892',
        skills: ['First Aid', 'Emergency Response'],
        availability: 'Available',
        location: 'Downtown Area',
      },
      {
        id: '2', 
        name: 'Medical Volunteer',
        email: 'medic@example.com',
        phone: '+1234567894',
        skills: ['Medical Training', 'CPR Certified'],
        availability: 'Busy',
        location: 'Hospital District',
      },
      {
        id: '3',
        name: 'Rescue Volunteer', 
        email: 'rescue@example.com',
        phone: '+1234567895',
        skills: ['Search and Rescue', 'Technical Rescue'],
        availability: 'Available',
        location: 'Fire Station Area',
      }
    ];
  }
}