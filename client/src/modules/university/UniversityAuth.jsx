import React, { useState, useEffect } from 'react';
import './university.css';
import { JharkhandCrest, ChevronRight, CloseIcon } from '../../components/Icons';
import { authService } from '../../services/authService';

export const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (National Capital Territory of Delhi)',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

export const EXPERTISE_OPTIONS = [
  'Education',
  'Healthcare',
  'Agriculture',
  'Water Management',
  'Sanitation',
  'Environment',
  'Rural Livelihoods',
  'Accessibility',
  'Urban Infrastructure',
  'Public Service Delivery',
  'Waste Management',
  'Unknown/Other'
];

export const CAPABILITIES_CONFIG = {
  'Technical Support': [
    'Software Development',
    'AI/ML Solutions',
    'Prototype Development',
    'Data Analysis',
    'Technical Consultation'
  ],
  'Research Support': [
    'Research & Development',
    'Field Studies',
    'Testing & Validation',
    'Laboratory Facilities'
  ],
  'Human Resources': [
    'Faculty Expertise',
    'Student Projects',
    'Student Volunteers',
    'Researchers'
  ],
  'Infrastructure': [
    'Laboratory',
    'Equipment',
    'Fabrication/Workshop Facilities',
    'Computing Resources'
  ],
  'Training & Community Support': [
    'Training',
    'Workshops',
    'Awareness Programs',
    'Community Engagement'
  ],
  'Implementation': [
    'Pilot Testing',
    'Field Implementation',
    'Monitoring & Evaluation'
  ]
};

// Initial default registered institutional accounts
const SEED_ACCOUNTS = [
  {
    officialEmail: 'civic.lab@cuj.ac.in',
    password: 'admin123',
    universityName: 'Central University of Jharkhand (CUJ), Ranchi',
    representativeName: 'Prof. Ramesh K. Soren',
    designation: 'Director of Civic Innovation Lab',
    city: 'Ranchi',
    state: 'Jharkhand',
    phoneNumber: '+91 94311 00101',
    areasOfExpertise: ['Water Management & Drainage', 'Renewable Energy & Solar Microgrids', 'Public Healthcare & Disease Sensors'],
    capabilitiesCount: 18
  },
  {
    officialEmail: 'bit.sindri@jharkhand.edu.in',
    password: 'admin123',
    universityName: 'Birsa Institute of Technology (BIT Sindri)',
    representativeName: 'Dr. Alok Verma',
    designation: 'Dean of Research & Innovation',
    city: 'Dhanbad',
    state: 'Jharkhand',
    phoneNumber: '+91 94311 87290',
    areasOfExpertise: ['Water Management & Drainage', 'Roads, Potholes & Bridges', 'Solid Waste & Sanitation'],
    capabilitiesCount: 14
  },
  {
    officialEmail: 'iit.ism@jharkhand.edu.in',
    password: 'admin123',
    universityName: 'Indian Institute of Technology (IIT-ISM), Dhanbad',
    representativeName: 'Prof. Debabrata Roy',
    designation: 'Chair, Center for AI & Transportation',
    city: 'Dhanbad',
    state: 'Jharkhand',
    phoneNumber: '+91 94340 55102',
    areasOfExpertise: ['Roads, Potholes & Bridges', 'Urban Traffic & Smart Mobility', 'Public Healthcare & Disease Sensors'],
    capabilitiesCount: 22
  },
  {
    officialEmail: 'bau.kanke@jharkhand.edu.in',
    password: 'admin123',
    universityName: 'Birsa Agricultural University (BAU), Kanke',
    representativeName: 'Dr. Devendra Mahto',
    designation: 'Principal Scientist, Agri-Engineering',
    city: 'Ranchi',
    state: 'Jharkhand',
    phoneNumber: '+91 94313 77219',
    areasOfExpertise: ['Agriculture & Cold Storage', 'Renewable Energy & Solar Microgrids'],
    capabilitiesCount: 16
  }
];

function getStoredAccounts() {
  try {
    const raw = localStorage.getItem('civic_university_accounts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read accounts from localStorage', e);
  }
  return SEED_ACCOUNTS;
}

