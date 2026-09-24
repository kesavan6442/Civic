import React, { useState, useEffect } from 'react';
import '../university/university.css';
import { JharkhandCrest, ChevronRight, CloseIcon } from '../../components/Icons';
import { INDIAN_STATES_AND_UTS } from '../university/UniversityAuth';
import { authService } from '../../services/authService';

export const INDUSTRY_EXPERTISE_OPTIONS = [
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

// Seed Registered Industry Accounts
const SEED_INDUSTRY_ACCOUNTS = [
  {
    officialEmail: 'csr@tatasteel.com',
    password: 'admin123',
    companyName: 'Tata Steel Limited (CSR & R&D Division)',
    representativeName: 'Sanjay Kumar Choudhary',
    designation: 'Vice President - Corporate Sustainability & PPP',
    city: 'Jamshedpur',
    state: 'Jharkhand',
    phoneNumber: '+91 94311 55220',
    industryExpertise: ['Water Management', 'Environment', 'Healthcare', 'Urban Infrastructure'],
    fundingCapacity: '₹5 Crore+'
  },
  {
    officialEmail: 'innovation@jindal.com',
    password: 'admin123',
    companyName: 'Jindal Steel & Power Ltd (Innovation Cell)',
    representativeName: 'Pooja Agarwal',
    designation: 'Head of Civic Innovation & CSR',
    city: 'Ranchi',
    state: 'Jharkhand',
    phoneNumber: '+91 98352 77110',
    industryExpertise: ['Energy', 'Rural Livelihoods', 'Agriculture'],
    fundingCapacity: '₹2.5 Crore+'
  }
];

function getStoredIndustryAccounts() {
  try {
    const raw = localStorage.getItem('civic_industry_accounts');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read industry accounts from localStorage', e);
  }
  return SEED_INDUSTRY_ACCOUNTS;
}

function saveStoredIndustryAccounts(accounts) {
  try {
    localStorage.setItem('civic_industry_accounts', JSON.stringify(accounts));
  } catch (e) {
    console.warn('Could not save industry accounts to localStorage', e);
  }
}

export const IndustryAuth = ({ onLoginSuccess, onBackToLanding }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [signupStep, setSignupStep] = useState(1); // 1 | 2
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupNotice, setSignupNotice] = useState('');
  
  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Accounts store
  const [accounts, setAccounts] = useState(getStoredIndustryAccounts());

  useEffect(() => {
    saveStoredIndustryAccounts(accounts);
  }, [accounts]);

  // Signup State
  const [formData, setFormData] = useState({
    companyName: '',
    city: '',
    state: 'Jharkhand',
    representativeName: '',
    designation: '',
    officialEmail: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    industryExpertise: []
  });

  const [formErrors, setFormErrors] = useState({});

  // Handlers for Industry Expertise Checkboxes
  const handleExpertiseToggle = (item) => {
    setFormData(prev => {
      const exists = prev.industryExpertise.includes(item);
      const updated = exists
        ? prev.industryExpertise.filter(e => e !== item)
        : [...prev.industryExpertise, item];
      return { ...prev, industryExpertise: updated };
    });
    if (formErrors.industryExpertise) {
      setFormErrors(prev => ({ ...prev, industryExpertise: '' }));
    }
  };

  const handleSelectAllExpertise = () => {
    setFormData(prev => ({
      ...prev,
      industryExpertise: [...INDUSTRY_EXPERTISE_OPTIONS]
    }));
    if (formErrors.industryExpertise) {
      setFormErrors(prev => ({ ...prev, industryExpertise: '' }));
    }
  };

  const handleClearAllExpertise = () => {
    setFormData(prev => ({
      ...prev,
      industryExpertise: []
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
    if (!formData.companyName.trim()) errors.companyName = 'Company / Enterprise Full Name is required';
    if (!formData.state.trim()) errors.state = 'State / Union Territory is required';
    if (!formData.city.trim()) errors.city = 'City / District is required';
    if (!formData.representativeName.trim()) errors.representativeName = 'Authorized Representative Full Name is required';
    if (!formData.designation.trim()) errors.designation = 'Designation / Role in Company is required';
    
    if (!formData.officialEmail.trim()) {
      errors.officialEmail = 'Official Corporate Email is required';
    } else if (!formData.officialEmail.includes('@') || !formData.officialEmail.includes('.')) {
      errors.officialEmail = 'Please enter a valid corporate email address';
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

    // Check if email already registered in industry
    const currentAccounts = getStoredIndustryAccounts();
    const existing = currentAccounts.find(a => a.officialEmail.toLowerCase() === formData.officialEmail.trim().toLowerCase());
    if (existing) {
      errors.officialEmail = 'An industry account with this official email already exists. Please log in.';
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

  const handleBackStep1 = () => {
    setSignupStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Login Submit Handler (Verifies against Industry Accounts Only)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const identifier = loginIdentifier.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!identifier || !password) {
      setLoginError('Please enter both your Official Corporate Email and Password.');
      return;
    }

    // Call authService.login
    const result = await authService.login({
      email: identifier,
      password: password,
      role: 'INDUSTRY'
    });

    if (result.success) {
      onLoginSuccess(result.user);
      return;
    }

    const currentAccounts = getStoredIndustryAccounts();
    const foundAccount = currentAccounts.find(acc => 
      acc.officialEmail.toLowerCase() === identifier ||
      acc.companyName.toLowerCase().includes(identifier) ||
      (acc.phoneNumber && acc.phoneNumber.replace(/\s+/g, '') === identifier.replace(/\s+/g, ''))
    );

    if (!foundAccount) {
      setLoginError('No such industry account exists! Please sign up first to register your company / enterprise.');
      setSignupNotice(`No industry account found for "${loginIdentifier}". Please complete this registration form to create your corporate account.`);
      
      if (identifier.includes('@')) {
        setFormData(prev => ({ ...prev, officialEmail: loginIdentifier.trim() }));
      }
      
      setTimeout(() => {
        setAuthMode('signup');
        setSignupStep(1);
      }, 900);
      return;
    }

    // Verify Password
    if (foundAccount.password !== password) {
      setLoginError('Invalid password. Please enter the correct password for this corporate account.');
      return;
    }

    // Success login
    authService.setSession(`mock-jwt-${foundAccount.officialEmail}`, foundAccount);
    onLoginSuccess(foundAccount);
  };

  // Final Signup Submit Handler (Step 2)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) {
      alert('Please fill in all required company details in Step 1.');
      setSignupStep(1);
      return;
    }

    if (formData.industryExpertise.length === 0) {
      setFormErrors({ industryExpertise: 'Please select at least one industry expertise / CSR focus domain.' });
      return;
    }

    // Check if email already registered in industry
    const currentAccounts = getStoredIndustryAccounts();
    const existing = currentAccounts.find(a => a.officialEmail.toLowerCase() === formData.officialEmail.trim().toLowerCase());
    if (existing) {
      alert('An industry account with this official email already exists. Please log in.');
      setAuthMode('login');
      setLoginIdentifier(formData.officialEmail);
      return;
    }

    const newAccount = {
      ...formData,
      officialEmail: formData.officialEmail.trim(),
      role: 'INDUSTRY'
    };

    const registerResult = await authService.register(newAccount);
    const updatedAccounts = [newAccount, ...currentAccounts];
    setAccounts(updatedAccounts);
    saveStoredIndustryAccounts(updatedAccounts);

    alert(`🎉 Corporate Account successfully registered for ${formData.companyName}! Logging you in.`);
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

  return (
    <div className="univ-auth-wrapper">
      <div className={`univ-auth-card ${authMode === 'signup' ? 'signup-mode' : ''}`}>
        
        {/* Card Header */}
        <div className="univ-auth-header" style={{ background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)' }}>
          <div className="univ-auth-emblem">
            <JharkhandCrest size={18} />
            <span>Government of Jharkhand • Industry & CSR Gateway</span>
          </div>

          <h2 className="univ-auth-title">
            {authMode === 'login' && 'Industry & CSR Portal Login'}
            {authMode === 'signup' && 'Corporate & Industry Registration'}
            {authMode === 'forgot' && 'Reset Corporate Account Password'}
          </h2>

          <p className="univ-auth-subtitle">
            {authMode === 'login' && 'Enter your company credentials to fund, collaborate, and execute civic challenges.'}
            {authMode === 'signup' && 'Register your company, CSR leadership, and key industry expertise domains.'}
            {authMode === 'forgot' && 'Enter your registered official email to receive a password reset link.'}
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
            <div style={{ display: 'flex', background: '#ECFDF5', border: '1.5px solid rgba(4, 120, 87, 0.25)', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setLoginError(''); }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: authMode === 'login' ? '#047857' : 'transparent',
                  color: authMode === 'login' ? '#FFFFFF' : '#064E3B',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'login' ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                🏢 Corporate Login
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setLoginError(''); setSignupNotice(''); setSignupStep(1); }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: authMode === 'signup' ? '#047857' : 'transparent',
                  color: authMode === 'signup' ? '#FFFFFF' : '#064E3B',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'signup' ? '0 2px 8px rgba(4, 120, 87, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                📝 Industry Sign Up
              </button>
            </div>
          )}

          {/* =========================================================
              VIEW 1: LOGIN FORM
             ========================================================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
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
                  <span>Official Corporate Email <span className="required">*</span></span>
                </label>
                <div className="univ-input-wrapper">
                  <input
                    type="text"
                    className="univ-form-input"
                    placeholder="e.g., csr@tatasteel.com or innovation@jindal.com"
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
                    placeholder="Enter your corporate portal password"
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

              <button type="submit" className="univ-btn-primary" style={{ background: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)' }}>
                <span>Login to Industry & CSR Portal</span>
                <ChevronRight size={18} />
              </button>

              {/* Seed Demo Account Helper */}
              <div style={{ marginTop: '18px', background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', fontSize: '0.8rem', color: '#4B5563' }}>
                <strong style={{ color: '#047857', display: 'block', marginBottom: '4px' }}>💼 Verified Corporate Accounts:</strong>
                <div style={{ margin: '2px 0' }}>• AquaGrid CSR: <code>aquagrid.industry@test.civicconnect.in</code> | Pass: <code>admin123</code></div>
                <div style={{ margin: '2px 0' }}>• GreenVolt Solar: <code>greenvolt.industry@test.civicconnect.in</code> | Pass: <code>admin123</code></div>
                <div style={{ margin: '2px 0', opacity: 0.85 }}>• Tata Steel CSR: <code>csr@tatasteel.com</code> | Pass: <code>admin123</code></div>
              </div>

              <div className="univ-toggle-row">
                <span>Don't have a registered corporate account?</span>
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
                      Registered Corporate Email Address <span className="required">*</span>
                    </label>
                    <div className="univ-input-wrapper">
                      <input
                        type="email"
                        className="univ-form-input"
                        placeholder="e.g., csr@tatasteel.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="univ-btn-primary">
                    <span>Send Password Reset Link</span>
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
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.6rem' }}>
                    ✓
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', marginBottom: '8px' }}>
                    Recovery Link Dispatched
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '20px' }}>
                    If <strong>{forgotEmail}</strong> is registered in the Jharkhand CSR database, a password recovery link has been sent.
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
              VIEW 3: STEP-BY-STEP SIGNUP REGISTRATION WIZARD (1 -> 2)
             ========================================================= */}
          {authMode === 'signup' && (
            <div>
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
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#064E3B' }}>
                    Step {signupStep} of 2:{' '}
                    <span style={{ color: '#047857', fontWeight: 700 }}>
                      {signupStep === 1 && 'Company & Location Details'}
                      {signupStep === 2 && 'Industry Expertise & CSR Priority Domains'}
                    </span>
                  </div>
                  <span style={{
                    background: '#047857',
                    color: '#FFFFFF',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}>
                    {signupStep === 1 ? '50% Completed' : '100% Final Step'}
                  </span>
                </div>

                {/* Progress bar track */}
                <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{
                    width: `${(signupStep / 2) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10B981 0%, #047857 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Step tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleBackStep1}
                    style={{
                      border: 'none',
                      background: signupStep === 1 ? '#ECFDF5' : '#FFFFFF',
                      borderBottom: signupStep === 1 ? '3px solid #047857' : '1px solid #E5E7EB',
                      padding: '8px 6px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: signupStep === 1 ? 800 : 600,
                      color: signupStep === 1 ? '#064E3B' : signupStep > 1 ? '#047857' : '#6B7280',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {signupStep > 1 ? '✓ ' : ''}1. Company & Location Details
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep1()) setSignupStep(2);
                    }}
                    style={{
                      border: 'none',
                      background: signupStep === 2 ? '#ECFDF5' : '#FFFFFF',
                      borderBottom: signupStep === 2 ? '3px solid #047857' : '1px solid #E5E7EB',
                      padding: '8px 6px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: signupStep === 2 ? 800 : 600,
                      color: signupStep === 2 ? '#064E3B' : '#6B7280',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    2. Industry Expertise & CSR Domains
                  </button>
                </div>
              </div>

              {/* =========================================================
                  STEP 1: COMPANY & LOCATION DETAILS
                 ========================================================= */}
              {signupStep === 1 && (
                <div className="univ-form-section" style={{ border: 'none', padding: 0 }}>
                  <div className="univ-section-title" style={{ marginBottom: '18px' }}>
                    <span className="univ-section-num" style={{ background: '#047857' }}>1</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#064E3B' }}>Company & Location Details</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#4B5563' }}>Enter corporate identity and authorized CSR leadership details</p>
                    </div>
                  </div>

                  <div className="univ-form-group">
                    <label className="univ-form-label">
                      <span>Company / Enterprise Full Name <span className="required">*</span></span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g., Tata Steel Limited / Jindal Steel & Power"
                      className={`univ-form-input ${formErrors.companyName ? 'input-error' : ''}`}
                      required
                    />
                    {formErrors.companyName && <span className="error-text">{formErrors.companyName}</span>}
                  </div>

                  <div className="univ-form-grid-2">
                    {/* State Dropdown */}
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
                        <span>City / District (Enter Manually) <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g., Jamshedpur / Ranchi / Bokaro"
                        className={`univ-form-input ${formErrors.city ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.city && <span className="error-text">{formErrors.city}</span>}
                    </div>
                  </div>

                  <div className="univ-form-grid-2">
                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Authorized Representative Full Name <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        name="representativeName"
                        value={formData.representativeName}
                        onChange={handleInputChange}
                        placeholder="e.g., Sanjay Kumar Choudhary"
                        className={`univ-form-input ${formErrors.representativeName ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.representativeName && <span className="error-text">{formErrors.representativeName}</span>}
                    </div>

                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Designation / Role in Company <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        placeholder="e.g., VP Sustainability / CSR Head"
                        className={`univ-form-input ${formErrors.designation ? 'input-error' : ''}`}
                        required
                      />
                      {formErrors.designation && <span className="error-text">{formErrors.designation}</span>}
                    </div>
                  </div>

                  <div className="univ-form-grid-2">
                    <div className="univ-form-group">
                      <label className="univ-form-label">
                        <span>Official Corporate Email <span className="required">*</span></span>
                      </label>
                      <input
                        type="email"
                        name="officialEmail"
                        value={formData.officialEmail}
                        onChange={handleInputChange}
                        placeholder="dc.ranchi@jharkhand.gov.in"
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
                      style={{ background: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>Next: Industry Expertise & CSR Domains (Step 2/2)</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================
                  STEP 2: INDUSTRY EXPERTISE & CSR PRIORITY DOMAINS
                 ========================================================= */}
              {signupStep === 2 && (
                <form onSubmit={handleSignupSubmit} className="univ-form-section" style={{ border: 'none', padding: 0 }}>
                  <div className="univ-section-title" style={{ marginBottom: '14px' }}>
                    <span className="univ-section-num" style={{ background: '#047857' }}>2</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#064E3B' }}>Industry Expertise & CSR Priority Domains</h3>
                      <p style={{ margin: '3px 0 0', fontSize: '0.86rem', color: '#4B5563' }}>
                        Select the areas where your company provides technological support, CSR funding, or engineering capabilities:
                      </p>
                    </div>
                  </div>

                  {/* Company Summary Pill */}
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.84rem', color: '#065F46', fontWeight: 700 }}>
                      🏢 Company: <strong>{formData.companyName || 'Enterprise'}</strong> ({formData.city || 'Jharkhand'})
                    </span>
                    <span style={{
                      background: '#047857',
                      color: '#FFFFFF',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}>
                      {formData.industryExpertise.length} Domains Selected
                    </span>
                  </div>

                  {/* Quick Select Tooling */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#064E3B' }}>
                      Selected: <strong>{formData.industryExpertise.length} of {INDUSTRY_EXPERTISE_OPTIONS.length} domains</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSelectAllExpertise}
                        style={{
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#064E3B',
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

                  <div className="expertise-grid" style={{ marginBottom: '20px' }}>
                    {INDUSTRY_EXPERTISE_OPTIONS.map((item) => {
                      const isChecked = formData.industryExpertise.includes(item);
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

                  {formErrors.industryExpertise && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #F87171',
                      color: '#991B1B',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      marginBottom: '16px'
                    }}>
                      ⚠️ {formErrors.industryExpertise}
                    </div>
                  )}

                  {/* Step 2 Action Buttons: Back & Complete Registration */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '12px', marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={handleBackStep1}
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
                      ← Back to Company Details
                    </button>
                    <button
                      type="submit"
                      className="univ-btn-primary"
                      style={{ background: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>Complete Registration & Access Dashboard</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </form>
              )}

              <div className="univ-toggle-row" style={{ marginTop: '20px' }}>
                <span>Already have an industry account?</span>
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
