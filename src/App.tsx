import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { LandingPage } from './pages/LandingPage';
import { CaregiverLogin, ElderLogin } from './pages/AuthPages';
import { CaregiverDashboard } from './pages/CaregiverDashboard';
import { ElderInterface } from './pages/ElderInterface';

// CSS for accessibility themes
const themeStyles = `
  [data-theme="light"] {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --border-color: #e5e7eb;
  }
  
  [data-theme="dark"] {
    --bg-primary: #1f2937;
    --bg-secondary: #111827;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --border-color: #374151;
  }
  
  [data-theme="high-contrast"] {
    --bg-primary: #ffffff;
    --bg-secondary: #f0f0f0;
    --text-primary: #000000;
    --text-secondary: #333333;
    --border-color: #000000;
  }
  
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  .slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  
  /* Ensure sufficient color contrast for accessibility */
  .focus\:ring-4:focus {
    ring-width: 4px;
  }
  
  /* Large touch targets for elderly users */
  button, input, select, textarea {
    min-height: 48px;
  }
  
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <div className="App">
          <style>{themeStyles}</style>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/caregiver-login" element={<CaregiverLogin />} />
            <Route path="/elder-login" element={<ElderLogin />} />
            <Route path="/caregiver-dashboard" element={<CaregiverDashboard />} />
            <Route path="/elder-interface" element={<ElderInterface />} />
            
            {/* Redirect legacy routes */}
            <Route path="/login" element={<Navigate to="/caregiver-login" replace />} />
            
            {/* 404 redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AccessibilityProvider>
  );
}

export default App;