function saveStoredAccounts(accounts) {
  try {
    localStorage.setItem('civic_university_accounts', JSON.stringify(accounts));
  } catch (e) {
    console.warn('Could not save accounts to localStorage', e);
  }
}

export const UniversityAuth = ({ onLoginSuccess, onBackToLanding }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [signupStep, setSignupStep] = useState(1); // 1 | 2 | 3
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupNotice, setSignupNotice] = useState('');
  
  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Accounts store
  const [accounts, setAccounts] = useState(getStoredAccounts());

  useEffect(() => {
    saveStoredAccounts(accounts);
  }, [accounts]);

  // Signup State
  const [formData, setFormData] = useState({
    universityName: '',
    city: '',
    state: 'Jharkhand',
    representativeName: '',
    designation: '',
    officialEmail: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    areasOfExpertise: [],
    capabilities: {
      'Technical Support': [],
      'Research Support': [],
      'Human Resources': [],
      'Infrastructure': [],
      'Training & Community Support': [],
      'Implementation': []
    }
  });

  const [formErrors, setFormErrors] = useState({});

  // Handlers for Area of Expertise
  const handleExpertiseToggle = (item) => {
    setFormData(prev => {
      const exists = prev.areasOfExpertise.includes(item);
      const updated = exists
        ? prev.areasOfExpertise.filter(e => e !== item)
        : [...prev.areasOfExpertise, item];
      return { ...prev, areasOfExpertise: updated };
    });
  };

  const handleSelectAllExpertise = () => {
    setFormData(prev => ({
      ...prev,
      areasOfExpertise: [...EXPERTISE_OPTIONS]
    }));
  };

  const handleClearAllExpertise = () => {
    setFormData(prev => ({
      ...prev,
      areasOfExpertise: []
    }));
  };

  // Handlers for Capabilities
  const handleCapabilityToggle = (category, item) => {
    setFormData(prev => {
      const catList = prev.capabilities[category] || [];
      const exists = catList.includes(item);
      const updatedCat = exists
        ? catList.filter(i => i !== item)
        : [...catList, item];
      return {
        ...prev,
        capabilities: {
          ...prev.capabilities,
          [category]: updatedCat
        }
      };
    });
  };

  const handleSelectAllCategoryCapabilities = (category) => {
    setFormData(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [category]: [...(CAPABILITIES_CONFIG[category] || [])]
      }
    }));
  };

  const handleClearCategoryCapabilities = (category) => {
    setFormData(prev => ({
      ...prev,
      capabilities: {
        ...prev.capabilities,
        [category]: []
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errors = {};
    if (!formData.universityName.trim()) errors.universityName = 'University / Institution Name is required';
    if (!formData.state.trim()) errors.state = 'State / Union Territory is required';
    if (!formData.city.trim()) errors.city = 'City / District is required';
    if (!formData.representativeName.trim()) errors.representativeName = 'Authorized Representative Name is required';
    if (!formData.designation.trim()) errors.designation = 'Designation / Role is required';
    
    if (!formData.officialEmail.trim()) {
      errors.officialEmail = 'Official Institutional Email is required';
    } else if (!formData.officialEmail.includes('@') || !formData.officialEmail.includes('.')) {
      errors.officialEmail = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Contact Phone Number is required';
    }

    if (!formData.password) {
      errors.password = 'Portal Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check if email already registered
    const currentAccounts = getStoredAccounts();
    const existing = currentAccounts.find(a => a.officialEmail.toLowerCase() === formData.officialEmail.trim().toLowerCase());
    if (existing) {
      errors.officialEmail = 'An account with this official email already exists. Please log in.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step Navigation Handlers
  const handleGoToStep2 = () => {
    if (validateStep1()) {
      setFormErrors({});
      setSignupStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToStep3 = () => {
    setSignupStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackStep = (targetStep) => {
    setSignupStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Strict Login Submit Handler with Account Verification
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const identifier = loginIdentifier.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!identifier || !password) {
      setLoginError('Please enter both your Official Email / Username and Password.');
      return;
    }

    // Call authService.login
    const result = await authService.login({
      email: identifier,
      password: password,
      role: 'UNIVERSITY'
    });

    if (result.success) {
      onLoginSuccess(result.user);
      return;
    }

    // Check if account exists locally
    const currentAccounts = getStoredAccounts();
    const foundAccount = currentAccounts.find(acc => 
      acc.officialEmail.toLowerCase() === identifier ||
      acc.universityName.toLowerCase().includes(identifier) ||
      (acc.phoneNumber && acc.phoneNumber.replace(/\s+/g, '') === identifier.replace(/\s+/g, ''))
    );

    if (!foundAccount) {
      // Account does not exist -> inform user and switch to signup
      setLoginError('No such account exists! Please sign up first to register your university institution.');
      setSignupNotice(`No account found for "${loginIdentifier}". Please fill out this registration form to create your university account.`);
      
      // Pre-fill email in signup form
      if (identifier.includes('@')) {
        setFormData(prev => ({ ...prev, officialEmail: loginIdentifier.trim() }));
      }
      
      // Automatically switch to signup tab after a brief pause so user sees notice
      setTimeout(() => {
        setAuthMode('signup');
        setSignupStep(1);
      }, 900);
      return;
    }

    // Verify Password
    if (foundAccount.password !== password) {
      setLoginError('Invalid password. Please enter the correct password for this university account.');
      return;
    }

    // Success login
    authService.setSession(`mock-jwt-${foundAccount.officialEmail}`, foundAccount);
    onLoginSuccess(foundAccount);
  };

  // Final Signup Submit Handler (Step 3)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) {
      alert('Please check the required fields in Step 1.');
      setSignupStep(1);
      return;
    }

    const currentAccounts = getStoredAccounts();
    const existing = currentAccounts.find(a => a.officialEmail.toLowerCase() === formData.officialEmail.trim().toLowerCase());
    if (existing) {
      alert('An account with this official email already exists. Please log in.');
      setAuthMode('login');
      setLoginIdentifier(formData.officialEmail);
      return;
    }

    // Success signup -> save account & enter dashboard
    const totalCapabilitiesCount = Object.values(formData.capabilities).reduce(
      (acc, list) => acc + list.length,
      0
    );

    const newAccount = {
      ...formData,
      officialEmail: formData.officialEmail.trim(),
      capabilitiesCount: totalCapabilitiesCount,
      role: 'UNIVERSITY'
    };

    const registerResult = await authService.register(newAccount);
    const updatedAccounts = [newAccount, ...currentAccounts];
    setAccounts(updatedAccounts);
    saveStoredAccounts(updatedAccounts);

    alert(`🎉 University Account successfully registered for ${formData.universityName}! Logging you into the portal.`);

    onLoginSuccess(registerResult.success ? registerResult.user : newAccount);
  };

  // Forgot Password Submit
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      alert('Please enter your registered official email address.');
      return;
    }
    setForgotSubmitted(true);
  };

  const totalSelectedCapabilities = Object.values(formData.capabilities).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="univ-auth-wrapper">
      <div className={`univ-auth-card ${authMode === 'signup' ? 'signup-mode' : ''}`}>
        {/* Card Header */}
        <div className="univ-auth-header">
          <div className="univ-auth-emblem">
            <JharkhandCrest size={18} />
            <span>Government of Jharkhand • University Gateway</span>
          </div>

          <h2 className="univ-auth-title">
            {authMode === 'login' && 'University Portal Login'}
            {authMode === 'signup' && 'University Registration'}
            {authMode === 'forgot' && 'Reset University Account Password'}
          </h2>

          <p className="univ-auth-subtitle">
            {authMode === 'login' && 'Enter your institutional credentials to manage problem statements & research projects.'}
            {authMode === 'signup' && 'Register your institution, academic areas of expertise, and technical capabilities.'}
            {authMode === 'forgot' && 'Enter your registered official email to receive a password recovery link.'}
          </p>

          <button
            type="button"
            onClick={onBackToLanding}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Return to Civic Connect Portals"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Card Body */}
        <div className="univ-auth-body">
          {/* Mode Switcher Tabs */}
          {authMode !== 'forgot' && (
            <div style={{ display: 'flex', background: '#F0FDF4', border: '1.5px solid rgba(3, 109, 51, 0.2)', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setLoginError(''); }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: authMode === 'login' ? '#036D33' : 'transparent',
                  color: authMode === 'login' ? '#FFFFFF' : '#024D24',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'login' ? '0 2px 8px rgba(3, 109, 51, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🔐 Institutional Login
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setLoginError(''); setSignupNotice(''); setSignupStep(1); }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: authMode === 'signup' ? '#036D33' : 'transparent',
                  color: authMode === 'signup' ? '#FFFFFF' : '#024D24',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'signup' ? '0 2px 8px rgba(3, 109, 51, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                📝 University Sign Up
              </button>
            </div>
          )}

          {/* =========================================================
              VIEW 1: LOGIN FORM
             ========================================================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              
              {/* Account Existence Error / Notice */}
              {loginError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #F87171',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  color: '#991B1B',
                  fontSize: '0.86rem',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  boxShadow: '0 2px 6px rgba(248, 113, 113, 0.15)'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <div>
                    <strong>Account Error:</strong> {loginError}
                  </div>
                </div>
              )}

              <div className="univ-form-group">
                <label className="univ-form-label">
                  <span>Official Email or Registered Username <span className="required">*</span></span>
                </label>
                <div className="univ-input-wrapper">
                  <input
                    type="text"
                    className="univ-form-input"
                    placeholder="e.g., bit.sindri@jharkhand.edu.in or civic.lab@cuj.ac.in"
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    required
                  />
                </div>
              </div>

              <div className="univ-form-group">
                <label className="univ-form-label">
                  <span>Portal Password <span className="required">*</span></span>
                </label>
                <div className="univ-input-wrapper">
                  <input
                    type="password"
                    className="univ-form-input"
                    placeholder="Enter your university portal password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    required
                  />
                </div>
              </div>

              <div className="univ-auth-meta-row">
                <button
                  type="button"
                  className="univ-forgot-link"
                  onClick={() => {
                    setAuthMode('forgot');
                    setForgotSubmitted(false);
                    setLoginError('');
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <button type="submit" className="univ-btn-primary">
                <span>Login to University Portal</span>
                <ChevronRight size={18} />
              </button>

              {/* Seed Demo Account Helper Box */}
              <div style={{ marginTop: '18px', background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', fontSize: '0.8rem', color: '#4B5563' }}>
                <strong style={{ color: '#024D24', display: 'block', marginBottom: '4px' }}>🏛️ Verified Institutional Accounts:</strong>
                <div style={{ margin: '2px 0' }}>• Agri Institute: <code>agri.university@test.civicconnect.in</code> | Pass: <code>Uni@12345</code></div>
                <div style={{ margin: '2px 0' }}>• Health Institute: <code>health.university@test.civicconnect.in</code> | Pass: <code>Uni@12345</code></div>
                <div style={{ margin: '2px 0', opacity: 0.85 }}>• CUJ Ranchi: <code>civic.lab@cuj.ac.in</code> | Pass: <code>admin123</code></div>
              </div>

              <div className="univ-toggle-row">
                <span>Don't have a registered institutional account?</span>
                <button
                  type="button"
                  className="univ-toggle-btn"
                  onClick={() => {
                    setAuthMode('signup');
                    setLoginError('');
                    setSignupNotice('');
                    setSignupStep(1);
                  }}
                >
                  Sign Up First
                </button>
              </div>
            </form>
          )}

          {/* =========================================================
              VIEW 2: FORGOT PASSWORD
             ========================================================= */}
          {authMode === 'forgot' && (
            <div>
              {!forgotSubmitted ? (
                <form onSubmit={handleForgotSubmit}>
                  <div className="univ-form-group">
                    <label className="univ-form-label">
                      Registered Official Email Address <span className="required">*</span>
                    </label>
                    <div className="univ-input-wrapper">
                      <input
                        type="email"
                        className="univ-form-input"
                        placeholder="e.g., registrar@bit.sindri.ac.in"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="univ-btn-primary">
                    <span>Send Password Recovery Link</span>
                    <ChevronRight size={18} />
                  </button>

                  <div className="univ-toggle-row" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="univ-toggle-btn"
                      onClick={() => setAuthMode('login')}
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#E8F5EC',
                    color: '#036D33',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '1.6rem'
                  }}>
                    ✓
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#024D24', marginBottom: '8px' }}>
                    Recovery Link Sent
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '20px' }}>
                    If <strong>{forgotEmail}</strong> is registered in the state database, a secure password reset link has been dispatched.
                  </p>
                  <button
                    type="button"
                    className="univ-btn-primary"
                    onClick={() => {
                      setAuthMode('login');
                      setForgotSubmitted(false);
                    }}
                  >
                    Return to Login
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =========================================================
              VIEW 3: STEP-BY-STEP SIGNUP REGISTRATION WIZARD (1 -> 2 -> 3)
             ========================================================= */}
          {authMode === 'signup' && (
            <div>
              {/* Notice if redirected from non-existent login */}
              {signupNotice && (
                <div style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  color: '#92400E',
                  fontSize: '0.86rem',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                  <div>
                    <strong>Sign-Up Required:</strong> {signupNotice}
                  </div>
                </div>
              )}

              {/* Step Progress Tracker & Indicators */}
              <div style={{
                background: '#F9FAFB',
                border: '1.5px solid #E5E7EB',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#024D24' }}>
                    Step {signupStep} of 3:{' '}
                    <span style={{ color: '#036D33', fontWeight: 700 }}>
                      {signupStep === 1 && 'Institution Profile & Location'}
                      {signupStep === 2 && 'Academic & Research Areas of Expertise'}
                      {signupStep === 3 && 'Institutional Capabilities & Facilities'}
                    </span>
                  </div>
                  <span style={{
                    background: '#036D33',
                    color: '#FFFFFF',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    {signupStep === 1 ? '33% Completed' : signupStep === 2 ? '66% Completed' : '100% Final Step'}
                  </span>
                </div>

                {/* Progress bar track */}
                <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{
                    width: `${(signupStep / 3) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #059669 0%, #024D24 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Step tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleBackStep(1)}
                    style={{
                      border: 'none',
                      background: signupStep === 1 ? '#E8F5EC' : '#FFFFFF',
                      borderBottom: signupStep === 1 ? '3px solid #036D33' : '1px solid #E5E7EB',
                      padding: '8px 6px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: signupStep === 1 ? 800 : 600,
                      color: signupStep === 1 ? '#024D24' : signupStep > 1 ? '#059669' : '#6B7280',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {signupStep > 1 ? '✓ ' : ''}1. Profile & Location
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) handleBackStep(2);
                    }}
                    style={{
                      border: 'none',
                      background: signupStep === 2 ? '#E8F5EC' : '#FFFFFF',
                      borderBottom: signupStep === 2 ? '3px solid #036D33' : '1px solid #E5E7EB',
                      padding: '8px 6px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: signupStep === 2 ? 800 : 600,
                      color: signupStep === 2 ? '#024D24' : signupStep > 2 ? '#059669' : '#6B7280',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {signupStep > 2 ? '✓ ' : ''}2. Academic Expertise
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setSignupStep(3);
                    }}
                    style={{
                      border: 'none',
                      background: signupStep === 3 ? '#E8F5EC' : '#FFFFFF',
                      borderBottom: signupStep === 3 ? '3px solid #036D33' : '1px solid #E5E7EB',
                      padding: '8px 6px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: signupStep === 3 ? 800 : 600,
                      color: signupStep === 3 ? '#024D24' : '#6B7280',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    3. Capabilities & Facilities
                  </button>
                </div>
              </div>

              {/* =========================================================
                  STEP 1: INSTITUTION PROFILE & LOCATION
                 ========================================================= */}
              {signupStep === 1 && (
                <div className="univ-form-section" style={{ border: 'none', padding: 0 }}>
                  <div className="univ-section-title" style={{ marginBottom: '18px' }}>
                    <span className="univ-section-num">1</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#024D24' }}>Institution Profile & Location</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#4B5563' }}>Enter official institutional identity and representative contact details</p>
                    </div>
                  </div>

                  <div className="univ-form-group">
                    <label className="univ-form-label">
                      <span>University / Institution Name <span className="required">*</span></span>
                    </label>
                    <input
                      type="text"
                      name="universityName"
                      value={formData.universityName}
                      onChange={handleInputChange}
                      placeholder="e.g., Central University of Jharkhand / BIT Sindri / Ranchi University"
                      className={`univ-form-input ${formErrors.universityName ? 'input-error' : ''}`}
                      required
                    />
                    {formErrors.universityName && <span className="error-text">{formErrors.universityName}</span>}
                  </div>

                  <div className="univ-form-grid-2">
                    {/* State Dropdown Menu */}
                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>State / Union Territory <span className="required">*</span></span>
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={`univ-form-select ${formErrors.state ? 'input-error' : ''}`}
                        required
                      >
                        <option value="">-- Select State / UT --</option>
                        {INDIAN_STATES_AND_UTS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      {formErrors.state && <span className="error-text">{formErrors.state}</span>}
                    </div>

                    {/* City Manual Input */}
                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>City / District (Manual Entry) <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g., Ranchi / Jamshedpur / Dhanbad"
                        className={`univ-form-input ${formErrors.city ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.city && <span className="error-text">{formErrors.city}</span>}
                    </div>
                  </div>

                  <div className="univ-form-grid-2">
                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Authorized Representative Name <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        name="representativeName"
                        value={formData.representativeName}
                        onChange={handleInputChange}
                        placeholder="e.g., Dr. Ramesh Soren"
                        className={`univ-form-input ${formErrors.representativeName ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.representativeName && <span className="error-text">{formErrors.representativeName}</span>}
                    </div>

                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Designation / Role <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        placeholder="e.g., Dean of Research / Registrar"
                        className={`univ-form-input ${formErrors.designation ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.designation && <span className="error-text">{formErrors.designation}</span>}
                    </div>
                  </div>

                  <div className="univ-form-grid-2">
                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Official Institutional Email <span className="required">*</span></span>
                      </label>
                      <input
                        type="email"
                        name="officialEmail"
                        value={formData.officialEmail}
                        onChange={handleInputChange}
                        placeholder="civic.lab@cuj.ac.in"
                        className={`univ-form-input ${formErrors.officialEmail ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.officialEmail && <span className="error-text">{formErrors.officialEmail}</span>}
                    </div>

                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Contact Phone Number <span className="required">*</span></span>
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="e.g., +91 94311 00000"
                        className={`univ-form-input ${formErrors.phoneNumber ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.phoneNumber && <span className="error-text">{formErrors.phoneNumber}</span>}
                    </div>
                  </div>

                  <div className="univ-form-grid-2">
                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Create Portal Password <span className="required">*</span></span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Minimum 6 characters"
                        className={`univ-form-input ${formErrors.password ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                    </div>

                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Confirm Password <span className="required">*</span></span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Re-enter password"
                        className={`univ-form-input ${formErrors.confirmPassword ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.confirmPassword && <span className="error-text">{formErrors.confirmPassword}</span>}
                    </div>
                  </div>

                  {/* Step 1 Action Button */}
                  <div style={{ marginTop: '24px' }}>
                    <button
                      type="button"
                      className="univ-btn-primary"
                      onClick={handleGoToStep2}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>Next: Academic Expertise (Step 2/3)</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================
                  STEP 2: ACADEMIC & RESEARCH AREAS OF EXPERTISE
                 ========================================================= */}
              {signupStep === 2 && (
                <div className="univ-form-section" style={{ border: 'none', padding: 0 }}>
                  <div className="univ-section-title" style={{ marginBottom: '14px' }}>
                    <span className="univ-section-num">2</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#024D24' }}>Academic & Research Areas of Expertise</h3>
                      <p style={{ margin: '3px 0 0', fontSize: '0.86rem', color: '#4B5563' }}>
                        Select the domains where your university or faculty can contribute to Jharkhand's civic problem statements:
                      </p>
                    </div>
                  </div>

                  {/* Quick Select Tooling */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#024D24' }}>
                      Selected: <strong>{formData.areasOfExpertise.length} of {EXPERTISE_OPTIONS.length} domains</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSelectAllExpertise}
                        style={{
                          background: '#E8F5EC',
                          border: '1px solid #A7F3D0',
                          color: '#024D24',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllExpertise}
                        style={{
                          background: '#F3F4F6',
                          border: '1px solid #D1D5DB',
                          color: '#4B5563',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Clear All
                      </button>
                    </div>
                  </div>

                  {/* Expertise Pill Checkbox Grid */}
                  <div className="expertise-grid" style={{ marginBottom: '24px' }}>
                    {EXPERTISE_OPTIONS.map((item) => {
                      const isChecked = formData.areasOfExpertise.includes(item);
                      return (
                        <label key={item} className={`checkbox-pill-card ${isChecked ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleExpertiseToggle(item)}
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Step 2 Action Buttons: Back & Next */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '12px', marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={() => handleBackStep(1)}
                      style={{
                        background: '#F3F4F6',
                        color: '#374151',
                        border: '1.5px solid #D1D5DB',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      ← Back to Profile
                    </button>
                    <button
                      type="button"
                      className="univ-btn-primary"
                      onClick={handleGoToStep3}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>Next: Capabilities & Facilities (Step 3/3)</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================
                  STEP 3: INSTITUTIONAL CAPABILITIES & FACILITIES
                 ========================================================= */}
              {signupStep === 3 && (
                <form onSubmit={handleSignupSubmit} className="univ-form-section" style={{ border: 'none', padding: 0 }}>
                  <div className="univ-section-title" style={{ marginBottom: '14px' }}>
                    <span className="univ-section-num">3</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#024D24' }}>Institutional Capabilities & Facilities</h3>
                      <p style={{ margin: '3px 0 0', fontSize: '0.86rem', color: '#4B5563' }}>
                        Select specific technical, research, infrastructure, and human capabilities available for state collaboration:
                      </p>
                    </div>
                  </div>

                  {/* Overview Chip */}
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.84rem', color: '#065F46', fontWeight: 700 }}>
                      🏛️ Institution: <strong>{formData.universityName || 'University'}</strong> ({formData.city || 'Jharkhand'})
                    </span>
                    <span style={{
                      background: '#036D33',
                      color: '#FFFFFF',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}>
                      {totalSelectedCapabilities} Capabilities Selected
                    </span>
                  </div>

                  <div className="capabilities-container">
                    {Object.entries(CAPABILITIES_CONFIG).map(([category, items]) => {
                      const selectedCount = (formData.capabilities[category] || []).length;
                      return (
                        <div key={category} className="capability-category-box">
                          <div className="capability-category-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{category}</span>
                              {selectedCount > 0 && (
                                <span style={{
                                  background: '#036D33',
                                  color: '#FFFFFF',
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  borderRadius: '8px',
                                  fontWeight: 700
                                }}>
                                  {selectedCount}/{items.length}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleSelectAllCategoryCapabilities(category)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#036D33',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  textDecoration: 'underline'
                                }}
                              >
                                All
                              </button>
                              <span style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>|</span>
                              <button
                                type="button"
                                onClick={() => handleClearCategoryCapabilities(category)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#6B7280',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                          <div className="capability-items-grid">
                            {items.map((subItem) => {
                              const isChecked = (formData.capabilities[category] || []).includes(subItem);
                              return (
                                <label key={subItem} className="capability-check-item">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleCapabilityToggle(category, subItem)}
                                  />
                                  <span>{subItem}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 3 Action Buttons: Back & Complete Registration */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '12px', marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={() => handleBackStep(2)}
                      style={{
                        background: '#F3F4F6',
                        color: '#374151',
                        border: '1.5px solid #D1D5DB',
                        borderRadius: '10px',
                        padding: '12px 18px',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                      }}
                    >
                      ← Back to Expertise
                    </button>
                    <button
                      type="submit"
                      className="univ-btn-primary"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>Complete Registration & Access Dashboard</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </form>
              )}

              {/* Toggle to Login */}
              <div className="univ-toggle-row" style={{ marginTop: '20px' }}>
                <span>Already have an institutional account?</span>
                <button
                  type="button"
                  className="univ-toggle-btn"
                  onClick={() => {
                    setAuthMode('login');
                    setSignupNotice('');
                  }}
                >
                  Log In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

