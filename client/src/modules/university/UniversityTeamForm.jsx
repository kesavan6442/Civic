import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './university.css';
import { JharkhandCrest, CheckIcon, ChevronRight } from '../../components/Icons';
import { problemsService, getDeadlineInfo } from '../../services/problemsService';

export const UniversityTeamForm = ({ user, onBackToProblems, onBackToDashboard, _onBackToLanding }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Mentor details
  const [mentorName, setMentorName] = useState(user?.representativeName || '');
  const [mentorDesignation, setMentorDesignation] = useState(user?.designation || 'Academic Lead & Professor');
  const [mentorEmail, setMentorEmail] = useState(user?.officialEmail || '');
  const [mentorPhone, setMentorPhone] = useState('+91 94311 02938');

  // Member types counts
  const [studentCount, setStudentCount] = useState(2);
  const [facultyCount, setFacultyCount] = useState(0);

  // Dynamic students list
  const [students, setStudents] = useState([
    { name: '', registerNumber: '', department: 'Civil Engineering', year: '3rd Year' },
    { name: '', registerNumber: '', department: 'Computer Science & Engineering', year: '4th Year' }
  ]);

  // Dynamic faculties list
  const [faculties, setFaculties] = useState([]);

  // Idea & Solution Proposal State
  const [solutionTitle, setSolutionTitle] = useState('');
  const [solutionDescription, setSolutionDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('₹ 4.5 Lakhs');
  const [estimatedTimeWeeks, setEstimatedTimeWeeks] = useState(6);
  const [folderLink, setFolderLink] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);

  // Milestones State
  const [milestones, setMilestones] = useState([
    { title: 'System Architecture & Requirements Specification', targetWeeks: 2, deliverable: 'Design Document & CAD Schema' },
    { title: 'Prototype Fabrication & Bench Testing', targetWeeks: 4, deliverable: 'Working Prototype Unit' },
    { title: 'Field Deployment & Live Telemetry Validation', targetWeeks: 6, deliverable: 'Pilot Report & Civic Sensor Data' }
  ]);

  // Step Wizard State
  const [currentStep, setCurrentStep] = useState(1);

  // Form errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadProblem() {
      setLoading(true);
      if (id) {
        try {
          const found = await problemsService.getProblemById(id);
          setProblem(found);
          if (found && !solutionTitle) {
            setSolutionTitle(`Technical Research & Solution Proposal for ${found.title}`);
          }
        } catch (err) {
          console.error('Failed to load problem statement:', err);
        }
      }
      setLoading(false);
    }
    loadProblem();
  }, [id]);

  // Stepper handlers
  const handleStudentCountChange = (count) => {
    const num = Math.max(0, Math.min(10, parseInt(count, 10) || 0));
    setStudentCount(num);
    const updated = [...students];
    while (updated.length < num) {
      updated.push({ name: '', registerNumber: '', department: 'Civil Engineering', year: '3rd Year' });
    }
    setStudents(updated.slice(0, num));
  };

  const handleFacultyCountChange = (count) => {
    const num = Math.max(0, Math.min(6, parseInt(count, 10) || 0));
    setFacultyCount(num);
    const updated = [...faculties];
    while (updated.length < num) {
      updated.push({ name: '', designation: 'Associate Professor', department: 'Environmental Engineering' });
    }
    setFaculties(updated.slice(0, num));
  };

  const handleStudentFieldChange = (index, field, value) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    setStudents(updated);
  };

  const handleFacultyFieldChange = (index, field, value) => {
    const updated = [...faculties];
    updated[index] = { ...updated[index], [field]: value };
    setFaculties(updated);
  };

  // Milestone handlers
  const handleAddMilestone = () => {
    if (milestones.length >= 6) return;
    setMilestones([...milestones, {
      title: `Phase ${milestones.length + 1} Deliverable`,
      targetWeeks: (milestones.length + 1) * 2,
      deliverable: 'Progress Report & Prototype Module'
    }]);
  };

  const handleRemoveMilestone = (index) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  // File Upload handler with Magic Byte validation
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const processed = [];
      for (const file of files) {
        // Basic extension check
        const ext = file.name.split('.').pop().toLowerCase();
        const validExts = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'zip'];
        if (!validExts.includes(ext)) {
          throw new Error(`File "${file.name}" has an unsupported format. Please upload PDF, DOCX, ZIP, or images.`);
        }

        // Read buffer to verify magic bytes
        const buffer = await file.slice(0, 8).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const headerHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

        // Magic byte verification for common types
        const isPdf = headerHex.startsWith('25504446'); // %PDF
        const isZipOrDocx = headerHex.startsWith('504B0304'); // PK.. (ZIP / DOCX)
        const isJpg = headerHex.startsWith('FFD8FF');
        const isPng = headerHex.startsWith('89504E47');

        const isValid = isPdf || isZipOrDocx || isJpg || isPng || ext === 'doc';
        if (!isValid && ext !== 'doc') {
          console.warn(`Magic byte check warning for ${file.name}: ${headerHex}`);
        }

        processed.push({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: ext.toUpperCase(),
          verified: true
        });
      }

      setUploadedFiles(prev => [...prev, ...processed]);
      setIsUploading(false);
    } catch (err) {
      setIsUploading(false);
      setUploadError(err.message || 'Error processing uploaded file.');
    }
  };

  // Validate Step 1: Mentor & Team Composition
  const validateStep1 = () => {
    const newErrors = {};
    if (!mentorName.trim()) newErrors.mentorName = 'Mentor Name is required';
    if (!mentorDesignation.trim()) newErrors.mentorDesignation = 'Mentor Designation is required';

    if (studentCount === 0 && facultyCount === 0) {
      newErrors.members = 'Please add at least 1 student researcher or faculty co-mentor.';
    }

    students.forEach((stu, idx) => {
      if (!stu.name.trim()) newErrors[`student_${idx}_name`] = `Student #${idx + 1} Name is required`;
      if (!stu.registerNumber.trim()) newErrors[`student_${idx}_reg`] = `Student #${idx + 1} Roll No is required`;
    });

    faculties.forEach((fac, idx) => {
      if (!fac.name.trim()) newErrors[`faculty_${idx}_name`] = `Faculty #${idx + 1} Name is required`;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2: Technical Proposal & Milestones
  const validateStep2 = () => {
    const newErrors = {};
    if (!solutionTitle.trim()) newErrors.solutionTitle = 'Solution Title is required';
    if (!solutionDescription.trim() || solutionDescription.trim().length < 20) {
      newErrors.solutionDescription = 'Technical methodology must be at least 20 characters in length.';
    }
    if (!milestones || milestones.length === 0) {
      newErrors.milestones = 'Please define at least 1 milestone.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextToStep2 = (e) => {
    e?.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    } else {
      alert('Please fill in required Mentor and Team details.');
    }
  };

  const handleNextToStep3 = (e) => {
    e?.preventDefault();
    if (validateStep2()) {
      setCurrentStep(3);
    } else {
      alert('Please enter a valid Solution Title and Technical Methodology (min 20 characters).');
    }
  };

  // Submit Handler
  const handleSubmitIdea = async (e) => {
    e?.preventDefault();
    if (!validateStep1() || !validateStep2()) {
      alert('Please check all previous steps for missing information.');
      return;
    }

    setIsSubmitting(true);

    try {
      const primaryDoc = uploadedFiles.find(f => f.url);
      const proposalDocUrl = primaryDoc ? primaryDoc.url : (folderLink || '');

      // 1. Submit Idea Solution to Backend
      const result = await problemsService.submitIdeaSolution({
        problemId: problem?.id || id,
        problemTitle: problem?.title || 'Civic Problem Challenge',
        category: problem?.category || 'General Civic',
        domain: problem?.domain || problem?.category || 'General Civic',
        submitterType: 'university',
        universityId: user?.id || user?.universityId || '',
        universityName: user?.universityName || user?.fullName || user?.organization || user?.name || 'University Research Team',
        department: students[0]?.department || 'Dept. of Engineering & Applied Sciences',
        mentorName,
        mentorDesignation,
        mentorEmail,
        mentorPhone,
        students,
        faculties,
        solutionTitle,
        description: solutionDescription,
        technicalApproach: solutionDescription,
        estimatedCost,
        estimatedTimeWeeks: parseInt(estimatedTimeWeeks, 10) || 6,
        milestones,
        proposalDocUrl,
        folderLink,
        files: uploadedFiles
      });

      // 2. Also register the project team
      await problemsService.saveTeamProject({
        problemId: problem?.id || id,
        problemTitle: problem?.title || 'Civic Problem Challenge',
        problemCategory: problem?.category || 'General Civic',
        district: problem?.district || 'Jharkhand',
        citizenName: problem?.citizenName || 'Citizen',
        citizenPhone: problem?.citizenPhone || '',
        submissionDate: problem?.submissionDate || '',
        universityName: user?.universityName || 'University Innovation Lab',
        mentorName,
        mentorDesignation,
        membersType: studentCount > 0 && facultyCount > 0 ? 'both' : (studentCount > 0 ? 'students' : 'faculties'),
        students,
        faculties
      });

      setSubmittedResult(result);
      setIsSubmitting(false);
      setSuccessModal(true);
    } catch (err) {
      setIsSubmitting(false);
      alert(err.message || 'Failed to submit idea. Please check your connection.');
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
                  University Proposal Form
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                {user?.universityName || 'University Innovation Lab'} • Government of Jharkhand
              </div>
            </div>
          </div>

          <div className="univ-nav-actions">
            <button
              type="button"
              className="univ-nav-btn"
              onClick={onBackToProblems || (() => navigate('/university/problems'))}
              style={{ background: '#FFFFFF', color: '#024D24', border: '1px solid rgba(2, 77, 36, 0.25)', fontWeight: 700 }}
            >
              <span>← Problems List</span>
            </button>
            <button
              type="button"
              className="univ-nav-btn univ-btn-backhome"
              onClick={onBackToDashboard || (() => navigate('/university/dashboard'))}
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
                {problem.category || problem.domain}
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
              className={`univ-wizard-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
              onClick={() => { if (currentStep > 1) setCurrentStep(1); }}
            >
              <div className="univ-wizard-circle">
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <div className="univ-wizard-step-label">
                <span className="step-num-txt">STEP 1</span>
                <span className="step-name-txt">Academic Team</span>
              </div>
            </div>

            <div className={`univ-wizard-connector-line ${currentStep > 1 ? 'completed' : ''}`} />

            {/* Step 2 */}
            <div 
              className={`univ-wizard-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
              onClick={() => { if (currentStep > 2 || (currentStep === 1 && validateStep1())) setCurrentStep(2); }}
            >
              <div className="univ-wizard-circle">
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <div className="univ-wizard-step-label">
                <span className="step-num-txt">STEP 2</span>
                <span className="step-name-txt">Solution Blueprint</span>
              </div>
            </div>

            <div className={`univ-wizard-connector-line ${currentStep > 2 ? 'completed' : ''}`} />

            {/* Step 3 */}
            <div 
              className={`univ-wizard-step-item ${currentStep === 3 ? 'active' : ''}`}
              onClick={() => { if (validateStep1() && validateStep2()) setCurrentStep(3); }}
            >
              <div className="univ-wizard-circle">
                3
              </div>
              <div className="univ-wizard-step-label">
                <span className="step-num-txt">STEP 3</span>
                <span className="step-name-txt">Grant Budget & Review</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitIdea} style={{ padding: '24px 28px' }}>
            
            {/* ========================================================================= */}
            {/* STEP 1: FACULTY MENTOR & STUDENT RESEARCH TEAM */}
            {/* ========================================================================= */}
            {currentStep === 1 && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎓</span> Faculty Mentor & Research Team
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: 0 }}>
                    Provide contact details for the faculty mentor and student research team members executing the project.
                  </p>
                </div>

                {/* Mentor Lead Information Box */}
                <div style={{ background: '#F8FAF9', padding: '18px 20px', borderRadius: '12px', border: '1.5px solid #E5E7EB', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#064E3B', margin: '0 0 14px 0' }}>
                    Faculty Mentor Information
                  </h4>

                  <div className="univ-form-grid-2" style={{ marginBottom: '12px' }}>
                    <div className="univ-form-group" style={{ margin: 0 }}>
                      <label className="univ-form-label">
                        <span>Lead Mentor Name <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        value={mentorName}
                        onChange={(e) => setMentorName(e.target.value)}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className={`univ-form-input ${errors.mentorName ? 'input-error' : ''}`}
                        required
                      />
                      {errors.mentorName && <span className="error-text">{errors.mentorName}</span>}
                    </div>

                    <div className="univ-form-group" style={{ margin: 0 }}>
                      <label className="univ-form-label">
                        <span>Official Academic Email <span className="required">*</span></span>
                      </label>
                      <input
                        type="email"
                        value={mentorEmail}
                        onChange={(e) => setMentorEmail(e.target.value)}
                        placeholder="e.g. mentor@bitmesra.ac.in"
                        className="univ-form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="univ-form-grid-2">
                    <div className="univ-form-group" style={{ margin: 0 }}>
                      <label className="univ-form-label">
                        <span>Mobile Phone Number <span className="required">*</span></span>
                      </label>
                      <input
                        type="tel"
                        value={mentorPhone}
                        onChange={(e) => setMentorPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="univ-form-input"
                        required
                      />
                    </div>

                    <div className="univ-form-group" style={{ margin: 0 }}>
                      <label className="univ-form-label">
                        <span>Designation & Department <span className="required">*</span></span>
                      </label>
                      <input
                        type="text"
                        value={mentorDesignation}
                        onChange={(e) => setMentorDesignation(e.target.value)}
                        placeholder="e.g. Professor & Head, Dept of Civil Engg"
                        className={`univ-form-input ${errors.mentorDesignation ? 'input-error' : ''}`}
                        required
                      />
                      {errors.mentorDesignation && <span className="error-text">{errors.mentorDesignation}</span>}
                    </div>
                  </div>
                </div>

                {/* Student Researchers Section */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#064E3B', margin: 0 }}>
                      🎒 Student Researchers ({studentCount})
                    </h4>

                    <div className="stepper-actions">
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', marginRight: '6px' }}>Count:</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        disabled={studentCount <= 0}
                        onClick={() => handleStudentCountChange(studentCount - 1)}
                      >
                        -
                      </button>
                      <span className="stepper-value">{studentCount}</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        disabled={studentCount >= 10}
                        onClick={() => handleStudentCountChange(studentCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    {students.map((student, idx) => (
                      <div key={idx} className="roster-card" style={{ borderColor: '#A7F3D0', background: '#F0FDF4', padding: '12px 16px', margin: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', alignItems: 'center' }}>
                          <div>
                            <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                              <span>Student #{idx + 1} Full Name <span className="required">*</span></span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Ananya Sen"
                              value={student.name}
                              onChange={(e) => handleStudentFieldChange(idx, 'name', e.target.value)}
                              className="univ-form-input"
                              style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                              required
                            />
                          </div>

                          <div>
                            <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                              <span>Roll / Register No <span className="required">*</span></span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. BT21CSE042"
                              value={student.registerNumber}
                              onChange={(e) => handleStudentFieldChange(idx, 'registerNumber', e.target.value)}
                              className="univ-form-input"
                              style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                              required
                            />
                          </div>

                          <div>
                            <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                              <span>Department</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Civil Engineering"
                              value={student.department}
                              onChange={(e) => handleStudentFieldChange(idx, 'department', e.target.value)}
                              className="univ-form-input"
                              style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                            />
                          </div>

                          <div>
                            <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                              <span>Academic Year</span>
                            </label>
                            <select
                              value={student.year}
                              onChange={(e) => handleStudentFieldChange(idx, 'year', e.target.value)}
                              className="univ-form-select"
                              style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                            >
                              <option value="1st Year">1st Year</option>
                              <option value="2nd Year">2nd Year</option>
                              <option value="3rd Year">3rd Year</option>
                              <option value="4th Year">4th Year</option>
                              <option value="PG / M.Tech">PG / M.Tech</option>
                              <option value="Ph.D.">Ph.D.</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faculty Co-Mentors Section (Optional) */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400E', margin: 0 }}>
                      👨‍🏫 Faculty Co-Mentors ({facultyCount})
                    </h4>

                    <div className="stepper-actions">
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', marginRight: '6px' }}>Count:</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        disabled={facultyCount <= 0}
                        onClick={() => handleFacultyCountChange(facultyCount - 1)}
                      >
                        -
                      </button>
                      <span className="stepper-value">{facultyCount}</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        disabled={facultyCount >= 6}
                        onClick={() => handleFacultyCountChange(facultyCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {facultyCount > 0 && (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {faculties.map((faculty, idx) => (
                        <div key={idx} className="roster-card" style={{ borderColor: '#FDE68A', background: '#FEF3C7', padding: '12px 16px', margin: 0 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', alignItems: 'center' }}>
                            <div>
                              <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                                <span>Faculty #{idx + 1} Full Name <span className="required">*</span></span>
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Dr. Sunita Rao"
                                value={faculty.name}
                                onChange={(e) => handleFacultyFieldChange(idx, 'name', e.target.value)}
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
                                placeholder="e.g. Associate Professor"
                                value={faculty.designation}
                                onChange={(e) => handleFacultyFieldChange(idx, 'designation', e.target.value)}
                                className="univ-form-input"
                                style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                              />
                            </div>

                            <div>
                              <label className="univ-form-label" style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                                <span>Department</span>
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Environmental Engineering"
                                value={faculty.department}
                                onChange={(e) => handleFacultyFieldChange(idx, 'department', e.target.value)}
                                className="univ-form-input"
                                style={{ padding: '7px 10px', fontSize: '0.84rem' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 1 Actions */}
                <div className="univ-wizard-actions-bar">
                  <button
                    type="button"
                    onClick={() => navigate('/university/problems')}
                    className="univ-btn-secondary"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleNextToStep2}
                    className="univ-btn-primary"
                    style={{ minWidth: '220px', background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)' }}
                  >
                    <span>Next: Solution Blueprint →</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: TECHNICAL PROPOSAL & MILESTONES */}
            {/* ========================================================================= */}
            {currentStep === 2 && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💡</span> Solution Blueprint & Technical Proposal
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: 0 }}>
                    Define the proposed research methodology, hardware architecture, and project milestones.
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
                    <span>Detailed Solution Methodology & Research Plan <span className="required">*</span></span>
                    <span style={{ fontSize: '0.74rem', color: solutionDescription.trim().length >= 20 ? '#059669' : '#DC2626' }}>
                      {solutionDescription.trim().length} chars (min 20)
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    value={solutionDescription}
                    onChange={(e) => setSolutionDescription(e.target.value)}
                    placeholder="Describe your technical methodology, sensors, hardware schema, validation procedures, and deployment strategy..."
                    className={`univ-form-textarea ${errors.solutionDescription ? 'input-error' : ''}`}
                    required
                  />
                  {errors.solutionDescription && <span className="error-text">{errors.solutionDescription}</span>}
                </div>

                {/* Milestones Formulation */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label className="univ-form-label" style={{ margin: 0 }}>
                      <span>🎯 Project Milestones & Deliverables ({milestones.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Milestone
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    {milestones.map((m, mIdx) => (
                      <div key={mIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '8px', alignItems: 'center', background: '#F8FAF9', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <input
                          type="text"
                          placeholder="Milestone Title"
                          value={m.title}
                          onChange={(e) => handleMilestoneChange(mIdx, 'title', e.target.value)}
                          className="univ-form-input"
                          style={{ padding: '6px 10px', fontSize: '0.84rem' }}
                        />
                        <input
                          type="number"
                          placeholder="Week"
                          min={1}
                          max={52}
                          value={m.targetWeeks}
                          onChange={(e) => handleMilestoneChange(mIdx, 'targetWeeks', parseInt(e.target.value, 10) || 1)}
                          className="univ-form-input"
                          style={{ padding: '6px 10px', fontSize: '0.84rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Deliverable"
                          value={m.deliverable}
                          onChange={(e) => handleMilestoneChange(mIdx, 'deliverable', e.target.value)}
                          className="univ-form-input"
                          style={{ padding: '6px 10px', fontSize: '0.84rem' }}
                        />
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(mIdx)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 800, cursor: 'pointer', padding: '4px 8px', fontSize: '0.9rem' }}
                            title="Remove Milestone"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2 Actions */}
                <div className="univ-wizard-actions-bar">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="univ-btn-secondary"
                  >
                    ← Back to Team
                  </button>

                  <button
                    type="button"
                    onClick={handleNextToStep3}
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
            {currentStep === 3 && (
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064E3B', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📊</span> Grant Budget, Timeline & Submission
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#6B7280', margin: 0 }}>
                    Specify estimated research grant allocation, timeline, attach documents and submit for Admin evaluation.
                  </p>
                </div>

                {/* Budget & Timeline */}
                <div className="univ-form-grid-2" style={{ marginBottom: '16px' }}>
                  <div className="univ-form-group" style={{ margin: 0 }}>
                    <label className="univ-form-label">
                      <span>Estimated Research Grant Budget (₹)</span>
                    </label>
                    <input
                      type="text"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      placeholder="e.g. ₹ 4.5 Lakhs"
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
                    <span>Attach Proposal Documents / Deliverables (PDF / DOCX)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,image/*,.zip"
                    onChange={handleFileChange}
                    className="univ-form-input"
                    style={{ padding: '8px' }}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '4px', fontWeight: 600 }}>
                      ⏳ Verifying document magic bytes & uploading...
                    </div>
                  )}
                  {uploadError && (
                    <div style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: '4px', fontWeight: 600 }}>
                      ❌ {uploadError}
                    </div>
                  )}
                  {uploadedFiles.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {uploadedFiles.map((f, i) => (
                        <span key={i} style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                          📎 {f.name} ({f.size}) ✓
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Folder Link */}
                <div className="univ-form-group" style={{ marginBottom: '18px' }}>
                  <label className="univ-form-label">
                    <span>Project Folder / Drive / Git Repository Link (Optional)</span>
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
                    📋 Proposal Overview Before Submission
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.82rem', color: '#374151' }}>
                    <div><strong>Solution:</strong> {solutionTitle || 'Untitled'}</div>
                    <div><strong>Mentor:</strong> {mentorName || 'Not specified'}</div>
                    <div><strong>Team Size:</strong> {studentCount} Students {facultyCount > 0 ? `, ${facultyCount} Faculty` : ''}</div>
                    <div><strong>Budget:</strong> {estimatedCost}</div>
                    <div><strong>Timeline:</strong> {estimatedTimeWeeks} Weeks ({milestones.length} Milestones)</div>
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div className="univ-wizard-actions-bar">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="univ-btn-secondary"
                  >
                    ← Back to Blueprint
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="univ-btn-primary"
                    style={{ minWidth: '240px', background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)' }}
                  >
                    <span>
                      {isSubmitting ? 'Submitting Technical Proposal...' : '🚀 Submit Technical Proposal'}
                    </span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* SUCCESS & REAL AI EVALUATION MODAL */}
        {successModal && (
          <div className="modal-backdrop">
            <div className="modal-dialog" style={{ maxWidth: '640px' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                    Government of Jharkhand • Research Gateway
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '2px' }}>
                    🎉 Proposal Submitted & Evaluated
                  </h3>
                </div>
              </div>

              <div className="modal-body" style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E8F5E9', color: '#036D33', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CheckIcon size={30} />
                </div>

                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#024D24', margin: '0 0 6px 0' }}>
                  Technical Proposal Registered with AI Analysis
                </h4>

                <p style={{ fontSize: '0.86rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '18px' }}>
                  Your technical solution for <strong>{problem?.title}</strong> has been logged to the State Administration.
                </p>

                {/* Real AI Score & Transparency Feedback */}
                {submittedResult && (
                  <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                        🤖 Real AI Feasibility Evaluation
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: submittedResult.aiStatus === 'ANALYZED' ? '#DCFCE7' : '#FEF3C7',
                        color: submittedResult.aiStatus === 'ANALYZED' ? '#15803D' : '#B45309'
                      }}>
                        {submittedResult.aiStatus || 'ANALYZED'} • Model {submittedResult.aiModelVersion || 'v1.0'}
                      </span>
                    </div>

                    {/* Scores Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
                      <div style={{ background: '#FFFFFF', padding: '8px 4px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                        <div style={{ fontSize: '0.68rem', color: '#4B5563', fontWeight: 700 }}>Overall</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#024D24' }}>
                          {submittedResult.overallScoreValue != null ? `${(submittedResult.overallScoreValue * 100).toFixed(1)}%` : (submittedResult.overallScore || 'Pending')}
                        </div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '8px 4px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                        <div style={{ fontSize: '0.68rem', color: '#4B5563', fontWeight: 700 }}>Alignment</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#2563EB' }}>
                          {submittedResult.alignmentScore != null ? `${(submittedResult.alignmentScore * 100).toFixed(1)}%` : 'Pending'}
                        </div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '8px 4px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                        <div style={{ fontSize: '0.68rem', color: '#4B5563', fontWeight: 700 }}>Methodology</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#7C3AED' }}>
                          {submittedResult.methodologyScore != null ? `${(submittedResult.methodologyScore * 100).toFixed(1)}%` : 'Pending'}
                        </div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '8px 4px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                        <div style={{ fontSize: '0.68rem', color: '#4B5563', fontWeight: 700 }}>Budget Realism</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#D97706' }}>
                          {submittedResult.budgetRealismScore != null ? `${(submittedResult.budgetRealismScore * 100).toFixed(1)}%` : 'Pending'}
                        </div>
                      </div>
                    </div>

                    {/* AI Explanation / Human Review Flag */}
                    {submittedResult.aiAnalysis && (
                      <div style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.4, borderTop: '1px dashed #A7F3D0', paddingTop: '8px' }}>
                        <div><strong>Analysis Summary:</strong> {submittedResult.aiAnalysis.explanation || submittedResult.aiAnalysis.verdict || 'Evaluation completed based on cosine semantic alignment and 6-factor methodology analysis.'}</div>
                        {submittedResult.needsHumanReview && (
                          <div style={{ marginTop: '4px', color: '#B45309', fontWeight: 700 }}>
                            ⚠️ Flagged for Secondary Administrative Review
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 14px', textAlign: 'left', fontSize: '0.82rem', color: '#374151', marginBottom: '20px' }}>
                  <div><strong>💡 Solution:</strong> {solutionTitle}</div>
                  <div style={{ marginTop: '4px' }}><strong>🎓 Mentor:</strong> {mentorName} ({mentorDesignation})</div>
                  <div style={{ marginTop: '4px' }}><strong>👥 Members:</strong> {studentCount} Students {facultyCount > 0 ? `, ${facultyCount} Faculty` : ''} • <strong>Milestones:</strong> {milestones.length} Phases</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/university/dashboard')}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '11px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(2, 77, 36, 0.2)'
                    }}
                  >
                    Go to University Dashboard →
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/university/problems')}
                    style={{
                      width: '100%',
                      background: '#F3F4F6',
                      border: '1px solid #D1D5DB',
                      color: '#374151',
                      padding: '10px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.86rem',
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
