import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../admin/admin.css';
import './university.css';
import { JharkhandCrest, CloseIcon, ChevronRight } from '../../components/Icons';
import { problemsService, normalizeTitle, JHARKHAND_DISTRICTS, PROBLEM_CATEGORIES, isProblemMatchingUniversityDomains, getDeadlineInfo } from '../../services/problemsService';
import { authService } from '../../services/authService';

export const UniversityProblems = ({ user, onBackToDashboard, onBackToLanding }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation & layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Normalizer helper for query tab aliases
  const normalizeUnivTab = (rawTab) => {
    if (!rawTab) return 'all';
    const t = rawTab.toLowerCase();
    if (t === 'working' || t === 'submitted' || t === 'proposals') return 'proposals';
    if (t === 'funding' || t === 'collaborations' || t === 'collab') return 'collaborations';
    if (t === 'available' || t === 'new') return 'new';
    if (t === 'all' || t === 'government') return 'all';
    return 'all';
  };

  // Active tab: 'all' | 'new' | 'proposals' | 'collaborations'
  const tabParam = normalizeUnivTab(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState(tabParam);

  const [problems, setProblems] = useState([]);
  const [activeTeams, setActiveTeams] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Domain-Based Routing Filter State
  const universityExpertise = user?.areasOfExpertise || user?.departmentSpecialization || ['Environment', 'Water Management', 'Healthcare', 'Agriculture'];
  const [filterByDomain, setFilterByDomain] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedMentor, setSelectedMentor] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [activeChallengeModal, setActiveChallengeModal] = useState(null);

  const availableMentors = Array.from(new Set([
    ...activeTeams.map(t => t.mentorName).filter(Boolean),
    ...proposals.map(p => p.mentorName || p.leadName).filter(Boolean),
    ...solutions.map(s => s.mentorName || s.leadName).filter(Boolean)
  ]));

  // Sync tab with URL search params
  useEffect(() => {
    const current = normalizeUnivTab(searchParams.get('tab'));
    setActiveTab(current);
  }, [searchParams]);

  const activeUser = user || authService.getCurrentUser();
  const displayName = activeUser?.universityName || activeUser?.name || activeUser?.fullName || 'Academic Institution';
  const displayInitials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'RU';

  const loadData = async () => {
    setLoading(true);
    const [problemList, teamsList, collabList, proposalList, solList] = await Promise.all([
      problemsService.getAllProblems(),
      problemsService.getCurrentlyWorkingProjects(activeUser),
      problemsService.getCollaborations({ universityName: activeUser?.universityName || activeUser?.name }, activeUser),
      problemsService.getProposals({ universityName: activeUser?.universityName || activeUser?.name }, activeUser),
      problemsService.getSolutions(activeUser)
    ]);
    setProblems(problemList || []);
    setActiveTeams(teamsList || []);
    setCollaborations(collabList || []);
    setProposals(proposalList || []);
    setSolutions(solList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getProblemProposal = (p) => {
    const activeUser = user || authService.getCurrentUser();
    const activeUnivName = (activeUser?.universityName || activeUser?.name || '').toLowerCase();
    const sol = (solutions || []).find(
      s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) &&
           (s.submitterType === 'university' || !s.companyName) &&
           (!activeUnivName || !s.universityName || s.universityName.toLowerCase().includes(activeUnivName) || s.userId === activeUser?.id)
    );
    if (sol) return sol;

    const prop = (proposals || []).find(
      s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) &&
           (!activeUnivName || !s.universityName || s.universityName.toLowerCase().includes(activeUnivName) || s.userId === activeUser?.id)
    );
    if (prop) return prop;

    return null;
  };

  const getProblemTeam = (p) => {
    const titleKey = normalizeTitle(p.title);
    return activeTeams.find(
      t => t.problemId === p.id || normalizeTitle(t.problemTitle) === titleKey
    ) || null;
  };

  const getProblemCollaboration = (p) => {
    return collaborations.find(c => c.problemId === p.id || c.id === p.id || (p.title && c.problemTitle && normalizeTitle(c.problemTitle) === normalizeTitle(p.title))) || null;
  };

  const isProblemWorking = (p) => {
    return !!getProblemTeam(p) || !!getProblemProposal(p);
  };

  const isProblemCollaborated = (p) => {
    return !!getProblemCollaboration(p);
  };

  const isMatchedToUniversity = (p) => {
    if (p.approvalStatus === 'PENDING_ADMIN_REVIEW' || p.approvalStatus === 'REJECTED_BY_ADMIN') return false;
    if (p.status === 'Pending Admin Review' || p.status === 'REJECTED' || p.status === 'MORE_INFO_REQUESTED') return false;

    // If no university user is logged in or user has no specific filter, allow viewing
    if (!activeUser || (!activeUser.universityName && !activeUser.name && !activeUser.id)) return true;

    // If user has a proposal, team, or collaboration for this problem, always match
    if (getProblemProposal(p) || getProblemTeam(p) || getProblemCollaboration(p)) return true;

    // If problem domain matches university expertise, match
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

  // Metric counts
  const accessibleProblems = problems.filter(isMatchedToUniversity);
  const domainFilteredProblems = filterByDomain && universityExpertise.length > 0
    ? accessibleProblems.filter(p => isProblemMatchingUniversityDomains(p, universityExpertise) || !!getProblemProposal(p) || isProblemCollaborated(p))
    : accessibleProblems;

  const totalCount = domainFilteredProblems.length;
  const proposalCount = domainFilteredProblems.filter(p => !!getProblemProposal(p)).length;
  const collabCount = domainFilteredProblems.filter(p => isProblemCollaborated(p)).length;
  const newCount = domainFilteredProblems.filter(p => !isProblemWorking(p) && !isProblemCollaborated(p)).length;

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Filter problems by Domain, Tab, Search, Category, District, Priority
  const filteredProblems = accessibleProblems.filter((p) => {
    const isWorking = isProblemWorking(p);
    const isCollab = isProblemCollaborated(p);
    const proposal = getProblemProposal(p);

    if (filterByDomain && universityExpertise.length > 0) {
      if (!isProblemMatchingUniversityDomains(p, universityExpertise) && !proposal && !isCollab) {
        return false;
      }
    }

    if (activeTab === 'new' && (isWorking || isCollab)) return false;
    if (activeTab === 'proposals' && !proposal) return false;
    if (activeTab === 'collaborations' && !isCollab) return false;

    // Category filter
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase().includes(selectedCategory.toLowerCase()) || (p.domain && p.domain.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    // District filter
    const matchesDist = selectedDistrict === 'All' || p.district.toLowerCase() === selectedDistrict.toLowerCase();
    
    // Priority filter
    const matchesPriority = selectedPriority === 'All' || 
      (p.urgency && p.urgency.toLowerCase() === selectedPriority.toLowerCase());

    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    const team = getProblemTeam(p);
    const collab = getProblemCollaboration(p);
    const matchesQuery = !q || 
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.citizenName?.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      (proposal && (proposal.solutionTitle?.toLowerCase().includes(q) || proposal.mentorName?.toLowerCase().includes(q))) ||
      (collab && (collab.companyName?.toLowerCase().includes(q) || collab.universityName?.toLowerCase().includes(q))) ||
      (team && (team.mentorName?.toLowerCase().includes(q) || team.problemTitle?.toLowerCase().includes(q)));

    return matchesCat && matchesDist && matchesPriority && matchesQuery;
  });

  const sortedProblems = [...filteredProblems].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.submissionDate || 0).getTime();
    const dateB = new Date(b.createdAt || b.submissionDate || 0).getTime();
    return dateB - dateA;
  });

  const isCollabTab = activeTab === 'collaborations';

  return (
    <div className="admin-layout-container">
      
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
          1. FULL-WIDTH TOPBAR HEADER (RUNS ACROSS ENTIRE TOP OF SCREEN)
         ========================================================================= */}
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
                {isCollabTab ? 'Joint Collaborations' : 'Problem Statements'}
              </span>
            </div>
            <div className="header-sub-text" style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.82)' }}>
              Higher Education Dept • Government of Jharkhand
            </div>
          </div>
        </div>

        <div className="admin-topbar-right">
          <button
            type="button"
            onClick={onBackToDashboard || (() => navigate('/university/dashboard'))}
            className="admin-topbar-btn overview-btn"
            title="Return to Dashboard Overview"
          >
            <span>← Dashboard Overview</span>
          </button>

          <button
            type="button"
            onClick={onBackToLanding || (() => navigate('/'))}
            className="admin-topbar-btn danger"
            title="Logout and Exit"
          >
            Logout
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. BODY CONTAINER (SIDEBAR UNDER HEADER + MAIN WRAPPER)
         ========================================================================= */}
      <div className="admin-body-container">
        
        {/* Sidebar Navigation (Under Header) */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          
          <div style={{ padding: '12px 14px 8px 14px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#024D24', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Institution Portal
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#ECFDF5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>
              AUTHENTICATED
            </span>
          </div>

          {/* Sidebar Nav List (Unified with Dashboard) */}
          <nav className="admin-sidebar-nav" style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className="admin-nav-item"
              onClick={() => { navigate('/university/dashboard'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">Dashboard</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'all' || activeTab === 'new' ? 'active' : ''}`}
              onClick={() => { handleTabChange('all'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">Matched Problems</span>
              <span className="admin-nav-count">{totalCount}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'proposals' ? 'active' : ''}`}
              onClick={() => { handleTabChange('proposals'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">My Proposals</span>
              <span className="admin-nav-count" style={{ background: '#FEF3C7', color: '#B45309' }}>{proposalCount}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'collaborations' ? 'active' : ''}`}
              onClick={() => { handleTabChange('collaborations'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">Active Collaborations</span>
              <span className="admin-nav-count" style={{ background: '#EDE9FE', color: '#6D28D9' }}>{collabCount}</span>
            </button>
          </nav>

          {/* Profile Details in Sidebar Footer */}
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
                  Higher Education • Academic R&D
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToLanding || (() => navigate('/'))}
              className="admin-return-btn"
              title="Return to Main Portals"
            >
              ← Return to Portals
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="admin-main-wrapper">
          {/* Scrollable Content Area */}
          <main className="admin-content-area" style={{ background: '#F0F8F8', padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 1. UNIFIED TABS & ACTIONS CARD */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            padding: '12px 18px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Tabs List */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Tab: All Problems */}
              <button
                type="button"
                onClick={() => handleTabChange('all')}
                style={{
                  background: activeTab === 'all' ? '#059669' : '#F9FAFB',
                  color: activeTab === 'all' ? '#FFFFFF' : '#374151',
                  border: activeTab === 'all' ? '1.5px solid #059669' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'all' ? '0 2px 6px rgba(5, 150, 105, 0.2)' : 'none'
                }}
              >
                <span>All Problems</span>
                <span style={{
                  background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#ECFDF5',
                  color: activeTab === 'all' ? '#FFFFFF' : '#059669',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {totalCount}
                </span>
              </button>

              {/* Tab: Available Challenges */}
              <button
                type="button"
                onClick={() => handleTabChange('new')}
                style={{
                  background: activeTab === 'new' ? '#0284C7' : '#F9FAFB',
                  color: activeTab === 'new' ? '#FFFFFF' : '#0284C7',
                  border: activeTab === 'new' ? '1.5px solid #0284C7' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'new' ? '0 2px 6px rgba(2, 132, 199, 0.2)' : 'none'
                }}
              >
                <span>Available Challenges</span>
                <span style={{
                  background: activeTab === 'new' ? 'rgba(255,255,255,0.25)' : '#E0F2FE',
                  color: activeTab === 'new' ? '#FFFFFF' : '#0369A1',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {newCount}
                </span>
              </button>

              {/* Tab: Submitted Proposals */}
              <button
                type="button"
                onClick={() => handleTabChange('proposals')}
                style={{
                  background: activeTab === 'proposals' ? '#D97706' : '#F9FAFB',
                  color: activeTab === 'proposals' ? '#FFFFFF' : '#B45309',
                  border: activeTab === 'proposals' ? '1.5px solid #D97706' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'proposals' ? '0 2px 6px rgba(217, 119, 6, 0.2)' : 'none'
                }}
              >
                <span>Submitted Proposals</span>
                <span style={{
                  background: activeTab === 'proposals' ? 'rgba(255,255,255,0.25)' : '#FEF3C7',
                  color: activeTab === 'proposals' ? '#FFFFFF' : '#92400E',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {proposalCount}
                </span>
              </button>

              {/* Tab: Active Collaborations */}
              <button
                type="button"
                onClick={() => handleTabChange('collaborations')}
                style={{
                  background: activeTab === 'collaborations' ? '#6D28D9' : '#F9FAFB',
                  color: activeTab === 'collaborations' ? '#FFFFFF' : '#6D28D9',
                  border: activeTab === 'collaborations' ? '1.5px solid #6D28D9' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'collaborations' ? '0 2px 6px rgba(109, 40, 217, 0.2)' : 'none'
                }}
              >
                <span>Active Collaborations</span>
                <span style={{
                  background: activeTab === 'collaborations' ? 'rgba(255,255,255,0.25)' : '#EDE9FE',
                  color: activeTab === 'collaborations' ? '#FFFFFF' : '#6D28D9',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {collabCount}
                </span>
              </button>
            </div>

            {/* Right Action Button */}
            <div>
              {isCollabTab ? (
                <span style={{
                  background: '#EDE9FE',
                  color: '#6D28D9',
                  border: '1px solid #DDD6FE',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'inline-block'
                }}>
                   {collabCount} Active Collaborations
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTabChange('new')}
                  style={{
                    background: '#024D24',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(2, 77, 36, 0.2)'
                  }}
                >
                  + Submit Proposal
                </button>
              )}
            </div>
          </div>

          {/* 3. DOMAIN ROUTING BANNER (NO ICON) */}
          {isCollabTab && (
            <div style={{
              background: '#ECFDF5',
              border: '1.5px solid #6EE7B7',
              borderRadius: '10px',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 1px 4px rgba(5, 150, 105, 0.04)'
            }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#065F46' }}>
                  Domain Routing Active: Showing challenges matched to {displayName}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '3px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>Your Registered Expertise:</span>
                  {universityExpertise.map((exp, i) => (
                    <span key={i} style={{
                      background: '#FFFFFF',
                      color: '#047857',
                      border: '1px solid #A7F3D0',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '12px'
                    }}>
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFilterByDomain(!filterByDomain)}
                style={{
                  background: '#024D24',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Filter Active
              </button>
            </div>
          )}

          {/* 4. FILTER & SEARCH BAR (NO ICONS) */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search box */}
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by topic, keyword, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '8px',
                    outline: 'none',
                    color: '#111827',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Filter by Category */}
              <div style={{ minWidth: '150px' }}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">Filter by Category: All</option>
                  {PROBLEM_CATEGORIES.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filter by District */}
              <div style={{ minWidth: '140px' }}>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All 24 Districts</option>
                  {JHARKHAND_DISTRICTS.map((dist, i) => (
                    <option key={i} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Priority */}
              <div style={{ minWidth: '130px' }}>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>

              {/* Filter by Mentor */}
              {!isCollabTab && (
                <div style={{ minWidth: '130px' }}>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: '1.5px solid #D1D5DB',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="All">All Mentors</option>
                    {availableMentors.map((mentor, idx) => (
                      <option key={idx} value={mentor}>{mentor}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 5. PROBLEM CHALLENGES LIST (NO DESCRIPTION UNDER TITLE, NO ICONS) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#FFFFFF', borderRadius: '10px' }}>
                Loading problem statements...
              </div>
            ) : sortedProblems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#FFFFFF', borderRadius: '10px' }}>
                No problem statements match your filter criteria.
              </div>
            ) : (
              sortedProblems.map((p, index) => {
                const collab = getProblemCollaboration(p);
                const pairedInd = collab?.companyName || p.pairedIndustry;
                const proposal = getProblemProposal(p);

                return (
                  <div
                    key={p.id || index}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #E5E7EB',
                      padding: '14px 18px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    {/* Top Row: Tags + Problem ID */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        
                        {/* Category tag in Collaborations */}
                        {isCollabTab && (
                          <span style={{
                            background: p.category?.includes('Water') || p.category?.includes('Pipeline') ? '#E0F2FE' : '#DCFCE7',
                            color: p.category?.includes('Water') || p.category?.includes('Pipeline') ? '#0284C7' : '#166534',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {p.category || 'Pipeline Leakage'}
                          </span>
                        )}

                        <span style={{
                          background: '#DCFCE7',
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          Problem Statement
                        </span>

                        {/* Priority tag */}
                        {p.urgency && (
                          <span style={{
                            background: p.urgency === 'Critical' ? '#FEE2E2' : '#FEF3C7',
                            color: p.urgency === 'Critical' ? '#991B1B' : '#B45309',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {p.urgency}
                          </span>
                        )}

                        {/* Paired Industry pill in Collaborations */}
                        {isCollabTab && pairedInd && (
                          <span style={{
                            background: '#EDE9FE',
                            color: '#6D28D9',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            Paired with: {pairedInd}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#6B7280', fontWeight: 600 }}>
                        ID: {p.id} • #{index + 1}
                      </div>
                    </div>

                    {/* Middle Row: Title + View Challenge Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', margin: '4px 0 8px 0', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: 0, flex: '1 1 320px' }}>
                        {p.title}
                      </h2>

                      <button
                        type="button"
                        onClick={() => {
                          if (isCollabTab || collab) {
                            navigate(`/university/collaborate/${p.id || collab?.problemId}`);
                          } else {
                            setActiveChallengeModal(p);
                          }
                        }}
                        style={{
                          background: (isCollabTab || collab) ? '#6D28D9' : '#024D24',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span>{(isCollabTab || collab) ? 'Collaborate Workspace →' : 'View Challenge →'}</span>
                      </button>
                    </div>

                    {/* Footer Metadata (NO ICONS) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: '#4B5563', flexWrap: 'wrap' }}>
                      <div>
                        <span>Submitter: <strong>{p.citizenName || '(0)'}</strong></span>
                      </div>

                      <div>
                        <span>Location: <strong>{p.district || 'Ranchi'}</strong></span>
                      </div>

                      <div>
                        <span>Date: <strong>{p.submissionDate || p.createdAt?.split('T')[0] || '2026-09-17'}</strong></span>
                      </div>

                      {pairedInd && (
                        <div style={{ color: '#6D28D9', fontWeight: 700 }}>
                          <span>Paired Industry: {pairedInd}</span>
                        </div>
                      )}
                    </div>

                    {/* Proposal Details Box (if proposal exists) */}
                    {proposal && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        color: '#92400E',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        <div>
                          <strong>Submitted Proposal:</strong> {proposal.solutionTitle || 'University Technical Proposal'}
                          {proposal.mentorName && <span style={{ marginLeft: '8px', color: '#78350F' }}>• Lead: {proposal.mentorName}</span>}
                        </div>
                        <span style={{ fontWeight: 800, background: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                          Status: {proposal.status || 'Under Review'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 6. BOTTOM BANNER (NO ICONS) */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '4px'
          }}>
            <div>
              <strong style={{ fontSize: '0.86rem', color: '#024D24', display: 'block' }}>
                {isCollabTab ? 'Together for a Better Tomorrow' : 'Have ideas for a new solution?'}
              </strong>
              <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>
                {isCollabTab 
                  ? 'Collaborate, solve, and create a positive impact in your community.'
                  : 'Collaborate with your team and submit your proposal to make an impact.'}
              </span>
            </div>

            <div>
              {isCollabTab ? (
                <button
                  type="button"
                  onClick={() => handleTabChange('collaborations')}
                  style={{
                    background: '#FFFFFF',
                    color: '#024D24',
                    border: '1px solid #024D24',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  View All Collaborations →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleTabChange('new')}
                  style={{
                    background: '#024D24',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  + Submit Proposal
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>

      {/* =========================================================================
          CHALLENGE INSPECT MODAL
         ========================================================================= */}
      {activeChallengeModal && (
        <div className="modal-backdrop" onClick={() => setActiveChallengeModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ background: '#024D24', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700, color: '#D1FAE5' }}>
                  Problem Statement & Proposal Gateway
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px', color: '#FFFFFF', lineHeight: 1.3 }}>
                  {activeChallengeModal.id}: {activeChallengeModal.title}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveChallengeModal(null)}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Badges Bar */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {activeChallengeModal.category && (
                  <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700 }}>
                    Category: {activeChallengeModal.category}
                  </span>
                )}

                {activeChallengeModal.domain && activeChallengeModal.domain !== activeChallengeModal.category && (
                  <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700 }}>
                    Domain: {activeChallengeModal.domain}
                  </span>
                )}

                {(activeChallengeModal.urgency || activeChallengeModal.priority) && (
                  <span style={{
                    background: (activeChallengeModal.urgency || activeChallengeModal.priority) === 'Critical' ? '#FEE2E2' : '#FEF3C7',
                    color: (activeChallengeModal.urgency || activeChallengeModal.priority) === 'Critical' ? '#991B1B' : '#B45309',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}>
                    Priority: {activeChallengeModal.urgency || activeChallengeModal.priority}
                  </span>
                )}

                {activeChallengeModal.status && (
                  <span style={{ background: '#F3F4F6', color: '#374151', padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, border: '1px solid #D1D5DB' }}>
                    Status: {activeChallengeModal.status}
                  </span>
                )}

                {activeChallengeModal.district && (
                  <span style={{ background: '#EDE9FE', color: '#6D28D9', padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700 }}>
                    District: {activeChallengeModal.district}
                  </span>
                )}
              </div>

              {/* Key Metadata Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px 16px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, letterSpacing: '0.5px' }}>Location / Address</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                    {activeChallengeModal.locationAddress || activeChallengeModal.location || activeChallengeModal.district || 'Ranchi, Jharkhand'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, letterSpacing: '0.5px' }}>Submitted By</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                    {activeChallengeModal.citizenName || 'Verified Citizen'}
                    {activeChallengeModal.citizenPhone ? ` (${activeChallengeModal.citizenPhone})` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, letterSpacing: '0.5px' }}>Submission Date</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                    {activeChallengeModal.submissionDate || activeChallengeModal.createdAt?.split('T')[0] || '2026-09-04'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6B7280', fontWeight: 700, letterSpacing: '0.5px' }}>Challenge ID</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#024D24', marginTop: '2px' }}>
                    {activeChallengeModal.id}
                  </div>
                </div>
              </div>

              {/* Full Description Box */}
              <div>
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#111827', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Problem Overview & Detailed Description
                </h4>
                <div style={{ background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '14px 16px', fontSize: '0.86rem', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {activeChallengeModal.description || 'No detailed problem statement provided.'}
                </div>
              </div>

              {/* Attached Media / Evidence Photo (if available) */}
              {activeChallengeModal.mediaUrl && (
                <div>
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#111827', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Ground Evidence & Media Attachment
                  </h4>
                  <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#000000', textAlign: 'center' }}>
                    <img
                      src={activeChallengeModal.mediaUrl}
                      alt={activeChallengeModal.title}
                      style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
                    />
                  </div>
                </div>
              )}

              {/* AI Triage & Verification Summary */}
              {(activeChallengeModal.aiStatus || activeChallengeModal.duplicateStatus || activeChallengeModal.matchedUniversitiesCount) && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '12px 16px', fontSize: '0.8rem', color: '#065F46' }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px', fontSize: '0.82rem' }}>
                    AI Audit & Multi-Partner Triage Status
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {activeChallengeModal.aiStatus && (
                      <div><strong>AI Triage:</strong> {activeChallengeModal.aiStatus}</div>
                    )}
                    {activeChallengeModal.duplicateStatus && (
                      <div><strong>Duplicate Check:</strong> {activeChallengeModal.duplicateStatus}</div>
                    )}
                    {activeChallengeModal.matchedUniversitiesCount && (
                      <div><strong>Academic Partners Matched:</strong> {activeChallengeModal.matchedUniversitiesCount}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '14px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setActiveChallengeModal(null)}
                  style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pId = activeChallengeModal.id;
                    setActiveChallengeModal(null);
                    navigate(`/university/take-challenge/${pId}`);
                  }}
                  style={{
                    background: '#024D24',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 22px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    boxShadow: '0 2px 6px rgba(2, 77, 36, 0.25)'
                  }}
                >
                  Propose Solution →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
