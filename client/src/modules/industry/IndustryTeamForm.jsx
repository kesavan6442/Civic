import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../university/university.css';
import { JharkhandCrest, CheckIcon, ChevronRight } from '../../components/Icons';
import { problemsService } from '../../services/problemsService';

export const IndustryTeamForm = ({ user, onBackToProblems, onBackToDashboard }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Team Lead details
  const [teamLeadName, setTeamLeadName] = useState(user?.representativeName || '');
  const [teamLeadEmail, setTeamLeadEmail] = useState(user?.officialEmail || '');
  const [teamLeadMobile, setTeamLeadMobile] = useState(user?.phoneNumber || '');
  const [teamLeadDesignation, setTeamLeadDesignation] = useState(user?.designation || 'Senior Project Lead & R&D Specialist');

  // Members count & list
  const [membersCount, setMembersCount] = useState(2);
  const [members, setMembers] = useState([
    { name: '', designation: 'Lead Systems Engineer', department: 'R&D & Engineering' },
    { name: '', designation: 'Field Operations Specialist', department: 'Deployment & Quality' }
  ]);

  // Idea & Solution Proposal State
  const [solutionTitle, setSolutionTitle] = useState('');
  const [solutionDescription, setSolutionDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('₹ 6.0 Lakhs (CSR Grant / Capital Allocation)');
  const [estimatedTimeWeeks, setEstimatedTimeWeeks] = useState(8);
  const [folderLink, setFolderLink] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadProblem() {
      setLoading(true);
      if (id) {
        const found = await problemsService.getProblemById(id);
        setProblem(found);
        if (found && !solutionTitle) {
          setSolutionTitle(`Industrial Solution & Deployment Blueprint for ${found.title}`);
        }
      }
      setLoading(false);
    }
    loadProblem();
  }, [id]);

  const handleMemberCountChange = (count) => {
    const num = Math.max(0, parseInt(count, 10) || 0);
    setMembersCount(num);
    const newMembers = [...members];
    while (newMembers.length < num) {
      newMembers.push({ name: '', designation: 'Technical Specialist', department: 'Operations & Engineering' });
    }
    setMembers(newMembers.slice(0, num));
  };

  const handleMemberFieldChange = (index, field, value) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleFileChange = (e) => {
    const fileList = Array.from(e.target.files || []);
    const mapped = fileList.map(f => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
      type: f.name.split('.').pop() || 'doc'
    }));
    setUploadedFiles(mapped);
  };

  // Step Wizard State
  const [activeStep, setActiveStep] = useState(1);

  const validateStep1 = () => {
    const stepErrors = {};
    if (!teamLeadName.trim()) stepErrors.teamLeadName = 'Team Lead Name is required';
    if (!teamLeadEmail.trim()) stepErrors.teamLeadEmail = 'Team Lead Email is required';
    if (!teamLeadMobile.trim()) stepErrors.teamLeadMobile = 'Mobile Number is required';
    members.forEach((m, idx) => {
      if (!m.name.trim()) stepErrors[`member_${idx}_name`] = `Member #${idx + 1} Name is required`;
    });
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep2 = () => {
    const stepErrors = {};
    if (!solutionTitle.trim()) stepErrors.solutionTitle = 'Solution Title is required';
    if (!solutionDescription.trim() || solutionDescription.trim().length < 20) {
      stepErrors.solutionDescription = 'Please provide a detailed technical methodology (min 20 characters)';
    }
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (activeStep === 1) {
      if (validateStep1()) setActiveStep(2);
    } else if (activeStep === 2) {
      if (validateStep2()) setActiveStep(3);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2()) {
      alert('Please fill in all required fields in earlier steps.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit Idea Solution to Admin
      await problemsService.submitIdeaSolution({
        problemId: problem?.id || id,
        problemTitle: problem?.title || 'Civic Problem Challenge',
        category: problem?.category || 'General Civic Infrastructure',
        domain: problem?.domain || problem?.category || 'General Civic Infrastructure',
        submitterType: 'industry',
        companyId: user?.id || user?.companyId || 'IND-CORP-01',
        companyName: user?.companyName || 'Corporate Innovation Partner',
        teamLeadName,
        teamLeadEmail,
        teamLeadMobile,
        teamLeadDesignation,
        membersCount: members.length,
        members,
        solutionTitle,
        description: solutionDescription,
        technicalApproach: solutionDescription,
        estimatedCost,
        estimatedTimeWeeks,
        folderLink,
        files: uploadedFiles
      });

      // 2. Also register internal industry project team
      await problemsService.saveIndustryTeamProject({
        problemId: problem?.id || id,
        problemTitle: problem?.title || 'Civic Problem Challenge',
        problemCategory: problem?.category || 'General Civic Infrastructure',
        district: problem?.district || 'Jharkhand',
        citizenName: problem?.citizenName || 'Citizen',
        citizenPhone: problem?.citizenPhone || '',
        companyName: user?.companyName || 'Corporate Innovation Partner',
        teamLeadName,
        teamLeadEmail,
        teamLeadMobile,
        teamLeadDesignation,
        membersCount: members.length,
        members
      });

      setIsSubmitting(false);
      setSuccessModal(true);
    } catch (err) {
      setIsSubmitting(false);
      alert('Failed to submit idea. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="univ-dashboard-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading problem statement details...</p>
      </div>
    );
  }

  return (
    <div className="univ-dashboard-wrapper" style={{ minHeight: '100vh', background: '#F4F7F5' }}>
      {/* Top Navbar */}
      <header className="univ-navbar">
        <div className="univ-navbar-inner">
          <div className="univ-brand-group">
            <JharkhandCrest size={38} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '1.1rem', color: '#024D24', letterSpacing: '-0.3px' }}>
                  CivicConnect
                </strong>
                <span className="univ-portal-badge" style={{ background: '#E0F2FE', color: '#0369A1', borderColor: '#BAE6FD' }}>
                  Industry Proposal Form
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                {user?.companyName || 'Corporate Innovation Partner'} • Government of Jharkhand
              </div>
            </div>
          </div>

          <div className="univ-nav-actions">
            <button
              type="button"
              className="univ-nav-btn"
              onClick={onBackToProblems || (() => navigate('/industry/problems'))}
              style={{ background: '#FFFFFF', color: '#024D24', border: '1px solid rgba(2, 77, 36, 0.25)', fontWeight: 700 }}
            >
              <span>← Problems List</span>
            </button>
            <button
              type="button"
              className="univ-nav-btn univ-btn-backhome"
              onClick={onBackToDashboard || (() => navigate('/industry/dashboard'))}
            >
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="univ-content-container" style={{ padding: '24px 20px', maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Compact Problem Summary Banner */}
        {problem && (
          <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1.5px solid #047857', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(4, 120, 87, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#047857', background: '#ECFDF5', padding: '3px 10px', borderRadius: '20px' }}>
                {problem.category}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>
                ID: {problem.id} • District: <strong>{problem.district}</strong>
              </span>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '0' }}>
              {problem.title}
            </h2>
          </div>
        )}

        {/* Step Wizard Card */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          
          {/* Step Progress Bar Header */}
          <div className="univ-wizard-steps-bar">
            {/* Step 1 */}
            <div 
              className={`univ-wizard-step-item ${activeStep === 1 ? 'active' : activeStep > 1 ? 'completed' : ''}`}
              onClick={() => { if (activeStep > 1) setActiveStep(1); }}
            >
              <div className="univ-wizard-circle">
                {activeStep > 1 ? '' : '1'}
              </div>
              <div className="univ-wizard-step-label">
                <span className="step-num-txt">STEP 1</span>
                <span className="step-name-txt">Corporate Team</span>
              </div>
            </div>

            <div className={`univ-wizard-connector-line ${activeStep > 1 ? 'completed' : ''}`} />

            {/* Step 2 */}
            <div 
              className={`univ-wizard-step-item ${activeStep === 2 ? 'active' : activeStep > 2 ? 'completed' : ''}`}
              onClick={() => { if (activeStep > 2 || (activeStep === 1 && validateStep1())) setActiveStep(2); }}
            >
              <div className="univ-wizard-circle">
                {activeStep > 2 ? '' : '2'}
              </div>
              <div className="univ-wizard-step-label">
                <span className="step-num-txt">STEP 2</span>
                <span className="step-name-txt">Solution Blueprint</span>
              </div>
            </div>

            <div className={`univ-wizard-connector-line ${activeStep > 2 ? 'completed' : ''}`} />

            {/* Step 3 */}
            <div 
              className={`univ-wizard-step-item ${activeStep === 3 ? 'active' : ''}`}
              onClick={() => { if (validateStep1() && validateStep2()) setActiveStep(3); }}
            >
              <div className="univ-wizard-circle">
                3
              </div>
              <div className="univ-wizard-step-label">
                <span className="step-num-txt">STEP 3</span>
                <span className="step-name-txt">CSR Budget & Review</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitIdea} style={{ padding: '24px 28px' }}>
            
            {/* ========================================================================= */}
            {/* STEP 1: CORPORATE TEAM LEAD & ENGINEERS */}
            {/* ========================================================================= */}
            {activeStep === 1 && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span></span> Corporate Project Lead & Engineering Team
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: 0 }}>
                    Provide contact details for the project lead and technical team members executing the deployment.
                  </p>
                </div>

                {/* Team Lead Fields */}
                <div style={{ background: '#F8FAF9', padding: '18px 20px', borderRadius: '12px', border: '1.5px solid #E5E7EB', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#064E3B', margin: '0 0 14px 0' }}>
                    Project Lead Information
                  </h4>

                  <div className="univ-form-grid-2" style={{ marginBottom: '12px' }}>
                    <div className="univ-form-group" style={{ margin: 0 }}>
                      <label className="univ-form-label">
                        <span>Lead Name <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        value={teamLeadName}
                        onChange={(e) => setTeamLeadName(e.target.value)}
                        placeholder="e.g. Rajesh Kumar"
                        className={`univ-form-input ${errors.teamLeadName ? 'input-error' : ''}`}
                        required
                      />
                      {errors.teamLeadName && <span className="error-text">{errors.teamLeadName}</span>}
                    </div>

                    <div className="univ-form-group" style={{ margin: 0 }}>
                      <label className="univ-form-label">
                        <span>Official Email <span className="required">*</span></span>
                      </label>
                      <input
                        type="email"
                        value={teamLeadEmail}
                        onChange={(e) => setTeamLeadEmail(e.target.value)}
                        placeholder="e.g. rajesh.k@tatasteel.com"
                        className={`univ-form-input ${errors.teamLeadEmail ? 'input-error' : ''}`}
                        required
                      />
                      {errors.teamLeadEmail && <span className="error-text">{errors.teamLeadEmail}</span>}
                    </div>
                  </div>

                  <div className="univ-form-grid-2">
                    <div className="univ-form-group" style={{ margin: 0 }}>
                      <label className="univ-form-label">
                        <span>Mobile Phone Number <span className="required">*</span></span>
                      </label>
                      <input
                        type="tel"
                        value={teamLeadMobile}
                        onChange={(e) => setTeamLeadMobile(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className={`univ-form-input ${errors.teamLeadMobile ? 'input-error' : ''}`}
                        required
                      />
                      {errors.teamLeadMobile && <span className="error-text">{errors.teamLeadMobile}</span>}
                    </div>

                    <div className="univ-form-group" style={{ margin: 0 }}>
                      <label className="univ-form-label">
                        <span>Designation / Role in Company</span>
                      </label>
                      <input
                        type="text"
                        value={teamLeadDesignation}
                        onChange={(e) => setTeamLeadDesignation(e.target.value)}
                        placeholder="e.g. Principal Engineer / CSR Project Lead"
                        className="univ-form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#064E3B', margin: 0 }}>
                       Additional Team Members ({membersCount})
                    </h4>

                    <div className="stepper-actions">
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', marginRight: '6px' }}>Count:</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        disabled={membersCount <= 0}
                        onClick={() => handleMemberCountChange(membersCount - 1)}
                      >
                        -
                      </button>
                      <span className="stepper-value">{membersCount}</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        disabled={membersCount >= 8}
                        onClick={() => handleMemberCountChange(membersCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    {members.map((member, idx) => (
                      <div key={idx} className="roster-card" style={{ borderColor: '#A7F3D0', background: '#F0FDF4', padding: '12px 16px', margin: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'center' }}>
                          <div>
                            <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                              <span>Member #{idx + 1} Full Name <span className="required">*</span></span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Ananya Sen"
                              value={member.name}
                              onChange={(e) => handleMemberFieldChange(idx, 'name', e.target.value)}
                              className="univ-form-input"
                              style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                              required
                            />
                          </div>

                          <div>
                            <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                              <span>Designation</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Senior Specialist"
                              value={member.designation}
                              onChange={(e) => handleMemberFieldChange(idx, 'designation', e.target.value)}
                              className="univ-form-input"
                              style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                            />
                          </div>

                          <div>
                            <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                              <span>Department / Domain</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. IoT & Hardware"
                              value={member.department}
                              onChange={(e) => handleMemberFieldChange(idx, 'department', e.target.value)}
                              className="univ-form-input"
                              style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className="univ-wizard-actions-bar">
                  <button
                    type="button"
                    onClick={() => navigate('/industry/problems')}
                    className="univ-btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="univ-btn-primary"
                    style={{ minWidth: '220px', background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)' }}
                  >
                    <span>Next: Solution Blueprint →</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: TECHNICAL PROPOSAL & METHODOLOGY */}
            {/* ========================================================================= */}
            {activeStep === 2 && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span></span> Solution Blueprint & Technical Proposal
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: 0 }}>
                    Define the proposed industrial solution architecture, technical specifications, and implementation strategy.
                  </p>
                </div>

                {/* Solution Title */}
                <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                  <label className="univ-form-label">
                    <span>Solution / Blueprint Title <span className="required">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={solutionTitle}
                    onChange={(e) => setSolutionTitle(e.target.value)}
                    placeholder="e.g. Solar IoT Continuous Water Filtration & Supply System"
                    className={`univ-form-input ${errors.solutionTitle ? 'input-error' : ''}`}
                    required
                  />
                  {errors.solutionTitle && <span className="error-text">{errors.solutionTitle}</span>}
                </div>

                {/* Detailed Description */}
                <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                  <label className="univ-form-label">
                    <span>Detailed Solution Methodology & Industrial Plan <span className="required">*</span></span>
                    <span style={{ fontSize: '0.74rem', color: solutionDescription.trim().length >= 20 ? '#059669' : '#DC2626' }}>
                      {solutionDescription.trim().length} chars (min 20)
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    value={solutionDescription}
                    onChange={(e) => setSolutionDescription(e.target.value)}
                    placeholder="Describe your technical architecture, manufacturing/procurement approach, field deployment plan, and industrial capability committed..."
                    className={`univ-form-textarea ${errors.solutionDescription ? 'input-error' : ''}`}
                    required
                  />
                  {errors.solutionDescription && <span className="error-text">{errors.solutionDescription}</span>}
                </div>

                {/* Step 2 Actions */}
                <div className="univ-wizard-actions-bar">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="univ-btn-secondary"
                  >
                    ← Back to Team
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="univ-btn-primary"
                    style={{ minWidth: '220px', background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)' }}
                  >
                    <span>Next: Budget & Submit →</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: BUDGET, TIMELINE, ATTACHMENTS & SUBMIT */}
            {/* ========================================================================= */}
            {activeStep === 3 && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span></span> CSR Budget, Timeline & Submission
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: 0 }}>
                    Specify estimated CSR allocation, timeline, attach documents and submit for Admin evaluation.
                  </p>
                </div>

                {/* Budget & Timeline */}
                <div className="univ-form-grid-2" style={{ marginBottom: '16px' }}>
                  <div className="univ-form-group" style={{ margin: 0 }}>
                    <label className="univ-form-label">
                      <span>Estimated Budget / CSR Allocation</span>
                    </label>
                    <input
                      type="text"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="e.g. ₹ 6.0 Lakhs"
                      className="univ-form-input"
                    />
                  </div>

                  <div className="univ-form-group" style={{ margin: 0 }}>
                    <label className="univ-form-label">
                      <span>Duration in Weeks</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={estimatedTimeWeeks}
                      onChange={(e) => setEstimatedTimeWeeks(e.target.value)}
                      className="univ-form-input"
                    />
                  </div>
                </div>

                {/* File Attachment */}
                <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                  <label className="univ-form-label">
                    <span>Attach Deliverables / Schematics / Files</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="univ-form-input"
                    style={{ padding: '8px' }}
                  />
                  {uploadedFiles.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {uploadedFiles.map((f, i) => (
                        <span key={i} style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                           {f.name} ({f.size})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Folder Link */}
                <div className="univ-form-group" style={{ marginBottom: '18px' }}>
                  <label className="univ-form-label">
                    <span>Project Folder / Drive / Repository Link (Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={folderLink}
                    onChange={(e) => setFolderLink(e.target.value)}
                    placeholder="https://drive.google.com/... or https://github.com/..."
                    className="univ-form-input"
                  />
                </div>

                {/* Proposal Summary Preview Card */}
                <div style={{ background: '#F8FAF9', borderRadius: '12px', border: '1.5px solid #D1D5DB', padding: '16px', marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#064E3B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Proposal Overview Before Submission
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.82rem', color: '#374151' }}>
                    <div><strong>Solution:</strong> {solutionTitle || 'Untitled'}</div>
                    <div><strong>Project Lead:</strong> {teamLeadName || 'Not specified'}</div>
                    <div><strong>Team Size:</strong> {members.length + 1} Members</div>
                    <div><strong>Budget:</strong> {estimatedCost}</div>
                    <div><strong>Timeline:</strong> {estimatedTimeWeeks} Weeks</div>
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div className="univ-wizard-actions-bar">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="univ-btn-secondary"
                  >
                    ← Back to Blueprint
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="univ-btn-primary"
                    style={{ minWidth: '240px', background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)' }}
                  >
                    <span>
                      {isSubmitting ? 'Submitting Solution Idea...' : 'Submit Corporate Proposal'}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* SUCCESS MODAL */}
        {successModal && (
          <div className="modal-backdrop">
            <div className="modal-dialog" style={{ maxWidth: '560px' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                    Industry Corporate Action • Government of Jharkhand
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '2px' }}>
                    Solution Idea Successfully Submitted!
                  </h3>
                </div>
              </div>

              <div className="modal-body" style={{ padding: '26px', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ECFDF5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckIcon size={34} />
                </div>

                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064E3B', margin: '0 0 8px 0' }}>
                  Solution Reached Admin Portal for Review
                </h4>

                <p style={{ fontSize: '0.88rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '20px' }}>
                  Your proposal for <strong>{problem?.title}</strong> along with your corporate team roster has been submitted to the State Administration. Admin will review both university and industry submissions and pair you with a university partner.
                </p>

                <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px', textAlign: 'left', fontSize: '0.84rem', color: '#374151', marginBottom: '22px' }}>
                  <div><strong>Solution:</strong> {solutionTitle}</div>
                  <div style={{ marginTop: '4px' }}><strong> Team Lead:</strong> {teamLeadName} ({teamLeadEmail})</div>
                  <div style={{ marginTop: '4px' }}><strong> Team Size:</strong> {members.length + 1} Members</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/industry/dashboard')}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(6, 78, 59, 0.2)'
                    }}
                  >
                    Go to Industry Dashboard →
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/industry/problems')}
                    style={{
                      width: '100%',
                      background: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      color: '#374151',
                      padding: '11px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Browse Other Challenges
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
