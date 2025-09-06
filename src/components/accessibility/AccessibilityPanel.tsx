import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Eye, Type, Volume2, Zap } from 'lucide-react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
  const { settings, updateSettings, resetSettings } = useAccessibility();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Accessibility Settings</h2>
            <Button variant="ghost" onClick={onClose} size="small">
              ✕
            </Button>
          </div>

          <div className="space-y-8">
            {/* Theme Selection */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <Sun className="text-yellow-500" size={24} />
                Color Theme
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'high-contrast', label: 'High Contrast', icon: Eye }
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={settings.theme === value ? 'primary' : 'secondary'}
                    onClick={() => updateSettings({ theme: value as any })}
                    className="justify-center"
                    size="medium"
                  >
                    <Icon size={20} />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <Type className="text-blue-500" size={24} />
                Text Size
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'small', label: 'Small', size: 'text-base' },
                  { value: 'medium', label: 'Medium', size: 'text-lg' },
                  { value: 'large', label: 'Large', size: 'text-xl' }
                ].map(({ value, label, size }) => (
                  <Button
                    key={value}
                    variant={settings.fontSize === value ? 'primary' : 'secondary'}
                    onClick={() => updateSettings({ fontSize: value as any })}
                    className={`justify-center ${size}`}
                    size="medium"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Voice Speed */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <Volume2 className="text-green-500" size={24} />
                Voice Speed: {settings.voiceSpeed}x
              </h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.voiceSpeed}
                  onChange={(e) => updateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  aria-label="Adjust voice speed"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Slower</span>
                  <span>Normal</span>
                  <span>Faster</span>
                </div>
              </div>
            </div>

            {/* Motion Preference */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <Zap className="text-purple-500" size={24} />
                Animations
              </h3>
              <div className="flex gap-4">
                <Button
                  variant={!settings.reducedMotion ? 'primary' : 'secondary'}
                  onClick={() => updateSettings({ reducedMotion: false })}
                  size="medium"
                >
                  Normal Animations
                </Button>
                <Button
                  variant={settings.reducedMotion ? 'primary' : 'secondary'}
                  onClick={() => updateSettings({ reducedMotion: true })}
                  size="medium"
                >
                  Reduced Motion
                </Button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={resetSettings}
              size="medium"
              className="flex-1"
            >
              Reset to Defaults
            </Button>
            <Button
              variant="primary"
              onClick={onClose}
              size="medium"
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}