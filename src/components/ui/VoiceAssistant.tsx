import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { apiService } from '../../services/api';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  onQueryReceived?: (query: string) => void;
  onResponseReceived?: (response: string) => void;
  disabled?: boolean;
}

export function VoiceAssistant({ onQueryReceived, onResponseReceived, disabled = false }: VoiceAssistantProps) {
  const { settings } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const clickTimeoutRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Check for browser support
  const [isSupportedBrowser, setIsSupportedBrowser] = useState(false);

  useEffect(() => {
    // Check if the browser supports Web Speech API
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupportedBrowser(isSupported);

    if (isSupported) {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US'; // You can make this configurable

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          setError('');
        };

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscriptText = '';
          let interimTranscriptText = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptResult = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptText += transcriptResult;
            } else {
              interimTranscriptText += transcriptResult;
            }
          }

          // Update the current transcript with both final and interim results
          const currentTranscript = finalTranscriptText + interimTranscriptText;
          setTranscript(currentTranscript);
          
          // Store the final transcript separately
          if (finalTranscriptText) {
            setFinalTranscript(prev => prev + finalTranscriptText);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          // Don't show error for "aborted" - this happens when user stops recording
          if (event.error !== 'aborted') {
            setError(`Speech recognition error: ${event.error}`);
          }
          
          // If we have some transcript when stopping, don't treat it as an error
          if (event.error === 'aborted' && (transcript || finalTranscript)) {
            console.log('Recording stopped by user, processing transcript...');
            return;
          }
          
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          
          // Don't restart if we're intentionally stopping
          if (isStoppingRecording) {
            setIsStoppingRecording(false);
            return;
          }
          
          if (isListening) {
            // If we're still supposed to be listening, restart
            startListening();
          }
        };
      }

      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupportedBrowser) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setIsListening(true);
    setTranscript('');
    setFinalTranscript('');
    setError('');
    setResponse('');
    setIsStoppingRecording(false);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition');
      setIsListening(false);
    }
  }, [isSupportedBrowser]);

  const stopListening = useCallback(async () => {
    setIsStoppingRecording(true);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsListening(false);
    
    // Use the final transcript, or fall back to current transcript
    const textToProcess = finalTranscript.trim() || transcript.trim();
    
    console.log('Final transcript to process:', textToProcess);
    
    if (textToProcess) {
      setIsProcessing(true);
      
      // Call the onQueryReceived callback
      if (onQueryReceived) {
        onQueryReceived(textToProcess);
      }

      try {
        // Send query to knowledge graph API using the API service
        const response = await apiService.processVoiceQuery(textToProcess, 'Elder voice interface');
        
        if (response.success && response.data) {
          const responseText = response.data.humanized_response || response.data.message;
          setResponse(responseText);
          
          // Call the onResponseReceived callback
          if (onResponseReceived) {
            onResponseReceived(responseText);
          }

          // Speak the response using text-to-speech
          speakResponse(responseText);
        } else {
          setError(response.data?.message || 'Failed to process your query');
        }
      } catch (error) {
        console.error('Error processing voice query:', error);
        setError('Sorry, I had trouble understanding your question. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setError('No speech detected. Please try speaking again.');
    }
  }, [transcript, finalTranscript, onQueryReceived, onResponseReceived]);

  const speakResponse = useCallback((text: string) => {
    if (synthRef.current && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slightly slower for elderly users
      utterance.volume = 1;
      utterance.pitch = 1;
      
      // Use a pleasant voice if available
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find((voice: any) => 
        voice.name.includes('Google') || voice.name.includes('Microsoft')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      synthRef.current.speak(utterance);
    }
  }, []);

  const handleButtonClick = useCallback(() => {
    if (disabled) return;

    setClickCount((prev: number) => prev + 1);

    // Clear existing timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    // Set timeout to detect double-click
    clickTimeoutRef.current = setTimeout(() => {
      if (clickCount === 0) {
        // Single click - start listening
        if (!isListening && !isProcessing) {
          startListening();
        }
      }
      setClickCount(0);
    }, 300); // 300ms window for double-click detection

    // If this is the second click (double-click)
    if (clickCount === 1) {
      clearTimeout(clickTimeoutRef.current);
      setClickCount(0);
      
      // Double click - stop listening
      if (isListening) {
        stopListening();
      }
    }
  }, [clickCount, disabled, isListening, isProcessing, startListening, stopListening]);

  if (!isSupportedBrowser) {
    return (
      <div className="text-center p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Voice Feature Not Available
          </h3>
          <p className="text-yellow-700">
            Your browser doesn't support speech recognition. Please try using Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Main voice button */}
      <motion.button
        onClick={handleButtonClick}
        disabled={disabled || isProcessing}
        className={`
          relative w-48 h-48 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-2xl
          focus:outline-none focus:ring-8 focus:ring-offset-4
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 text-white' 
            : isProcessing
            ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300 text-white'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300 text-white'
          }
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        whileHover={!settings.reducedMotion && !disabled && !isProcessing ? { scale: 1.05 } : {}}
        whileTap={!settings.reducedMotion && !disabled && !isProcessing ? { scale: 0.95 } : {}}
        animate={!settings.reducedMotion && isListening ? {
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          ]
        } : {}}
        transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
        aria-label={isListening ? "Double-click to stop listening" : "Click to start listening"}
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
        
        {/* Icon */}
        <div className="relative">
          {isProcessing ? (
            <Loader size={64} className="drop-shadow-lg animate-spin" />
          ) : isListening ? (
            <MicOff size={64} className="drop-shadow-lg" />
          ) : (
            <Mic size={64} className="drop-shadow-lg" />
          )}
        </div>
      </motion.button>

      {/* Status text and visual indicators */}
      <div className="text-center space-y-4">
        <p className={`text-2xl font-semibold ${
          isProcessing ? 'text-yellow-600' : isListening ? 'text-red-600' : 'text-gray-600'
        }`}>
          {isProcessing ? 'Thinking...' : isListening ? 'Listening...' : 'Click to speak'}
        </p>

        {/* Instructions */}
        <p className="text-lg text-gray-500 max-w-md text-center">
          {isListening 
            ? 'Double-click to stop and get an answer'
            : 'Click once to start, double-click to stop'
          }
        </p>
        
        {/* Voice level indicator */}
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
        
        {/* Transcript display - Show during listening and after stopping */}
        <AnimatePresence>
          {(isListening || transcript || finalTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mb-4"
            >
              <p className="text-sm text-blue-600 mb-2">
                {isListening ? "Listening..." : "You said:"}
              </p>
              <p className="text-lg text-blue-800">
                {isListening ? (transcript || "Waiting for speech...") : (finalTranscript || transcript || "Processing...")}
              </p>
              {!isListening && (finalTranscript || transcript) && (
                <p className="text-xs text-blue-500 mt-2">
                  Processing your question...
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md"
            >
              <p className="text-lg text-red-800">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Response display */}
        <AnimatePresence>
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl"
              onAnimationComplete={() => {
                // Clear transcript after response is shown
                setTimeout(() => {
                  setTranscript('');
                  setFinalTranscript('');
                }, 2000);
              }}
            >
              <p className="text-xl text-green-800 leading-relaxed">
                {response}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}