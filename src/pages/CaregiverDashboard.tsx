import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Shield,
  Clock,
  MessageSquare,
  TrendingUp,
  Phone
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FamilyMemberCard } from '../components/caregiver/FamilyMemberCard';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { mockFamilyMembers, mockAnalytics, mockConversations } from '../data/mockData';
import { FamilyMember } from '../types';

export function CaregiverDashboard() {
  const { settings } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'family' | 'analytics' | 'conversations'>('family');
  const [familyMembers, setFamilyMembers] = useState(mockFamilyMembers);

  const handleEditMember = (member: FamilyMember) => {
    // In a real app, this would open an edit modal
    alert(`Editing ${member.name} - This would open an edit form in a real application`);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Are you sure you want to remove this family member?')) {
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddMember = () => {
    // In a real app, this would open an add member modal
    alert('Add new family member - This would open a form in a real application');
  };

  const totalInteractions = mockAnalytics.reduce((sum, day) => sum + day.interactions, 0);
  const avgSuccessRate = mockAnalytics.reduce((sum, day) => sum + (day.successfulRecognitions / day.interactions), 0) / mockAnalytics.length;
  const emergencyCalls = mockAnalytics.reduce((sum, day) => sum + day.emergencyCalls, 0);

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
              <Button variant="secondary" size="medium">
                <Settings size={20} />
                Settings
              </Button>
              <Button variant="primary" size="medium">
                <Phone size={20} />
                Call Eleanor
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interactions</p>
                <p className="text-3xl font-bold text-gray-900">{totalInteractions}</p>
                <p className="text-sm text-green-600">+12% this week</p>
              </div>
              <MessageSquare className="text-blue-600" size={40} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">{(avgSuccessRate * 100).toFixed(1)}%</p>
                <p className="text-sm text-green-600">+3% this week</p>
              </div>
              <TrendingUp className="text-green-600" size={40} />
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

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emergency Calls</p>
                <p className="text-3xl font-bold text-gray-900">{emergencyCalls}</p>
                <p className="text-sm text-gray-600">This week</p>
              </div>
              <Shield className={`${emergencyCalls > 0 ? 'text-red-600' : 'text-gray-400'}`} size={40} />
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'family', label: 'Family Members', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'conversations', label: 'Conversations', icon: MessageSquare }
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
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Daily Interactions</h3>
                  <div className="space-y-3">
                    {mockAnalytics.map((day) => (
                      <div key={day.date} className="flex items-center justify-between">
                        <span className="text-gray-600">
                          {new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(day.interactions / 20) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-900 font-medium w-8">{day.interactions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Success Rates</h3>
                  <div className="space-y-3">
                    {mockAnalytics.map((day) => {
                      const successRate = (day.successfulRecognitions / day.interactions) * 100;
                      return (
                        <div key={day.date} className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                            <span className="text-gray-900 font-medium w-12">{successRate.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Weekly Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{totalInteractions}</p>
                    <p className="text-gray-600">Total Interactions</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{(avgSuccessRate * 100).toFixed(1)}%</p>
                    <p className="text-gray-600">Average Success Rate</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-600">
                      {(mockAnalytics.reduce((sum, day) => sum + day.averageSessionLength, 0) / mockAnalytics.length).toFixed(1)}m
                    </p>
                    <p className="text-gray-600">Avg Session Length</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'conversations' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Conversations</h2>
              
              <div className="space-y-4">
                {mockConversations.map((conversation) => (
                  <Card key={conversation.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <Clock size={20} className="text-gray-500" />
                        <span className="text-gray-600">
                          {conversation.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          conversation.context === 'emergency' ? 'bg-red-100 text-red-800' :
                          conversation.context === 'family_recognition' ? 'bg-blue-100 text-blue-800' :
                          conversation.context === 'task_reminder' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {conversation.context.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {(conversation.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Question:</p>
                        <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">
                          "{conversation.query}"
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Response:</p>
                        <p className="text-lg text-blue-700 bg-blue-50 p-3 rounded-lg">
                          "{conversation.response}"
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}