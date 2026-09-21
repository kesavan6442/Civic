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

  // Form errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadProblem() {
      setLoading(true);
      if (id) {
        const found = await problemsService.getProblemById(id);
        setProblem(found);
        if (found && !solutionTitle) {
          setSolutionTitle(`Technical Solution & Working Prototype for ${found.title}`);
        }
      }
      setLoading(false);
    }
    loadProblem();
  }, [id]);

  // Handle student count change
  const handleStudentCountChange = (count) => {
    const num = Math.max(0, parseInt(count, 10) || 0);
    setStudentCount(num);
    const newStudents = [...students];
    while (newStudents.length < num) {
      newStudents.push({ name: '', registerNumber: '', department: 'Computer Science & Engineering', year: '3rd Year' });
    }
    setStudents(newStudents.slice(0, num));
  };

  // Handle faculty count change
  const handleFacultyCountChange = (count) => {
    const num = Math.max(0, parseInt(count, 10) || 0);
    setFacultyCount(num);
    const newFaculties = [...faculties];
    while (newFaculties.length < num) {
      newFaculties.push({ name: '', designation: 'Assistant Professor', department: 'Engineering & Technology' });
    }
    setFaculties(newFaculties.slice(0, num));
  };

  // Update specific student field
  const handleStudentFieldChange = (index, field, value) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    setStudents(updated);
  };

  // Update specific faculty field
  const handleFacultyFieldChange = (index, field, value) => {
    const updated = [...faculties];
    updated[index] = { ...updated[index], [field]: value };
    setFaculties(updated);
  };

  // Milestone handlers
  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      { title: `Milestone #${milestones.length + 1}`, targetWeeks: (milestones.length + 1) * 2, deliverable: 'Progress Milestone Report' }
    ]);
  };

  const handleRemoveMilestone = (index) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // Handle file selection with server-side magic byte validation
  const handleFileChange = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;
    setUploadError('');
    setIsUploading(true);
    const newFiles = [...uploadedFiles];

    for (const file of fileList) {
      try {
        const uploaded = await problemsService.uploadMediaFile(file);
        newFiles.push({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.name.split('.').pop() || 'doc',
          url: uploaded.fileUrl || uploaded.url || ''
        });
      } catch (err) {
        setUploadError(err.message || `Failed to upload ${file.name}`);
      }
    }
    setUploadedFiles(newFiles);
    setIsUploading(false);
  };

  // Submit Handler
  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!mentorName.trim()) newErrors.mentorName = 'Mentor Name is required';
    if (!mentorDesignation.trim()) newErrors.mentorDesignation = 'Mentor Designation is required';
    if (!solutionTitle.trim()) newErrors.solutionTitle = 'Solution / Idea Title is required';
    if (!solutionDescription.trim() || solutionDescription.trim().length < 20) {
      newErrors.solutionDescription = 'Technical approach and methodology must be at least 20 characters in length.';
    }

    if (studentCount === 0 && facultyCount === 0) {
      newErrors.members = 'Please add at least 1 student or 1 faculty member to the team';
    }

    // Validate students
    students.forEach((stu, idx) => {
      if (!stu.name.trim()) newErrors[`student_${idx}_name`] = `Student #${idx + 1} Name is required`;
      if (!stu.registerNumber.trim()) newErrors[`student_${idx}_reg`] = `Student #${idx + 1} Register Number is required`;
    });

    // Validate faculties
    faculties.forEach((fac, idx) => {
      if (!fac.name.trim()) newErrors[`faculty_${idx}_name`] = `Faculty #${idx + 1} Name is required`;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Please fill in all required team and solution details.');
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
        universityId: user?.id || user?.universityId || user?.universityId || '',
        universityName: user?.universityName || user?.fullName || user?.organization || user?.name || '',
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
                <span className="univ-portal-badge">Team Formation & Idea Submission</span>
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

      {/* Main Form Content */}
      <main className="univ-content-container" style={{ padding: '30px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* PROBLEM SUMMARY BANNER */}
        {problem && (
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #036D33', padding: '22px 26px', marginBottom: '28px', boxShadow: '0 4px 16px rgba(3, 109, 51, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#024D24', background: '#E8F5E9', padding: '4px 12px', borderRadius: '20px' }}>
                {problem.category}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>
                ID: {problem.id} • District: <strong>{problem.district}</strong>
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 10px 0' }}>
              {problem.title}
            </h2>

            <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.55, margin: '0 0 14px 0' }}>
              {problem.description}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#6B7280', borderTop: '1px solid #E5E7EB', paddingTop: '10px' }}>
              <span>👤 Submitter: <strong>{problem.citizenName}</strong> ({problem.citizenPhone})</span>
              <span>📍 Address: <strong>{problem.locationAddress || `${problem.district}, Jharkhand`}</strong></span>
              <span>⚡ Priority: <strong style={{ color: problem.urgency === 'Critical' ? '#DC2626' : '#D97706' }}>{problem.urgency || 'High'}</strong></span>
            </div>
          </div>
        )}

        {/* TEAM FORMATION AND IDEA SUBMISSION FORM */}
        <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)', color: '#FFFFFF', padding: '24px 30px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0' }}>
              👥 1. Form Project Research Team & 💡 2. Submit Solution Idea
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.88)', margin: 0 }}>
              Specify faculty mentor, participating student/faculty researchers, and your comprehensive technical idea. Admin will review your solution and pair your university with an industry corporate partner.
            </p>
          </div>

          <form onSubmit={handleSubmitIdea} style={{ padding: '30px' }}>
            
            {/* SECTION 1: MENTOR DETAILS */}
            <div style={{ background: '#F8FAF9', padding: '22px 24px', borderRadius: '14px', border: '1.5px solid #E5E7EB', marginBottom: '26px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#024D24', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎓</span>
                <span>Section 1: Team Lead / Faculty Mentor Details</span>
              </h4>

              <div className="univ-form-grid-2">
                <div className="univ-form-group" style={{ margin: 0 }}>
                  <label className="univ-form-label">
                    <span>Mentor Full Name <span className="required">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Soren / Prof. Alok Verma"
                    className={`univ-form-input ${errors.mentorName ? 'input-error' : ''}`}
                    required
                  />
                  {errors.mentorName && <span className="error-text">{errors.mentorName}</span>}
                </div>

                <div className="univ-form-group" style={{ margin: 0 }}>
                  <label className="univ-form-label">
                    <span>Mentor Designation & Department <span className="required">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={mentorDesignation}
                    onChange={(e) => setMentorDesignation(e.target.value)}
                    placeholder="e.g. Professor & Head of Eco-Hydrology Lab"
                    className={`univ-form-input ${errors.mentorDesignation ? 'input-error' : ''}`}
                    required
                  />
                  {errors.mentorDesignation && <span className="error-text">{errors.mentorDesignation}</span>}
                </div>

                <div className="univ-form-group" style={{ margin: 0 }}>
                  <label className="univ-form-label">
                    <span>Official Email</span>
                  </label>
                  <input
                    type="email"
                    value={mentorEmail}
                    onChange={(e) => setMentorEmail(e.target.value)}
                    placeholder="e.g. mentor@university.ac.in"
                    className="univ-form-input"
                  />
                </div>

                <div className="univ-form-group" style={{ margin: 0 }}>
                  <label className="univ-form-label">
                    <span>Contact Phone</span>
                  </label>
                  <input
                    type="text"
                    value={mentorPhone}
                    onChange={(e) => setMentorPhone(e.target.value)}
                    placeholder="e.g. +91 94311 02938"
                    className="univ-form-input"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: TEAM COMPOSITION CONTROLS */}
            <div style={{ marginBottom: '26px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#024D24', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👥</span>
                <span>Section 2: Team Members (Students & Faculty)</span>
              </h4>

              <div className="univ-form-grid-2" style={{ marginBottom: '20px' }}>
                {/* Student Count Stepper */}
                <div className="stepper-box">
                  <div>
                    <strong style={{ display: 'block', color: '#1F2937', fontSize: '0.92rem' }}>Student Researchers</strong>
                    <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>Undergraduate / PG researchers</span>
                  </div>
                  <div className="stepper-actions">
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
                      disabled={studentCount >= 12}
                      onClick={() => handleStudentCountChange(studentCount + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Faculty Count Stepper */}
                <div className="stepper-box">
                  <div>
                    <strong style={{ display: 'block', color: '#1F2937', fontSize: '0.92rem' }}>Faculty Co-Mentors</strong>
                    <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>Optional faculty co-investigators</span>
                  </div>
                  <div className="stepper-actions">
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
              </div>
            </div>

            {/* DYNAMIC STUDENTS LIST */}
            {studentCount > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h5 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#024D24', margin: 0 }}>
                    🎒 Student Researchers Roster ({studentCount} Students)
                  </h5>
                  <span style={{ fontSize: '0.78rem', color: '#036D33', fontWeight: 700, background: '#E8F5EC', padding: '3px 10px', borderRadius: '20px' }}>
                    Enter Name, Reg No, Department & Academic Year
                  </span>
                </div>

                <div>
                  {students.map((student, idx) => (
                    <div key={idx} className="roster-card">
                      <div className="roster-badge">
                        🎒 Student #{idx + 1}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                        <div>
                          <label className="univ-form-label" style={{ fontSize: '0.78rem' }}>
                            <span>Full Name <span className="required">*</span></span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Priya Sharma"
                            value={student.name}
                            onChange={(e) => handleStudentFieldChange(idx, 'name', e.target.value)}
                            className="univ-form-input"
                            required
                          />
                        </div>

                        <div>
                          <label className="univ-form-label" style={{ fontSize: '0.78rem' }}>
                            <span>Register / Roll No. <span className="required">*</span></span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 22CS089 / BIT2023-14"
                            value={student.registerNumber}
                            onChange={(e) => handleStudentFieldChange(idx, 'registerNumber', e.target.value)}
                            className="univ-form-input"
                            required
                          />
                        </div>

                        <div>
                          <label className="univ-form-label" style={{ fontSize: '0.78rem' }}>
                            <span>Department</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Civil Engineering"
                            value={student.department}
                            onChange={(e) => handleStudentFieldChange(idx, 'department', e.target.value)}
                            className="univ-form-input"
                          />
                        </div>

                        <div>
                          <label className="univ-form-label" style={{ fontSize: '0.78rem' }}>
                            <span>Academic Year</span>
                          </label>
                          <select
                            value={student.year}
                            onChange={(e) => handleStudentFieldChange(idx, 'year', e.target.value)}
                            className="univ-form-select"
                          >
                            <option value="1st Year">1st Year (UG)</option>
                            <option value="2nd Year">2nd Year (UG)</option>
                            <option value="3rd Year">3rd Year (UG)</option>
                            <option value="4th Year">4th / Final Year (UG)</option>
                            <option value="M.Tech / Post Graduate">M.Tech / PG</option>
                            <option value="Ph.D. Scholar">Ph.D. Scholar</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DYNAMIC FACULTIES LIST */}
            {facultyCount > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h5 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#92400E', margin: 0 }}>
                    👨‍🏫 Faculty Co-Mentors ({facultyCount} Faculty)
                  </h5>
                  <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 700, background: '#FEF3C7', padding: '3px 10px', borderRadius: '20px' }}>
                    Enter Name, Designation & Department
                  </span>
                </div>

                <div>
                  {faculties.map((faculty, idx) => (
                    <div key={idx} className="roster-card faculty-theme">
                      <div className="roster-badge faculty-badge">
                        👨‍🏫 Faculty #{idx + 1}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        <div>
                          <label className="univ-form-label" style={{ fontSize: '0.78rem' }}>
                            <span>Faculty Name <span className="required">*</span></span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Dr. Ramesh Soren"
                            value={faculty.name}
                            onChange={(e) => handleFacultyFieldChange(idx, 'name', e.target.value)}
                            className="univ-form-input"
                            required
                          />
                        </div>

                        <div>
                          <label className="univ-form-label" style={{ fontSize: '0.78rem' }}>
                            <span>Designation</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Associate Professor"
                            value={faculty.designation}
                            onChange={(e) => handleFacultyFieldChange(idx, 'designation', e.target.value)}
                            className="univ-form-input"
                          />
                        </div>

                        <div>
                          <label className="univ-form-label" style={{ fontSize: '0.78rem' }}>
                            <span>Department</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Environmental Science"
                            value={faculty.department}
                            onChange={(e) => handleFacultyFieldChange(idx, 'department', e.target.value)}
                            className="univ-form-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: DETAILED IDEA & SOLUTION SUBMISSION */}
            <div style={{ background: '#F0FDF4', padding: '24px', borderRadius: '16px', border: '1.5px solid #86EFAC', marginBottom: '26px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#166534', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💡</span>
                <span>Section 3: Detailed Solution Idea & Technical Proposal</span>
              </h4>

              {/* Solution Title */}
              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label">
                  <span>Solution / Idea Title <span className="required">*</span></span>
                </label>
                <input
                  type="text"
                  value={solutionTitle}
                  onChange={(e) => setSolutionTitle(e.target.value)}
                  placeholder="e.g. Multi-Tier Bio-Floating Wetland & Phytoremediation Matrix"
                  className={`univ-form-input ${errors.solutionTitle ? 'input-error' : ''}`}
                  required
                />
                {errors.solutionTitle && <span className="error-text">{errors.solutionTitle}</span>}
              </div>

              {/* Detailed Description */}
              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label">
                  <span>Detailed Technical Approach & Methodology <span className="required">*</span></span>
                </label>
                <textarea
                  rows={5}
                  value={solutionDescription}
                  onChange={(e) => setSolutionDescription(e.target.value)}
                  placeholder="Provide a detailed technical description of your proposed solution (min 20 characters), architecture, methodology, validation criteria, and execution plan..."
                  className={`univ-form-textarea ${errors.solutionDescription ? 'input-error' : ''}`}
                  required
                />
                {errors.solutionDescription && <span className="error-text">{errors.solutionDescription}</span>}
              </div>

              {/* Milestones Formulation Section */}
              <div style={{ marginBottom: '18px', background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: '#065F46' }}>🎯 Technical Milestones & Deliverables ({milestones.length})</strong>
                    <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>Define phase-wise timeline and engineering deliverables</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Milestone
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {milestones.map((m, mIdx) => (
                    <div key={mIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '8px', alignItems: 'center', background: '#F9FAFB', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                      <input
                        type="text"
                        placeholder="Milestone Title"
                        value={m.title}
                        onChange={(e) => handleMilestoneChange(mIdx, 'title', e.target.value)}
                        className="univ-form-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                      <input
                        type="number"
                        placeholder="Week"
                        min={1}
                        max={52}
                        value={m.targetWeeks}
                        onChange={(e) => handleMilestoneChange(mIdx, 'targetWeeks', parseInt(e.target.value, 10) || 1)}
                        className="univ-form-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                      <input
                        type="text"
                        placeholder="Deliverable"
                        value={m.deliverable}
                        onChange={(e) => handleMilestoneChange(mIdx, 'deliverable', e.target.value)}
                        className="univ-form-input"
                        style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      />
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(mIdx)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 800, cursor: 'pointer', padding: '4px' }}
                          title="Remove milestone"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="univ-form-grid-2" style={{ marginBottom: '16px' }}>
                <div className="univ-form-group" style={{ margin: 0 }}>
                  <label className="univ-form-label">
                    <span>Estimated Budget (₹)</span>
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

              {/* File Attachment / Proposal Document Upload */}
              <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                <label className="univ-form-label">
                  <span>Attach Proposal Document (PDF, DOCX, Images with Magic Byte Verification)</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,image/*"
                  onChange={handleFileChange}
                  className="univ-form-input"
                  style={{ padding: '8px' }}
                  disabled={isUploading}
                />
                {isUploading && (
                  <div style={{ fontSize: '0.78rem', color: '#036D33', marginTop: '4px', fontWeight: 600 }}>
                    ⏳ Uploading and verifying document magic bytes...
                  </div>
                )}
                {uploadError && (
                  <div style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: '4px', fontWeight: 700 }}>
                    ❌ {uploadError}
                  </div>
                )}
                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {uploadedFiles.map((f, i) => (
                      <span key={i} style={{ background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                        📎 {f.name} ({f.size}) ✓ Verified
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Folder / Drive Link */}
              <div className="univ-form-group" style={{ margin: 0 }}>
                <label className="univ-form-label">
                  <span>Or Provide Project Repository / Drive Link</span>
                </label>
                <input
                  type="url"
                  value={folderLink}
                  onChange={(e) => setFolderLink(e.target.value)}
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  className="univ-form-input"
                />
              </div>
            </div>

            {/* SUBMIT IDEA BUTTON */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'flex-end', borderTop: '1.5px solid #E5E7EB', paddingTop: '22px' }}>
              <button
                type="button"
                onClick={() => navigate('/university/problems')}
                className="univ-btn-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="univ-btn-primary"
                style={{ width: 'auto', minWidth: '260px', background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)', boxShadow: '0 4px 14px rgba(2, 77, 36, 0.25)' }}
              >
                <span>
                  {isSubmitting ? 'Submitting Technical Proposal...' : '🚀 Submit Technical Proposal'}
                </span>
                <ChevronRight size={18} />
              </button>
            </div>
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
