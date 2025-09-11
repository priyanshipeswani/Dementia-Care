import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Calendar, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VoiceButton } from '../components/ui/VoiceButton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService, FamilyMember, Event } from '../services/api';

export function ElderInterface() {
  const navigate = useNavigate();
  const { settings } = useAccessibility();
  const { user, isAuthenticated, isLoading } = useAuth();
  console.log('ElderInterface: Auth state - user:', user, 'isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
  
  const [isListening, setIsListening] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [showFamilyPhotos, setShowFamilyPhotos] = useState(false);
  const [showTodaysTasks, setShowTodaysTasks] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [todaysEvents, setTodaysEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch family members and events
  useEffect(() => {
    const fetchData = async () => {
      console.log('ElderInterface: fetchData called, user:', user);
      if (!user) {
        console.log('ElderInterface: No user found, returning');
        return;
      }
      
      setLoading(true);
      try {
        console.log('ElderInterface: Fetching family members for user ID:', user.id);
        // Fetch family members
        const familyResponse = await apiService.getFamilyMembers(user.id);
        console.log('ElderInterface: Family response:', familyResponse);
        if (familyResponse.success && familyResponse.data) {
          console.log('ElderInterface: Setting family members:', familyResponse.data);
          setFamilyMembers(familyResponse.data);
        }

        console.log('ElderInterface: Fetching events for user ID:', user.id);
        // Fetch events
        const eventsResponse = await apiService.getEvents(user.id);
        console.log('ElderInterface: Events response:', eventsResponse);
        if (eventsResponse.success && eventsResponse.data) {
          // Filter for today's events
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          console.log('ElderInterface: Today string:', todayStr);
          
          const todayEvents = eventsResponse.data.filter(event => {
            const eventDate = new Date(event.scheduled_date).toISOString().split('T')[0];
            console.log('ElderInterface: Event date:', eventDate, 'vs today:', todayStr);
            return eventDate === todayStr;
          });
          
          console.log('ElderInterface: Filtered today events:', todayEvents);
          setTodaysEvents(todayEvents);
        } else {
          console.log('ElderInterface: Events response not successful or no data');
        }
      } catch (error) {
        console.error('ElderInterface: Failed to fetch data:', error);
      } finally {
        console.log('ElderInterface: fetchData completed, setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Simulate voice interaction
  const handleVoiceToggle = () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      // Simulate processing and response
      setTimeout(() => {
        const responses = [
          "That's Sarah, your daughter. She visits you every Sunday and loves gardening with you.",
          "Today is Thursday. You might want to water the plants and Sarah said she'll call around 3 PM.",
          "Your son Michael's phone number is (555) 987-6543. He usually calls you on Tuesday evenings.",
          "Emma Rose is your granddaughter. She's 8 years old and loves playing board games and drawing with you."
        ];
        setCurrentResponse(responses[Math.floor(Math.random() * responses.length)]);
      }, 2000);
    } else {
      // Start listening
      setIsListening(true);
      setCurrentResponse('');
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if not authenticated (will redirect)
  if (!isLoading && (!isAuthenticated || !user)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Please log in to access the Elder Interface</p>
          <button 
            onClick={() => navigate('/elder-login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      {/* Header with time and navigation */}
      <header className="mb-8">
        <div className="flex justify-center items-center mb-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h1>
            <p className="text-xl text-gray-600">
              {currentTime.toLocaleDateString([], { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Quick access buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            variant="secondary"
            size="medium"
            onClick={() => setShowFamilyPhotos(!showFamilyPhotos)}
          >
            <Users size={24} />
            Family Photos ({familyMembers.length})
          </Button>
          
          <Button
            variant="secondary"
            size="medium"
            onClick={() => setShowTodaysTasks(!showTodaysTasks)}
          >
            <Clock size={24} />
            Today's Events ({todaysEvents.length})
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Main voice interface */}
        <div className="text-center mb-12">
          <motion.div
            initial={!settings.reducedMotion ? { opacity: 0, scale: 0.9 } : { opacity: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <VoiceButton
              isListening={isListening}
              onToggleListening={handleVoiceToggle}
            />
          </motion.div>
        </div>

        {/* Response display */}
        <AnimatePresence>
          {currentResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="p-8 bg-blue-50 border-2 border-blue-200">
                <p className="text-2xl text-gray-800 leading-relaxed text-center">
                  {currentResponse}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Family photos carousel */}
        <AnimatePresence>
          {showFamilyPhotos && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Your Family
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {loading ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-xl text-gray-600">Loading your family...</p>
                    </div>
                  ) : familyMembers.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-xl text-gray-600">No family members added yet.</p>
                    </div>
                  ) : (
                    familyMembers.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={!settings.reducedMotion ? { opacity: 0, scale: 0.8 } : { opacity: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="text-center"
                      >
                        <div className="relative mb-3">
                          <img
                            src={member.photo_url || 'https://via.placeholder.com/96x96/CCCCCC/666666?text=Photo'}
                            alt={member.name}
                            className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-blue-200 shadow-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/96x96/CCCCCC/666666?text=Photo';
                            }}
                          />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member.name}
                        </h3>
                        <p className="text-sm text-blue-600 font-medium">
                          {member.relationship_type}
                        </p>
                        {member.phone_number && (
                          <p className="text-xs text-gray-500 mt-1">
                            📞 {member.phone_number}
                          </p>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Events */}
        <AnimatePresence>
          {showTodaysTasks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Today's Events
                </h2>
                
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-xl text-gray-600">Loading your events...</p>
                  </div>
                ) : todaysEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xl text-gray-600">No events scheduled for today.</p>
                    <p className="text-lg text-gray-500 mt-2">Enjoy your free time! 😊</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaysEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={!settings.reducedMotion ? { opacity: 0, x: -20 } : { opacity: 1 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-l-4 ${
                          event.priority === 'high' 
                            ? 'bg-red-50 border-red-400' 
                            : event.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-green-50 border-green-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {event.title}
                            </h3>
                            {event.description && (
                              <p className="text-gray-700 mb-2">{event.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock size={16} />
                                {new Date(event.scheduled_date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {event.location && (
                                <span>📍 {event.location}</span>
                              )}
                              {event.duration_minutes && (
                                <span>⏱️ {event.duration_minutes} min</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              event.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : event.status === 'missed'
                                ? 'bg-red-100 text-red-800'
                                : event.status === 'cancelled'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}