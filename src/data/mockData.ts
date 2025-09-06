import { FamilyMember, Conversation, UsageAnalytics } from '../types';

// Mock family members with realistic data
export const mockFamilyMembers: FamilyMember[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    relationship: 'Daughter',
    profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    contactInfo: {
      phone: '(555) 123-4567',
      email: 'sarah.johnson@email.com',
      address: '123 Oak Street, Springfield, IL'
    },
    notes: 'Visits every Sunday. Loves gardening with you.',
    isEmergencyContact: true,
    addedBy: 'caregiver-1',
    addedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Michael Johnson',
    relationship: 'Son',
    profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    contactInfo: {
      phone: '(555) 987-6543',
      email: 'michael.j@email.com'
    },
    notes: 'Lives in California. Calls every Tuesday evening.',
    isEmergencyContact: true,
    addedBy: 'caregiver-1',
    addedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    name: 'Emma Rose',
    relationship: 'Granddaughter',
    profileImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    contactInfo: {
      phone: '(555) 456-7890'
    },
    notes: 'Age 8. Loves playing board games and drawing.',
    isEmergencyContact: false,
    addedBy: 'caregiver-1',
    addedAt: new Date('2024-01-20')
  },
  {
    id: '4',
    name: 'Robert Miller',
    relationship: 'Brother',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    contactInfo: {
      phone: '(555) 111-2233',
      address: '456 Elm Avenue, Springfield, IL'
    },
    notes: 'Retired teacher. Enjoys talking about old school days.',
    isEmergencyContact: false,
    addedBy: 'caregiver-1',
    addedAt: new Date('2024-01-18')
  },
  {
    id: '5',
    name: 'Lucy Miller',
    relationship: 'Sister-in-law',
    profileImage: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
    contactInfo: {
      phone: '(555) 444-5566',
      email: 'lucy.miller@email.com'
    },
    notes: 'Great cook. Brings homemade soup when you\'re not feeling well.',
    isEmergencyContact: false,
    addedBy: 'caregiver-1',
    addedAt: new Date('2024-01-22')
  }
];

// Mock conversation history
export const mockConversations: Conversation[] = [
  {
    id: '1',
    elderId: 'elder-1',
    timestamp: new Date('2024-01-25T14:30:00'),
    query: 'Who is the woman with brown hair in the photo?',
    response: 'That\'s Sarah, your daughter. She visits you every Sunday and loves gardening with you.',
    context: 'family_recognition',
    confidence: 0.95
  },
  {
    id: '2',
    elderId: 'elder-1',
    timestamp: new Date('2024-01-25T10:15:00'),
    query: 'What should I do today?',
    response: 'Today is Thursday. You might want to water the plants and Sarah said she\'ll call around 3 PM.',
    context: 'task_reminder',
    confidence: 0.88
  },
  {
    id: '3',
    elderId: 'elder-1',
    timestamp: new Date('2024-01-24T16:45:00'),
    query: 'How do I call my son?',
    response: 'Your son Michael\'s phone number is (555) 987-6543. He usually calls you on Tuesday evenings.',
    context: 'general',
    confidence: 0.92
  },
  {
    id: '4',
    elderId: 'elder-1',
    timestamp: new Date('2024-01-24T09:20:00'),
    query: 'I need help, I feel confused',
    response: 'I\'m contacting Sarah right away. Stay calm, help is coming.',
    context: 'emergency',
    confidence: 0.97
  },
  {
    id: '5',
    elderId: 'elder-1',
    timestamp: new Date('2024-01-23T13:10:00'),
    query: 'Tell me about Emma',
    response: 'Emma Rose is your granddaughter. She\'s 8 years old and loves playing board games and drawing with you.',
    context: 'family_recognition',
    confidence: 0.94
  }
];

// Mock usage analytics data
export const mockAnalytics: UsageAnalytics[] = [
  { date: '2024-01-25', interactions: 12, successfulRecognitions: 11, emergencyCalls: 0, averageSessionLength: 3.2 },
  { date: '2024-01-24', interactions: 8, successfulRecognitions: 7, emergencyCalls: 1, averageSessionLength: 4.1 },
  { date: '2024-01-23', interactions: 15, successfulRecognitions: 14, emergencyCalls: 0, averageSessionLength: 2.8 },
  { date: '2024-01-22', interactions: 6, successfulRecognitions: 5, emergencyCalls: 0, averageSessionLength: 3.7 },
  { date: '2024-01-21', interactions: 10, successfulRecognitions: 9, emergencyCalls: 0, averageSessionLength: 3.0 },
  { date: '2024-01-20', interactions: 14, successfulRecognitions: 12, emergencyCalls: 0, averageSessionLength: 3.5 },
  { date: '2024-01-19', interactions: 9, successfulRecognitions: 8, emergencyCalls: 0, averageSessionLength: 2.9 }
];

// Sample testimonials for landing page
export const mockTestimonials = [
  {
    id: '1',
    name: 'Margaret Chen',
    role: 'Caregiver',
    image: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=400',
    quote: 'This app has been a lifeline for helping my mother remember family members. The voice interface is so gentle and easy to use.'
  },
  {
    id: '2',
    name: 'David Rodriguez',
    role: 'Son & Primary Caregiver',
    image: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400',
    quote: 'The family photo feature helps Dad remember us every day. Setting it up was simple, and the analytics help me understand his needs better.'
  },
  {
    id: '3',
    name: 'Eleanor Thompson',
    role: 'Elder User',
    image: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400',
    quote: 'I love being able to just ask about my family and get clear, helpful answers. It makes me feel more connected and less alone.'
  }
];