import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Home, Clock, Users, Settings } from 'lucide-react';
import { VoiceButton } from '../components/ui/VoiceButton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { mockFamilyMembers, mockConversations } from '../data/mockData';

export function ElderInterface() {
  const { settings } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [showFamilyPhotos, setShowFamilyPhotos] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

  // Emergency call function
  const handleEmergencyCall = () => {
    alert('Calling Sarah Johnson at (555) 123-4567...\n\nIn a real application, this would dial your emergency contact.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      {/* Header with time and navigation */}
      <header className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="text-right">
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
          
          <Button
            variant="secondary"
            size="large"
            className="flex-shrink-0"
            onClick={() => {/* Settings modal */}}
          >
            <Settings size={24} />
            Settings
          </Button>
        </div>

        {/* Quick access buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            variant="secondary"
            size="medium"
            onClick={() => setShowFamilyPhotos(!showFamilyPhotos)}
          >
            <Users size={24} />
            Family Photos
          </Button>
          
          <Button
            variant="secondary"
            size="medium"
            onClick={() => {/* Show today's tasks */}}
          >
            <Clock size={24} />
            Today's Tasks
          </Button>
          
          <Button
            variant="emergency"
            size="medium"
            onClick={handleEmergencyCall}
          >
            <Phone size={24} />
            Call for Help
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
                  {mockFamilyMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={!settings.reducedMotion ? { opacity: 0, scale: 0.8 } : { opacity: 1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div className="relative mb-3">
                        <img
                          src={member.profileImage}
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
                        {member.relationship}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent conversations */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Conversations
          </h2>
          
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {mockConversations.slice(0, 3).map((conversation, index) => (
              <motion.div
                key={conversation.id}
                initial={!settings.reducedMotion ? { opacity: 0, x: -20 } : { opacity: 1 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-gray-500">
                    {conversation.timestamp.toLocaleString()}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    conversation.context === 'emergency' ? 'bg-red-100 text-red-800' :
                    conversation.context === 'family_recognition' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {conversation.context.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="mb-3">
                  <p className="text-gray-700 font-medium">You asked:</p>
                  <p className="text-lg text-gray-900 ml-4">"{conversation.query}"</p>
                </div>
                
                <div>
                  <p className="text-gray-700 font-medium">I responded:</p>
                  <p className="text-lg text-blue-700 ml-4">"{conversation.response}"</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}