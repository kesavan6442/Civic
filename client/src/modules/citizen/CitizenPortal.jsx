import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './citizen.css';
import { JharkhandCrest, CloseIcon } from '../../components/Icons';
import { problemsService, JHARKHAND_DISTRICTS, PROBLEM_CATEGORIES, STANDARD_DOMAINS } from '../../services/problemsService';
import { authService } from '../../services/authService';
import heroBgMaster from '../../assets/jharkhand_waterfall_hero.jpg';

// Core Domain Definitions with Icons
const CORE_DOMAINS = [
  { name: 'Water', icon: '💧' },
  { name: 'Roads', icon: '🛣️' },
  { name: 'Agriculture', icon: '🌾' },
  { name: 'Healthcare', icon: '💚' },
  { name: 'Education', icon: '🎓' },
  { name: 'Sanitation', icon: '🚯' },
  { name: 'Environment', icon: '🍃' },
  { name: 'Accessibility', icon: '♿' },
  { name: 'Public Services', icon: '🏛️' }
];

// 5 Stage Cards from the Reference
const FIVE_STAGES_CARDS = [
  {
    num: 1,
    icon: '📝',
    theme: 'green',
    title: 'Submit Your Challenge',
    titleHi: 'चुनौती दर्ज करें',
    desc: 'Describe the problem, location and impact. Upload a photo or supporting evidence.',
    descHi: 'समस्या, स्थान और प्रभाव का विवरण दें। फोटो या सहायक साक्ष्य अपलोड करें।',
    linkText: 'Get Started →'
  },
  {
    num: 2,
    icon: '🤖',
    theme: 'blue',
    title: 'AI Analysis & Verification',
    titleHi: 'एआई विश्लेषण व सत्यापन',
    desc: 'AI analyzes the problem domain, urgency, keywords and submitted evidence. Duplicate and authenticity checks help improve validation.',
    descHi: 'एआई डोमेन, तात्कालिकता, कीवर्ड और साक्ष्यों का विश्लेषण करता है। डुप्लीकेट व प्रमाणिकता जांच द्वारा सत्यापन किया जाता है।',
    linkText: 'Learn More →'
  },
  {
    num: 3,
    icon: '🎓',
    theme: 'purple',
    title: 'University Matching',
    titleHi: 'विश्वविद्यालय मिलान',
    desc: 'The platform identifies relevant universities, departments, faculty expertise and research capabilities for the challenge.',
    descHi: 'प्लेटफॉर्म चुनौती के लिए उपयुक्त विश्वविद्यालयों, विभागों, संकाय विशेषज्ञता और अनुसंधान क्षमताओं की पहचान करता है।',
    linkText: 'Learn More →'
  },
  {
    num: 4,
    icon: '🏭',
    theme: 'amber',
    title: 'Industry & CSR Collaboration',
    titleHi: 'उद्योग व सीएसआर सहयोग',
    desc: 'Suitable industry, startup and CSR partners can support mentoring, funding, prototyping and implementation.',
    descHi: 'उपयुक्त उद्योग, स्टार्टअप और सीएसआर भागीदार मार्गदर्शन, फंडिंग, प्रोटोटाइपिंग और क्रियान्वयन में सहयोग कर सकते हैं।',
    linkText: 'Learn More →'
  },
  {
    num: 5,
    icon: '📈',
    theme: 'teal',
    title: 'Solution & Impact',
    titleHi: 'समाधान व सामुदायिक प्रभाव',
    desc: 'Track project milestones, implementation progress, verification and the final community outcome.',
    descHi: 'परियोजना मील के पत्थर, कार्यान्वयन प्रगति, सरकारी सत्यापन और अंतिम सामुदायिक परिणाम को ट्रैक करें।',
    linkText: 'Learn More →'
  }
];

// 8 Connected Lifecycle Flow Steps
const LIFECYCLE_STEPS = [
  { num: 1, labelEn: 'Citizen Problem', labelHi: 'नागरिक समस्या', color: '#10B981' },
  { num: 2, labelEn: 'AI Analysis', labelHi: 'एआई विश्लेषण', color: '#3B82F6' },
  { num: 3, labelEn: 'Duplicate & Authenticity Check', labelHi: 'डुप्लीकेट व सत्यता जांच', color: '#6366F1' },
  { num: 4, labelEn: 'University Matching', labelHi: 'विश्वविद्यालय मिलान', color: '#8B5CF6' },
  { num: 5, labelEn: 'Technical Proposal', labelHi: 'तकनीकी प्रस्ताव', color: '#EC4899' },
  { num: 6, labelEn: 'Industry / CSR Collaboration', labelHi: 'उद्योग / सीएसआर सहयोग', color: '#F59E0B' },
  { num: 7, labelEn: 'Project Execution', labelHi: 'परियोजना क्रियान्वयन', color: '#06B6D4' },
  { num: 8, labelEn: 'Government Verification & Resolution', labelHi: 'सरकारी सत्यापन व समाधान', color: '#059669' }
];

const SUBMITTER_ENTITIES = [
  'Individual Citizen',
  'Resident Welfare Association (RWA)',
  'Student / Youth Group',
  'Gram Panchayat / Village Lead',
  'NGO / Community Volunteer'
];

