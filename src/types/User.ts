export enum UserRole {
  VICTIM = 'victim',
  VOLUNTEER = 'volunteer',
  MONITORING = 'monitoring',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Victim specific fields
  emergencyContacts?: string[];
  medicalInfo?: string;
  
  // Volunteer specific fields
  certifications?: Certification[];
  policeVerification?: PoliceVerification;
  rating?: number;
  totalRatings?: number;
  specializations?: DisasterType[];
  availability?: boolean;
  
  // Monitoring specific fields
  permissions?: string[];
  department?: string;
}

export interface Certification {
  id: string;
  certificateNumber: string;
  issueDate: Date;
  issuingBody: string;
  expiryDate?: Date;
  type: string;
}

export interface PoliceVerification {
  id: string;
  verificationNumber: string;
  verifiedDate: Date;
  status: 'verified' | 'pending' | 'rejected';
  verifyingAuthority: string;
}

export enum DisasterType {
  FLOOD = 'flood',
  EARTHQUAKE = 'earthquake',
  FIRE = 'fire',
  ROAD_ACCIDENT = 'road_accident',
  WOMEN_SAFETY = 'women_safety',
  CYCLONE = 'cyclone',
  TSUNAMI = 'tsunami',
  AVALANCHE = 'avalanche',
  LANDSLIDE = 'landslide',
  FOREST_FIRE = 'forest_fire',
  CHEMICAL_EMERGENCY = 'chemical_emergency',
}

export interface EmergencyRequest {
  id: string;
  victimId: string;
  disasterType: DisasterType;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  description: string;
  voiceRecording?: string;
  aiDetectedKeywords?: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedVolunteers: string[];
  governmentAgenciesNotified: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  rating?: number;
  feedback?: string;
}