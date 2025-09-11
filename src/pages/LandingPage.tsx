import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Shield, Clock, Star, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAccessibility } from '../contexts/AccessibilityContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { settings } = useAccessibility();

  const features = [
    {
      icon: Heart,
      title: 'Gentle Voice Assistant',
      description: 'A caring AI companion that helps with daily reminders and family recognition using simple voice commands.'
    },
    {
      icon: Users,
      title: 'Family Connection',
      description: 'Keep your loved ones connected with photo-based family member identification and contact management.'
    },
    {
      icon: Shield,
      title: 'Emergency Support',
      description: 'Immediate access to emergency contacts and professional help when needed most.'
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Round-the-clock support for memory assistance, medication reminders, and daily guidance.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Heart className="text-blue-600" size={36} />
            <h1 className="text-2xl font-bold text-gray-900">Dementia Care</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-lg text-gray-600 hover:text-blue-600 transition-colors">
              Features
            </a>
            <Button 
              variant="ghost" 
              size="medium"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={!settings.reducedMotion ? { opacity: 0, y: 30 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              A Caring Voice for
              <span className="text-blue-600 block">Memory Support</span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              An AI companion designed specifically for seniors with dementia and their families. 
              Simple voice interactions help with daily tasks, family recognition, and staying connected.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                variant="primary"
                size="extra-large"
                onClick={() => navigate('/elder-login')}
                className="min-w-[280px]"
              >
                <Heart size={28} />
                I Need Help Remembering
                <ArrowRight size={24} />
              </Button>
              
              <Button
                variant="secondary"
                size="extra-large"
                onClick={() => navigate('/caregiver-login')}
                className="min-w-[280px]"
              >
                <Users size={28} />
                I'm a Caregiver
                <ArrowRight size={24} />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-lg text-gray-500">
              <div className="flex items-center gap-2">
                <Shield size={24} className="text-green-600" />
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-2">
                <Heart size={24} className="text-red-500" />
                10,000+ Families Helped
              </div>
              <div className="flex items-center gap-2">
                <Star size={24} className="text-yellow-500" />
                4.9/5 Rating
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-6">
              Designed with Love and Care
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every feature is thoughtfully crafted for accessibility, simplicity, and the unique needs of seniors with dementia.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={!settings.reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-8 h-full text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                    <feature.icon className="text-blue-600" size={32} />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}