export const CitizenPortal = ({ lang, onToggleLang }) => {
  const navigate = useNavigate();
  const isHindi = lang === 'hi';
  const currentUser = authService.getCurrentUser();

  // Active View Tab: 'home' | 'submit' | 'my-challenges' | 'notifications' | 'profile'
  const [viewTab, setViewTab] = useState('home');

  // Wizard Step for Submissions: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data States
  const [allChallenges, setAllChallenges] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isLoadingMine, setIsLoadingMine] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccessModal, setSubmittedSuccessModal] = useState(null);
  const [phoneSearch, setPhoneSearch] = useState('');

  // Citizen Clarification / More Info Response State
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [selectedProblemForClarification, setSelectedProblemForClarification] = useState(null);
  const [clarificationText, setClarificationText] = useState('');
  const [clarificationMediaUrl, setClarificationMediaUrl] = useState('');
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);

  const handleOpenClarificationModal = (problem) => {
    setSelectedProblemForClarification(problem);
    setClarificationText('');
    setClarificationMediaUrl('');
    setClarificationModalOpen(true);
  };

  const handleSubmitClarification = async (e) => {
    e.preventDefault();
    if (!selectedProblemForClarification || !clarificationText.trim()) return;
    setIsSubmittingClarification(true);
    try {
      const res = await problemsService.respondToInformationRequest(selectedProblemForClarification.id, {
        additionalInformation: clarificationText,
        mediaUrl: clarificationMediaUrl
      });
      if (res.success || res.data) {
        setClarificationModalOpen(false);
        alert('Clarification successfully submitted! Your problem statement has been re-queued for Admin Gate 1 review.');
        await loadMyChallenges();
      }
    } catch (err) {
      alert('Failed to submit clarification: ' + err.message);
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  // Form State (Clean inputs with no forced login)
  const [formData, setFormData] = useState({
    citizenName: '',
    citizenPhone: '',
    citizenEmail: '',
    entityType: 'Individual Citizen',
    submissionDate: new Date().toISOString().substring(0, 10),
    title: '',
    category: '',
    domain: '',
    urgency: 'Medium',
    description: '',
    district: '',
    locationAddress: '',
    mediaType: 'none',
    mediaUrl: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFileName, setMediaFileName] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Load all public problems from backend
  const loadAllChallenges = async () => {
    setIsLoadingAll(true);
    try {
      const list = await problemsService.getAllProblems();
      setAllChallenges(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Could not load all challenges', e);
      setAllChallenges([]);
    } finally {
      setIsLoadingAll(false);
    }
  };

  // Load citizen submissions
  const loadMyChallenges = async (phone = '') => {
    setIsLoadingMine(true);
    try {
      const targetPhone = phone || phoneSearch || formData.citizenPhone;
      let list = [];
      if (currentUser) {
        list = await problemsService.getMyChallenges(currentUser);
      }
      if ((!list || list.length === 0)) {
        const all = await problemsService.getAllProblems();
        if (targetPhone) {
          list = all.filter(p => p.citizenPhone && p.citizenPhone.includes(targetPhone));
        } else {
          list = all;
        }
      }
      setMyChallenges(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Could not load citizen challenges', e);
      setMyChallenges([]);
    } finally {
      setIsLoadingMine(false);
    }
  };

  const loadNotifications = async () => {
    setNotifications([
      {
        id: 'n1',
        title: isHindi ? 'झारखंड जल शक्ति मिशन अद्यतन' : 'Jharkhand Jal Shakti Mission Update',
        message: isHindi ? 'रांची और धनबाद में जल संचयन चुनौतियों के लिए विश्वविद्यालय अनुसंधान दल नियुक्त किए गए हैं।' : 'University research teams assigned to water harvesting challenges in Ranchi & Dhanbad.',
        status: 'Active'
      },
      {
        id: 'n2',
        title: isHindi ? 'सड़क मरम्मत व सुरक्षा ऑडिट' : 'Road Infrastructure Safety Review',
        message: isHindi ? 'सड़क गड्ढे संबंधी चुनौतियों की एआई उपग्रह व इमेज विश्लेषण द्वारा समीक्षा जारी है।' : 'Road damage submissions are being triaged with computer vision defect detection.',
        status: 'Notice'
      },
      {
        id: 'n3',
        title: isHindi ? 'सौर विद्युतीकरण परियोजना' : 'Rural Solar Electrification',
        message: isHindi ? 'गुमला एवं खूंटी जिलों में सौर ऊर्जा समाधानों के लिए उद्योग सीएसआर सहयोग स्वीकृत हुआ है।' : 'Industry CSR co-funding approved for solar microgrid projects in Gumla and Khunti.',
        status: 'Active'
      }
    ]);
  };

  useEffect(() => {
    loadAllChallenges();
    loadMyChallenges();
    loadNotifications();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMediaFileName(file.name);
      setFormData(prev => ({ ...prev, mediaType: 'image' }));
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMediaPreview(null);
    setMediaFileName('');
    setFormData(prev => ({ ...prev, mediaType: 'none', mediaUrl: '' }));
  };

  // Step Validations
  const validateStep1 = () => {
    const errors = {};
    if (!formData.citizenName.trim()) {
      errors.citizenName = isHindi ? 'कृपया अपना नाम दर्ज करें।' : 'Please enter your name.';
    }
    if (!formData.citizenPhone.trim() || formData.citizenPhone.trim().length < 10) {
      errors.citizenPhone = isHindi ? 'कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      errors.title = isHindi ? 'शीर्षक कम से कम 5 अक्षर का होना चाहिए।' : 'Title must be at least 5 characters.';
    }
    if (!formData.category) {
      errors.category = isHindi ? 'कृपया समस्या की श्रेणी चुनें।' : 'Please select a problem category.';
    }
    if (!formData.domain) {
      errors.domain = isHindi ? 'कृपया संबंधित डोमेन चुनें।' : 'Please select a relevant domain.';
    }
    if (!formData.description.trim() || formData.description.trim().length < 15) {
      errors.description = isHindi ? 'कृपया समस्या का विस्तृत विवरण दें।' : 'Please provide a detailed description.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.district) {
      errors.district = isHindi ? 'कृपया जिला चुनें।' : 'Please select a district in Jharkhand.';
    }
    if (!formData.locationAddress.trim()) {
      errors.locationAddress = isHindi ? 'कृपया सटीक स्थान या वार्ड दर्ज करें।' : 'Please enter exact location/ward.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handleSubmitChallenge = async () => {
    setIsSubmitting(true);
    try {
      let uploadedUrl = formData.mediaUrl || '';
      if (selectedFile) {
        try {
          const uploadRes = await problemsService.uploadMediaFile(selectedFile);
          if (uploadRes && uploadRes.fileUrl) {
            uploadedUrl = uploadRes.fileUrl;
          }
        } catch (uploadErr) {
          console.warn('File upload notice:', uploadErr.message);
        }
      }

      const payload = {
        title: (formData.title || '').trim(),
        category: formData.category || 'Water Management & Drainage',
        domain: formData.domain || formData.category || 'Water Management & Drainage',
        urgency: formData.urgency || 'Medium',
        priority: formData.urgency || 'Medium',
        description: (formData.description || '').trim(),
        district: formData.district || 'Ranchi',
        locationAddress: (formData.locationAddress || '').trim(),
        citizenName: (formData.citizenName || '').trim(),
        citizenPhone: (formData.citizenPhone || '').trim(),
        citizenEmail: (formData.citizenEmail || '').trim() || undefined,
        entityType: formData.entityType || 'Individual Citizen',
        submissionDate: formData.submissionDate || new Date().toISOString().split('T')[0],
        mediaType: selectedFile ? 'image' : 'none',
        mediaUrl: uploadedUrl || '',
        status: 'Pending Admin Review'
      };

      const result = await problemsService.submitChallenge(payload);

      setSubmittedSuccessModal({
        id: result?.id || `JH-CHLG-${Math.floor(1000 + Math.random() * 9000)}`,
        title: payload.title
      });

      try {
        await loadAllChallenges();
        await loadMyChallenges(payload.citizenPhone);
      } catch (loadErr) {
        console.warn('Could not refresh challenge list immediately:', loadErr);
      }

      setFormData({
        citizenName: '',
        citizenPhone: '',
        citizenEmail: '',
        entityType: 'Individual Citizen',
        submissionDate: new Date().toISOString().substring(0, 10),
        title: '',
        category: '',
        domain: '',
        urgency: 'Medium',
        description: '',
        district: '',
        locationAddress: '',
        mediaType: 'none',
        mediaUrl: ''
      });
      setSelectedFile(null);
      setMediaPreview(null);
      setMediaFileName('');
      setCurrentStep(1);
    } catch (err) {
      console.error('Submission failed', err);
      const msg = err?.message || (isHindi ? 'चुनौती दर्ज करने में त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'Failed to submit challenge. Please try again.');
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAiStatus = (item) => {
    if (item.aiStatus === 'AI_COMPLETED' || item.aiAnalysisResult || item.aiAnalysis) {
      return <span style={{ color: '#059669', fontWeight: 700 }}>✓ AI Analyzed</span>;
    }
    return <span style={{ color: '#036D33', fontWeight: 600 }}>⚙️ AI Triage Ready</span>;
  };

  const renderUnivStatus = (item) => {
    if (item.adoptedByUniversity || item.assignedUniversityId || item.universityName) {
      return (
        <span style={{ color: '#0284C7', fontWeight: 700 }}>
          🎓 {item.universityName || item.adoptedByUniversity || 'University Assigned'}
        </span>
      );
    }
    return <span style={{ color: '#D97706', fontWeight: 600 }}>⏳ Open for Academic Proposals</span>;
  };

  return (
    <div className="citizen-portal-root">
      {/* =========================================================================
          TOP OFFICIAL HEADER BAR (Matching Second Reference Image)
          ========================================================================= */}
      <header className="citizen-top-header">
        <div className="citizen-top-header-left">
          <div className="citizen-header-brand" onClick={() => navigate('/')}>
            <JharkhandCrest size={34} />
            <div className="citizen-header-brand-text">
              <div className="citizen-header-brand-title">CivicConnect</div>
              <div className="citizen-header-brand-sub">{isHindi ? 'झारखंड सरकार' : 'Govt. of Jharkhand'}</div>
            </div>
          </div>

          <div className="citizen-header-divider" />

          <div className="citizen-header-dept">
            <div className="citizen-header-dept-title">
              {isHindi ? 'एकीकृत नागरिक एवं संस्थागत पोर्टल' : 'Unified Civic & Institutional Portal'}
            </div>
            <div className="citizen-header-dept-sub">
              {isHindi ? 'सूचना प्रौद्योगिकी एवं ई-गवर्नेंस विभाग • झारखंड सरकार' : 'Dept. of IT & e-Governance • Government of Jharkhand'}
            </div>
          </div>
        </div>

        {/* Right Navigation Tabs */}
        <nav className="citizen-top-nav">
          <button
            type="button"
            className={`citizen-nav-btn ${viewTab === 'home' ? 'active' : ''}`}
            onClick={() => { setViewTab('home'); loadAllChallenges(); }}
          >
            {isHindi ? 'नागरिक होम' : 'Citizen Home'}
          </button>

          <button
            type="button"
            className={`citizen-nav-btn ${viewTab === 'submit' ? 'active' : ''}`}
            onClick={() => { setViewTab('submit'); setCurrentStep(1); }}
          >
            {isHindi ? 'चुनौती दर्ज करें' : 'Submit Challenge'}
          </button>

          <button
            type="button"
            className={`citizen-nav-btn ${viewTab === 'my-challenges' ? 'active' : ''}`}
            onClick={() => { setViewTab('my-challenges'); loadMyChallenges(); }}
          >
            {isHindi ? 'मेरी चुनौतियाँ' : 'My Challenges'}
          </button>

          <button
            type="button"
            className={`citizen-nav-btn ${viewTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setViewTab('notifications'); loadNotifications(); }}
          >
            {isHindi ? 'सूचनाएं' : 'Notifications'}
            <span className="citizen-nav-badge-red">{notifications.length || 3}</span>
          </button>

          <button
            type="button"
            className={`citizen-nav-btn ${viewTab === 'profile' ? 'active' : ''}`}
            onClick={() => setViewTab('profile')}
          >
            {isHindi ? 'प्रोफ़ाइल' : 'Profile'}
          </button>
        </nav>

      </header>

      {/* =========================================================================
          MAIN CONTAINER
          ========================================================================= */}
      <main className="citizen-body-wrapper">
        
        {/* =========================================================================
            TAB 1: CITIZEN HOME PAGE (Matches Reference Image 2)
            ========================================================================= */}
        {viewTab === 'home' && (
          <div className="citizen-home-layout">
            
            {/* 1. HERO BANNER — Compact reference-matching design */}
            <section className="citizen-hero-banner">

              {/* LEFT: Text content */}
              <div className="citizen-hero-content">
                {/* Pill badge - no icon */}
                <div className="citizen-hero-badge-pill">
                  {isHindi ? 'सुरक्षित नागरिक पोर्टल' : 'Secure Citizen Gateway'}
                </div>

                {/* Main heading */}
                <h1 className="citizen-hero-main-title">
                  {isHindi ? 'नागरिक सिविक' : 'Welcome to Citizen Civic'}
                  <span className="citizen-hero-title-highlight">
                    {isHindi ? 'समाधान गेटवे' : 'Solutions Gateway'}
                  </span>
                </h1>

                <p className="citizen-hero-description">
                  {isHindi
                    ? 'स्थानीय समस्या की रिपोर्ट करें और व्यावहारिक समाधान के लिए सही शैक्षणिक व औद्योगिक भागीदारों से जुड़ें।'
                    : 'Report a local problem and connect it with the right academic and industry partners for practical solutions.'}
                </p>

                {/* Core Domains row — no icons, text only */}
                <div className="citizen-domains-section">
                  <span className="citizen-domains-title">CORE DOMAINS:</span>
                  <div className="citizen-domains-list">
                    {CORE_DOMAINS.map((dom, idx) => (
                      <span key={idx} className="citizen-domain-pill">
                        {dom.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons — no icons */}
                <div className="citizen-hero-btn-row">
                  <button
                    type="button"
                    className="citizen-primary-hero-btn"
                    onClick={() => { setViewTab('submit'); setCurrentStep(1); }}
                  >
                    {isHindi ? 'नागरिक चुनौती दर्ज करें' : 'Submit a Civic Challenge →'}
                  </button>
                  <button
                    type="button"
                    className="citizen-secondary-hero-btn"
                    onClick={() => { setViewTab('my-challenges'); loadMyChallenges(); }}
                  >
                    {isHindi ? 'मेरी चुनौतियाँ देखें' : 'View My Challenges'}
                  </button>
                </div>

                {/* AI note — no icon */}
                <div className="citizen-hero-ai-note">
                  {isHindi
                    ? 'आपकी चुनौती का एआई द्वारा विश्लेषण किया जाता है, डुप्लीकेट रिपोर्टों की जांच की जाती है, और प्रासंगिक विश्वविद्यालयों व समाधान भागीदारों से मिलान किया जाता है।'
                    : 'Your challenge is analyzed using AI, checked for duplicate reports, and matched with relevant universities and solution partners.'}
                </div>
              </div>


              {/* RIGHT: Waterfall image ~42% with gradient fade + handwritten overlay */}
              <div className="citizen-hero-image-panel">
                {/* Fade gradient on the left edge of the image panel */}
                <div className="citizen-hero-img-fade" />

                {/* Handwritten overlay text */}
                <div className="citizen-hero-script-text">
                  Better Solutions<br />for a Stronger<br />Jharkhand
                </div>

                <img
                  src={heroBgMaster}
                  alt="Jharkhand waterfall landscape"
                  className="citizen-hero-landscape-img"
                />
              </div>
            </section>

            {/* 2. HOW YOUR CIVIC CHALLENGE GETS SOLVED (5 Stage Cards Grid) */}
            <section className="citizen-stages-section">
              <div className="citizen-section-title-wrap">
                <div>
                  <h2 className="citizen-section-main-heading">
                    {isHindi ? 'आपकी नागरिक चुनौती का समाधान कैसे होता है' : 'How Your Civic Challenge Gets Solved'}
                  </h2>
                  <p className="citizen-section-sub-heading">
                    {isHindi
                      ? 'नागरिक समस्या प्रस्तुति से लेकर सरकारी सत्यापन और सामुदायिक प्रभाव तक एक संरचित 8-चरणीय जीवनचक्र।'
                      : 'A structured 8-stage lifecycle from citizen problem submission to government verification & community impact.'}
                  </p>
                </div>
              </div>

              {/* 5 Distinctly Colored Stage Cards */}
              <div className="citizen-five-cards-grid">
                {FIVE_STAGES_CARDS.map((stg) => (
                  <div key={stg.num} className={`citizen-stage-box theme-${stg.theme}`}>
                    <div className="citizen-stage-top-badge">
                      <span className="citizen-badge-num">{stg.num}</span>
                    </div>


                    <h3 className="citizen-stage-box-title">
                      {isHindi ? stg.titleHi : stg.title}
                    </h3>

                    <p className="citizen-stage-box-desc">
                      {isHindi ? stg.descHi : stg.desc}
                    </p>

                    <div
                      className="citizen-stage-box-link"
                      onClick={() => {
                        if (stg.num === 1) {
                          setViewTab('submit');
                          setCurrentStep(1);
                        } else {
                          setViewTab('my-challenges');
                        }
                      }}
                    >
                      {stg.linkText}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. 8 CONNECTED NUMBERED LIFECYCLE STEPS */}
            <section className="citizen-lifecycle-section">
              <div className="citizen-lifecycle-header">
                <span className="citizen-lifecycle-title">
                  {isHindi ? '8-चरणीय समाधान जीवनचक्र' : 'End-to-End 8-Stage Resolution Flow'}
                </span>
              </div>

              <div className="citizen-lifecycle-flow">
                {LIFECYCLE_STEPS.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="citizen-lifecycle-item">
                      <div className="citizen-lifecycle-num" style={{ borderColor: step.color, color: step.color }}>
                        {step.num}
                      </div>
                      <div className="citizen-lifecycle-label">
                        {isHindi ? step.labelHi : step.labelEn}
                      </div>
                    </div>
                    {idx < LIFECYCLE_STEPS.length - 1 && (
                      <div className="citizen-lifecycle-connector" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* =========================================================================
            TAB 2: SUBMIT CIVIC CHALLENGE FORM
            ========================================================================= */}
        {viewTab === 'submit' && (
          <div className="citizen-submit-view-container">
            {/* Steps Progress Header */}
            <div className="citizen-wizard-steps-bar">
              <div className="citizen-wizard-step" onClick={() => setCurrentStep(1)}>
                <div className={`citizen-wizard-circle ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'inactive'}`}>
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <span className={`citizen-wizard-label ${currentStep === 1 ? 'active' : ''}`}>
                  {isHindi ? '1. प्रस्तुतकर्ता जानकारी' : '1. Submitter Info'}
                </span>
              </div>

              <div className={`citizen-wizard-line ${currentStep > 1 ? 'completed' : ''}`} />

              <div className="citizen-wizard-step" onClick={() => { if (validateStep1()) setCurrentStep(2); }}>
                <div className={`citizen-wizard-circle ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'inactive'}`}>
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <span className={`citizen-wizard-label ${currentStep === 2 ? 'active' : ''}`}>
                  {isHindi ? '2. समस्या का विवरण' : '2. Problem Details'}
                </span>
              </div>

              <div className={`citizen-wizard-line ${currentStep > 2 ? 'completed' : ''}`} />

              <div className="citizen-wizard-step" onClick={() => { if (validateStep1() && validateStep2()) setCurrentStep(3); }}>
                <div className={`citizen-wizard-circle ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'inactive'}`}>
                  {currentStep > 3 ? '✓' : '3'}
                </div>
                <span className={`citizen-wizard-label ${currentStep === 3 ? 'active' : ''}`}>
                  {isHindi ? '3. स्थान व साक्ष्य' : '3. Location & Evidence'}
                </span>
              </div>

              <div className={`citizen-wizard-line ${currentStep > 3 ? 'completed' : ''}`} />

              <div className="citizen-wizard-step" onClick={() => { if (validateStep1() && validateStep2() && validateStep3()) setCurrentStep(4); }}>
                <div className={`citizen-wizard-circle ${currentStep === 4 ? 'active' : 'inactive'}`}>
                  4
                </div>
                <span className={`citizen-wizard-label ${currentStep === 4 ? 'active' : ''}`}>
                  {isHindi ? '4. समीक्षा एवं सबमिट' : '4. Review & Submit'}
                </span>
              </div>
            </div>

            {/* Form & Sidebar Grid */}
            <div className="citizen-form-layout-grid">
              <div className="citizen-main-form-box">

                {/* STEP 1: SUBMITTER INFO */}
                {currentStep === 1 && (
                  <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                    <div className="citizen-form-section-heading">
                      <span>👤</span>
                      <h3>1. {isHindi ? 'प्रस्तुतकर्ता की जानकारी' : 'Submitter Information'}</h3>
                    </div>

                    <div className="citizen-form-row-2">
                      <div className="citizen-input-group">
                        <label>
                          {isHindi ? 'व्यक्ति / प्रमुख का नाम' : 'Person / Lead Name'} <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          name="citizenName"
                          value={formData.citizenName}
                          onChange={handleChange}
                          placeholder={isHindi ? 'उदा. रमेश कुमार सोरेन' : 'e.g. Ramesh Kumar Soren'}
                          className="citizen-form-control"
                          required
                        />
                        {formErrors.citizenName && <span className="error-msg">{formErrors.citizenName}</span>}
                      </div>

                      <div className="citizen-input-group">
                        <label>
                          {isHindi ? 'मोबाइल / फोन नंबर' : 'Mobile / Phone Number'} <span className="req">*</span>
                        </label>
                        <input
                          type="tel"
                          name="citizenPhone"
                          value={formData.citizenPhone}
                          onChange={handleChange}
                          placeholder="e.g. 9431100000"
                          className="citizen-form-control"
                          required
                        />
                        {formErrors.citizenPhone && <span className="error-msg">{formErrors.citizenPhone}</span>}
                      </div>
                    </div>

                    <div className="citizen-form-row-2">
                      <div className="citizen-input-group">
                        <label>
                          {isHindi ? 'प्रस्तुतकर्ता प्रकार' : 'Submitter Entity Type'} <span className="req">*</span>
                        </label>
                        <select
                          name="entityType"
                          value={formData.entityType}
                          onChange={handleChange}
                          className="citizen-form-control"
                        >
                          {SUBMITTER_ENTITIES.map((ent, idx) => (
                            <option key={idx} value={ent}>{ent}</option>
                          ))}
                        </select>
                      </div>

                      <div className="citizen-input-group">
                        <label>
                          {isHindi ? 'दर्ज करने की तिथि' : 'Date of Submission'} <span className="req">*</span>
                        </label>
                        <input
                          type="date"
                          name="submissionDate"
                          value={formData.submissionDate}
                          onChange={handleChange}
                          className="citizen-form-control"
                          required
                        />
                      </div>
                    </div>

                    <div className="citizen-input-group">
                      <label>{isHindi ? 'ईमेल पता (वैकल्पिक)' : 'Email Address (Optional)'}</label>
                      <input
                        type="email"
                        name="citizenEmail"
                        value={formData.citizenEmail}
                        onChange={handleChange}
                        placeholder="e.g. citizen@jharkhand.gov.in"
                        className="citizen-form-control"
                      />
                    </div>

                    <div className="citizen-form-actions-row">
                      <button type="button" className="citizen-btn-secondary" onClick={() => setViewTab('home')}>
                        {isHindi ? 'होम पर जाएं' : 'Back to Home'}
                      </button>
                      <button type="submit" className="citizen-btn-primary">
                        <span>{isHindi ? 'अगला: समस्या का विवरण' : 'Next: Problem Details'}</span>
                        <span>→</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: PROBLEM DETAILS */}
                {currentStep === 2 && (
                  <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                    <div className="citizen-form-section-heading">
                      <span>📝</span>
                      <h3>2. {isHindi ? 'समस्या का विवरण व डोमेन' : 'Problem Details & Categorization'}</h3>
                    </div>

                    <div className="citizen-form-row-2">
                      <div className="citizen-input-group">
                        <label>{isHindi ? 'चुनौती का शीर्षक' : 'Challenge Title'} <span className="req">*</span></label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          maxLength={200}
                          placeholder={isHindi ? 'उदा. मुख्य रिंग रोड पर जल निकासी अवरुद्ध' : 'e.g. Broken water pipeline on Main Ring Road'}
                          className="citizen-form-control"
                          required
                        />
                        {formErrors.title && <span className="error-msg">{formErrors.title}</span>}
                      </div>

                      <div className="citizen-input-group">
                        <label>{isHindi ? 'समस्या की श्रेणी' : 'Problem Category'} <span className="req">*</span></label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="citizen-form-control"
                          required
                        >
                          <option value="">{isHindi ? 'श्रेणी चुनें' : 'Select category'}</option>
                          {PROBLEM_CATEGORIES.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {formErrors.category && <span className="error-msg">{formErrors.category}</span>}
                      </div>
                    </div>

                    <div className="citizen-input-group">
                      <label>{isHindi ? 'समस्या का विस्तृत विवरण' : 'Detailed Description'} <span className="req">*</span></label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={3000}
                        placeholder={isHindi ? 'समस्या का विस्तार से वर्णन करें...' : 'Describe what is happening, where, and the community impact...'}
                        className="citizen-form-control"
                        rows={4}
                        required
                      />
                      {formErrors.description && <span className="error-msg">{formErrors.description}</span>}
                    </div>

                    <div className="citizen-form-row-2">
                      <div className="citizen-input-group">
                        <label>{isHindi ? 'अनुसंधान डोमेन' : 'Research Domain'} <span className="req">*</span></label>
                        <select
                          name="domain"
                          value={formData.domain}
                          onChange={handleChange}
                          className="citizen-form-control"
                          required
                        >
                          <option value="">{isHindi ? 'डोमेन चुनें' : 'Select domain'}</option>
                          {STANDARD_DOMAINS.map((dom, idx) => (
                            <option key={idx} value={dom}>{dom}</option>
                          ))}
                        </select>
                        {formErrors.domain && <span className="error-msg">{formErrors.domain}</span>}
                      </div>

                      <div className="citizen-input-group">
                        <label>{isHindi ? 'तात्कालिकता स्तर' : 'Urgency Level'} <span className="req">*</span></label>
                        <select
                          name="urgency"
                          value={formData.urgency}
                          onChange={handleChange}
                          className="citizen-form-control"
                        >
                          <option value="Critical">🔴 Critical (Immediate Hazard)</option>
                          <option value="High">🟠 High Priority</option>
                          <option value="Medium">🟡 Medium Priority</option>
                          <option value="Low">🟢 Low Priority</option>
                        </select>
                      </div>
                    </div>

                    <div className="citizen-form-actions-row">
                      <button type="button" className="citizen-btn-secondary" onClick={() => setCurrentStep(1)}>
                        ← {isHindi ? 'वापस' : 'Previous Step'}
                      </button>
                      <button type="submit" className="citizen-btn-primary">
                        <span>{isHindi ? 'अगला: स्थान व साक्ष्य' : 'Next: Location & Evidence'}</span>
                        <span>→</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: LOCATION & EVIDENCE */}
                {currentStep === 3 && (
                  <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
                    <div className="citizen-form-section-heading">
                      <span>📍</span>
                      <h3>3. {isHindi ? 'स्थान एवं साक्ष्य अपलोड' : 'Location & Supporting Evidence'}</h3>
                    </div>

                    <div className="citizen-form-row-2">
                      <div className="citizen-input-group">
                        <label>{isHindi ? 'झारखंड का जिला' : 'District in Jharkhand'} <span className="req">*</span></label>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          className="citizen-form-control"
                          required
                        >
                          <option value="">{isHindi ? 'जिला चुनें' : 'Select District'}</option>
                          {JHARKHAND_DISTRICTS.map((dist, idx) => (
                            <option key={idx} value={dist}>{dist}</option>
                          ))}
                        </select>
                        {formErrors.district && <span className="error-msg">{formErrors.district}</span>}
                      </div>

                      <div className="citizen-input-group">
                        <label>{isHindi ? 'सटीक स्थान / वार्ड / लैंडमार्क' : 'Exact Location / Ward / Landmark'} <span className="req">*</span></label>
                        <input
                          type="text"
                          name="locationAddress"
                          value={formData.locationAddress}
                          onChange={handleChange}
                          placeholder={isHindi ? 'उदा. वार्ड 26, हरमू हाउसिंग कॉलोनी, रांची' : 'e.g. Ward 26, Harmu Road, Ranchi'}
                          className="citizen-form-control"
                          required
                        />
                        {formErrors.locationAddress && <span className="error-msg">{formErrors.locationAddress}</span>}
                      </div>
                    </div>

                    <div className="citizen-input-group">
                      <label>{isHindi ? 'फोटो या साक्ष्य अपलोड (वैकल्पिक)' : 'Upload Photo / Evidence (Optional)'}</label>
                      {!mediaPreview ? (
                        <div
                          className="citizen-dropzone"
                          onClick={() => document.getElementById('citizen-file-picker').click()}
                        >
                          <input
                            id="citizen-file-picker"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                          />
                          <div className="citizen-dropzone-icon">📷</div>
                          <div className="citizen-dropzone-text">
                            {isHindi ? 'फोटो या दस्तावेज चुनने के लिए क्लिक करें' : 'Click to browse or upload problem photos'}
                          </div>
                          <div className="citizen-dropzone-sub">PNG, JPG, JPEG, PDF up to 10MB</div>
                        </div>
                      ) : (
                        <div className="citizen-uploaded-preview">
                          <img src={mediaPreview} alt="Preview" className="citizen-preview-thumbnail" />
                          <div className="citizen-preview-details">
                            <span>{mediaFileName || 'evidence.jpg'}</span>
                            <button type="button" onClick={handleRemoveFile} className="citizen-remove-btn">
                              <CloseIcon size={14} /> Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="citizen-form-actions-row">
                      <button type="button" className="citizen-btn-secondary" onClick={() => setCurrentStep(2)}>
                        ← {isHindi ? 'वापस' : 'Previous Step'}
                      </button>
                      <button type="submit" className="citizen-btn-primary">
                        <span>{isHindi ? 'अगला: समीक्षा एवं सबमिट' : 'Next: Review & Submit'}</span>
                        <span>→</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 4: REVIEW & CONFIRM */}
                {currentStep === 4 && (
                  <div>
                    <div className="citizen-form-section-heading">
                      <span>✓</span>
                      <h3>4. {isHindi ? 'समीक्षा एवं अंतिम पुष्टि' : 'Review & Final Confirmation'}</h3>
                    </div>

                    <div className="citizen-review-summary-card">
                      <h4 className="citizen-review-title">{formData.title || 'Untitled Challenge'}</h4>
                      <div className="citizen-review-meta-grid">
                        <div><strong>👤 Submitter:</strong> {formData.citizenName} ({formData.entityType})</div>
                        <div><strong>📱 Phone:</strong> {formData.citizenPhone}</div>
                        <div><strong>🏷️ Category:</strong> {formData.category}</div>
                        <div><strong>🔬 Domain:</strong> {formData.domain}</div>
                        <div><strong>⚡ Urgency:</strong> {formData.urgency}</div>
                        <div><strong>📍 District & Location:</strong> {formData.district} ({formData.locationAddress})</div>
                        <div><strong>📅 Date:</strong> {formData.submissionDate}</div>
                        <div><strong>📎 Evidence:</strong> {mediaFileName || 'None'}</div>
                      </div>

                      <div className="citizen-review-desc">
                        <strong>Description:</strong> {formData.description}
                      </div>

                      {mediaPreview && (
                        <div style={{ marginTop: '12px' }}>
                          <img src={mediaPreview} alt="Preview" style={{ maxHeight: '140px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                        </div>
                      )}
                    </div>

                    <div className="citizen-form-actions-row">
                      <button type="button" className="citizen-btn-secondary" onClick={() => setCurrentStep(3)}>
                        ← {isHindi ? 'वापस' : 'Previous Step'}
                      </button>
                      <button type="button" className="citizen-btn-primary" onClick={handleSubmitChallenge} disabled={isSubmitting}>
                        {isSubmitting ? (isHindi ? 'सबमिट हो रहा है...' : 'Submitting to AI...') : `🚀 ${isHindi ? 'चुनौती सबमिट करें' : 'Submit Civic Challenge'}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar Benefit Cards */}
              <aside className="citizen-form-sidebar">
                <div className="citizen-sidebar-card">
                  <h4>💡 Open & Frictionless</h4>
                  <p>Citizens can report civic issues immediately without login barriers. Real-time AI will triage and route it to matching universities.</p>
                </div>

                <div className="citizen-sidebar-card">
                  <h4>🛡️ AI Authenticity & Duplication Check</h4>
                  <p>Your problem is automatically checked against existing district reports to prevent duplication and fast-track resource allocation.</p>
                </div>

                <div className="citizen-sidebar-card">
                  <h4>🎓 Academic & Industry Action</h4>
                  <p>Faculty and student research teams formulate engineering prototypes while CSR funds enable rapid deployment.</p>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: MY CHALLENGES VIEW
            ========================================================================= */}
        {viewTab === 'my-challenges' && (
          <div className="citizen-challenges-view-wrapper">
            <div className="citizen-challenges-header-row">
              <div>
                <h2>📋 {isHindi ? 'मेरी दर्ज नागरिक चुनौतियाँ' : 'My Registered Civic Challenges'} ({myChallenges.length})</h2>
                <p>Track the real-time AI triage status, university assignment, and government resolution milestones:</p>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="tel"
                  placeholder="Filter by Phone..."
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  className="citizen-form-control"
                  style={{ width: '180px', padding: '6px 10px', fontSize: '0.84rem' }}
                />
                <button
                  type="button"
                  onClick={() => loadMyChallenges(phoneSearch)}
                  className="citizen-secondary-hero-btn"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => { setViewTab('submit'); setCurrentStep(1); }}
                  className="citizen-primary-hero-btn"
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  + New Challenge
                </button>
              </div>
            </div>

            {isLoadingMine ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280' }}>⏳ Loading your challenges...</div>
            ) : myChallenges.length === 0 ? (
              <div className="citizen-empty-state-card">
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📭</div>
                <h3>{isHindi ? 'कोई दर्ज चुनौती नहीं मिली।' : 'No submissions found for this phone/session.'}</h3>
                <p>Submit a new civic problem or search using your registered mobile number.</p>
                <button type="button" onClick={() => { setViewTab('submit'); setCurrentStep(1); }} className="citizen-primary-hero-btn">
                  Submit a Civic Challenge
                </button>
              </div>
            ) : (
              <div className="citizen-challenges-list-grid">
                {myChallenges.map((item, idx) => (
                  <div key={idx} className="citizen-problem-item-card">
                    <div className="citizen-problem-item-top">
                      <span className="citizen-problem-id-pill">{item.id}</span>
                      <span className={`citizen-status-badge ${item.status === 'Resolved' ? 'resolved' : item.status === 'MORE_INFO_REQUESTED' ? 'warning' : 'pending'}`}>
                        {item.status === 'MORE_INFO_REQUESTED' ? 'Clarification Needed' : (item.status || 'Pending Admin Review')}
                      </span>
                    </div>

                    <h3 className="citizen-problem-item-title">{item.title}</h3>
                    <p className="citizen-problem-item-desc">{item.description}</p>

                    {/* Clarification Request Banner */}
                    {(item.status === 'MORE_INFO_REQUESTED' || item.approvalStatus === 'MORE_INFO_REQUESTED') && (
                      <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '8px', padding: '10px 12px', margin: '10px 0', fontSize: '0.82rem' }}>
                        <strong style={{ color: '#92400E', display: 'block', marginBottom: '3px' }}>
                          ⚠️ State Administration Clarification Request:
                        </strong>
                        <div style={{ color: '#78350F', lineHeight: 1.4 }}>
                          {item.adminReviewNotes || item.requestedInformation || 'Please provide clearer on-site photographic evidence or landmark details.'}
                        </div>
                        <button
                          type="button"
                          className="citizen-primary-hero-btn"
                          onClick={() => handleOpenClarificationModal(item)}
                          style={{ marginTop: '8px', padding: '5px 12px', fontSize: '0.78rem', background: '#D97706', borderColor: '#B45309' }}
                        >
                          Respond & Submit Clarification →
                        </button>
                      </div>
                    )}

                    <div className="citizen-problem-item-meta">
                      <div>📍 {item.district || 'Ranchi'} ({item.locationAddress || 'Jharkhand'})</div>
                      <div>🏷️ {item.category || item.domain}</div>
                      <div>⚡ {item.urgency || 'Medium'}</div>
                      <div>🤖 {renderAiStatus(item)}</div>
                      <div>🎓 {renderUnivStatus(item)}</div>
                      <div>📅 {item.submissionDate || 'Recent'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: NOTIFICATIONS VIEW
            ========================================================================= */}
        {viewTab === 'notifications' && (
          <div className="citizen-challenges-view-wrapper">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#024D24', marginBottom: '16px' }}>
              🔔 {isHindi ? 'नागरिक सूचनाएं एवं राज्य अपडेट' : 'Citizen Notifications & State Updates'} ({notifications.length})
            </h2>

            <div style={{ display: 'grid', gap: '12px' }}>
              {notifications.map((notif, idx) => (
                <div key={idx} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#024D24', fontSize: '0.96rem', marginBottom: '4px' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#4B5563' }}>
                      {notif.message}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#DCFCE7', color: '#065F46', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                    {notif.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: CITIZEN PROFILE VIEW
            ========================================================================= */}
        {viewTab === 'profile' && (
          <div className="citizen-challenges-view-wrapper" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#E8F5EC', color: '#036D33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800 }}>
                👤
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#024D24', margin: '0 0 4px 0' }}>
                  {currentUser?.fullName || currentUser?.name || 'Citizen User'}
                </h2>
                <span style={{ background: '#DCFCE7', color: '#065F46', fontSize: '0.74rem', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' }}>
                  CITIZEN CIVIC PORTAL
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.86rem', background: '#F9FAFB', padding: '18px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '24px' }}>
              <div>
                <strong style={{ color: '#374151', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', marginBottom: '2px' }}>Role Access</strong>
                <span style={{ color: '#111827', fontWeight: 600 }}>Open Citizen Gateway</span>
              </div>
              <div>
                <strong style={{ color: '#374151', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', marginBottom: '2px' }}>State</strong>
                <span style={{ color: '#111827', fontWeight: 600 }}>Jharkhand</span>
              </div>
            </div>

            <button type="button" onClick={() => setViewTab('home')} className="citizen-secondary-hero-btn" style={{ width: '100%', justifyContent: 'center' }}>
              ← {isHindi ? 'होम पर जाएं' : 'Back to Home'}
            </button>
          </div>
        )}

        {/* =========================================================================
            SUBMISSION SUCCESS MODAL
            ========================================================================= */}
        {submittedSuccessModal && (
          <div className="citizen-modal-overlay">
            <div className="citizen-modal-box">
              <div className="citizen-modal-check">✓</div>
              <h2>{isHindi ? 'चुनौती सफलतापूर्वक दर्ज हुई!' : 'Civic Challenge Submitted!'}</h2>
              <p>Your problem statement has been saved to MongoDB and processed for university & industry matching.</p>
              
              <div className="citizen-tracking-pill">
                <span>TRACKING ID</span>
                <strong>{submittedSuccessModal.id}</strong>
              </div>

              <button
                type="button"
                className="citizen-primary-hero-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setSubmittedSuccessModal(null);
                  setViewTab('my-challenges');
                  loadMyChallenges();
                }}
              >
                {isHindi ? 'मेरी चुनौतियाँ देखें' : 'View My Challenges'}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            CLARIFICATION RESPONSE MODAL
            ========================================================================= */}
        {clarificationModalOpen && selectedProblemForClarification && (
          <div className="citizen-modal-overlay">
            <div className="citizen-modal-box" style={{ maxWidth: '560px', width: '92%', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E5E7EB', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#024D24', margin: 0 }}>
                  📝 {isHindi ? 'स्पष्टीकरण व अतिरिक्त साक्ष्य दर्ज करें' : 'Provide Clarification & Evidence'}
                </h3>
                <button
                  type="button"
                  onClick={() => setClarificationModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '0.82rem' }}>
                <strong>Problem:</strong> {selectedProblemForClarification.title}
                <div style={{ color: '#92400E', marginTop: '4px' }}>
                  <strong>Admin Request:</strong> {selectedProblemForClarification.adminReviewNotes || selectedProblemForClarification.requestedInformation}
                </div>
              </div>

              <form onSubmit={handleSubmitClarification}>
                <div className="citizen-input-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {isHindi ? 'विस्तृत स्पष्टीकरण या विवरण' : 'Detailed Clarification / Information'} <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={clarificationText}
                    onChange={(e) => setClarificationText(e.target.value)}
                    placeholder={isHindi ? 'स्पष्टीकरण लिखें...' : 'Provide specific details, landmark clarifications, or answers to the admin query...'}
                    className="citizen-form-control"
                    required
                  />
                </div>

                <div className="citizen-input-group" style={{ marginBottom: '18px' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {isHindi ? 'अतिरिक्त फोटो / साक्ष्य लिंक (वैकल्पिक)' : 'Supporting Photo / Document Link (Optional)'}
                  </label>
                  <input
                    type="url"
                    value={clarificationMediaUrl}
                    onChange={(e) => setClarificationMediaUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or image URL"
                    className="citizen-form-control"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="citizen-btn-secondary"
                    onClick={() => setClarificationModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="citizen-primary-hero-btn"
                    disabled={isSubmittingClarification || !clarificationText.trim()}
                  >
                    {isSubmittingClarification ? 'Submitting...' : 'Submit Clarification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default CitizenPortal;
