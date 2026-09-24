import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../admin/admin.css';
import './university.css';
import { JharkhandCrest, CloseIcon, ChevronRight } from '../../components/Icons';
import { problemsService, normalizeTitle, isProblemMatchingUniversityDomains } from '../../services/problemsService';
import { authService } from '../../services/authService';

export const UniversityDashboard = ({ user, onLogout, onBackToLanding }) => {
  const navigate = useNavigate();

  // Navigation & layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    matchedProblems: 0,
    myProposals: 0,
    acceptedProposals: 0,
    activeCollaborations: 0,
    activeProjects: 0,
    completedProjects: 0
  });

  const [workingProjects, setWorkingProjects] = useState([]);
  const [problemsList, setProblemsList] = useState([]);
  const [collaborationsList, setCollaborationsList] = useState([]);
  const [proposalsList, setProposalsList] = useState([]);
  const [solutionsList, setSolutionsList] = useState([]);
  const [activeWorkingModal, setActiveWorkingModal] = useState(false);
  const [selectedTeamProject, setSelectedTeamProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Capability Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('academic'); // 'academic' | 'labs' | 'track' | 'contact'
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    location: '',
    accreditation: '',
    ranking: '',
    activeFacultyCount: '',
    departments: '',
    expertise: '',
    researchAreas: '',
    facultyExpertise: '',
    labs: '',
    equipment: '',
    technologies: '',
    centersOfExcellence: '',
    availableResearchCapabilities: '',
    coreStrengths: '',
    completedCivicProjects: '',
    civicProjectExperience: '',
    previousProjects: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  const openProfileModal = () => {
    setProfileFormData({
      name: profile?.name || user?.universityName || user?.name || '',
      location: profile?.location || profile?.district || user?.district || '',
      accreditation: profile?.accreditation || '',
      ranking: profile?.ranking || '',
      activeFacultyCount: profile?.activeFacultyCount || 0,
      departments: Array.isArray(profile?.departments) ? profile.departments.join(', ') : (profile?.departments || ''),
      expertise: Array.isArray(profile?.expertise) ? profile.expertise.join(', ') : (profile?.expertise || ''),
      researchAreas: Array.isArray(profile?.researchAreas) ? profile.researchAreas.join(', ') : (profile?.researchAreas || ''),
      facultyExpertise: Array.isArray(profile?.facultyExpertise) ? profile.facultyExpertise.join(', ') : (profile?.facultyExpertise || ''),
      labs: Array.isArray(profile?.labs) ? profile.labs.join(', ') : (profile?.labs || ''),
      equipment: Array.isArray(profile?.equipment) ? profile.equipment.join(', ') : (profile?.equipment || ''),
      technologies: Array.isArray(profile?.technologies) ? profile.technologies.join(', ') : (profile?.technologies || ''),
      centersOfExcellence: Array.isArray(profile?.centersOfExcellence) ? profile.centersOfExcellence.join(', ') : (profile?.centersOfExcellence || ''),
      availableResearchCapabilities: profile?.availableResearchCapabilities || profile?.coreStrengths || '',
      coreStrengths: profile?.coreStrengths || profile?.availableResearchCapabilities || '',
      completedCivicProjects: profile?.completedCivicProjects || 0,
      civicProjectExperience: profile?.civicProjectExperience || '',
      previousProjects: Array.isArray(profile?.previousProjects) ? profile.previousProjects.join(', ') : (profile?.previousProjects || ''),
      contactPerson: profile?.contactPerson || user?.name || '',
      contactEmail: profile?.contactEmail || user?.email || '',
      contactPhone: profile?.contactPhone || user?.phone || '',
      address: profile?.address || ''
    });
    setProfileSuccessMsg('');
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const payload = {
        ...profile,
        name: profileFormData.name,
        location: profileFormData.location,
        accreditation: profileFormData.accreditation,
        ranking: parseInt(profileFormData.ranking, 10) || 1,
        activeFacultyCount: parseInt(profileFormData.activeFacultyCount, 10) || 24,
        departments: profileFormData.departments.split(',').map(s => s.trim()).filter(Boolean),
        expertise: profileFormData.expertise.split(',').map(s => s.trim()).filter(Boolean),
        researchAreas: profileFormData.researchAreas.split(',').map(s => s.trim()).filter(Boolean),
        facultyExpertise: profileFormData.facultyExpertise.split(',').map(s => s.trim()).filter(Boolean),
        labs: profileFormData.labs.split(',').map(s => s.trim()).filter(Boolean),
        equipment: profileFormData.equipment.split(',').map(s => s.trim()).filter(Boolean),
        technologies: profileFormData.technologies.split(',').map(s => s.trim()).filter(Boolean),
        centersOfExcellence: profileFormData.centersOfExcellence.split(',').map(s => s.trim()).filter(Boolean),
        availableResearchCapabilities: profileFormData.availableResearchCapabilities,
        coreStrengths: profileFormData.coreStrengths || profileFormData.availableResearchCapabilities,
        completedCivicProjects: parseInt(profileFormData.completedCivicProjects, 10) || 0,
        civicProjectExperience: profileFormData.civicProjectExperience,
        previousProjects: profileFormData.previousProjects.split(',').map(s => s.trim()).filter(Boolean),
        contactPerson: profileFormData.contactPerson,
        contactEmail: profileFormData.contactEmail,
        contactPhone: profileFormData.contactPhone,
        address: profileFormData.address
      };
      const updated = await problemsService.updateUniversityProfile(payload);
      if (updated) {
        setProfile(updated);
        setProfileSuccessMsg('University Capability Profile successfully updated and synced with AI Matching Engine!');
        setTimeout(() => {
          setShowProfileModal(false);
          setProfileSuccessMsg('');
        }, 1500);
      }
    } catch (err) {
      alert('Failed to update capability profile: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const activeUser = user || authService.getCurrentUser();
  const universityExpertise = activeUser?.areasOfExpertise || activeUser?.departmentSpecialization || ['Environment', 'Water Management', 'Healthcare', 'Agriculture'];

  const getProblemProposalHelper = (p, proposalsArr, solutionsArr) => {
    const activeUnivName = (activeUser?.universityName || activeUser?.name || '').toLowerCase();
    const sol = (solutionsArr || []).find(
      s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) &&
           (s.submitterType === 'university' || !s.companyName) &&
           (!activeUnivName || !s.universityName || s.universityName.toLowerCase().includes(activeUnivName) || s.userId === activeUser?.id)
    );
    if (sol) return sol;

    const prop = (proposalsArr || []).find(
      s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) &&
           (!activeUnivName || !s.universityName || s.universityName.toLowerCase().includes(activeUnivName) || s.userId === activeUser?.id)
    );
    if (prop) return prop;

    return null;
  };

  const getProblemTeamHelper = (p, teamsArr) => {
    const titleKey = normalizeTitle(p.title);
    return (teamsArr || []).find(
      t => t.problemId === p.id || normalizeTitle(t.problemTitle) === titleKey
    ) || null;
  };

  const getProblemCollaborationHelper = (p, collabsArr) => {
    return (collabsArr || []).find(c => c.problemId === p.id || c.id === p.id || (p.title && c.problemTitle && normalizeTitle(c.problemTitle) === normalizeTitle(p.title))) || null;
  };

  const isMatchedToUniversityHelper = (p, teamsArr, propArr, solArr, collabsArr) => {
    if (p.approvalStatus === 'PENDING_ADMIN_REVIEW' || p.approvalStatus === 'REJECTED_BY_ADMIN') return false;
    if (p.status === 'Pending Admin Review' || p.status === 'REJECTED' || p.status === 'MORE_INFO_REQUESTED') return false;

    if (!activeUser || (!activeUser.universityName && !activeUser.name && !activeUser.id)) return true;

    if (getProblemProposalHelper(p, propArr, solArr) || getProblemTeamHelper(p, teamsArr) || getProblemCollaborationHelper(p, collabsArr)) return true;

    if (isProblemMatchingUniversityDomains(p, universityExpertise)) return true;

    if (Array.isArray(p.matchedUniversityIds) && p.matchedUniversityIds.length > 0) {
      const uId = (activeUser?.id || activeUser?.universityId || '').toLowerCase();
      const uName = (activeUser?.universityName || activeUser?.name || activeUser?.organization || '').toLowerCase();
      if (!uId && !uName) return true;
      const matched = p.matchedUniversityIds.some(m => {
        const matchLower = (m || '').toLowerCase();
        return (uId && matchLower === uId) || (uName && (matchLower.includes(uName) || uName.includes(matchLower)));
      });
      return matched || p.matchedUniversityIds.length === 0;
    }
    return true;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      const [uProfile, uProjects, problemList, teamsList, collabList, proposalList, solList] = await Promise.all([
        problemsService.getUniversityProfile(),
        problemsService.getUniversityProjects(),
        problemsService.getAllProblems(),
        problemsService.getCurrentlyWorkingProjects(activeUser),
        problemsService.getCollaborations({ universityName: activeUser?.universityName || activeUser?.name }, activeUser),
        problemsService.getProposals({ universityName: activeUser?.universityName || activeUser?.name }, activeUser),
        problemsService.getSolutions(activeUser)
      ]);

      if (uProfile) setProfile(uProfile);

      const allProblems = problemList || [];
      const allTeams = teamsList || [];
      const allCollabs = collabList || [];
      const allProposals = proposalList || [];
      const allSolutions = solList || [];

      // Calculate counts using the exact same logic as UniversityProblems.jsx
      const accessibleProblems = allProblems.filter(p => isMatchedToUniversityHelper(p, allTeams, allProposals, allSolutions, allCollabs));
      const domainFilteredProblems = universityExpertise.length > 0
        ? accessibleProblems.filter(p => isProblemMatchingUniversityDomains(p, universityExpertise) || !!getProblemProposalHelper(p, allProposals, allSolutions) || !!getProblemCollaborationHelper(p, allCollabs))
        : accessibleProblems;

      const totalMatched = domainFilteredProblems.length;
      const totalProposals = domainFilteredProblems.filter(p => !!getProblemProposalHelper(p, allProposals, allSolutions)).length;
      const totalCollabs = domainFilteredProblems.filter(p => !!getProblemCollaborationHelper(p, allCollabs)).length;
      const totalAccepted = allProposals.filter(p => p.status === 'APPROVED' || p.status === 'ACCEPTED' || p.approvalStatus === 'APPROVED').length;
      const totalActiveProjects = (uProjects && uProjects.length > 0) ? uProjects.length : totalCollabs;

      const computedMetrics = {
        matchedProblems: totalMatched,
        myProposals: totalProposals,
        acceptedProposals: totalAccepted,
        activeCollaborations: totalCollabs,
        activeProjects: totalActiveProjects,
        completedProjects: 0
      };

      setMetrics(computedMetrics);
      setProblemsList(domainFilteredProblems);
      setProposalsList(allProposals);
      setSolutionsList(allSolutions);
      setCollaborationsList(allCollabs);
      setWorkingProjects(allTeams);
    } catch (err) {
      console.error('Error fetching university dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const displayName = profile?.name || activeUser?.universityName || activeUser?.fullName || activeUser?.name || activeUser?.organization || '';
  const displayInitials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'UN';

  const matchedProblemsCount = metrics.matchedProblems ?? 0;
  const myProposalsCount = metrics.myProposals ?? 0;
  const activeCollaborationsCount = metrics.activeCollaborations ?? 0;

  // 6 Specified Tenant Metrics
  const problemMetrics = [
    {
      id: 'matched-problems',
      className: 'card-total-problems',
      labelEn: 'Matched Problems',
      labelHi: 'मेल खाती समस्याएं',
      count: matchedProblemsCount,
      clickable: true,
      subtitle: 'Assigned by Domain Expertise →',
      path: '/university/problems?tab=all',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      )
    },
    {
      id: 'my-proposals',
      className: 'card-submitted-problems',
      labelEn: 'My Proposals',
      labelHi: 'मेरे प्रस्ताव',
      count: myProposalsCount,
      clickable: true,
      subtitle: 'Solutions Under Review →',
      path: '/university/problems?tab=proposals',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    },
    {
      id: 'accepted-proposals',
      className: 'card-in-progress',
      labelEn: 'Accepted Proposals',
      labelHi: 'स्वीकृत प्रस्ताव',
      count: metrics?.acceptedProposals ?? 0,
      clickable: false,
      subtitle: 'Ready for Implementation →',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    },
    {
      id: 'active-collaborations',
      className: 'card-collaborations',
      labelEn: 'Active Collaborations',
      labelHi: 'सक्रिय सहयोग',
      count: activeCollaborationsCount,
      clickable: true,
      subtitle: 'Industry CSR Partnerships →',
      path: '/university/problems?tab=collaborations',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 'active-projects',
      className: 'card-assigned-problems',
      labelEn: 'Active Projects',
      labelHi: 'सक्रिय परियोजनाएं',
      count: metrics?.activeProjects ?? workingProjects?.length ?? 0,
      clickable: false,
      subtitle: 'Under Implementation →',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      )
    },
    {
      id: 'completed-projects',
      className: 'card-submitted-to-government',
      labelEn: 'Completed Projects',
      labelHi: 'पूर्ण परियोजनाएं',
      count: metrics.completedProjects ?? 0,
      clickable: true,
      badge: metrics.completedProjects > 0 ? 'Verified & Deployed' : null,
      subtitle: 'Delivered to Government →',
      path: '/university/problems?tab=all',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="21" x2="21" y2="21" />
          <line x1="6" y1="21" x2="6" y2="10" />
          <line x1="10" y1="21" x2="10" y2="10" />
          <line x1="14" y1="21" x2="14" y2="10" />
          <line x1="18" y1="21" x2="18" y2="10" />
          <polygon points="12 3 2 9 22 9 12 3" />
        </svg>
      )
    }
  ];

  return (
    <div className="admin-layout-container" style={{ background: '#F0F8F8' }}>
      
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. TOPBAR HEADER */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button
            type="button"
            className="admin-sidebar-toggle-btn"
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Navigation Sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Crest & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <JharkhandCrest size={28} />
            <div>
              <div style={{ fontSize: '1.02rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.2px', lineHeight: 1.1 }}>
                CivicConnect
              </div>
              <div style={{ fontSize: '0.66rem', color: '#D1FAE5', fontWeight: 600 }}>
                Govt. of Jharkhand
              </div>
            </div>
          </div>

          <div className="header-divider" style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.25)', margin: '0 4px' }} />

          <div className="header-entity-info">
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{displayName}</span>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                {profile?.naacGrade ? `NAAC ${profile.naacGrade}` : 'Academic Portal'}
              </span>
            </div>
            <div className="header-sub-text" style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.82)' }}>
              Higher Education Dept • Government of Jharkhand
            </div>
          </div>
        </div>

        <div className="admin-topbar-right">
          <span className="admin-topbar-badge desktop-only">
             University Portal
          </span>

          <button
            type="button"
            className="admin-topbar-btn overview-btn"
            onClick={() => navigate('/university/problems')}
            title="View Problems List"
          >
            View Problems
          </button>

          <button
            type="button"
            className="admin-topbar-btn danger"
            onClick={onLogout || (() => navigate('/'))}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 2. BODY CONTAINER */}
      <div className="admin-body-container">
        
        {/* Sidebar */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          
          <div style={{ padding: '12px 14px 8px 14px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#024D24', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Institution Portal
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#ECFDF5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>
              AUTHENTICATED
            </span>
          </div>

          <nav className="admin-sidebar-nav" style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className="admin-nav-item active"
              onClick={() => { navigate('/university/dashboard'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">Dashboard</span>
            </button>

            <button
              type="button"
              className="admin-nav-item"
              onClick={() => { navigate('/university/problems?tab=all'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">Matched Problems</span>
              <span className="admin-nav-count" style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6' }}>
                {matchedProblemsCount}
              </span>
            </button>

            <button
              type="button"
              className="admin-nav-item"
              onClick={() => { navigate('/university/problems?tab=proposals'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">My Proposals</span>
              <span className="admin-nav-count" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                {myProposalsCount}
              </span>
            </button>

            <button
              type="button"
              className="admin-nav-item"
              onClick={() => { navigate('/university/problems?tab=collaborations'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">Active Collaborations</span>
              <span className="admin-nav-count" style={{ background: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
                {activeCollaborationsCount}
              </span>
            </button>
          </nav>

          {/* Profile Details in Sidebar */}
          <div className="admin-sidebar-footer">
            <div className="admin-user-profile" style={{ marginBottom: '10px' }}>
              <div className="admin-avatar" style={{ background: 'linear-gradient(135deg, #024D24 0%, #059669 100%)', color: '#FFFFFF', width: '34px', height: '34px', fontSize: '0.82rem' }}>
                {displayInitials}
              </div>
              <div className="admin-user-details">
                <div className="admin-user-name" style={{ fontSize: '0.84rem' }}>
                  {displayName}
                </div>
                <div className="admin-user-role" style={{ fontSize: '0.72rem' }}>
                  {profile?.district ? `${profile.district} • ` : ''}{profile?.ranking ? `Rank ${profile.ranking}` : 'Higher Education'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="admin-return-btn"
              onClick={onBackToLanding || (() => navigate('/'))}
            >
              ← Return to Portals
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="admin-main-wrapper">
          <div className="admin-content-area" style={{ background: '#F0F8F8', minHeight: '100%', padding: '24px 28px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Institution Identity Card */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '24px 28px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <div style={{ flex: '1 1 500px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.4rem' }}></span>
                    <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#024D24', margin: 0 }}>
                      {displayName}
                    </h1>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: '#4B5563', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                    {profile?.location || profile?.district ? `${profile?.location || profile?.district}, Jharkhand` : 'Jharkhand, India'}
                    {profile?.naacGrade ? ` •  NAAC Grade: ${profile.naacGrade}` : ''}
                    {profile?.ranking ? ` • NIRF Rank: ${profile.ranking}` : ''}
                  </p>

                  {/* Departments & Expertise Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#024D24' }}>Domain Expertise:</span>
                    {(profile?.expertise || profile?.areasOfExpertise || ['Water Management', 'Healthcare', 'Agriculture', 'Environment']).map((exp, i) => (
                      <span key={i} style={{
                        background: '#ECFDF5',
                        color: '#065F46',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: '1px solid #A7F3D0'
                      }}>
                        {exp}
                      </span>
                    ))}
                  </div>

                  {profile?.departments && profile.departments.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>Key Departments:</span>
                      {profile.departments.slice(0, 4).map((dept, i) => (
                        <span key={i} style={{
                          background: '#F3F4F6',
                          color: '#374151',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {dept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '240px' }}>
                  <button
                    type="button"
                    onClick={openProfileModal}
                    style={{
                      background: 'linear-gradient(135deg, #024D24 0%, #047857 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '11px 18px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(2,77,36,0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span></span>
                    <span>Edit R&D Capability Profile</span>
                  </button>
                  <div style={{
                    background: '#F0FDF4',
                    border: '1.5px solid #86EFAC',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Tenant Isolation Status
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#14532D', marginTop: '2px' }}>
                      Strict Academic Scope
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#15803D', marginTop: '2px' }}>
                      AI Matching Synced ({profile?.labs?.length || 2} Labs, {profile?.technologies?.length || 3} Tech)
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Tenant Metrics Cards */}
              <div className="admin-stats-grid-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {problemMetrics.map((card) => (
                  <div
                    key={card.id}
                    className={`admin-stat-card-neat ${card.className}`}
                    onClick={() => navigate(card.path)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="admin-stat-neat-label">{card.labelEn}</div>
                        <div className="admin-stat-neat-count">{card.count}</div>
                      </div>
                      {card.badge && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: 'rgba(2,77,36,0.1)',
                          color: '#024D24'
                        }}>
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <div className="admin-stat-neat-sub">{card.subtitle}</div>
                  </div>
                ))}
              </div>

              {/* Matched Problem Statements Table */}
              <div className="admin-table-card">
                <div className="admin-table-header" style={{ padding: '16px 20px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      Matched Problem Statements ({problemsList.length})
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                      Civic challenges matching {displayName}'s research expertise and assignments
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/university/problems')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#036D33',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    View All Opportunities →
                  </button>
                </div>

                {problemsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6B7280' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}></div>
                    <h4 style={{ fontSize: '1.05rem', color: '#374151', margin: '0 0 6px 0' }}>No Matched Problems Currently</h4>
                    <p style={{ fontSize: '0.84rem', maxWidth: '420px', margin: '0 auto' }}>
                      No civic problems are currently routed to this university's domain expertise. New citizen submissions in your domain will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="admin-table-responsive">
                    <table className="admin-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#F9FAFB' }}>
                          <th style={{ padding: '12px 16px', fontSize: '0.72rem' }}>ID</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.72rem' }}>PROBLEM STATEMENT</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.72rem' }}>DISTRICT</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.72rem' }}>CATEGORY</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.72rem' }}>PRIORITY</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.72rem' }}>STATUS</th>
                          <th style={{ padding: '12px 16px', fontSize: '0.72rem', textAlign: 'center' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {problemsList.slice(0, 6).map((p, idx) => {
                          const priority = p.priority || (idx === 0 ? 'Critical' : idx === 1 ? 'High' : 'Medium');
                          const status = p.status || 'Assigned';

                          return (
                            <tr key={p.id || idx}>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#6B7280', fontSize: '0.78rem' }}>
                                {p.id}
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#111827', maxWidth: '340px' }}>
                                {p.title}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#4B5563' }}>
                                {p.district || 'Ranchi'}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#047857', fontWeight: 600 }}>
                                {p.category || p.domain || 'General'}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  background: priority === 'Critical' ? '#FEE2E2' : priority === 'High' ? '#FFEDD5' : '#FEF3C7',
                                  color: priority === 'Critical' ? '#DC2626' : priority === 'High' ? '#EA580C' : '#D97706'
                                }}>
                                  {priority}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  background: status === 'Currently Working' || status === 'In Progress' ? '#ECFDF5' :
                                              status === 'Solutions Submitted' ? '#FAF5FF' :
                                              status === 'Broadcasted to Universities' ? '#EFF6FF' : '#FEF3C7',
                                  color: status === 'Currently Working' || status === 'In Progress' ? '#059669' :
                                         status === 'Solutions Submitted' ? '#7C3AED' :
                                         status === 'Broadcasted to Universities' ? '#2563EB' : '#D97706'
                                }}>
                                  {status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                {(() => {
                                  const hasCollab = getProblemCollaborationHelper(p, collaborationsList);
                                  const hasProposal = getProblemProposalHelper(p, proposalsList, solutionsList);
                                  if (hasCollab) {
                                    return (
                                      <button
                                        type="button"
                                        className="admin-view-btn"
                                        style={{ background: '#6D28D9', color: '#FFFFFF' }}
                                        onClick={() => navigate(`/university/collaborate/${p.id}`)}
                                      >
                                        View Collaboration
                                      </button>
                                    );
                                  }
                                  if (hasProposal) {
                                    return (
                                      <button
                                        type="button"
                                        className="admin-view-btn"
                                        style={{ background: '#D97706', color: '#FFFFFF' }}
                                        onClick={() => navigate(`/university/take-challenge/${p.id}`)}
                                      >
                                        View Proposal
                                      </button>
                                    );
                                  }
                                  return (
                                    <button
                                      type="button"
                                      className="admin-view-btn"
                                      onClick={() => navigate(`/university/take-challenge/${p.id}`)}
                                    >
                                      Take Challenge
                                    </button>
                                  );
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: CURRENTLY WORKING PROJECTS LIST
         ========================================================================= */}
      {activeWorkingModal && (
        <div className="modal-backdrop" onClick={() => setActiveWorkingModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', width: '92%' }}>
            
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Active University R&D Projects
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '2px' }}>
                  Currently Working Projects ({workingProjects.length})
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveWorkingModal(false)}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              {workingProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
                  <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}></div>
                  <h4 style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '6px' }}>No Active Project Teams Yet</h4>
                  <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 18px' }}>
                    Browse available problem statements, select "Take this Challenge", and register your student or faculty team to start working on a project.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveWorkingModal(false);
                      navigate('/university/problems');
                    }}
                    style={{
                      background: '#036D33',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Browse Available Problems →
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {workingProjects.map((proj) => (
                    <div
                      key={proj.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #E5E7EB',
                        borderRadius: '14px',
                        padding: '18px 20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '14px'
                      }}
                    >
                      <div style={{ flex: '1 1 340px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#036D33', background: '#E8F5E9', padding: '3px 8px', borderRadius: '4px' }}>
                            {proj.problemCategory || 'Civic Problem'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                            {proj.district} • ID: {proj.problemId}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#111827', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                          {proj.problemTitle}
                        </h4>

                        <div style={{ fontSize: '0.82rem', color: '#4B5563' }}>
                          <span> <strong>Mentor:</strong> {proj.mentorName} ({proj.mentorDesignation})</span>
                          <span style={{ margin: '0 8px' }}>•</span>
                          <span> <strong>Started:</strong> {proj.startedDate || proj.startedAt?.split('T')[0]}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedTeamProject(proj)}
                        style={{
                          background: '#024D24',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '9px 18px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(2, 77, 36, 0.2)'
                        }}
                      >
                        <span> View Team</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VIEW TEAM DETAILS & START DATE
         ========================================================================= */}
      {selectedTeamProject && (
        <div className="modal-backdrop" onClick={() => setSelectedTeamProject(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '92%' }}>
            
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Research Team Roster & Project Info
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px' }}>
                  Team Details: {selectedTeamProject.problemId}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTeamProject(null)}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Problem Title */}
              <div style={{ marginBottom: '18px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#036D33', background: '#E8F5E9', padding: '3px 8px', borderRadius: '4px' }}>
                  {selectedTeamProject.problemCategory}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '6px 0' }}>
                  {selectedTeamProject.problemTitle}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                  District: <strong>{selectedTeamProject.district}</strong> • Citizen Submitter: <strong>{selectedTeamProject.citizenName}</strong> ({selectedTeamProject.citizenPhone})
                </div>
              </div>

              {/* MENTOR & STARTED DATE BOX */}
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.86rem' }}>
                  <div>
                    <span style={{ color: '#166534', fontSize: '0.76rem', fontWeight: 700, display: 'block' }}>FACULTY LEAD / MENTOR</span>
                    <strong style={{ fontSize: '1rem', color: '#111827' }}>{selectedTeamProject.mentorName}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#4B5563' }}>{selectedTeamProject.mentorDesignation}</div>
                  </div>

                  <div>
                    <span style={{ color: '#166534', fontSize: '0.76rem', fontWeight: 700, display: 'block' }}>PROJECT STARTED DATE</span>
                    <strong style={{ fontSize: '1rem', color: '#111827' }}>
                      {selectedTeamProject.startedDate || selectedTeamProject.startedAt?.split('T')[0]}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Status: Currently Working</div>
                  </div>
                </div>
              </div>

              {/* STUDENTS ROSTER */}
              {selectedTeamProject.students && selectedTeamProject.students.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#024D24', marginBottom: '10px' }}>
                     Student Researchers ({selectedTeamProject.students.length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTeamProject.students.map((stu, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div>
                          <strong>#{i + 1} {stu.name}</strong>
                          <span style={{ color: '#6B7280', fontSize: '0.78rem', marginLeft: '8px' }}>
                            (Reg: {stu.registerNumber})
                          </span>
                        </div>
                        <div style={{ color: '#4B5563', fontSize: '0.8rem' }}>
                          <span>{stu.department}</span> • <span style={{ color: '#036D33', fontWeight: 600 }}>{stu.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FACULTIES ROSTER */}
              {selectedTeamProject.faculties && selectedTeamProject.faculties.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400E', marginBottom: '10px' }}>
                     Faculty Co-Mentors ({selectedTeamProject.faculties.length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTeamProject.faculties.map((fac, i) => (
                      <div
                        key={i}
                        style={{
                          background: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '6px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div>
                          <strong>#{i + 1} {fac.name}</strong>
                          <span style={{ color: '#92400E', fontSize: '0.78rem', marginLeft: '8px' }}>
                            ({fac.designation})
                          </span>
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>
                          {fac.department}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTeamProject(null)}
                  style={{
                    background: '#036D33',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Close Team Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT R&D CAPABILITY PROFILE (13 Fields across 4 Tabs)
         ========================================================================= */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px', width: '95%' }}>
            
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Institutional Profile & Matching Capabilities
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                   Edit University R&D Capability Profile
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowProfileModal(false)}>
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Profile Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #E5E7EB',
              background: '#F9FAFB',
              padding: '0 24px',
              gap: '4px'
            }}>
              {[
                { id: 'academic', label: '1. Academic & Ranking' },
                { id: 'labs', label: '2. Labs, CoE & Tech' },
                { id: 'track', label: '3. Track Record' },
                { id: 'contact', label: '4. Contact Details' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProfileTab(tab.id)}
                  style={{
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: profileTab === tab.id ? '3px solid #024D24' : '3px solid transparent',
                    color: profileTab === tab.id ? '#024D24' : '#6B7280',
                    fontWeight: profileTab === tab.id ? 800 : 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body" style={{ padding: '24px', maxHeight: '65vh', overflowY: 'auto' }}>
                
                {profileSuccessMsg && (
                  <div style={{
                    background: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    marginBottom: '16px'
                  }}>
                    {profileSuccessMsg}
                  </div>
                )}

                {/* TAB 1: ACADEMIC & RANKING */}
                {profileTab === 'academic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        University / Institution Official Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        value={profileFormData.name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          District / Location *
                        </label>
                        <input
                          type="text"
                          required
                          className="admin-input"
                          value={profileFormData.location}
                          onChange={(e) => setProfileFormData({ ...profileFormData, location: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Accreditation (NAAC/NIRF)
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="e.g. NAAC A++ / NIRF Top 50"
                          value={profileFormData.accreditation}
                          onChange={(e) => setProfileFormData({ ...profileFormData, accreditation: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          State NIRF Ranking
                        </label>
                        <input
                          type="number"
                          className="admin-input"
                          value={profileFormData.ranking}
                          onChange={(e) => setProfileFormData({ ...profileFormData, ranking: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Active Faculty & Researchers Count
                      </label>
                      <input
                        type="number"
                        className="admin-input"
                        value={profileFormData.activeFacultyCount}
                        onChange={(e) => setProfileFormData({ ...profileFormData, activeFacultyCount: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Key Academic Departments (Comma-separated)
                      </label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Civil Engineering, Computer Science, Environmental Sciences"
                        value={profileFormData.departments}
                        onChange={(e) => setProfileFormData({ ...profileFormData, departments: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Primary Domain Expertise (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Water Management, Renewable Energy, Healthcare, Waste Management"
                        value={profileFormData.expertise}
                        onChange={(e) => setProfileFormData({ ...profileFormData, expertise: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                      <small style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                        The AI Multi-Factor Matching Engine uses these domains to automatically route civic problems to your dashboard.
                      </small>
                    </div>
                  </div>
                )}

                {/* TAB 2: LABS, COE & TECH */}
                {profileTab === 'labs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Research & Testing Labs (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Advanced Water Purification Lab, Solar Energy Simulation Lab"
                        value={profileFormData.labs}
                        onChange={(e) => setProfileFormData({ ...profileFormData, labs: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Equipment & Instrumentation (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Spectrophotometer UV-Vis, Solar Grid Analyzers, Multi-Probe Sensor"
                        value={profileFormData.equipment}
                        onChange={(e) => setProfileFormData({ ...profileFormData, equipment: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Specialized Technologies & Methodologies (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. IoT Sensory Networks, Membrane Filtration, AI Spectral Analysis"
                        value={profileFormData.technologies}
                        onChange={(e) => setProfileFormData({ ...profileFormData, technologies: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Centers of Excellence (CoE) (Comma-separated)
                      </label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Center of Excellence in Water Management & Green Energy"
                        value={profileFormData.centersOfExcellence}
                        onChange={(e) => setProfileFormData({ ...profileFormData, centersOfExcellence: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Comprehensive Research Capabilities & Infrastructure Summary
                      </label>
                      <textarea
                        rows={3}
                        className="admin-input"
                        placeholder="Describe your laboratory infrastructure, testing setups, and pilot testing capacities..."
                        value={profileFormData.availableResearchCapabilities}
                        onChange={(e) => setProfileFormData({ ...profileFormData, availableResearchCapabilities: e.target.value, coreStrengths: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: TRACK RECORD */}
                {profileTab === 'track' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Completed Civic Projects Count
                        </label>
                        <input
                          type="number"
                          className="admin-input"
                          value={profileFormData.completedCivicProjects}
                          onChange={(e) => setProfileFormData({ ...profileFormData, completedCivicProjects: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Civic Project Experience Summary
                        </label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="e.g. 14 completed projects with Urban Development Dept"
                          value={profileFormData.civicProjectExperience}
                          onChange={(e) => setProfileFormData({ ...profileFormData, civicProjectExperience: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Previous Key Civic/Government Projects (Comma-separated)
                      </label>
                      <textarea
                        rows={3}
                        className="admin-input"
                        placeholder="e.g. Subarnarekha River Basin Pollution Monitoring, Rural Solar Pumping Automation"
                        value={profileFormData.previousProjects}
                        onChange={(e) => setProfileFormData({ ...profileFormData, previousProjects: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Lead Faculty Researchers & Specializations (Comma-separated)
                      </label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="e.g. Prof. R. Sharma (Water Hydrology), Dr. A. Keshri (Solar PV)"
                        value={profileFormData.facultyExpertise}
                        onChange={(e) => setProfileFormData({ ...profileFormData, facultyExpertise: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: CONTACT DETAILS */}
                {profileTab === 'contact' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        R&D Dean / Institutional Point of Contact *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Prof. Rajesh Sharma (Dean Research & Consultancy)"
                        value={profileFormData.contactPerson}
                        onChange={(e) => setProfileFormData({ ...profileFormData, contactPerson: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Official Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          className="admin-input"
                          placeholder="e.g. rnd@cuj.ac.in"
                          value={profileFormData.contactEmail}
                          onChange={(e) => setProfileFormData({ ...profileFormData, contactEmail: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Official Phone / Helpline *
                        </label>
                        <input
                          type="tel"
                          required
                          className="admin-input"
                          placeholder="e.g. +91 94311 02938"
                          value={profileFormData.contactPhone}
                          onChange={(e) => setProfileFormData({ ...profileFormData, contactPhone: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Campus Address *
                      </label>
                      <textarea
                        rows={2}
                        required
                        className="admin-input"
                        placeholder="e.g. Brambe Campus, Ranchi, Jharkhand - 835205"
                        value={profileFormData.address}
                        onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderTop: '1px solid #E5E7EB',
                background: '#F9FAFB'
              }}>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  Changes are instantly persisted to MongoDB and synced with AI Multi-Factor Matcher.
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #D1D5DB',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    style={{
                      background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 22px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: isSavingProfile ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSavingProfile ? 'Saving...' : ' Save Capability Profile'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
