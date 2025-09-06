import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface VoiceButtonProps {
  isListening: boolean;
  onToggleListening: () => void;
  disabled?: boolean;
}

export function VoiceButton({ isListening, onToggleListening, disabled = false }: VoiceButtonProps) {
  const { settings } = useAccessibility();
  const [isPulsing, setIsPulsing] = useState(false);

  const handleClick = () => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 200);
    onToggleListening();
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main voice button */}
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative w-48 h-48 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-2xl
          focus:outline-none focus:ring-8 focus:ring-offset-4
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 text-white'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        whileHover={!settings.reducedMotion && !disabled ? { scale: 1.05 } : {}}
        whileTap={!settings.reducedMotion && !disabled ? { scale: 0.95 } : {}}
        animate={!settings.reducedMotion && (isListening || isPulsing) ? {
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          ]
        } : {}}
        transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
        aria-label={isListening ? "Stop listening" : "Start listening"}
        aria-pressed={isListening}
      >
        {/* Ripple effect for visual feedback */}
        {isListening && !settings.reducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-white"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        {/* Microphone icon */}
        <div className="relative">
          {isListening ? (
            <MicOff size={64} className="drop-shadow-lg" />
          ) : (
            <Mic size={64} className="drop-shadow-lg" />
          )}
        </div>
      </motion.button>

      {/* Status text and visual indicators */}
      <div className="text-center space-y-4">
        <p className={`text-2xl font-semibold ${
          isListening ? 'text-red-600' : 'text-gray-600'
        }`}>
          {isListening ? 'Listening...' : 'Tap to speak'}
        </p>
        
        {/* Voice level indicator - purely visual since we're simulating */}
        {isListening && (
          <div className="flex items-center justify-center space-x-2">
            <Volume2 size={24} className="text-gray-500" />
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((bar) => (
                <motion.div
                  key={bar}
                  className="w-2 bg-green-500 rounded-full"
                  animate={!settings.reducedMotion ? {
                    height: [8, 24, 8],
                  } : { height: 16 }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: bar * 0.1
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Accessibility hint */}
        <p className="text-lg text-gray-500 max-w-md text-center">
          Press and hold to ask about family members, daily tasks, or get help
        </p>
      </div>
    </div>
  );
}