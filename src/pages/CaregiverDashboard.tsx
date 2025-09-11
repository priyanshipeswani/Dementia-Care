import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Settings, 
  Plus,
  MessageSquare,
  X,
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  Shield,
  Camera,
  LogOut,
  Edit
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FamilyMemberCard } from '../components/caregiver/FamilyMemberCard';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { mockAnalytics } from '../data/mockData';
import { FamilyMember } from '../types';
import { useNavigate } from 'react-router-dom';
import apiService, { Event, EventCreate } from '../services/api';

export function CaregiverDashboard() {
  const { settings } = useAccessibility();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'family' | 'conversations' | 'events'>('family');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    birthday: '',
    isEmergencyContact: false,
    notes: '',
    photo: ''
  });
  
  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'reminder' as 'reminder' | 'appointment' | 'medication' | 'activity',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Mock user data - in real app this would come from auth context
  const currentUser = {
    id: 1, // This should come from auth context
    firstName: 'John',
    lastName: 'Doe', 
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    patientName: 'Eleanor Johnson',
    relationship: 'Son'
  };

  // Load events when component mounts
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      // Backend automatically finds the right elder's events
      const response = await apiService.getEvents();
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleEditMember = (member: FamilyMember) => {
    // In a real app, this would open an edit modal
    alert(`Editing ${member.name} - This would open an edit form in a real application`);
  };

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingEvents(true);
        
        // Load events for user_id 2 (elder user)
        const eventsResponse = await apiService.getEvents(2);
        if (eventsResponse.success && eventsResponse.data) {
          setEvents(eventsResponse.data);
        }
        
        // Load family members for user_id 2 (elder user) 
        const familyResponse = await apiService.getFamilyMembers(2);
        if (familyResponse.success && familyResponse.data) {
          // Convert API FamilyMember to local FamilyMember interface
          const convertedMembers = familyResponse.data.map(member => ({
            id: member.id.toString(),
            name: member.name,
            relationship: member.relationship_type,
            profileImage: member.photo_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400`,
            contactInfo: {
              phone: member.phone_number,
              email: member.email,
              address: member.address
            },
            notes: member.notes || '',
            isEmergencyContact: member.is_emergency_contact,
            addedBy: 'caregiver',
            addedAt: new Date(member.created_at)
          }));
          setFamilyMembers(convertedMembers);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadData();
  }, []);

  const handleDeleteMember = async (id: string) => {
    if (confirm('Are you sure you want to remove this family member?')) {
      try {
        const response = await apiService.deleteFamilyMember(parseInt(id));
        if (response.success) {
          setFamilyMembers(prev => prev.filter(m => m.id !== id));
        } else {
          alert('Failed to delete family member: ' + response.error);
        }
      } catch (error) {
        console.error('Failed to delete family member:', error);
        alert('Failed to delete family member');
      }
    }
  };

  const handleAddMember = () => {
    setShowAddMemberModal(true);
  };

  const handleSaveMember = async () => {
    if (newMember.name && newMember.relationship) {
      try {
        // Create family member in backend
        const familyMemberData = {
          name: newMember.name,
          relationship_type: newMember.relationship,
          phone_number: newMember.phone || undefined,
          email: newMember.email || undefined,
          address: newMember.address || undefined,
          is_emergency_contact: newMember.isEmergencyContact,
          photo_url: newMember.photo || undefined,
          notes: newMember.notes || undefined,
          last_contact_date: undefined
        };

        console.log('🔍 DEBUG: About to create family member with data:', JSON.stringify(familyMemberData, null, 2));
        console.log('🔍 DEBUG: newMember state:', JSON.stringify(newMember, null, 2));

        const response = await apiService.createFamilyMember(familyMemberData, 2); // user_id 2 (elder)
        
        if (response.success && response.data) {
          // Convert API response to local FamilyMember interface
          const member: FamilyMember = {
            id: response.data.id.toString(),
            name: response.data.name,
            relationship: response.data.relationship_type,
            profileImage: response.data.photo_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400`,
            contactInfo: {
              phone: response.data.phone_number,
              email: response.data.email,
              address: response.data.address
            },
            notes: response.data.notes || '',
            isEmergencyContact: response.data.is_emergency_contact,
            addedBy: 'caregiver',
            addedAt: new Date(response.data.created_at)
          };
          
          setFamilyMembers(prev => [...prev, member]);
          setNewMember({
            name: '',
            relationship: '',
            phone: '',
            email: '',
            address: '',
            birthday: '',
            isEmergencyContact: false,
            notes: '',
            photo: ''
          });
          setShowAddMemberModal(false);
        } else {
          alert('Failed to add family member: ' + response.error);
        }
      } catch (error) {
        console.error('Failed to add family member:', error);
        alert('Failed to add family member');
      }
    }
  };

  const handleAddEvent = async () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      try {
        // Combine date and time into ISO string
        const scheduledDate = new Date(`${newEvent.date}T${newEvent.time}`).toISOString();
        
        const eventData: EventCreate = {
          title: newEvent.title,
          description: newEvent.description || undefined,
          event_type: newEvent.type,
          priority: newEvent.priority,
          scheduled_date: scheduledDate,
          // Remove user_id - backend will automatically determine the right elder user
          is_recurring: false
        };

        const response = await apiService.createEvent(eventData);
        
        if (response.success && response.data) {
          // Add the new event to local state
          setEvents(prev => [...prev, response.data!]);
          
          // Reset form
          setNewEvent({
            title: '',
            description: '',
            date: '',
            time: '',
            type: 'reminder',
            priority: 'medium'
          });
          setShowAddEventModal(false);
        } else {
          alert('Failed to create event: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event. Please try again.');
      }
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await apiService.deleteEvent(eventId);
        if (response.success) {
          setEvents(prev => prev.filter(e => e.id !== eventId));
        } else {
          alert('Failed to delete event: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      navigate('/');
    }
  };

  const totalInteractions = mockAnalytics.reduce((sum, day) => sum + day.interactions, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Caregiver Dashboard</h1>
              <p className="text-lg text-gray-600 mt-1">Managing care for Eleanor Johnson</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="secondary" 
                size="medium"
                onClick={() => setShowSettingsModal(true)}
              >
                <Settings size={20} />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interactions</p>
                <p className="text-3xl font-bold text-gray-900">{totalInteractions}</p>
              </div>
              <MessageSquare className="text-blue-600" size={40} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Family Members</p>
                <p className="text-3xl font-bold text-gray-900">{familyMembers.length}</p>
                <p className="text-sm text-blue-600">{familyMembers.filter(m => m.isEmergencyContact).length} emergency contacts</p>
              </div>
              <Users className="text-blue-600" size={40} />
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'family', label: 'Family Members', icon: Users },
              { id: 'conversations', label: 'Conversations', icon: MessageSquare },
              { id: 'events', label: 'Schedule Events', icon: Calendar }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-md transition-all text-lg font-medium
                  ${activeTab === id 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={!settings.reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'family' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Family Members</h2>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleAddMember}
                >
                  <Plus size={20} />
                  Add Family Member
                </Button>
              </div>

              {familyMembers.length === 0 ? (
                <Card className="p-12 text-center">
                  <Users className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Family Members Added</h3>
                  <p className="text-gray-600 mb-6">Start by adding family members to help with recognition and emergency contacts.</p>
                  <Button
                    variant="primary"
                    size="medium"
                    onClick={handleAddMember}
                  >
                    <Plus size={20} />
                    Add First Family Member
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {familyMembers.map((member) => (
                    <FamilyMemberCard
                      key={member.id}
                      member={member}
                      onEdit={handleEditMember}
                      onDelete={handleDeleteMember}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'conversations' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Conversations</h2>
              
              <Card className="p-12 text-center">
                <MessageSquare className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conversations Yet</h3>
                <p className="text-gray-600">Conversations between the patient and the assistant will appear here.</p>
              </Card>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Schedule Events</h2>
                <Button 
                  variant="primary" 
                  onClick={() => setShowAddEventModal(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Event
                </Button>
              </div>

              {events.length === 0 ? (
                <Card className="p-12 text-center">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Scheduled</h3>
                  <p className="text-gray-600 mb-4">Create reminders, appointments, and tasks for the elder.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowAddEventModal(true)}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus size={20} />
                    Add First Event
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {events.map((event) => (
                    <Card key={event.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          {event.description && (
                            <p className="text-gray-600 mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>📅 {new Date(event.scheduled_date).toLocaleDateString()}</span>
                            <span>🕐 {new Date(event.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              event.priority === 'high' ? 'bg-red-100 text-red-800' :
                              event.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {event.priority} priority
                            </span>
                            <span className="capitalize">{event.event_type}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Family Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={!settings.reducedMotion ? { opacity: 0, scale: 0.9 } : { opacity: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Add Family Member</h3>
                <Button
                  variant="ghost"
                  size="medium"
                  onClick={() => setShowAddMemberModal(false)}
                >
                  <X size={24} />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      required
                      className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                      placeholder="Enter full name"
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Relationship *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                    value={newMember.relationship}
                    onChange={(e) => setNewMember(prev => ({ ...prev, relationship: e.target.value }))}
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="grandchild">Grandchild</option>
                    <option value="friend">Friend</option>
                    <option value="neighbor">Neighbor</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="doctor">Doctor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                      placeholder="Enter phone number"
                      value={newMember.phone}
                      onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                      placeholder="Enter email address"
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-4 text-gray-400" size={20} />
                  <textarea
                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                    placeholder="Enter address"
                    rows={2}
                    value={newMember.address}
                    onChange={(e) => setNewMember(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Birthday
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="date"
                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                    value={newMember.birthday}
                    onChange={(e) => setNewMember(prev => ({ ...prev, birthday: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Upload Photo
                </label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Create a preview URL for the uploaded image
                        const imageUrl = URL.createObjectURL(file);
                        setNewMember(prev => ({ ...prev, photo: imageUrl }));
                      }
                    }}
                  />
                </div>
                {newMember.photo && (
                  <div className="mt-2">
                    <img 
                      src={newMember.photo} 
                      alt="Preview" 
                      className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500"
                  placeholder="Additional notes about this person..."
                  rows={3}
                  value={newMember.notes}
                  onChange={(e) => setNewMember(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emergencyContact"
                  className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                  checked={newMember.isEmergencyContact}
                  onChange={(e) => setNewMember(prev => ({ ...prev, isEmergencyContact: e.target.checked }))}
                />
                <label htmlFor="emergencyContact" className="ml-3 text-lg text-gray-700 flex items-center">
                  <Shield className="mr-2 text-red-500" size={20} />
                  Emergency Contact
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <Button
                variant="secondary"
                size="medium"
                onClick={() => setShowAddMemberModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="medium"
                onClick={handleSaveMember}
                disabled={!newMember.name || !newMember.relationship}
              >
                Add Family Member
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={!settings.reducedMotion ? { opacity: 0, scale: 0.9 } : { opacity: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Account Settings</h3>
                <Button
                  variant="ghost"
                  size="medium"
                  onClick={() => setShowSettingsModal(false)}
                >
                  <X size={24} />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Profile Information */}
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h4>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <User className="text-gray-600" size={24} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Full Name</p>
                        <p className="text-lg text-gray-900">{currentUser.firstName} {currentUser.lastName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Mail className="text-gray-600" size={24} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-lg text-gray-900">{currentUser.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Phone className="text-gray-600" size={24} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-lg text-gray-900">{currentUser.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Users className="text-gray-600" size={24} />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Relationship</p>
                        <p className="text-lg text-gray-900">{currentUser.relationship}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="border-t pt-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h4>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <User className="text-blue-600" size={24} />
                  <div>
                    <p className="text-sm font-medium text-blue-600">Patient Name</p>
                    <p className="text-xl text-blue-900 font-semibold">{currentUser.patientName}</p>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="border-t pt-6">
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h4>
                <div className="space-y-3">
                  <Button 
                    variant="secondary" 
                    size="medium" 
                    className="w-full justify-start text-red-600 hover:bg-red-50 border-red-200"
                    onClick={handleLogout}
                  >
                    <LogOut size={20} />
                    Log Out
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button
                variant="primary"
                size="medium"
                onClick={() => setShowSettingsModal(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={!settings.reducedMotion ? { opacity: 0, scale: 0.9 } : { opacity: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Add Event</h3>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Take morning medication"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional details..."
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as 'reminder' | 'appointment' | 'medication' | 'activity' }))}
                >
                  <option value="reminder">Reminder</option>
                  <option value="appointment">Appointment</option>
                  <option value="medication">Medication</option>
                  <option value="activity">Activity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newEvent.priority}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                size="medium"
                onClick={() => setShowAddEventModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="medium"
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.date || !newEvent.time}
              >
                Add Event
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}