import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../admin/admin.css';
import '../university/university.css';
import { JharkhandCrest, CloseIcon, ChevronRight } from '../../components/Icons';
import { problemsService, normalizeTitle, JHARKHAND_DISTRICTS, PROBLEM_CATEGORIES, isProblemMatchingUniversityDomains } from '../../services/problemsService';
import { authService } from '../../services/authService';

export const IndustryProblems = ({ user, onBackToDashboard, onBackToLanding }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation & layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Normalizer helper for query tab aliases
  const normalizeIndustryTab = (rawTab) => {
    if (!rawTab) return 'all';
    const t = rawTab.toLowerCase();
    if (t === 'working' || t === 'submitted' || t === 'proposals') return 'working';
    if (t === 'funding' || t === 'funds' || t === 'collaborations' || t === 'collab') return 'collaborations';
    if (t === 'available' || t === 'new') return 'new';
    if (t === 'all' || t === 'government') return 'all';
    return 'all';
  };

  // Active tab: 'all' | 'new' | 'working' | 'collaborations'
  const tabParam = normalizeIndustryTab(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState(tabParam);

  const [problems, setProblems] = useState([]);
  const [industryTeams, setIndustryTeams] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Domain Expertise
  const industryExpertise = user?.areasOfExpertise || user?.industryExpertise || ['Environment', 'Water Management', 'Healthcare', 'Agriculture'];
  const [filterByDomain, setFilterByDomain] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Flow State
  const [activeChallengeModal, setActiveChallengeModal] = useState(null);

  // Sync tab with URL search params
  useEffect(() => {
    const current = normalizeIndustryTab(searchParams.get('tab'));
    setActiveTab(current);
  }, [searchParams]);

  const activeUser = user || authService.getCurrentUser();
  const displayName = activeUser?.companyName || activeUser?.organization || activeUser?.name || activeUser?.fullName || 'Corporate CSR Partner';
  const displayInitials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'TS';

  const loadData = async () => {
    setLoading(true);
    const [problemList, iTeams, collabList, solList] = await Promise.all([
      problemsService.getAllProblems(),
      problemsService.getIndustryTeams(activeUser),
      problemsService.getCollaborations({ companyName: activeUser?.companyName || activeUser?.name }, activeUser),
      problemsService.getSolutions(activeUser)
    ]);
    setProblems(problemList || []);
    setIndustryTeams(iTeams || []);
    setCollaborations(collabList || []);
    setSolutions(solList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getProblemIndustryTeam = (p) => {
    const titleKey = normalizeTitle(p.title);
    return industryTeams.find(
      t => t.problemId === p.id || normalizeTitle(t.problemTitle) === titleKey
    ) || null;
  };

  const getProblemCollaboration = (p) => {
    return collaborations.find(c => c.problemId === p.id || c.id === p.id || (p.title && c.problemTitle && normalizeTitle(c.problemTitle) === normalizeTitle(p.title))) || null;
  };

  const getProblemIndustrySolution = (p) => {
    const activeUser = user || authService.getCurrentUser();
    const activeCompName = (activeUser?.companyName || activeUser?.name || '').toLowerCase();
    const sol = (solutions || []).find(
      s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) &&
           (s.submitterType === 'industry' || s.companyName) &&
           (!activeCompName || !s.companyName || s.companyName.toLowerCase().includes(activeCompName) || s.userId === activeUser?.id)
    );
    return sol || null;
  };

  const isProblemIndustryWorking = (p) => {
    return !!getProblemIndustryTeam(p) || !!getProblemIndustrySolution(p);
  };

  const isProblemCollaborated = (p) => {
    return !!getProblemCollaboration(p);
  };

  const isMatchedToIndustry = (p) => {
    if (p.approvalStatus === 'PENDING_ADMIN_REVIEW' || p.approvalStatus === 'REJECTED_BY_ADMIN') return false;
    if (p.status === 'Pending Admin Review' || p.status === 'REJECTED' || p.status === 'MORE_INFO_REQUESTED') return false;

    // If no industry user is logged in or user has no specific filter, allow viewing
    if (!activeUser || (!activeUser.companyName && !activeUser.name && !activeUser.id)) return true;

    // If industry user has a team, solution, or collaboration for this problem, always match
    if (getProblemIndustryTeam(p) || getProblemIndustrySolution(p) || getProblemCollaboration(p)) return true;

    // If problem domain matches industry expertise, match
    if (isProblemMatchingUniversityDomains(p, industryExpertise)) return true;

    if (Array.isArray(p.matchedIndustryIds) && p.matchedIndustryIds.length > 0) {
      const iId = (activeUser?.id || activeUser?.industryId || '').toLowerCase();
      const iName = (activeUser?.companyName || activeUser?.organization || activeUser?.name || '').toLowerCase();
      if (!iId && !iName) return true;
      const matched = p.matchedIndustryIds.some(m => {
        const matchLower = (m || '').toLowerCase();
        return (iId && matchLower === iId) || (iName && (matchLower.includes(iName) || iName.includes(matchLower)));
      });
      return matched || p.matchedIndustryIds.length === 0;
    }
    return true;
  };

  // Metric counts
  const accessibleProblems = problems.filter(isMatchedToIndustry);
  const domainFilteredProblems = filterByDomain && industryExpertise.length > 0
    ? accessibleProblems.filter(p => isProblemMatchingUniversityDomains(p, industryExpertise) || isProblemIndustryWorking(p) || isProblemCollaborated(p))
    : accessibleProblems;

  const totalCount = domainFilteredProblems.length;
  const collabCount = domainFilteredProblems.filter(p => isProblemCollaborated(p)).length;
  const workingCount = domainFilteredProblems.filter(p => isProblemIndustryWorking(p)).length;
  const newCount = domainFilteredProblems.filter(p => !isProblemIndustryWorking(p) && !isProblemCollaborated(p)).length;

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Filtering
  const filteredProblems = accessibleProblems.filter((p) => {
    const isCollab = isProblemCollaborated(p);
    const isWorking = isProblemIndustryWorking(p);

    if (filterByDomain && industryExpertise.length > 0) {
      if (!isProblemMatchingUniversityDomains(p, industryExpertise) && !isWorking && !isCollab) {
        return false;
      }
    }

    if (activeTab === 'new' && (isCollab || isWorking)) return false;
    if (activeTab === 'working' && !isWorking) return false;
    if (activeTab === 'collaborations' && !isCollab) return false;

    // Category
    const matchesCat = selectedCategory === 'All' || p.category.toLowerCase().includes(selectedCategory.toLowerCase()) || (p.domain && p.domain.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    // District
    const matchesDist = selectedDistrict === 'All' || p.district.toLowerCase() === selectedDistrict.toLowerCase();
    
    // Priority
    const matchesPriority = selectedPriority === 'All' || 
      (p.urgency && p.urgency.toLowerCase() === selectedPriority.toLowerCase());

    // Search
    const q = searchQuery.toLowerCase().trim();
    const indTeam = getProblemIndustryTeam(p);
    const indSol = getProblemIndustrySolution(p);
    const collab = getProblemCollaboration(p);
    const matchesQuery = !q || 
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.citizenName?.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      (collab && (collab.companyName?.toLowerCase().includes(q) || collab.universityName?.toLowerCase().includes(q))) ||
      (indTeam && (indTeam.teamLeadName?.toLowerCase().includes(q) || indTeam.companyName?.toLowerCase().includes(q))) ||
      (indSol && (indSol.solutionTitle?.toLowerCase().includes(q) || indSol.teamLeadName?.toLowerCase().includes(q)));

    return matchesCat && matchesDist && matchesPriority && matchesQuery;
  });

  const sortedProblems = [...filteredProblems].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.submissionDate || 0).getTime();
    const dateB = new Date(b.createdAt || b.submissionDate || 0).getTime();
    return dateB - dateA;
  });

  const isCollabTab = activeTab === 'collaborations';

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

      {/* Mobile Backdrop Overlay */}
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
              <span>{isCollabTab ? 'Joint Innovation & Active Collaborations' : 'Industry Solutions & Problem Statements'}</span>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                {sortedProblems.length} Active Challenges
              </span>
            </div>
            <div className="header-sub-text" style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.82)' }}>
              Department of Industries & CSR • Government of Jharkhand
            </div>
          </div>
        </div>

        <div className="admin-topbar-right">
          <button
            type="button"
            onClick={onBackToDashboard || (() => navigate('/industry/dashboard'))}
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
              CSR Navigation
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px' }}>
              AUTHENTICATED
            </span>
          </div>

          {/* Sidebar Nav List (Unified with Industry Dashboard) */}
          <nav className="admin-nav-list" style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className="admin-nav-item"
              onClick={() => navigate('/industry/dashboard')}
            >
              <span className="admin-nav-label">Dashboard</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'all' || activeTab === 'new' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <span className="admin-nav-label">Matched Opportunities</span>
              <span className="admin-nav-count">{totalCount}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'working' ? 'active' : ''}`}
              onClick={() => handleTabChange('working')}
            >
              <span className="admin-nav-label">CSR Proposals</span>
              <span className="admin-nav-count" style={{ background: '#FEF3C7', color: '#B45309' }}>{workingCount}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === 'collaborations' ? 'active' : ''}`}
              onClick={() => handleTabChange('collaborations')}
            >
              <span className="admin-nav-label">Active Collaborations</span>
              <span className="admin-nav-count" style={{ background: '#EDE9FE', color: '#6D28D9' }}>{collabCount}</span>
            </button>
          </nav>

          {/* Profile Card in Sidebar */}
          <div className="admin-sidebar-footer" style={{ padding: '14px' }}>
            <div className="admin-user-profile" style={{ marginBottom: '10px' }}>
              <div className="admin-avatar" style={{ background: 'linear-gradient(135deg, #024D24 0%, #059669 100%)', color: '#FFFFFF', width: '34px', height: '34px', fontSize: '0.82rem' }}>
                {displayInitials}
              </div>
              <div className="admin-user-details">
                <div className="admin-user-name" style={{ fontSize: '0.84rem' }}>
                  {displayName}
                </div>
                <div className="admin-user-role" style={{ fontSize: '0.72rem' }}>
                  Industrial CSR Partner
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
          <div className="admin-content-area" style={{ background: '#F0F8F8', minHeight: '100%', padding: '24px 28px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
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
                  background: activeTab === 'all' ? '#036D33' : '#F9FAFB',
                  color: activeTab === 'all' ? '#FFFFFF' : '#374151',
                  border: activeTab === 'all' ? '1.5px solid #036D33' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'all' ? '0 2px 6px rgba(3, 109, 51, 0.2)' : 'none'
                }}
              >
                <span>Matched Opportunities</span>
                <span style={{
                  background: activeTab === 'all' ? 'rgba(255,255,255,0.25)' : '#ECFDF5',
                  color: activeTab === 'all' ? '#FFFFFF' : '#036D33',
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

              {/* Tab: My Submitted Solutions */}
              <button
                type="button"
                onClick={() => handleTabChange('working')}
                style={{
                  background: activeTab === 'working' ? '#D97706' : '#F9FAFB',
                  color: activeTab === 'working' ? '#FFFFFF' : '#B45309',
                  border: activeTab === 'working' ? '1.5px solid #D97706' : '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '7px 16px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'working' ? '0 2px 6px rgba(217, 119, 6, 0.2)' : 'none'
                }}
              >
                <span>CSR Proposals</span>
                <span style={{
                  background: activeTab === 'working' ? 'rgba(255,255,255,0.25)' : '#FEF3C7',
                  color: activeTab === 'working' ? '#FFFFFF' : '#92400E',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {workingCount}
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
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.05)'
            }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#065F46' }}>
                  Domain Routing Active: Showing challenges matched to {user?.companyName || 'your corporate expertise'}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '3px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>Your Registered Expertise:</span>
                  {industryExpertise.map((exp, i) => (
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
            borderRadius: '12px',
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
            </div>
          </div>

          {/* 5. PROBLEM CHALLENGES LIST (NO DESCRIPTION UNDER TITLE, NO ICONS) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#FFFFFF', borderRadius: '12px' }}>
                Loading problem statements...
              </div>
            ) : sortedProblems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280', background: '#FFFFFF', borderRadius: '12px' }}>
                No problem statements match your filter criteria.
              </div>
            ) : (
              sortedProblems.map((p, index) => {
                const collab = getProblemCollaboration(p);
                const pairedInd = collab?.companyName || p.pairedIndustry;
                const indSol = getProblemIndustrySolution(p);

                return (
                  <div
                    key={p.id || index}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      padding: '16px 20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    {/* Top Row: Tags + Problem ID */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        
                        {/* Category tag in Collaborations */}
                        {isCollabTab && (
                          <span style={{
                            background: p.category?.includes('Water') || p.category?.includes('Pipeline') ? '#E0F2FE' : '#DCFCE7',
                            color: p.category?.includes('Water') || p.category?.includes('Pipeline') ? '#0284C7' : '#166534',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            {p.category || 'Pipeline Leakage'}
                          </span>
                        )}

                        <span style={{
                          background: '#DCFCE7',
                          color: '#166534',
                          padding: '2px 10px',
                          borderRadius: '12px',
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
                            padding: '2px 10px',
                            borderRadius: '12px',
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
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            Paired with: {pairedInd}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 600 }}>
                        ID: {p.id} • #{index + 1}
                      </div>
                    </div>

                    {/* Middle Row: Title + View Challenge Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', margin: '4px 0 10px 0', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0, flex: '1 1 320px' }}>
                        {p.title}
                      </h2>

                      <button
                        type="button"
                        onClick={() => {
                          if (isCollabTab || collab) {
                            navigate(`/industry/collaborate/${p.id || collab?.problemId}`);
                          } else {
                            setActiveChallengeModal(p);
                          }
                        }}
                        style={{
                          background: (isCollabTab || collab) ? '#6D28D9' : '#024D24',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '7px 16px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.76rem', color: '#4B5563', flexWrap: 'wrap' }}>
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

                    {/* Solution / Proposal Details Box (if solution exists) */}
                    {indSol && (
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
                          <strong>Submitted CSR Solution:</strong> {indSol.solutionTitle || 'Corporate CSR Technical Proposal'}
                          {indSol.companyName && <span style={{ marginLeft: '8px', color: '#78350F' }}>• Partner: {indSol.companyName}</span>}
                        </div>
                        <span style={{ fontWeight: 800, background: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                          Status: {indSol.status || 'Under Review'}
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
            background: '#E6F7ED',
            border: '1px solid #A7F3D0',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '8px'
          }}>
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#024D24', display: 'block' }}>
                {isCollabTab ? 'Together for a Better Tomorrow' : 'Have ideas for a new solution?'}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#047857' }}>
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
                    padding: '7px 16px',
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
                    padding: '7px 16px',
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
        </div>
      </div>
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
                    navigate(`/industry/take-challenge/${pId}`);
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
                  Propose Industrial Solution →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
