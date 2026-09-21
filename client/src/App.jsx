import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { UniversityAuth, EXPERTISE_OPTIONS, CAPABILITIES_CONFIG, INDIAN_STATES_AND_UTS } from './modules/university/UniversityAuth';
import { UniversityDashboard } from './modules/university/UniversityDashboard';
import { UniversityProblems } from './modules/university/UniversityProblems';
import { UniversityTeamForm } from './modules/university/UniversityTeamForm';
import { IndustryAuth } from './modules/industry/IndustryAuth';
import { IndustryDashboard } from './modules/industry/IndustryDashboard';
import { IndustryProblems } from './modules/industry/IndustryProblems';
import { IndustryTeamForm } from './modules/industry/IndustryTeamForm';
import { IndustryCollaborate } from './modules/industry/IndustryCollaborate';
import { CitizenPortal } from './modules/citizen/CitizenPortal';
import { AdminPortal } from './modules/admin/AdminPortal';
import { authService } from './services/authService';

export const ROLES_DATA = [
  {
    id: 'citizen',
    titleEn: 'Citizen',
    titleHi: 'नागरिक',
    badgeEn: 'Public & Grievance',
    badgeHi: 'जन सेवा व समाधान',
    descEn: 'Report local civic issues, track real-time resolution status, and access government welfare initiatives.',
    descHi: 'स्थानीय समस्याएं दर्ज करें, रीयल-टाइम समाधान ट्रैक करें और सरकारी योजनाओं का लाभ उठाएं।',
    featuresEn: [
      'Jan Samvaad Grievance Filing',
      'Real-Time Milestone Tracking',
      'Community Solutions & Voting',
      'Ward Councillor Direct Connect'
    ],
    featuresHi: [
      'जन संवाद शिकायत पंजीकरण',
      'लाइव समाधान स्थिति ट्रैकिंग',
      'सामुदायिक सुझाव व वोटिंग',
      'वार्ड पार्षद से सीधा संपर्क'
    ]
  },
  {
    id: 'university',
    titleEn: 'University',
    titleHi: 'विश्वविद्यालय',
    badgeEn: 'Academia & Research',
    badgeHi: 'अकादमिक व शोध संस्थान',
    descEn: 'Access state civic challenges matching your domain, submit student R&D proposals, and secure project grants.',
    descHi: 'अपने विषय अनुसार समस्याएं देखें, छात्र शोध प्रस्ताव जमा करें और राज्य अनुसंधान ग्रांट प्राप्त करें।',
    featuresEn: [
      'Jharkhand State Research Grants',
      'Domain-Based Problem Routing',
      'Student Innovation Teams',
      '90-Day SLA Milestone Manager'
    ],
    featuresHi: [
      'राज्य अनुसंधान व विकास ग्रांट्स',
      'विषय-आधारित चुनौती चयन',
      'छात्र एवं फेकल्टी रिसर्च टीम',
      '90-दिवसीय समय सीमा ट्रैकिंग'
    ]
  },
  {
    id: 'industry',
    titleEn: 'Industry',
    titleHi: 'उद्योग व व्यापार',
    badgeEn: 'Enterprise & PPP',
    badgeHi: 'कॉर्पोरेट व पीपीपी',
    descEn: 'Direct CSR investment into high-priority state projects, co-fund university prototypes, and provide lab access.',
    descHi: 'उच्च-प्राथमिकता परियोजनाओं में सीएसआर निवेश करें, प्रोटोटाइप को फंड करें और टेस्टिंग सुविधा दें।',
    featuresEn: [
      'Verified District CSR Projects',
      'University Co-Funding Pledges',
      'Equipment & Lab Sponsorship',
      'Single-Window Compliance Desk'
    ],
    featuresHi: [
      'सत्यापित जिला स्तरीय सीएसआर प्रोजेक्ट्स',
      'विश्वविद्यालय सह-वित्तपोषण',
      'उपकरण व लैब टेस्टिंग सहयोग',
      'सिंगल-विंडो औद्योगिक समाधान'
    ]
  },
  {
    id: 'admin',
    titleEn: 'Admin',
    titleHi: 'प्रशासन',
    badgeEn: 'Official Command',
    badgeHi: 'प्रशासनिक नियंत्रण कक्ष',
    descEn: 'AI triage command center for District Collectors and nodal officers to broadcast, assign, and track SLAs.',
    descHi: 'उपायुक्तों एवं नोडल अधिकारियों के लिए एआई समीक्षा, चुनौती प्रसारण व 90-दिवसीय एसएलए नियंत्रण कक्ष।',
    featuresEn: [
      'AI Vision & Duplicate Triage',
      '24 Districts Real-Time KPI Radar',
      '90-Day SLA & Auto-Breach Alerts',
      'Multi-Solution Matrix Comparison'
    ],
    featuresHi: [
      'एआई विजन व डुप्लीकेट समीक्षा',
      '24 जिलों का लाइव प्रदर्शन रडार',
      '90-दिवसीय एसएलए ऑटो-अलर्ट',
      'बहु-समाधान तुलनात्मक मूल्यांकन'
    ]
  }
];

import { JharkhandCrest, EyeIcon, EyeOffIcon, JharkhandMapSilhouette } from './components/Icons';

