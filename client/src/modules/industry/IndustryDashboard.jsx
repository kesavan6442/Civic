import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../admin/admin.css';
import '../university/university.css';
import { JharkhandCrest, CloseIcon, ChevronRight, IndustryIcon } from '../../components/Icons';
import { problemsService, normalizeTitle, isProblemMatchingUniversityDomains } from '../../services/problemsService';
import { authService } from '../../services/authService';

export const IndustryDashboard = ({ user, onLogout, onBackToLanding }) => {
  const navigate = useNavigate();

  // Navigation & layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState({
    matchedOpportunities: 0,
    csrCommitments: 0,
    myProposals: 0,
    activeCollaborations: 0,
    activeProjects: 0,
    totalFundingCommitted: 0,
    totalFundingCommittedFormatted: '₹ 0 Lakhs'
  });

  const [industryTeams, setIndustryTeams] = useState([]);
  const [collaborationsList, setCollaborationsList] = useState([]);
  const [problemsList, setProblemsList] = useState([]);
  const [solutionsList, setSolutionsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Industry CSR Capability Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileTab, setProfileTab] = useState('company'); // 'company' | 'capabilities' | 'csr' | 'contact'
  const [profileFormData, setProfileFormData] = useState({
    companyName: '',
    sector: '',
    headquarters: '',
    annualCsrBudget: '',
    focusAreas: '',
    manufacturingCapabilities: '',
    deploymentCapabilities: '',
    fieldDeploymentRegions: '',
    technicalSupport: '',
    equipmentSupport: '',
    availableInfrastructure: '',
    completedCivicProjects: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  const openProfileModal = () => {
    setProfileFormData({
      companyName: profile?.companyName || profile?.name || user?.companyName || user?.name || '',
      sector: profile?.sector || user?.sector || '',
      headquarters: profile?.headquarters || profile?.location || user?.location || '',
      annualCsrBudget: profile?.annualCsrBudget || profile?.fundingCapacity || '',
      focusAreas: Array.isArray(profile?.focusAreas || profile?.csrSectors) ? (profile.focusAreas || profile.csrSectors).join(', ') : (profile?.focusAreas || ''),
      manufacturingCapabilities: Array.isArray(profile?.manufacturingCapabilities) ? profile.manufacturingCapabilities.join(', ') : (profile?.manufacturingCapabilities || ''),
      deploymentCapabilities: Array.isArray(profile?.deploymentCapabilities) ? profile.deploymentCapabilities.join(', ') : (profile?.deploymentCapabilities || ''),
      fieldDeploymentRegions: Array.isArray(profile?.fieldDeploymentRegions) ? profile.fieldDeploymentRegions.join(', ') : (profile?.fieldDeploymentRegions || ''),
      technicalSupport: Array.isArray(profile?.technicalSupport) ? profile.technicalSupport.join(', ') : (profile?.technicalSupport || ''),
      equipmentSupport: Array.isArray(profile?.equipmentSupport) ? profile.equipmentSupport.join(', ') : (profile?.equipmentSupport || ''),
      availableInfrastructure: profile?.availableInfrastructure || '',
      completedCivicProjects: profile?.completedCivicProjects || 0,
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
        name: profileFormData.companyName,
        companyName: profileFormData.companyName,
        sector: profileFormData.sector,
        headquarters: profileFormData.headquarters,
        location: profileFormData.headquarters,
        annualCsrBudget: profileFormData.annualCsrBudget,
        fundingCapacity: profileFormData.annualCsrBudget,
        focusAreas: profileFormData.focusAreas.split(',').map(s => s.trim()).filter(Boolean),
        csrSectors: profileFormData.focusAreas.split(',').map(s => s.trim()).filter(Boolean),
        manufacturingCapabilities: profileFormData.manufacturingCapabilities.split(',').map(s => s.trim()).filter(Boolean),
        deploymentCapabilities: profileFormData.deploymentCapabilities.split(',').map(s => s.trim()).filter(Boolean),
        fieldDeploymentRegions: profileFormData.fieldDeploymentRegions.split(',').map(s => s.trim()).filter(Boolean),
        technicalSupport: profileFormData.technicalSupport.split(',').map(s => s.trim()).filter(Boolean),
        equipmentSupport: profileFormData.equipmentSupport.split(',').map(s => s.trim()).filter(Boolean),
        availableInfrastructure: profileFormData.availableInfrastructure,
        completedCivicProjects: parseInt(profileFormData.completedCivicProjects, 10) || 0,
        contactPerson: profileFormData.contactPerson,
        contactEmail: profileFormData.contactEmail,
        contactPhone: profileFormData.contactPhone,
        address: profileFormData.address
      };
      const updated = await problemsService.updateIndustryProfile(payload);
      if (updated) {
        setProfile(updated);
        setProfileSuccessMsg('✅ Industry CSR & Deployment Profile successfully updated and synced with AI Engine!');
        setTimeout(() => {
          setShowProfileModal(false);
          setProfileSuccessMsg('');
        }, 1500);
      }
    } catch (err) {
      alert('Failed to update corporate profile: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const activeUser = user || authService.getCurrentUser();
  const industryExpertise = activeUser?.areasOfExpertise || activeUser?.industryExpertise || ['Environment', 'Water Management', 'Healthcare', 'Agriculture'];

  const getProblemIndustryTeamHelper = (p, teamsArr) => {
    const titleKey = normalizeTitle(p.title);
    return (teamsArr || []).find(
      t => t.problemId === p.id || normalizeTitle(t.problemTitle) === titleKey
    ) || null;
  };

  const getProblemCollaborationHelper = (p, collabsArr) => {
    return (collabsArr || []).find(c => c.problemId === p.id || c.id === p.id || (p.title && c.problemTitle && normalizeTitle(c.problemTitle) === normalizeTitle(p.title))) || null;
  };

  const getProblemIndustrySolutionHelper = (p, solsArr) => {
    const activeCompName = (activeUser?.companyName || activeUser?.name || '').toLowerCase();
    const sol = (solsArr || []).find(
      s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) &&
           (s.submitterType === 'industry' || s.companyName) &&
           (!activeCompName || !s.companyName || s.companyName.toLowerCase().includes(activeCompName) || s.userId === activeUser?.id)
    );
    return sol || null;
  };

  const isProblemIndustryWorkingHelper = (p, teamsArr, solsArr) => {
    return !!getProblemIndustryTeamHelper(p, teamsArr) || !!getProblemIndustrySolutionHelper(p, solsArr);
  };

  const isMatchedToIndustryHelper = (p, teamsArr, solsArr, collabsArr) => {
    if (p.approvalStatus === 'PENDING_ADMIN_REVIEW' || p.approvalStatus === 'REJECTED_BY_ADMIN') return false;
    if (p.status === 'Pending Admin Review' || p.status === 'REJECTED' || p.status === 'MORE_INFO_REQUESTED') return false;

    if (!activeUser || (!activeUser.companyName && !activeUser.name && !activeUser.id)) return true;

    if (getProblemIndustryTeamHelper(p, teamsArr) || getProblemIndustrySolutionHelper(p, solsArr) || getProblemCollaborationHelper(p, collabsArr)) return true;

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

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      const [iProfile, iProjects, problemList, iTeams, collabList, solList] = await Promise.all([
        problemsService.getIndustryProfile(),
        problemsService.getIndustryProjects(),
        problemsService.getAllProblems(),
        problemsService.getIndustryTeams(activeUser),
        problemsService.getCollaborations({ companyName: activeUser?.companyName || activeUser?.name }, activeUser),
        problemsService.getSolutions(activeUser)
      ]);

      if (iProfile) setProfile(iProfile);

      const allProblems = problemList || [];
      const allTeams = iTeams || [];
      const allCollabs = collabList || [];
      const allSolutions = solList || [];

      // Calculate counts using the exact same logic as IndustryProblems.jsx
      const accessibleProblems = allProblems.filter(p => isMatchedToIndustryHelper(p, allTeams, allSolutions, allCollabs));
      const domainFilteredProblems = industryExpertise.length > 0
        ? accessibleProblems.filter(p => isProblemMatchingUniversityDomains(p, industryExpertise) || isProblemIndustryWorkingHelper(p, allTeams, allSolutions) || !!getProblemCollaborationHelper(p, allCollabs))
        : accessibleProblems;

      const totalCount = domainFilteredProblems.length;
      const collabCount = domainFilteredProblems.filter(p => !!getProblemCollaborationHelper(p, allCollabs)).length;
      const workingCount = domainFilteredProblems.filter(p => isProblemIndustryWorkingHelper(p, allTeams, allSolutions)).length;

      const totalCommittedNum = (allCollabs || []).reduce((sum, c) => {
        const amt = parseFloat((c.fundingAmount || '').replace(/[^0-9.]/g, '')) || 0;
        return sum + amt;
      }, 0);

      const computedMetrics = {
        matchedOpportunities: totalCount,
        csrProposals: workingCount,
        myProposals: workingCount,
        activeCollaborations: collabCount,
        activePartnerships: collabCount,
        activeProjects: (iProjects && iProjects.length > 0) ? iProjects.length : collabCount,
        completedCSRProjects: 0,
        sanctionedCSR: totalCommittedNum > 0 ? `₹ ${(totalCommittedNum / 100).toFixed(2)} Cr` : '₹ 0.00 Cr',
        totalFundingCommitted: totalCommittedNum,
        totalFundingCommittedFormatted: totalCommittedNum > 0 ? `₹ ${totalCommittedNum} Lakhs` : '₹ 0 Lakhs'
      };

      setMetrics(computedMetrics);
      setProblemsList(domainFilteredProblems);
      setIndustryTeams(allTeams);
      setSolutionsList(allSolutions);
      setCollaborationsList(allCollabs);
    } catch (err) {
      console.error('Error fetching industry dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const displayName = profile?.companyName || profile?.name || activeUser?.companyName || activeUser?.fullName || activeUser?.name || activeUser?.organization || '';
  const displaySector = profile?.sector || activeUser?.sector || '';
  const displayLocation = profile?.location || profile?.headquarters || activeUser?.location || activeUser?.district || '';
  const displayInitials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'IN';

  // 6 Specified Tenant Industry Metrics
  const industryMetrics = [
    {
      id: 'matched-opportunities',
      className: 'card-total-problems',
      labelEn: 'Matched CSR Opportunities',
      labelHi: 'मेल खाती सीएसआर संभावनाएं',
      count: metrics.matchedOpportunities ?? 0,
      clickable: true,
      subtitle: 'Aligned with CSR Sectors →',
      path: '/industry/problems?tab=all',
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
      id: 'csr-proposals',
      className: 'card-submitted-problems',
      labelEn: 'CSR Commitments / Proposals',
      labelHi: 'सीएसआर प्रतिबद्धताएं / प्रस्ताव',
      count: metrics.myProposals ?? 0,
      clickable: true,
      badge: metrics.myProposals > 0 ? `${metrics.myProposals} Submitted` : null,
      subtitle: 'Grant Proposals Under Review →',
      path: '/industry/problems?tab=working',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      )
    },
    {
      id: 'active-collaborations',
      className: 'card-funding-approved',
      labelEn: 'Active Collaborations',
      labelHi: 'सक्रिय विश्वविद्यालय सहयोग',
      count: metrics.activeCollaborations ?? 0,
      clickable: true,
      badge: metrics.activeCollaborations > 0 ? `${metrics.activeCollaborations} University Grants` : null,
      subtitle: 'Joint Innovation Teams →',
      path: '/industry/problems?tab=collaborations',
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
      className: 'card-currently-working',
      labelEn: 'Active Co-Funded Projects',
      labelHi: 'सक्रिय सह-वित्तपोषित परियोजनाएं',
      count: metrics.activeProjects ?? 0,
      clickable: true,
      badge: metrics.activeProjects > 0 ? `${metrics.activeProjects} In Field` : null,
      subtitle: 'Deployment & Monitoring →',
      path: '/industry/problems?tab=collaborations',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: 'total-funding',
      className: 'card-submitted-to-government',
      labelEn: 'Total CSR Funding Committed',
      labelHi: 'कुल सीएसआर निधि प्रतिबद्ध',
      count: metrics.totalFundingCommittedFormatted || '₹ 0 Lakhs',
      clickable: true,
      badge: 'Direct CSR Impact',
      subtitle: 'Allocated to District Projects →',
      path: '/industry/problems?tab=collaborations',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
        <div className="admin-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="admin-sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Navigation Sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <JharkhandCrest size={32} />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.2px', lineHeight: 1.1 }}>
                CivicConnect
              </div>
              <div style={{ fontSize: '0.68rem', color: '#D1FAE5', fontWeight: 600 }}>
                Govt. of Jharkhand
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.25)', margin: '0 4px' }} />

          <div>
            <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{displayName}</span>
              <span style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                CSR Command Center
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.82)' }}>
              Industries & CSR Dept • Government of Jharkhand
            </div>
          </div>
        </div>

        <div className="admin-topbar-right">
          <span className="admin-topbar-badge">
            🇮🇳 Industry Partner Portal
          </span>

          <button
            type="button"
            onClick={() => navigate('/industry/problems')}
            className="admin-topbar-btn"
          >
            View Problems
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="admin-topbar-btn danger"
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
              CSR Navigation
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px' }}>
              AUTHENTICATED
            </span>
          </div>

          <nav className="admin-nav-list" style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className="admin-nav-item active"
              onClick={() => navigate('/industry/dashboard')}
            >
              <span className="admin-nav-label">Dashboard</span>
            </button>

            <button
              type="button"
              className="admin-nav-item"
              onClick={() => navigate('/industry/problems?tab=all')}
            >
              <span className="admin-nav-label">Matched Opportunities</span>
              <span className="admin-nav-count" style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6' }}>
                {metrics?.matchedOpportunities ?? 0}
              </span>
            </button>

            <button
              type="button"
              className="admin-nav-item"
              onClick={() => navigate('/industry/problems?tab=working')}
            >
              <span className="admin-nav-label">CSR Proposals</span>
              <span className="admin-nav-count" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                {metrics?.myProposals ?? 0}
              </span>
            </button>

            <button
              type="button"
              className="admin-nav-item"
              onClick={() => navigate('/industry/problems?tab=collaborations')}
            >
              <span className="admin-nav-label">Active Collaborations</span>
              <span className="admin-nav-count" style={{ background: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
                {metrics?.activeCollaborations ?? 0}
              </span>
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
                  {displaySector.split(',')[0]}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="admin-return-btn"
              onClick={onBackToLanding || (() => navigate('/'))}
              style={{ width: '100%', justifyContent: 'center', padding: '7px 10px', fontSize: '0.76rem' }}
            >
              ← Return to Portals
            </button>
          </div>
        </aside>

        {/* Main Content Wrapper */}
        <div className="admin-main-wrapper">
          <div className="admin-content-area" style={{ background: '#F0F8F8', minHeight: '100%', padding: '24px 28px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Industry Identity Card */}
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
                    <span style={{ fontSize: '1.4rem' }}>🏭</span>
                    <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#024D24', margin: 0 }}>
                      {displayName}
                    </h1>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: '#4B5563', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                    📍 HQ: <strong>{displayLocation}</strong> • 🏢 Sector: <strong>{displaySector}</strong>
                    {profile?.fundingCapacity ? ` • 💰 Annual CSR Budget: ${profile.fundingCapacity}` : ''}
                  </p>

                  {/* CSR Focus Sectors Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#024D24' }}>CSR Focus Areas:</span>
                    {(profile?.focusAreas || profile?.csrSectors || ['Water Management', 'Healthcare', 'Skill Development', 'Rural Infrastructure']).map((sec, i) => (
                      <span key={i} style={{
                        background: '#FEF3C7',
                        color: '#92400E',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        border: '1px solid #FDE68A'
                      }}>
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '240px' }}>
                  <button
                    type="button"
                    onClick={openProfileModal}
                    style={{
                      background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
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
                      boxShadow: '0 2px 8px rgba(180,83,9,0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>🏢</span>
                    <span>Edit Corporate CSR Profile</span>
                  </button>
                  <div style={{
                    background: '#FFFBEB',
                    border: '1.5px solid #FCD34D',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Tenant Isolation Status
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#78350F', marginTop: '2px' }}>
                      🔒 Strict Enterprise Scope
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '2px' }}>
                      AI Matching Synced ({profile?.equipmentSupport?.length || 3} Equip, {profile?.deploymentCapabilities?.length || 2} Log)
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Industry Metrics Cards */}
              <div className="admin-stats-grid-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {industryMetrics.map((card) => (
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

              {/* Matched CSR Opportunities Table */}
              <div className="admin-table-card">
                <div className="admin-table-header" style={{ padding: '16px 20px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      Matched CSR Opportunities ({problemsList.length})
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                      Civic problems aligned with {displayName}'s CSR thematic priorities
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/industry/problems')}
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
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💡</div>
                    <h4 style={{ fontSize: '1.05rem', color: '#374151', margin: '0 0 6px 0' }}>No Matched Opportunities Currently</h4>
                    <p style={{ fontSize: '0.84rem', maxWidth: '420px', margin: '0 auto' }}>
                      No civic problems are currently routed to this industry partner's CSR focus sectors. New problem statements will appear here upon submission.
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
                          <th style={{ padding: '12px 16px', fontSize: '0.72rem' }}>SECTOR</th>
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
                              <td style={{ padding: '14px 16px', color: '#92400E', fontWeight: 600 }}>
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
                                              status === 'Broadcasted to Domain Partners' ? '#EFF6FF' : '#FEF3C7',
                                  color: status === 'Currently Working' || status === 'In Progress' ? '#059669' :
                                         status === 'Solutions Submitted' ? '#7C3AED' :
                                         status === 'Broadcasted to Domain Partners' ? '#2563EB' : '#D97706'
                                }}>
                                  {status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="admin-view-btn"
                                  onClick={() => navigate(`/industry/take-challenge/${p.id}`)}
                                >
                                  Co-Fund / Adopt
                                </button>
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
          MODAL: EDIT INDUSTRY CSR & DEPLOYMENT PROFILE (4 Tabs)
         ========================================================================= */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px', width: '95%' }}>
            
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Corporate Entity Profile & CSR Matching
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  🏢 Edit Corporate CSR & Deployment Profile
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
                { id: 'company', label: '1. Company & Budget' },
                { id: 'capabilities', label: '2. Tech & Equipment' },
                { id: 'csr', label: '3. CSR & Field Scope' },
                { id: 'contact', label: '4. Corporate Contact' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProfileTab(tab.id)}
                  style={{
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: profileTab === tab.id ? '3px solid #B45309' : '3px solid transparent',
                    color: profileTab === tab.id ? '#B45309' : '#6B7280',
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

                {/* TAB 1: COMPANY & BUDGET */}
                {profileTab === 'company' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Company / Corporation Official Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        value={profileFormData.companyName}
                        onChange={(e) => setProfileFormData({ ...profileFormData, companyName: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Industry Sector / Domain *
                        </label>
                        <input
                          type="text"
                          required
                          className="admin-input"
                          placeholder="e.g. Mining, Steel & Heavy Engineering"
                          value={profileFormData.sector}
                          onChange={(e) => setProfileFormData({ ...profileFormData, sector: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Corporate Headquarters / Base Location *
                        </label>
                        <input
                          type="text"
                          required
                          className="admin-input"
                          placeholder="e.g. Jamshedpur, Jharkhand"
                          value={profileFormData.headquarters}
                          onChange={(e) => setProfileFormData({ ...profileFormData, headquarters: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Annual CSR Budget Allocation Range *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. ₹ 25 Crores / ₹ 10-50 Lakhs per civic project"
                        value={profileFormData.annualCsrBudget}
                        onChange={(e) => setProfileFormData({ ...profileFormData, annualCsrBudget: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: TECH & EQUIPMENT */}
                {profileTab === 'capabilities' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Manufacturing & Fabrication Capabilities (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Heavy Steel Fabrication, Pipe Extrusion & Casting, Solar Mounting"
                        value={profileFormData.manufacturingCapabilities}
                        onChange={(e) => setProfileFormData({ ...profileFormData, manufacturingCapabilities: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Heavy Machinery & Equipment Support (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Heavy Excavators, Hydraulic Pipeline Pushers, Mobile Water Testing Vans"
                        value={profileFormData.equipmentSupport}
                        onChange={(e) => setProfileFormData({ ...profileFormData, equipmentSupport: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Technical Staffing & Engineering Support (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Senior Structural Engineers, IoT Maintenance Crews, Metallurgical Testing"
                        value={profileFormData.technicalSupport}
                        onChange={(e) => setProfileFormData({ ...profileFormData, technicalSupport: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Available Logistics & Infrastructure Summary
                      </label>
                      <textarea
                        rows={3}
                        className="admin-input"
                        placeholder="Describe fabrication yards, warehousing locations, plant facilities, and vehicle fleets..."
                        value={profileFormData.availableInfrastructure}
                        onChange={(e) => setProfileFormData({ ...profileFormData, availableInfrastructure: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: CSR & FIELD SCOPE */}
                {profileTab === 'csr' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        CSR Thematic Priority Focus Areas (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Water Management, Renewable Energy, Healthcare, Waste Management, Rural Infra"
                        value={profileFormData.focusAreas}
                        onChange={(e) => setProfileFormData({ ...profileFormData, focusAreas: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                      <small style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                        The AI Matcher routes civic problems to your company when they align with these CSR priority areas.
                      </small>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Field Deployment Capabilities (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. District-wide On-ground Logistics, Heavy Crane Fleet, Civil Execution"
                        value={profileFormData.deploymentCapabilities}
                        onChange={(e) => setProfileFormData({ ...profileFormData, deploymentCapabilities: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Target Field Deployment Districts in Jharkhand (Comma-separated) *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. East Singhbhum, West Singhbhum, Saraikela, Ranchi, Ramgarh, Bokaro"
                        value={profileFormData.fieldDeploymentRegions}
                        onChange={(e) => setProfileFormData({ ...profileFormData, fieldDeploymentRegions: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Completed Civic & CSR Projects Count
                      </label>
                      <input
                        type="number"
                        className="admin-input"
                        value={profileFormData.completedCivicProjects}
                        onChange={(e) => setProfileFormData({ ...profileFormData, completedCivicProjects: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: CORPORATE CONTACT */}
                {profileTab === 'contact' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        CSR Head / Corporate Point of Contact *
                      </label>
                      <input
                        type="text"
                        required
                        className="admin-input"
                        placeholder="e.g. Mr. Alok Sengupta (VP Corporate Sustainability)"
                        value={profileFormData.contactPerson}
                        onChange={(e) => setProfileFormData({ ...profileFormData, contactPerson: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Corporate CSR Email *
                        </label>
                        <input
                          type="email"
                          required
                          className="admin-input"
                          placeholder="e.g. csr@tatasteel.com"
                          value={profileFormData.contactEmail}
                          onChange={(e) => setProfileFormData({ ...profileFormData, contactEmail: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                          Official Corporate Phone / Helpline *
                        </label>
                        <input
                          type="tel"
                          required
                          className="admin-input"
                          placeholder="e.g. +91 657 242 4000"
                          value={profileFormData.contactPhone}
                          onChange={(e) => setProfileFormData({ ...profileFormData, contactPhone: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                        Corporate Office Address *
                      </label>
                      <textarea
                        rows={2}
                        required
                        className="admin-input"
                        placeholder="e.g. Corporate CSR Division, Tata Steel Ltd, Jamshedpur, Jharkhand - 831001"
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
                  Changes are persisted to MongoDB and synced with AI Opportunity Matcher.
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
                      background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 22px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      cursor: isSavingProfile ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSavingProfile ? 'Saving...' : '💾 Save CSR Profile'}
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
