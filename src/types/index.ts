// Core type definitions for the dementia care assistant application
export interface User {
  id: string;
  name: string;
  role: 'elder' | 'caregiver';
  profileImage?: string;
  createdAt: Date;
}

export interface ElderUser extends User {
  role: 'elder';
  pin?: string;
  emergencyContacts: string[];
  preferredVoiceSpeed: number;
  lastActive: Date;
}

export interface CaregiverUser extends User {
  role: 'caregiver';
  email: string;
  eldersManaged: string[];
  notificationPreferences: NotificationSettings;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  profileImage: string;
  contactInfo: ContactInfo;
  notes: string;
  isEmergencyContact: boolean;
  addedBy: string;
  addedAt: Date;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
}

export interface Conversation {
  id: string;
  elderId: string;
  timestamp: Date;
  query: string;
  response: string;
  context: 'family_recognition' | 'task_reminder' | 'general' | 'emergency';
  confidence: number;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  emergencyOnly: boolean;
  dailyReports: boolean;
}

export interface AccessibilitySettings {
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: 'small' | 'medium' | 'large';
  voiceSpeed: number;
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
}

export interface UsageAnalytics {
  date: string;
  interactions: number;
  successfulRecognitions: number;
  emergencyCalls: number;
  averageSessionLength: number;
}