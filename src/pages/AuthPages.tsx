import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, User, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAccessibility } from '../contexts/AccessibilityContext';

// Caregiver Login Page
export function CaregiverLogin() {
  const navigate = useNavigate();
  const { settings } = useAccessibility();
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      navigate('/caregiver-dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={!settings.reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Button>
          
          <div className="flex items-center justify-center mb-4">
            <Heart className="text-blue-600 mr-3" size={36} />
            <h1 className="text-3xl font-bold text-gray-900">MemoryCompanion</h1>
          </div>
          <p className="text-xl text-gray-600">Caregiver Portal</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Demo credentials info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Demo Credentials</h3>
              <div className="text-blue-700">
                <p><strong>Email:</strong> caregiver@demo.com</p>
                <p><strong>Password:</strong> demo123</p>
                <p className="text-sm mt-2 text-blue-600">
                  Or use any email/password combination for demo purposes
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  id="password"
                  required
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                checked={formData.rememberMe}
                onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
              />
              <label htmlFor="rememberMe" className="ml-3 text-lg text-gray-700">
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>

            <div className="text-center space-y-2">
              <a href="#" className="text-blue-600 hover:text-blue-700 text-lg underline">
                Forgot your password?
              </a>
              <p className="text-gray-600">
                New to MemoryCompanion?{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                  Create an account
                </a>
              </p>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

// Elder Login Page - Simplified interface
export function ElderLogin() {
  const navigate = useNavigate();
  const { settings } = useAccessibility();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const users = [
    {
      id: 'elder-1',
      name: 'Eleanor Johnson',
      image: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setPin('');
  };

  const handlePinSubmit = () => {
    if (pin.length >= 4) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        navigate('/elder-interface');
      }, 1000);
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handlePinClear = () => {
    setPin('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={!settings.reducedMotion ? { opacity: 0, scale: 0.9 } : { opacity: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
            size="large"
          >
            <ArrowLeft size={24} />
            Back
          </Button>
          
          <div className="flex items-center justify-center mb-4">
            <Heart className="text-blue-600 mr-3" size={40} />
            <h1 className="text-4xl font-bold text-gray-900">Welcome Back</h1>
          </div>
        </div>

        <Card className="p-8">
          {!selectedUser ? (
            <div className="text-center">
              {/* Demo instructions */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Demo Instructions</h3>
                <p className="text-green-700">
                  Click on Eleanor's photo, then enter any 4-6 digit PIN (e.g., 1234)
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-8">Who are you?</h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <Button
                    key={user.id}
                    variant="secondary"
                    size="extra-large"
                    onClick={() => handleUserSelect(user.id)}
                    className="w-full justify-start"
                  >
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                    />
                    <span className="text-2xl">{user.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Enter Your PIN</h2>
              <p className="text-xl text-gray-600 mb-8">
                Please enter your personal identification number (Demo: any 4+ digits)
              </p>
              
              {/* PIN Display */}
              <div className="flex justify-center mb-8">
                <div className="flex space-x-3">
                  {[1, 2, 3, 4, 5, 6].map((position) => (
                    <div
                      key={position}
                      className="w-12 h-12 border-4 border-gray-300 rounded-lg flex items-center justify-center bg-white"
                    >
                      {pin[position - 1] ? (
                        <div className="w-3 h-3 bg-blue-600 rounded-full" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {/* PIN Keypad */}
              <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <Button
                    key={digit}
                    variant="secondary"
                    size="large"
                    onClick={() => handlePinInput(digit.toString())}
                    className="aspect-square text-3xl font-bold"
                  >
                    {digit}
                  </Button>
                ))}
                
                <Button
                  variant="ghost"
                  size="large"
                  onClick={handlePinClear}
                  className="aspect-square text-xl"
                >
                  Clear
                </Button>
                
                <Button
                  variant="secondary"
                  size="large"
                  onClick={() => handlePinInput('0')}
                  className="aspect-square text-3xl font-bold"
                >
                  0
                </Button>
                
                <Button
                  variant="primary"
                  size="large"
                  onClick={handlePinSubmit}
                  disabled={pin.length < 4}
                  isLoading={isLoading}
                  className="aspect-square text-xl"
                >
                  ✓
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setSelectedUser(null)}
                size="medium"
              >
                Choose Different Person
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}