// Active credentials for each persona
const DEMO_CREDENTIALS = {
  citizen: { email: 'citizen.ranchi@jharkhand.gov.in', password: 'admin123' },
  university: { email: 'univ.ai01@example.com', password: 'Uni@AI2026#01' },
  industry: { email: 'csr@tatasteel.com', password: 'admin123' },
  admin: { email: 'admin@jharkhand.gov.in', password: 'admin123' }
};

// Main Landing Page Component with Unified Hero & Single Login / Sign Up Card
function LandingPage({ 
  lang, 
  onToggleLang, 
  onFooterRoleSelect,
  onCitizenLogin,
  onUniversityLogin,
  onIndustryLogin,
  onAdminLogin
}) {
  const isHindi = lang === 'hi';
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [signupStep, setSignupStep] = useState(1); // 1 | 2 | 3
  const [stepError, setStepError] = useState('');
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [email, setEmail] = useState(DEMO_CREDENTIALS.citizen.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.citizen.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotMsg, setForgotMsg] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Sign Up form state
  const [signupData, setSignupData] = useState({
    fullName: '',
    phone: '',
    district: 'Ranchi',
    ward: '',
    // University specific fields
    instName: '',
    state: 'Jharkhand',
    city: 'Ranchi',
    repName: '',
    designation: '',
    instEmail: '',
    phoneNumber: '',
    areasOfExpertise: ['Water Management', 'Environment', 'Urban Infrastructure'],
    capabilities: {
      'Technical Support': ['Software Development', 'AI/ML Solutions'],
      'Research Support': ['Research & Development', 'Laboratory Facilities'],
      'Human Resources': ['Faculty Expertise', 'Student Projects'],
      'Infrastructure': ['Laboratory', 'Computing Resources'],
      'Training & Community Support': ['Workshops', 'Training'],
      'Implementation': ['Pilot Testing', 'Field Implementation']
    },
    // Industry specific fields
    compName: '',
    corpEmail: '',
    csrSector: 'Urban Infrastructure & Sanitation',
    password: '',
    confirmPassword: ''
  });

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setEmail(DEMO_CREDENTIALS[roleId]?.email || '');
    setPassword(DEMO_CREDENTIALS[roleId]?.password || 'admin123');
    setForgotMsg(false);
    setSuccessMsg('');
    setStepError('');
  };

  const handleSignupChange = (field, value) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  const handleUnivExpertiseToggle = (item) => {
    setSignupData(prev => {
      const exists = prev.areasOfExpertise.includes(item);
      const updated = exists
        ? prev.areasOfExpertise.filter(e => e !== item)
        : [...prev.areasOfExpertise, item];
      return { ...prev, areasOfExpertise: updated };
    });
  };

  const handleUnivCapabilityToggle = (category, item) => {
    setSignupData(prev => {
      const current = prev.capabilities[category] || [];
      const exists = current.includes(item);
      const updated = exists ? current.filter(i => i !== item) : [...current, item];
      return {
        ...prev,
        capabilities: {
          ...prev.capabilities,
          [category]: updated
        }
      };
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStepError('');
    try {
      const result = await authService.login({
        email,
        password,
        role: selectedRole
      });
      setIsSubmitting(false);
      if (result.success) {
        const u = result.user;
        if (selectedRole === 'citizen') {
          onCitizenLogin(u);
        } else if (selectedRole === 'university') {
          onUniversityLogin(u);
        } else if (selectedRole === 'industry') {
          onIndustryLogin(u);
        } else if (selectedRole === 'admin') {
          onAdminLogin(u);
        }
      } else {
        setStepError(result.message || (isHindi ? 'लॉग इन विफल हुआ। कृपया क्रेडेंशियल जांचें।' : 'Login failed. Please check your credentials.'));
      }
    } catch (err) {
      setIsSubmitting(false);
      setStepError(isHindi ? 'सर्वर से कनेक्ट नहीं हो सका।' : 'Could not connect to server.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (signupData.password && signupData.confirmPassword && signupData.password !== signupData.confirmPassword) {
      setStepError(isHindi ? 'पासवर्ड मेल नहीं खाते।' : 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setStepError('');

    try {
      const totalCaps = signupData.capabilities ? Object.values(signupData.capabilities).reduce((acc, l) => acc + l.length, 0) : 0;
      const payload = {
        role: selectedRole,
        fullName: selectedRole === 'citizen' ? (signupData.fullName || 'Citizen User') : (signupData.repName || 'Authorized Representative'),
        email: selectedRole === 'citizen' ? (signupData.phone ? `${signupData.phone.replace(/[^0-9]/g, '')}@citizen.jharkhand.gov.in` : 'citizen@jharkhand.gov.in') : (selectedRole === 'university' ? signupData.instEmail : signupData.corpEmail),
        phone: signupData.phone || signupData.phoneNumber || '+91 94311 00000',
        district: signupData.district || signupData.city || 'Ranchi',
        state: signupData.state || 'Jharkhand',
        city: signupData.city || signupData.district || 'Ranchi',
        password: signupData.password || 'password123',
        representativeName: signupData.repName || signupData.fullName,
        designation: signupData.designation || '',
        universityName: signupData.instName || '',
        companyName: signupData.compName || '',
        areasOfExpertise: signupData.areasOfExpertise || [signupData.csrSector].filter(Boolean),
        capabilities: signupData.capabilities || {},
        capabilitiesCount: totalCaps
      };

      const result = await authService.register(payload);
      setIsSubmitting(false);

      if (result.success) {
        setSuccessMsg(isHindi ? 'खाता सफलतापूर्वक बनाया गया! पोर्टल लोड हो रहा है...' : 'Account created successfully! Redirecting...');
        setTimeout(() => {
          const u = result.user;
          if (selectedRole === 'citizen') {
            onCitizenLogin(u);
          } else if (selectedRole === 'university') {
            onUniversityLogin(u);
          } else if (selectedRole === 'industry') {
            onIndustryLogin(u);
          } else if (selectedRole === 'admin') {
            onAdminLogin(u);
          }
        }, 400);
      } else {
        setStepError(result.message || (isHindi ? 'पंजीकरण विफल हुआ।' : 'Registration failed. Please check your details.'));
      }
    } catch (err) {
      setIsSubmitting(false);
      setStepError(isHindi ? 'सर्वर से कनेक्ट नहीं हो सका।' : 'Could not connect to server.');
    }
  };

  return (
    <div className="app-container unified-landing-wrapper">
      {/* Header with Government branding */}
      <Header lang={lang} onToggleLang={onToggleLang} />

      {/* Main Unified Hero + Login Card Section */}
      <main className="unified-hero-section">
        <div className="unified-hero-container">
          
          {/* Centered Single Unified Login / Sign Up Card */}
          <div className="unified-login-card">
            
            {/* Card Header Brand */}
            <div className="card-brand-header">
              <div className="card-brand-crest">
                <JharkhandCrest size={34} />
              </div>
                <div className="card-brand-info">
                  <h3 className="card-brand-title">Civic Connect</h3>
                  <p className="card-brand-sub">
                    {isHindi ? 'एकीकृत नागरिक एवं संस्थागत पोर्टल' : 'Unified Civic & Institutional Portal'}
                  </p>
                </div>
              </div>

              {/* Top Auth Mode Tabs: Login vs Sign Up */}
              <div style={{
                display: 'flex',
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: '10px',
                padding: '3px',
                marginBottom: '18px',
                gap: '3px'
              }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setSuccessMsg(''); }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: authMode === 'login' ? '#036D33' : 'transparent',
                    color: authMode === 'login' ? '#FFFFFF' : '#024D24',
                    boxShadow: authMode === 'login' ? '0 2px 6px rgba(3, 109, 51, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isHindi ? 'लॉग इन' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setSuccessMsg('');
                    if (selectedRole === 'admin') setSelectedRole('citizen');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: authMode === 'signup' ? '#036D33' : 'transparent',
                    color: authMode === 'signup' ? '#FFFFFF' : '#024D24',
                    boxShadow: authMode === 'signup' ? '0 2px 6px rgba(3, 109, 51, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isHindi ? 'साइन अप (रजिस्ट्रेशन)' : 'Sign Up'}
                </button>
              </div>

              {/* Card Form Title */}
              <div className="card-title-section">
                <h2 className="login-heading">
                  {authMode === 'login' 
                    ? (isHindi ? 'लॉग इन' : 'Login') 
                    : (isHindi ? 'नया खाता बनाएं' : 'Create Account')}
                </h2>
                <p className="login-subheading">
                  {authMode === 'login'
                    ? (isHindi ? 'जारी रखने के लिए अपने खाते में प्रवेश करें' : 'Access your account to continue')
                    : (isHindi ? 'झारखंड सिविक कनेक्ट पोर्टल में पंजीकरण करें' : 'Register for Jharkhand Civic Connect')}
                </p>
              </div>

              {successMsg && (
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #10B981',
                  color: '#065F46',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '14px'
                }}>
                  {successMsg}
                </div>
              )}

              {/* ======================= LOGIN FORM ======================= */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="unified-login-form">
                  
                  {/* Role Switcher Tabs */}
                  <div className="form-group-role">
                    <label className="input-label-sm">{isHindi ? 'भूमिका चुनें' : 'Select Role'}</label>
                    <div className="role-segmented-tabs">
                      <button
                        type="button"
                        className={`role-tab-btn ${selectedRole === 'citizen' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('citizen')}
                      >
                        {isHindi ? 'नागरिक' : 'Citizen'}
                      </button>
                      <button
                        type="button"
                        className={`role-tab-btn ${selectedRole === 'university' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('university')}
                      >
                        {isHindi ? 'विश्वविद्यालय' : 'University'}
                      </button>
                      <button
                        type="button"
                        className={`role-tab-btn ${selectedRole === 'industry' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('industry')}
                      >
                        {isHindi ? 'उद्योग' : 'Industry'}
                      </button>
                      <button
                        type="button"
                        className={`role-tab-btn ${selectedRole === 'admin' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('admin')}
                      >
                        {isHindi ? 'प्रशासन' : 'Admin'}
                      </button>
                    </div>
                  </div>

                  {selectedRole === 'citizen' && (
                    <div style={{
                      background: '#F0FDF4',
                      border: '1.5px solid #BBF7D0',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ fontSize: '0.82rem', color: '#065F46', fontWeight: 600, lineHeight: 1.4 }}>
                        ✨ {isHindi 
                          ? 'नागरिक बिना लॉगिन के सीधे समस्याएं दर्ज कर सकते हैं और सार्वजनिक समाधान देख सकते हैं।' 
                          : 'Citizens can report civic challenges and explore solutions directly without login!'}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/citizen')}
                        style={{
                          background: '#036D33',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 4px rgba(3, 109, 51, 0.2)'
                        }}
                      >
                        <span>{isHindi ? 'नागरिक पोर्टल में सीधे जाएं' : 'Enter Citizen Portal Directly (No Login)'}</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}

                  {/* Email / Username Input */}
                  <div className="form-group-field">
                    <label className="input-label">
                      {isHindi ? 'ईमेल / उपयोगकर्ता नाम' : 'Email / Username'}
                    </label>
                    <input
                      type="text"
                      className="unified-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={isHindi ? 'ईमेल या यूज़रनेम दर्ज करें' : 'Enter email or username'}
                      required
                    />
                  </div>

                  {/* Password Input */}
                  <div className="form-group-field">
                    <label className="input-label">{isHindi ? 'पासवर्ड' : 'Password'}</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="unified-input password-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isHindi ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="unified-login-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? (isHindi ? 'प्रवेश हो रहा है...' : 'Authenticating...') 
                      : (isHindi ? 'लॉग इन' : 'Login')}
                  </button>

                  {/* Links Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.82rem' }}>
                    <button
                      type="button"
                      className="forgot-pass-btn"
                      onClick={() => setForgotMsg(!forgotMsg)}
                    >
                      {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); if (selectedRole === 'admin') setSelectedRole('citizen'); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#024D24',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {isHindi ? 'नया खाता बनाएं →' : 'Sign Up →'}
                    </button>
                  </div>

                  {forgotMsg && (
                    <div className="forgot-notice-banner">
                      {isHindi
                        ? 'पासवर्ड रीसेट के लिए कृपया अपने जिला नोडल अधिकारी या टोल फ्री 181 पर संपर्क करें।'
                        : 'For password reset assistance, please contact your District Nodal Officer or call Helpline 181.'}
                    </div>
                  )}
                </form>
              )}

              {/* ======================= SIGN UP STEP-BY-STEP WIZARD ======================= */}
              {authMode === 'signup' && (
                <div className="unified-login-form">
                  {stepError && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #F87171',
                      color: '#991B1B',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {stepError}
                    </div>
                  )}

                  {/* ----------------- STEP 1: ROLE & BASIC IDENTITY ----------------- */}
                  {signupStep === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Role Switcher Tabs */}
                      <div className="form-group-role">
                        <label className="input-label-sm">{isHindi ? 'पंजीकरण भूमिका चुनें' : 'Select Registration Role'}</label>
                        <div className="role-segmented-tabs">
                          <button
                            type="button"
                            className={`role-tab-btn ${selectedRole === 'citizen' ? 'active' : ''}`}
                            onClick={() => { handleRoleChange('citizen'); setStepError(''); }}
                          >
                            {isHindi ? 'नागरिक' : 'Citizen'}
                          </button>
                          <button
                            type="button"
                            className={`role-tab-btn ${selectedRole === 'university' ? 'active' : ''}`}
                            onClick={() => { handleRoleChange('university'); setStepError(''); }}
                          >
                            {isHindi ? 'विश्वविद्यालय' : 'University'}
                          </button>
                          <button
                            type="button"
                            className={`role-tab-btn ${selectedRole === 'industry' ? 'active' : ''}`}
                            onClick={() => { handleRoleChange('industry'); setStepError(''); }}
                          >
                            {isHindi ? 'उद्योग' : 'Industry'}
                          </button>
                        </div>
                      </div>

                      {/* Citizen Step 1 */}
                      {selectedRole === 'citizen' && (
                        <>
                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'पूरा नाम' : 'Full Name'} *</label>
                            <input
                              type="text"
                              className="unified-input"
                              value={signupData.fullName}
                              onChange={(e) => { handleSignupChange('fullName', e.target.value); setStepError(''); }}
                              placeholder={isHindi ? 'अपना पूरा नाम दर्ज करें' : 'e.g. Ramesh Kumar Soren'}
                              required
                            />
                          </div>
                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'मोबाइल नंबर' : 'Mobile Number'} *</label>
                            <input
                              type="tel"
                              className="unified-input"
                              value={signupData.phone}
                              onChange={(e) => { handleSignupChange('phone', e.target.value); setStepError(''); }}
                              placeholder="9876543210"
                              required
                            />
                          </div>
                        </>
                      )}

                      {/* University Step 1 */}
                      {selectedRole === 'university' && (
                        <>
                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'विश्वविद्यालय / संस्थान का नाम' : 'University / Institution Name'} *</label>
                            <input
                              type="text"
                              className="unified-input"
                              value={signupData.instName}
                              onChange={(e) => { handleSignupChange('instName', e.target.value); setStepError(''); }}
                              placeholder="e.g., Central University of Jharkhand / BIT Sindri / Ranchi University"
                              required
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group-field">
                              <label className="input-label">{isHindi ? 'राज्य / केंद्र शासित प्रदेश' : 'State / Union Territory'} *</label>
                              <select
                                className="unified-input"
                                value={signupData.state}
                                onChange={(e) => handleSignupChange('state', e.target.value)}
                                style={{ cursor: 'pointer' }}
                              >
                                {INDIAN_STATES_AND_UTS.map((st) => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </div>

                            <div className="form-group-field">
                              <label className="input-label">{isHindi ? 'शहर / जिला' : 'City / District (Manual Entry)'} *</label>
                              <input
                                type="text"
                                className="unified-input"
                                value={signupData.city}
                                onChange={(e) => { handleSignupChange('city', e.target.value); setStepError(''); }}
                                placeholder="e.g., Ranchi / Jamshedpur / Dhanbad"
                                required
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group-field">
                              <label className="input-label">{isHindi ? 'अधिकृत प्रतिनिधि नाम' : 'Authorized Representative Name'} *</label>
                              <input
                                type="text"
                                className="unified-input"
                                value={signupData.repName}
                                onChange={(e) => { handleSignupChange('repName', e.target.value); setStepError(''); }}
                                placeholder="e.g., Dr. Ramesh Soren"
                                required
                              />
                            </div>
                            <div className="form-group-field">
                              <label className="input-label">{isHindi ? 'पद / भूमिका' : 'Designation / Role'} *</label>
                              <input
                                type="text"
                                className="unified-input"
                                value={signupData.designation}
                                onChange={(e) => { handleSignupChange('designation', e.target.value); setStepError(''); }}
                                placeholder="e.g., Dean of Research / Registrar"
                                required
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group-field">
                              <label className="input-label">{isHindi ? 'आधिकारिक संस्थागत ईमेल' : 'Official Institutional Email'} *</label>
                              <input
                                type="email"
                                className="unified-input"
                                value={signupData.instEmail}
                                onChange={(e) => { handleSignupChange('instEmail', e.target.value); setStepError(''); }}
                                placeholder="civic.lab@cuj.ac.in"
                                required
                              />
                            </div>
                            <div className="form-group-field">
                              <label className="input-label">{isHindi ? 'संपर्क फोन नंबर' : 'Contact Phone Number'} *</label>
                              <input
                                type="tel"
                                className="unified-input"
                                value={signupData.phoneNumber}
                                onChange={(e) => { handleSignupChange('phoneNumber', e.target.value); setStepError(''); }}
                                placeholder="e.g., +91 94311 00000"
                                required
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Industry Step 1 */}
                      {selectedRole === 'industry' && (
                        <>
                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'कंपनी / संगठन का नाम' : 'Company / Enterprise Name'} *</label>
                            <input
                              type="text"
                              className="unified-input"
                              value={signupData.compName}
                              onChange={(e) => { handleSignupChange('compName', e.target.value); setStepError(''); }}
                              placeholder="e.g. Tata Steel Foundation / CCL / SAIL"
                              required
                            />
                          </div>
                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'राज्य / जिला परिचालन' : 'Operational District'} *</label>
                            <select
                              className="unified-input"
                              value={signupData.district}
                              onChange={(e) => handleSignupChange('district', e.target.value)}
                              style={{ cursor: 'pointer' }}
                            >
                              {['Ranchi', 'East Singhbhum (Jamshedpur)', 'Dhanbad', 'Bokaro', 'Ramgarh', 'Hazaribagh', 'West Singhbhum', 'Deoghar'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {/* Next Button */}
                      <button
                        type="button"
                        className="unified-login-btn"
                        onClick={() => {
                          if (selectedRole === 'citizen' && (!signupData.fullName.trim() || !signupData.phone.trim())) {
                            setStepError(isHindi ? 'कृपया पूरा नाम और मोबाइल नंबर दर्ज करें।' : 'Please enter your Full Name and Mobile Number.');
                            return;
                          }
                          if (selectedRole === 'university') {
                            if (!signupData.instName.trim() || !signupData.city.trim() || !signupData.repName.trim() || !signupData.designation.trim() || !signupData.instEmail.trim() || !signupData.phoneNumber.trim()) {
                              setStepError(isHindi ? 'कृपया संस्थान की सभी आवश्यक जानकारी दर्ज करें।' : 'Please fill in all required Institution Profile & Location fields.');
                              return;
                            }
                          }
                          if (selectedRole === 'industry' && !signupData.compName.trim()) {
                            setStepError(isHindi ? 'कृपया कंपनी का नाम दर्ज करें।' : 'Please enter the Enterprise Name.');
                            return;
                          }
                          setStepError('');
                          setSignupStep(2);
                        }}
                      >
                        {isHindi ? 'आगे बढ़ें (Next) →' : 'Next Step →'}
                      </button>
                    </div>
                  )}

                  {/* ----------------- STEP 2: PROFILE & DOMAIN DETAILS ----------------- */}
                  {signupStep === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Citizen Step 2 */}
                      {selectedRole === 'citizen' && (
                        <>
                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'जिला' : 'District'} *</label>
                            <select
                              className="unified-input"
                              value={signupData.district}
                              onChange={(e) => handleSignupChange('district', e.target.value)}
                              style={{ cursor: 'pointer' }}
                            >
                              {['Ranchi', 'Dhanbad', 'East Singhbhum (Jamshedpur)', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Dumka', 'Giridih', 'Latehar', 'Sahibganj'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'वार्ड / पंचायत / मोहल्ला' : 'Ward / Gram Panchayat / Area'}</label>
                            <input
                              type="text"
                              className="unified-input"
                              value={signupData.ward}
                              onChange={(e) => handleSignupChange('ward', e.target.value)}
                              placeholder={isHindi ? 'वार्ड नंबर या ग्राम पंचायत' : 'e.g. Ward 12, Harmu Road'}
                            />
                          </div>
                        </>
                      )}

                      {/* University Step 2: Academic & Research Areas of Expertise */}
                      {selectedRole === 'university' && (
                        <div>
                          <div style={{ marginBottom: '8px' }}>
                            <label className="input-label" style={{ fontWeight: 800, color: '#024D24', marginBottom: '3px', display: 'block' }}>
                              {isHindi ? '2. अकादमिक व अनुसंधान विशेषज्ञता क्षेत्र' : '2. Academic & Research Areas of Expertise'}
                            </label>
                            <p style={{ fontSize: '0.78rem', color: '#4B5563', margin: 0, lineHeight: 1.35 }}>
                              Select the domains where your university or faculty can contribute to Jharkhand's civic problem statements:
                            </p>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '6px',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            padding: '4px',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px'
                          }}>
                            {EXPERTISE_OPTIONS.map((item) => {
                              const isChecked = signupData.areasOfExpertise.includes(item);
                              return (
                                <button
                                  type="button"
                                  key={item}
                                  onClick={() => handleUnivExpertiseToggle(item)}
                                  style={{
                                    border: isChecked ? '1.5px solid #036D33' : '1px solid #D1D5DB',
                                    background: isChecked ? '#E8F5EC' : '#FFFFFF',
                                    color: isChecked ? '#024D24' : '#374151',
                                    borderRadius: '6px',
                                    padding: '6px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: isChecked ? 700 : 500,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <span>{isChecked ? '☑' : '☐'}</span>
                                  <span style={{ whiteSpace: 'normal' }}>{item}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Industry Step 2 */}
                      {selectedRole === 'industry' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group-field">
                              <label className="input-label">{isHindi ? 'सीएसआर अधिकारी' : 'CSR Lead Name'} *</label>
                              <input
                                type="text"
                                className="unified-input"
                                value={signupData.repName}
                                onChange={(e) => { handleSignupChange('repName', e.target.value); setStepError(''); }}
                                placeholder="e.g. Rajesh V."
                                required
                              />
                            </div>
                            <div className="form-group-field">
                              <label className="input-label">{isHindi ? 'पदनाम' : 'Designation'} *</label>
                              <input
                                type="text"
                                className="unified-input"
                                value={signupData.designation}
                                onChange={(e) => { handleSignupChange('designation', e.target.value); setStepError(''); }}
                                placeholder="e.g. CSR Director"
                                required
                              />
                            </div>
                          </div>

                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'कॉर्पोरेट ईमेल' : 'Corporate Email ID'} *</label>
                            <input
                              type="email"
                              className="unified-input"
                              value={signupData.corpEmail}
                              onChange={(e) => { handleSignupChange('corpEmail', e.target.value); setStepError(''); }}
                              placeholder="csr.initiatives@tatasteel.com"
                              required
                            />
                          </div>

                          <div className="form-group-field">
                            <label className="input-label">{isHindi ? 'सीएसआर फोकस सेक्टर' : 'CSR Focus Sector'}</label>
                            <select
                              className="unified-input"
                              value={signupData.csrSector}
                              onChange={(e) => handleSignupChange('csrSector', e.target.value)}
                              style={{ cursor: 'pointer' }}
                            >
                              <option value="Urban Infrastructure & Sanitation">Urban Infrastructure & Sanitation</option>
                              <option value="Clean Water & Arsenic Mitigation">Clean Water & Arsenic Mitigation</option>
                              <option value="Solar Electrification">Solar Electrification for Tribal Belts</option>
                              <option value="Smart Public Healthcare">Smart Public Healthcare & Telemedicine</option>
                              <option value="Skill Development & Education">Skill Development & Education</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Navigation Buttons: Back and Next */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => { setStepError(''); setSignupStep(1); }}
                          style={{
                            background: '#F3F4F6',
                            color: '#374151',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer'
                          }}
                        >
                          {isHindi ? '← पीछे जाएं' : '← Back'}
                        </button>
                        <button
                          type="button"
                          className="unified-login-btn"
                          style={{ marginTop: 0 }}
                          onClick={() => {
                            if (selectedRole === 'industry' && (!signupData.repName.trim() || !signupData.corpEmail.trim())) {
                              setStepError(isHindi ? 'कृपया सीएसआर अधिकारी का नाम और ईमेल दर्ज करें।' : 'Please enter CSR Lead Name and Corporate Email.');
                              return;
                            }
                            setStepError('');
                            setSignupStep(3);
                          }}
                        >
                          {isHindi ? 'आगे बढ़ें (Next) →' : 'Next Step →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ----------------- STEP 3: SECURITY & FINAL SUBMISSION ----------------- */}
                  {signupStep === 3 && (
                    <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Summary preview pill */}
                      <div style={{
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '0.8rem',
                        color: '#065F46',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ fontWeight: 800 }}>
                          {isHindi ? 'पंजीकरण पूर्वावलोकन:' : 'Registration Preview:'}
                        </div>
                        <div>
                          <strong>{selectedRole.toUpperCase()}</strong>: {selectedRole === 'citizen' ? (signupData.fullName || 'Citizen User') : selectedRole === 'university' ? (signupData.instName || 'University') : (signupData.compName || 'Corporate Partner')} ({signupData.city || signupData.district || 'Jharkhand'})
                        </div>
                      </div>

                      {/* University Step 3: Institutional Capabilities & Facilities */}
                      {selectedRole === 'university' && (
                        <div>
                          <div style={{ marginBottom: '8px' }}>
                            <label className="input-label" style={{ fontWeight: 800, color: '#024D24', marginBottom: '2px', display: 'block' }}>
                              {isHindi ? '3. संस्थागत क्षमताएं व सुविधाएं' : '3. Institutional Capabilities & Facilities'}
                            </label>
                            <p style={{ fontSize: '0.78rem', color: '#4B5563', margin: 0, lineHeight: 1.35 }}>
                              Select specific technical, research, infrastructure, and human capabilities available for state collaboration:
                            </p>
                          </div>

                          <div style={{
                            maxHeight: '180px',
                            overflowY: 'auto',
                            padding: '8px',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}>
                            {Object.entries(CAPABILITIES_CONFIG).map(([category, items]) => (
                              <div key={category}>
                                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#024D24', marginBottom: '4px' }}>
                                  • {category}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                  {items.map((subItem) => {
                                    const isChecked = (signupData.capabilities[category] || []).includes(subItem);
                                    return (
                                      <button
                                        type="button"
                                        key={subItem}
                                        onClick={() => handleUnivCapabilityToggle(category, subItem)}
                                        style={{
                                          border: isChecked ? '1.5px solid #036D33' : '1px solid #D1D5DB',
                                          background: isChecked ? '#E8F5EC' : '#FFFFFF',
                                          color: isChecked ? '#024D24' : '#4B5563',
                                          borderRadius: '5px',
                                          padding: '4px 6px',
                                          fontSize: '0.72rem',
                                          fontWeight: isChecked ? 700 : 500,
                                          cursor: 'pointer',
                                          textAlign: 'left',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <span>{isChecked ? '☑' : '☐'}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subItem}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Password Field */}
                      <div className="form-group-field">
                        <label className="input-label">{isHindi ? 'पासवर्ड बनाएं' : 'Create Password'} *</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="unified-input password-input"
                            value={signupData.password}
                            onChange={(e) => { handleSignupChange('password', e.target.value); setStepError(''); }}
                            placeholder={isHindi ? 'कम से कम 6 अक्षर का पासवर्ड' : 'At least 6 characters'}
                            required
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password Field */}
                      <div className="form-group-field">
                        <label className="input-label">{isHindi ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'} *</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="unified-input"
                          value={signupData.confirmPassword}
                          onChange={(e) => { handleSignupChange('confirmPassword', e.target.value); setStepError(''); }}
                          placeholder={isHindi ? 'पासवर्ड दोबारा दर्ज करें' : 'Re-enter your password'}
                          required
                        />
                      </div>

                      {/* Navigation: Back and Submit */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '10px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => { setStepError(''); setSignupStep(2); }}
                          style={{
                            background: '#F3F4F6',
                            color: '#374151',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            cursor: 'pointer'
                          }}
                        >
                          {isHindi ? '← पीछे जाएं' : '← Back'}
                        </button>
                        <button
                          type="submit"
                          className="unified-login-btn"
                          style={{ marginTop: 0 }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting 
                            ? (isHindi ? 'खाता बन रहा है...' : 'Creating...') 
                            : (isHindi ? 'खाता बनाएं ✓' : 'Create Account ✓')}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Switch to Login Link */}
                  <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.84rem' }}>
                    <span style={{ color: '#6B7280' }}>
                      {isHindi ? 'पहले से खाता है? ' : 'Already have an account? '}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setSignupStep(1); setStepError(''); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#036D33',
                        fontWeight: 800,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {isHindi ? 'लॉग इन करें' : 'Login'}
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}


export default function App() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('civic_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const [selectedRole, setSelectedRole] = useState(null);
  const [universityUser, setUniversityUser] = useState(() => {
    try {
      const activeUser = authService.getCurrentUser();
      if (activeUser && activeUser.role === 'UNIVERSITY') return activeUser;
      const saved = sessionStorage.getItem('civic_univ_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [industryUser, setIndustryUser] = useState(() => {
    try {
      const activeUser = authService.getCurrentUser();
      if (activeUser && activeUser.role === 'INDUSTRY') return activeUser;
      const saved = sessionStorage.getItem('civic_industry_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('civic_lang', lang);
      // Clean up legacy mock local storage keys to ensure zero mock data
      const legacyKeys = [
        'civic_problems_repository',
        'civic_assignments_repository',
        'civic_solutions_proposals',
        'civic_collaborations_repository',
        'civic_funding_approvals',
        'civic_working_teams',
        'civic_industry_teams'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    } catch {}
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'hi' : 'en');
  };

  const handleSelectRole = (roleData) => {
    if (roleData.id === 'university') {
      navigate('/university/dashboard');
      return;
    }
    if (roleData.id === 'citizen') {
      navigate('/citizen');
      return;
    }
    if (roleData.id === 'industry') {
      navigate('/industry/dashboard');
      return;
    }
    if (roleData.id === 'admin') {
      navigate('/admin');
      return;
    }
    setSelectedRole(roleData);
  };

  const handleEnterModule = (role) => {
    setSelectedRole(null);
    if (role.id === 'university') navigate('/university/dashboard');
    else if (role.id === 'industry') navigate('/industry/dashboard');
    else navigate(`/${role.id}`);
  };

  const handleFooterRoleSelect = (roleId) => {
    if (roleId === 'university') navigate('/university/dashboard');
    else if (roleId === 'industry') navigate('/industry/dashboard');
    else navigate(`/${roleId}`);
  };

  const handleUniversityLoginSuccess = (userData) => {
    const userToSet = userData || authService.getCurrentUser();
    setUniversityUser(userToSet);
    try {
      sessionStorage.setItem('civic_univ_user', JSON.stringify(userToSet));
    } catch {}
    navigate('/university/dashboard');
  };

  const handleUniversityLogout = () => {
    authService.logout();
    setUniversityUser(null);
    navigate('/');
  };

  const handleIndustryLoginSuccess = (userData) => {
    const userToSet = userData || authService.getCurrentUser();
    setIndustryUser(userToSet);
    try {
      sessionStorage.setItem('civic_industry_user', JSON.stringify(userToSet));
    } catch {}
    navigate('/industry/dashboard');
  };

  const handleIndustryLogout = () => {
    authService.logout();
    setIndustryUser(null);
    navigate('/');
  };

  const handleBackToLanding = () => {
    setSelectedRole(null);
    navigate('/');
  };

  return (
    <Routes>
      {/* Home / Personas Landing Page */}
      <Route
        path="/"
        element={
          <LandingPage
            lang={lang}
            onToggleLang={toggleLanguage}
            onFooterRoleSelect={handleFooterRoleSelect}
            onCitizenLogin={(u) => navigate('/citizen')}
            onUniversityLogin={(u) => handleUniversityLoginSuccess(u)}
            onIndustryLogin={(u) => handleIndustryLoginSuccess(u)}
            onAdminLogin={(u) => navigate('/admin')}
          />
        }
      />

      {/* University Portal Routes */}
      <Route
        path="/university"
        element={<Navigate to="/university/dashboard" replace />}
      />

      <Route
        path="/university/dashboard"
        element={
          <UniversityDashboard
            user={universityUser}
            onLogout={handleUniversityLogout}
            onBackToLanding={handleBackToLanding}
          />
        }
      />

      <Route
        path="/university/problems"
        element={
          <UniversityProblems
            user={universityUser}
            onBackToDashboard={() => navigate('/university/dashboard')}
            onBackToLanding={handleBackToLanding}
          />
        }
      />

      <Route
        path="/university/take-challenge/:id"
        element={
          <UniversityTeamForm
            user={universityUser}
            onBackToProblems={() => navigate('/university/problems')}
            onBackToDashboard={() => navigate('/university/dashboard')}
            onBackToLanding={handleBackToLanding}
          />
        }
      />

      <Route
        path="/university/collaborate/:id"
        element={
          <IndustryCollaborate
            user={universityUser}
            userRole="university"
            onBackToProblems={() => navigate('/university/problems')}
            onBackToDashboard={() => navigate('/university/dashboard')}
          />
        }
      />

      {/* Citizen Portal Route */}
      <Route
        path="/citizen"
        element={
          <CitizenPortal
            lang={lang}
            onToggleLang={toggleLanguage}
          />
        }
      />

      {/* Industry Portal Routes */}
      <Route
        path="/industry"
        element={<Navigate to="/industry/dashboard" replace />}
      />

      <Route
        path="/industry/dashboard"
        element={
          <IndustryDashboard
            user={industryUser}
            onLogout={handleIndustryLogout}
            onBackToLanding={handleBackToLanding}
          />
        }
      />

      <Route
        path="/industry/problems"
        element={
          <IndustryProblems
            user={industryUser}
            onBackToDashboard={() => navigate('/industry/dashboard')}
            onBackToLanding={handleBackToLanding}
          />
        }
      />

      <Route
        path="/industry/take-challenge/:id"
        element={
          <IndustryTeamForm
            user={industryUser}
            onBackToProblems={() => navigate('/industry/problems')}
            onBackToDashboard={() => navigate('/industry/dashboard')}
          />
        }
      />

      <Route
        path="/industry/collaborate/:id"
        element={
          <IndustryCollaborate
            user={industryUser}
            onBackToProblems={() => navigate('/industry/problems')}
            onBackToDashboard={() => navigate('/industry/dashboard')}
          />
        }
      />

      {/* Admin Portal Route */}
      <Route
        path="/admin"
        element={
          <AdminPortal
            lang={lang}
            onToggleLang={toggleLanguage}
          />
        }
      />

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
