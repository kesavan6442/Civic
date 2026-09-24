import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../admin/admin.css';
import '../university/university.css';
import { JharkhandCrest, CloseIcon, ChevronRight } from '../../components/Icons';
import { problemsService, isProblemMatchingUniversityDomains, normalizeTitle } from '../../services/problemsService';

// =========================================================================
// SVG HELPER ICONS (MATCHING USER REFERENCE UI)
// =========================================================================
const HomeNavIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const FolderNavIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const TrendingNavIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const UsersNavIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const DocNavIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const ChatNavIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const BellNavIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const SproutIcon = ({ size = 26, color = '#059669' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10" />
    <path d="M10 20c0-4 1.5-7 4-9" />
    <path d="M4 11a7 7 0 0 1 7-7h1a7 7 0 0 1 7 7v1a7 7 0 0 1-7 7H8a4 4 0 0 1-4-4v-4z" />
  </svg>
);

const PencilEditIcon = ({ size = 15, color = '#059669' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const SendPlaneIcon = ({ size = 16, color = '#FFFFFF' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const UniversityBuildingIcon = ({ size = 18, color = '#4B5563' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 2L2 7h20L12 2z"/>
  </svg>
);

const IndustryBuildingIcon = ({ size = 18, color = '#4B5563' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20h20M4 20V8l6 4V4l6 4v12M14 12v.01M14 16v.01M6 12v.01M6 16v.01M10 16v.01M18 12v.01M18 16v.01"/>
  </svg>
);

const MegaphoneIcon = ({ size = 18, color = '#111827' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l18-5v12L3 13v-2z"></path>
    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
  </svg>
);

const LightbulbIcon = ({ size = 18, color = '#FFFFFF' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4M15 8a6 6 0 1 0-8 5.3v1.7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.7c1.8-1.2 2-3.3 0-5.3z" />
  </svg>
);

export const IndustryCollaborate = ({ user, userRole: propRole, onBackToProblems, onBackToDashboard }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatBottomRef = useRef(null);

  // Navigation & layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine user role
  const isUniv = propRole === 'university' || !!user?.universityName || window.location.pathname.startsWith('/university');
  const userRole = isUniv ? 'university' : 'industry';
  const roleColor = isUniv ? '#036D33' : '#6D28D9';
  const roleBg = isUniv ? '#E8F5E9' : '#EDE9FE';

  const activeUser = user || authService.getCurrentUser();
  const displayName = isUniv 
    ? (activeUser?.universityName || activeUser?.name || 'Academic Research Partner') 
    : (activeUser?.companyName || activeUser?.name || 'Industrial CSR Partner');
  const displayInitials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || (isUniv ? 'UN' : 'IN');

  const [collab, setCollab] = useState(null);
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);

  // Chat message input
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateProgress, setUpdateProgress] = useState('50%');
  const [updateFolderLink, setUpdateFolderLink] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Final Submit Modal State
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [finalTitle, setFinalTitle] = useState('');
  const [finalDescription, setFinalDescription] = useState('');
  const [finalFolderLink, setFinalFolderLink] = useState('');
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [finalSuccessModal, setFinalSuccessModal] = useState(false);

  // Default initial chat thread matching the exact reference UI
  const DEFAULT_INITIAL_MESSAGES = [
    {
      id: 'MSG-SYSTEM-INIT',
      sender: 'Govt. Administration System',
      senderType: 'system',
      role: 'admin',
      time: 'Just now',
      text: 'Official collaboration established between University and Industry teams. Coordinate deliverables, blueprints, and milestone updates here.'
    }
  ];

  // Default initial notices
  const DEFAULT_NOTICES = [];

  // Default milestones
  const DEFAULT_MILESTONES = [
    { id: 1, title: 'Initial Setup', date: '10/06/2026', status: 'completed' },
    { id: 2, title: 'Field Study', date: '22/06/2026', status: 'completed' },
    { id: 3, title: 'Prototype', date: '05/07/2026', status: 'active' },
    { id: 4, title: 'Final Report', date: '20/07/2026', status: 'pending' }
  ];

  // Shared Storage Helpers
  const loadSharedMessages = (problemId) => {
    try {
      const saved = localStorage.getItem(`civic_messages_${problemId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_INITIAL_MESSAGES;
  };

  const loadSharedUpdates = (problemId) => {
    try {
      const saved = localStorage.getItem(`civic_updates_${problemId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'UPD-1',
        title: 'Joint Workspace Initialized by State Admin',
        author: 'State Administration Command Center',
        role: 'admin',
        date: new Date().toLocaleDateString('en-IN'),
        description: 'Tripartite collaboration sanctioned. Academic R&D team and Corporate CSR partner linked for joint execution.'
      }
    ];
  };

  const [allAvailableProblems, setAllAvailableProblems] = useState([]);
  const [navMetrics, setNavMetrics] = useState({
    matched: 0,
    proposals: 0,
    collaborations: 0
  });

  const loadData = async () => {
    setLoading(true);
    const cleanId = id ? decodeURIComponent(id).trim() : 'JH-CHLG-2026-1001';
    const allProblems = await problemsService.getAllProblems();
    const allSols = await problemsService.getSolutions();
    const allCollabs = await problemsService.getCollaborations();
    setAllAvailableProblems(allProblems);

    // Compute dynamic sidebar counts to match Dashboard & Problems views exactly
    if (isUniv) {
      const universityExpertise = activeUser?.areasOfExpertise || activeUser?.departmentSpecialization || ['Environment', 'Water Management', 'Healthcare', 'Agriculture'];
      const activeUnivName = (activeUser?.universityName || activeUser?.name || '').toLowerCase();
      
      const isMatchedUniv = (p) => {
        if (p.approvalStatus === 'PENDING_ADMIN_REVIEW' || p.approvalStatus === 'REJECTED_BY_ADMIN') return false;
        if (p.status === 'Pending Admin Review' || p.status === 'REJECTED' || p.status === 'MORE_INFO_REQUESTED') return false;
        if (!activeUser || (!activeUser.universityName && !activeUser.name && !activeUser.id)) return true;
        const hasSol = allSols.some(s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) && (!activeUnivName || !s.universityName || s.universityName.toLowerCase().includes(activeUnivName) || s.userId === activeUser?.id));
        const hasCol = allCollabs.some(c => c.problemId === p.id || c.id === p.id || (p.title && c.problemTitle && normalizeTitle(c.problemTitle) === normalizeTitle(p.title)));
        if (hasSol || hasCol) return true;
        return isProblemMatchingUniversityDomains(p, universityExpertise);
      };

      const matchedProblems = allProblems.filter(isMatchedUniv);
      const myProposals = matchedProblems.filter(p => allSols.some(s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) && (!activeUnivName || !s.universityName || s.universityName.toLowerCase().includes(activeUnivName) || s.userId === activeUser?.id)));
      const activeCollabs = matchedProblems.filter(p => allCollabs.some(c => c.problemId === p.id || c.id === p.id || (p.title && c.problemTitle && normalizeTitle(c.problemTitle) === normalizeTitle(p.title))));

      setNavMetrics({
        matched: matchedProblems.length,
        proposals: myProposals.length,
        collaborations: activeCollabs.length
      });
    } else {
      const industryExpertise = activeUser?.areasOfExpertise || activeUser?.industryExpertise || ['Environment', 'Water Management', 'Healthcare', 'Agriculture'];
      const activeCompName = (activeUser?.companyName || activeUser?.name || '').toLowerCase();

      const isMatchedInd = (p) => {
        if (p.approvalStatus === 'PENDING_ADMIN_REVIEW' || p.approvalStatus === 'REJECTED_BY_ADMIN') return false;
        if (p.status === 'Pending Admin Review' || p.status === 'REJECTED' || p.status === 'MORE_INFO_REQUESTED') return false;
        if (!activeUser || (!activeUser.companyName && !activeUser.name && !activeUser.id)) return true;
        const hasSol = allSols.some(s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) && (s.submitterType === 'industry' || s.companyName) && (!activeCompName || !s.companyName || s.companyName.toLowerCase().includes(activeCompName) || s.userId === activeUser?.id));
        const hasCol = allCollabs.some(c => c.problemId === p.id || c.id === p.id || (p.title && c.problemTitle && normalizeTitle(c.problemTitle) === normalizeTitle(p.title)));
        if (hasSol || hasCol) return true;
        return isProblemMatchingUniversityDomains(p, industryExpertise);
      };

      const matchedProblems = allProblems.filter(isMatchedInd);
      const myProposals = matchedProblems.filter(p => allSols.some(s => (s.problemId === p.id || (s.problemTitle && p.title && normalizeTitle(s.problemTitle) === normalizeTitle(p.title))) && (s.submitterType === 'industry' || s.companyName) && (!activeCompName || !s.companyName || s.companyName.toLowerCase().includes(activeCompName) || s.userId === activeUser?.id)));
      const activeCollabs = matchedProblems.filter(p => allCollabs.some(c => c.problemId === p.id || c.id === p.id || (p.title && c.problemTitle && normalizeTitle(c.problemTitle) === normalizeTitle(p.title))));

      setNavMetrics({
        matched: matchedProblems.length,
        proposals: myProposals.length,
        collaborations: activeCollabs.length
      });
    }

    // 1. Try to find existing collaboration by exact ID
    let foundCollab = allCollabs.find(c => 
      c.id === cleanId || 
      c.problemId === cleanId ||
      (c.id && cleanId && (c.id.toLowerCase().includes(cleanId.toLowerCase()) || cleanId.toLowerCase().includes(c.id.toLowerCase())))
    );

    // 2. If not found directly, extract problem reference from ID
    let foundProblem = null;
    if (foundCollab && foundCollab.problemId) {
      foundProblem = allProblems.find(p => p.id === foundCollab.problemId) || await problemsService.getProblemById(foundCollab.problemId);
    }

    if (!foundProblem) {
      const match = cleanId.match(/10\d{2}/);
      const code = match ? match[0] : '';
      if (code) {
        foundProblem = allProblems.find(p => p.id?.includes(code) || p.id === `JH-CHLG-2026-${code}`);
      }
      if (!foundProblem) {
        foundProblem = allProblems.find(p => p.id === cleanId || (p.title && cleanId.toLowerCase().includes(p.title.toLowerCase().substring(0, 15))))
          || allProblems.find(p => p.id === 'JH-CHLG-2026-1001')
          || allProblems[0];
      }
    }

    const problemId = foundProblem?.id || 'JH-CHLG-2026-1001';
    const univSols = allSols.filter(s => s.problemId === problemId && (s.submitterType?.toLowerCase() === 'university' || s.universityName));
    const indSols = allSols.filter(s => s.problemId === problemId && (s.submitterType?.toLowerCase() === 'industry' || s.companyName));
    
    const univSol = univSols[0] || null;
    const indSol = indSols[0] || null;

    const sharedMessages = loadSharedMessages(problemId);
    const sharedUpdates = loadSharedUpdates(problemId);

    const enrichedCollab = {
      id: foundCollab?.id || `COLLAB-${problemId}`,
      problemId: problemId,
      problemTitle: foundCollab?.problemTitle || foundProblem?.title || 'Civic Infrastructure Challenge',
      category: foundCollab?.category || foundProblem?.category || 'Civic Infrastructure',
      district: foundCollab?.district || foundProblem?.district || 'Jharkhand',
      status: foundCollab?.status || 'Active Collaboration',
      universityName: foundCollab?.universityName || foundProblem?.adoptedByUniversity || univSol?.universityName || activeUser?.universityName || 'Academic Institution',
      universitySolution: foundCollab?.universitySolution || (univSol ? {
        solutionTitle: univSol.solutionTitle || univSol.title,
        description: univSol.technicalApproach || univSol.description,
        technicalApproach: univSol.technicalApproach || univSol.description,
        mentorName: univSol.mentorName || univSol.leadName || 'Faculty Project Lead',
        mentorDesignation: univSol.mentorDesignation || 'Principal Investigator',
        students: univSol.students || [],
        estimatedCost: univSol.estimatedCost || univSol.budget || '₹ 30 Lakhs',
        estimatedTimeWeeks: univSol.estimatedTimeWeeks || 12,
        folderLink: univSol.folderLink || ''
      } : {
        solutionTitle: foundProblem?.title ? `Research Solution: ${foundProblem.title}` : 'Civic Problem Solution Proposal',
        description: foundProblem?.description || 'Applied engineering proposal and methodology.',
        technicalApproach: foundProblem?.description || 'Applied engineering proposal and methodology.',
        mentorName: 'Faculty Project Lead',
        mentorDesignation: 'Principal Investigator',
        students: [],
        estimatedCost: '₹ 30 Lakhs',
        estimatedTimeWeeks: 12,
        folderLink: ''
      }),
      companyName: foundCollab?.companyName || foundProblem?.adoptedByIndustry || indSol?.companyName || activeUser?.companyName || 'Corporate CSR Partner',
      industrySolution: foundCollab?.industrySolution || (indSol ? {
        solutionTitle: indSol.solutionTitle || indSol.title,
        description: indSol.technicalApproach || indSol.description,
        technicalApproach: indSol.technicalApproach || indSol.description,
        teamLeadName: indSol.teamLeadName || indSol.mentorName || 'CSR Project Manager',
        teamLeadDesignation: indSol.teamLeadDesignation || 'Head of Community Relations',
        members: indSol.members || [],
        estimatedCost: indSol.fundingAmount || indSol.estimatedCost || 'CSR Funding Commitment',
        estimatedTimeWeeks: indSol.estimatedTimeWeeks || 12,
        folderLink: indSol.folderLink || ''
      } : {
        solutionTitle: foundProblem?.title ? `CSR Implementation: ${foundProblem.title}` : 'CSR Co-Funding & Equipment Support',
        description: 'CSR capital co-funding, equipment supply, and industrial field deployment support.',
        technicalApproach: 'CSR capital co-funding, equipment supply, and industrial field deployment support.',
        teamLeadName: 'CSR Project Lead',
        teamLeadDesignation: 'Head of Community Relations',
        members: [],
        estimatedCost: '₹ 40 Lakhs CSR Co-Funding',
        estimatedTimeWeeks: 12,
        folderLink: ''
      }),
      updates: sharedUpdates,
      messages: sharedMessages
    };

    setCollab(enrichedCollab);
    setProblem(foundProblem);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Real-time synchronization across tabs and windows
  useEffect(() => {
    if (!collab?.problemId) return;

    const syncLatestData = () => {
      const msgs = loadSharedMessages(collab.problemId);
      const upds = loadSharedUpdates(collab.problemId);
      setCollab(prev => {
        if (!prev) return prev;
        const msgsChanged = JSON.stringify(prev.messages) !== JSON.stringify(msgs);
        const updsChanged = JSON.stringify(prev.updates) !== JSON.stringify(upds);
        if (msgsChanged || updsChanged) {
          return { ...prev, messages: msgs, updates: upds };
        }
        return prev;
      });
    };

    const interval = setInterval(syncLatestData, 1000);
    window.addEventListener('storage', syncLatestData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncLatestData);
    };
  }, [collab?.problemId]);

  // Send message with real-time multi-tab broadcasting
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !collab?.problemId) return;

    setIsSendingMessage(true);
    const senderName = user?.representativeName || (isUniv ? (user?.universityName || 'Prof. Ramesh K. Soren') : (user?.companyName || 'Rajesh Kumar Verma'));
    const newMsg = {
      id: `MSG-${Date.now()}`,
      sender: senderName,
      senderName: senderName,
      role: userRole,
      senderType: userRole,
      text: messageText.trim(),
      message: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: new Date().toISOString()
    };

    // 1. Save to shared problem message store
    const currentMsgs = loadSharedMessages(collab.problemId);
    const updatedMsgs = [...currentMsgs, newMsg];
    try {
      localStorage.setItem(`civic_messages_${collab.problemId}`, JSON.stringify(updatedMsgs));
      localStorage.setItem('civic_collab_sync_trigger', Date.now().toString());
    } catch (e) {}

    // 2. Dispatch cross-tab storage event
    window.dispatchEvent(new Event('storage'));

    // 3. Update local state
    setCollab(prev => ({
      ...prev,
      messages: updatedMsgs
    }));
    setMessageText('');
    setIsSendingMessage(false);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Post Update with real-time multi-tab broadcasting
  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateTitle.trim() || !updateDescription.trim() || !collab?.problemId) {
      alert('Please provide update title and details.');
      return;
    }

    setIsSubmittingUpdate(true);
    const authorName = user?.representativeName || (isUniv ? (user?.universityName || 'Prof. Ramesh K. Soren') : (user?.companyName || 'Rajesh Kumar Verma'));
    const updateObj = {
      id: `UPD-${Date.now()}`,
      title: updateTitle.trim(),
      description: updateDescription.trim(),
      author: authorName,
      authorName: authorName,
      role: userRole,
      authorType: userRole,
      progress: updateProgress,
      folderLink: updateFolderLink.trim(),
      date: new Date().toLocaleDateString('en-IN')
    };

    // 1. Save to shared problem updates store
    const currentUpds = loadSharedUpdates(collab.problemId);
    const updatedUpds = [updateObj, ...currentUpds];
    try {
      localStorage.setItem(`civic_updates_${collab.problemId}`, JSON.stringify(updatedUpds));
      localStorage.setItem('civic_collab_sync_trigger', Date.now().toString());
    } catch (e) {}

    // 2. Dispatch cross-tab storage event
    window.dispatchEvent(new Event('storage'));

    // 3. Update local state
    setCollab(prev => ({
      ...prev,
      updates: updatedUpds
    }));
    setShowUpdateModal(false);
    setUpdateTitle('');
    setUpdateDescription('');
    setUpdateFolderLink('');
    setIsSubmittingUpdate(false);
  };

  // Submit Final Solution to Admin
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!finalTitle.trim() || !finalDescription.trim()) {
      alert('Please provide a final solution title and deployment description.');
      return;
    }

    setIsSubmittingFinal(true);
    const finalData = {
      finalTitle: finalTitle.trim(),
      finalDescription: finalDescription.trim(),
      finalFolderLink: finalFolderLink.trim(),
      submittedByRole: userRole,
      submittedByName: user?.representativeName || (isUniv ? user?.universityName : user?.companyName)
    };

    try {
      await problemsService.submitFinalDeliverables({
        collabId: collab.id,
        ...finalData
      });
    } catch (err) {
      console.warn('API submitFinalDeliverables fallback:', err);
    }

    setCollab(prev => ({
      ...prev,
      status: 'Submitted to Admin for Final Review',
      finalDeliverables: finalData
    }));
    setShowFinalSubmitModal(false);
    setFinalSuccessModal(true);
    setIsSubmittingFinal(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F8F8' }}>
        <p style={{ color: '#036D33', fontWeight: 700, fontSize: '1.1rem' }}>Loading collaboration workspace...</p>
      </div>
    );
  }

  const univWork = collab?.universitySolution || {};
  const indWork = collab?.industrySolution || {};

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
              <span>{isUniv ? 'Academic R&D Challenges' : 'Joint Innovation & Active Collaborations'}</span>
              <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                Active Collaboration
              </span>
            </div>
            <div className="header-sub-text" style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.82)' }}>
              {isUniv ? 'Higher Education Dept • Government of Jharkhand' : 'Department of Industries & CSR • Government of Jharkhand'}
            </div>
          </div>
        </div>

        <div className="admin-topbar-right">
          <button
            type="button"
            className="admin-topbar-btn overview-btn"
            onClick={onBackToDashboard || (() => navigate(isUniv ? '/university/dashboard' : '/industry/dashboard'))}
            title="Return to Dashboard Overview"
          >
            <span>← Dashboard Overview</span>
          </button>

          <button
            type="button"
            className="admin-topbar-btn danger"
            onClick={() => navigate('/')}
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
              {isUniv ? 'Academic Portal' : 'CSR Navigation'}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: isUniv ? '#ECFDF5' : '#FEF3C7', color: isUniv ? '#047857' : '#92400E', padding: '2px 6px', borderRadius: '4px' }}>
              AUTHENTICATED
            </span>
          </div>

          {/* Sidebar Nav List (Unified 4-item navigation structure) */}
          <nav className="admin-sidebar-nav" style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className="admin-nav-item"
              onClick={() => { navigate(isUniv ? '/university/dashboard' : '/industry/dashboard'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">Dashboard</span>
            </button>

            <button
              type="button"
              className="admin-nav-item"
              onClick={() => { navigate(isUniv ? '/university/problems?tab=all' : '/industry/problems?tab=all'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">{isUniv ? 'Matched Problems' : 'Matched Opportunities'}</span>
              <span className="admin-nav-count" style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6' }}>
                {navMetrics.matched}
              </span>
            </button>

            <button
              type="button"
              className="admin-nav-item"
              onClick={() => { navigate(isUniv ? '/university/problems?tab=proposals' : '/industry/problems?tab=working'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">{isUniv ? 'My Proposals' : 'CSR Proposals'}</span>
              <span className="admin-nav-count" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                {navMetrics.proposals}
              </span>
            </button>

            <button
              type="button"
              className="admin-nav-item active"
              onClick={() => { navigate(isUniv ? '/university/problems?tab=collaborations' : '/industry/problems?tab=collaborations'); setMobileMenuOpen(false); }}
            >
              <span className="admin-nav-label">Active Collaborations</span>
              <span className="admin-nav-count" style={{ background: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
                {navMetrics.collaborations}
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
                  {isUniv ? 'Academic Research Partner' : 'Industrial CSR Partner'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="admin-return-btn"
              title="Return to Main Portals"
            >
              <span>← Return to Portals</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="admin-main-wrapper">
          <div 
            className="admin-content-area"
            style={{
              flex: 1,
              height: '100%',
              maxHeight: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxSizing: 'border-box'
            }}
          >
          
          {/* Breadcrumb Navigation */}
          <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span 
              onClick={() => navigate(isUniv ? '/university/dashboard' : '/industry/dashboard')}
              style={{ color: '#036D33', cursor: 'pointer', fontWeight: 600 }}
            >
              Dashboard
            </span>
            <span>›</span>
            <span 
              onClick={() => navigate(isUniv ? '/university/problems?tab=collaborations' : '/industry/problems?tab=collaborations')}
              style={{ color: '#036D33', cursor: 'pointer', fontWeight: 600 }}
            >
              Active Collaborations
            </span>
            <span>›</span>
            <span style={{ color: '#111827', fontWeight: 700 }}>
              {collab?.problemTitle || problem?.title || 'Harmu River Siltation & Biological Wastewater Treatment'}
            </span>
          </div>

          {/* =====================================================================
              1. TOP PROBLEM HEADER & PARTNER ACTIONS CARD
             ===================================================================== */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            {/* Top Row: Sprout Icon + Title + Switch Project Dropdown */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '280px' }}>
                {/* Sprout Icon Container */}
                <div style={{
                  background: '#ECFDF5',
                  borderRadius: '14px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <SproutIcon size={26} color="#059669" />
                </div>

                {/* Title & Description */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      background: '#036D33',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 10px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}>
                      Active Collaboration
                    </span>
                  </div>

                  <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#064E3B', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                    {collab?.problemTitle || problem?.title || 'Harmu River Siltation & Biological Wastewater Treatment'}
                  </h1>

                  <p style={{ fontSize: '0.84rem', color: '#4B5563', lineHeight: 1.45, margin: 0, maxWidth: '850px' }}>
                    {problem?.description || 'Harmu river catchment in Ranchi suffers from domestic wastewater discharge and heavy monsoon siltation. Need cost-effective phytoremediation and decentralized bio-filter system suitable for urban drainage integration.'}
                  </p>
                </div>
              </div>

              {/* Right: Update Work Button + Switch Project Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  style={{
                    background: '#ECFDF5',
                    border: '1.5px solid #86EFAC',
                    color: '#059669',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PencilEditIcon size={14} color="#059669" />
                  <span>Update Work / Progress</span>
                </button>

                {allAvailableProblems && allAvailableProblems.length > 0 && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4B5563' }}>Switch Project</span>
                    <select
                      value={collab?.problemId || 'JH-CHLG-2026-1001'}
                      onChange={(e) => navigate(isUniv ? `/university/collaborate/${e.target.value}` : `/industry/collaborate/${e.target.value}`)}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        background: '#FFFFFF',
                        color: '#1F2937',
                        cursor: 'pointer',
                        maxWidth: '260px'
                      }}
                    >
                      {allAvailableProblems.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.id}: {p.title?.length > 26 ? p.title.substring(0, 26) + '...' : p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Partner Information, Status & Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #F1F5F9',
              marginTop: '16px',
              paddingTop: '14px',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {/* University Partner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UniversityBuildingIcon size={20} color="#059669" />
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>University Partner</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
                      {collab?.universityName || activeUser?.universityName || 'Academic Research Partner'}
                    </div>
                  </div>
                </div>

                {/* Industry Partner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IndustryBuildingIcon size={20} color="#7C3AED" />
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>Industry Partner</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>
                      {collab?.companyName || activeUser?.companyName || 'Industrial CSR Partner'}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{
                  background: '#ECFDF5',
                  color: '#059669',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }}></span>
                  <span>Status: Active Collaboration</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setChatOpen(!chatOpen)}
                  style={{
                    background: chatOpen ? '#F8FAFC' : '#ECFDF5',
                    border: chatOpen ? '1.5px solid #CBD5E1' : '1.5px solid #10B981',
                    color: chatOpen ? '#475569' : '#047857',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  title={chatOpen ? "Hide Live Collaboration Chat" : "Open Live Collaboration Chat"}
                >
                  <ChatNavIcon size={14} color={chatOpen ? '#475569' : '#047857'} />
                  <span>{chatOpen ? 'Hide Chat' : '💬 Open Live Chat'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #10B981',
                    color: '#059669',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <PencilEditIcon size={14} color="#059669" />
                  <span>Update Work / Progress</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFinalSubmitModal(true)}
                  style={{
                    background: '#024D24',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '7px 16px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(2, 77, 36, 0.25)'
                  }}
                >
                  <SendPlaneIcon size={14} color="#FFFFFF" />
                  <span>Submit Final Solution to Admin</span>
                </button>
              </div>
            </div>
          </div>

          {/* =====================================================================
              2. MAIN 2-COLUMN / FULL-WIDTH GRID (LEFT: WORK + UPDATES | RIGHT: CHAT)
             ===================================================================== */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: chatOpen ? 'minmax(0, 1fr) 350px' : '1fr',
            gap: '18px',
            alignItems: 'stretch',
            transition: 'all 0.2s ease'
          }}>
            
            {/* LEFT COLUMN: CARDS & STEPPER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* MIDDLE ROW: UNIVERSITY & INDUSTRY SUBMITTED WORK (SIDE-BY-SIDE) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                
                {/* LEFT: UNIVERSITY WORK & R&D */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.04)', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Banner Header with Decorative Wave Graphic */}
                  <div style={{
                    background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)',
                    color: '#FFFFFF',
                    padding: '14px 18px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UniversityBuildingIcon size={18} color="#FFFFFF" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
                          University Submitted Work & R&D
                        </h3>
                        <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                          {collab?.universityName || activeUser?.universityName || 'Academic Research Partner'}
                        </div>
                      </div>
                    </div>

                    {/* Wave SVG Accent */}
                    <svg style={{ position: 'absolute', right: 0, top: 0, bottom: 0, height: '100%', opacity: 0.25 }} viewBox="0 0 100 60" preserveAspectRatio="none">
                      <path d="M0,0 C30,40 70,20 100,60 L100,0 Z" fill="#FFFFFF" />
                    </svg>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        PROPOSED SOLUTION TITLE
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#036D33', marginTop: '2px' }}>
                        {univWork.solutionTitle || (problem?.title ? `Research Solution: ${problem.title}` : 'Smart Civic Engineering System')}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                        TECHNICAL METHODOLOGY & DESCRIPTION
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.45, background: '#F0FDF4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                        {univWork.description || 'Applied technical solution prototype and methodology.'}
                      </div>
                    </div>

                    {/* Metadata Items with Icons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', marginBottom: '14px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#059669' }}>👤</span>
                        <span style={{ color: '#6B7280', fontWeight: 700, minWidth: '130px' }}>Faculty Lead / PI</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{univWork.facultyLead || univWork.mentorName || 'Faculty Project Lead'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#059669' }}>👥</span>
                        <span style={{ color: '#6B7280', fontWeight: 700, minWidth: '130px' }}>Student Researchers</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{univWork.studentResearchers || (univWork.students?.length > 0 ? univWork.students.map(s => s.name || s).join(', ') : 'Student Research Team')}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#059669' }}>💰</span>
                        <span style={{ color: '#6B7280', fontWeight: 700, minWidth: '130px' }}>Estimated Budget</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{univWork.estimatedBudget || univWork.estimatedCost || '₹ 30 Lakhs (12 Weeks)'}</span>
                      </div>
                    </div>

                    {/* Button Link */}
                    <a
                      href={univWork.folderLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        borderRadius: '8px',
                        padding: '9px 14px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        textAlign: 'center',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FolderNavIcon size={16} color="#059669" />
                      <span>Open University Project Folder →</span>
                    </a>
                  </div>
                </div>

                {/* RIGHT: INDUSTRY SUBMITTED WORK & SUPPORT */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(109, 40, 217, 0.04)', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Banner Header with Decorative Wave Graphic */}
                  <div style={{
                    background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
                    color: '#FFFFFF',
                    padding: '14px 18px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <IndustryBuildingIcon size={18} color="#FFFFFF" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, letterSpacing: '-0.2px' }}>
                          Industry Submitted Work & Support
                        </h3>
                        <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                          {collab?.companyName || activeUser?.companyName || 'Industrial CSR Partner'}
                        </div>
                      </div>
                    </div>

                    {/* Wave SVG Accent */}
                    <svg style={{ position: 'absolute', right: 0, top: 0, bottom: 0, height: '100%', opacity: 0.25 }} viewBox="0 0 100 60" preserveAspectRatio="none">
                      <path d="M0,0 C30,40 70,20 100,60 L100,0 Z" fill="#FFFFFF" />
                    </svg>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        PROPOSED SOLUTION TITLE
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#6D28D9', marginTop: '2px' }}>
                        {indWork.solutionTitle || (problem?.title ? `CSR Implementation: ${problem.title}` : 'CSR Co-Funding & Equipment Support')}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                        INDUSTRIAL PLAN & DEPLOYMENT APPROACH
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: 1.45, background: '#FAF5FF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EDE9FE' }}>
                        {indWork.description || 'CSR capital co-funding, equipment supply, and industrial field deployment support.'}
                      </div>
                    </div>

                    {/* Metadata Items with Icons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', marginBottom: '14px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#7C3AED' }}>👤</span>
                        <span style={{ color: '#6B7280', fontWeight: 700, minWidth: '130px' }}>Corporate Lead</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{indWork.corporateLead || indWork.teamLeadName || 'CSR Project Lead'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#7C3AED' }}>👥</span>
                        <span style={{ color: '#6B7280', fontWeight: 700, minWidth: '130px' }}>Corporate Engineers</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{indWork.engineers || (indWork.members?.length > 0 ? indWork.members.map(m => m.name || m).join(', ') : 'Industrial Field Engineering Team')}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#7C3AED' }}>💰</span>
                        <span style={{ color: '#6B7280', fontWeight: 700, minWidth: '130px' }}>Committed Funding</span>
                        <span style={{ color: '#111827', fontWeight: 600 }}>{indWork.funding || indWork.estimatedCost || collab?.fundingAmount || '₹ 40 Lakhs CSR Co-Funding'}</span>
                      </div>
                    </div>

                    {/* Button Link */}
                    <a
                      href={indWork.folderLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F5F3FF',
                        color: '#6D28D9',
                        border: '1px solid #DDD6FE',
                        borderRadius: '8px',
                        padding: '9px 14px',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        textAlign: 'center',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <FolderNavIcon size={16} color="#6D28D9" />
                      <span>Open Industry Repository Folder →</span>
                    </a>
                  </div>
                </div>

              </div>

              {/* BOTTOM ROW: WORK PROGRESS STEPPER & KEY UPDATES NOTICES */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                
                {/* BOTTOM-LEFT: WORK PROGRESS & MILESTONE UPDATES */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UsersNavIcon size={18} color="#111827" />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Work Progress & Milestone Updates
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUpdateModal(true)}
                      style={{
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Post Update
                    </button>
                  </div>

                  {/* Milestone Stepper Bar */}
                  <div style={{ padding: '10px 8px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    
                    {/* Step 1: Initial Setup */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px' }}>
                        ✓
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#111827' }}>Initial Setup</span>
                      <span style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '2px' }}>10/06/2026</span>
                    </div>

                    {/* Connecting Line 1 */}
                    <div style={{ height: '2px', background: '#059669', flex: 1, margin: '-22px 0 0 0' }}></div>

                    {/* Step 2: Field Study */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 800, marginBottom: '6px' }}>
                        ✓
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#111827' }}>Field Study</span>
                      <span style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '2px' }}>22/06/2026</span>
                    </div>

                    {/* Connecting Line 2 */}
                    <div style={{ height: '2px', background: '#7C3AED', flex: 1, margin: '-22px 0 0 0' }}></div>

                    {/* Step 3: Prototype (Active) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#FFFFFF', border: '2.5px solid #7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7C3AED' }}></div>
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#6D28D9' }}>Prototype</span>
                      <span style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '2px' }}>05/07/2026</span>
                    </div>

                    {/* Connecting Line 3 */}
                    <div style={{ height: '2px', background: '#E5E7EB', flex: 1, margin: '-22px 0 0 0' }}></div>

                    {/* Step 4: Final Report */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF', border: '1.5px solid #D1D5DB', marginBottom: '6px' }}>
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#6B7280' }}>Final Report</span>
                      <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px' }}>20/07/2026</span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM-RIGHT: KEY UPDATES & NOTICES */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MegaphoneIcon size={18} color="#111827" />
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Key Updates & Notices
                      </h3>
                    </div>
                    <span 
                      onClick={() => navigate(isUniv ? '/university/problems?tab=collaborations' : '/industry/problems?tab=collaborations')}
                      style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      View All
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {DEFAULT_NOTICES.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          background: '#F9FAFB',
                          borderRadius: '8px',
                          border: '1px solid #F3F4F6',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
                          <span style={{ fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {item.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9CA3AF', fontSize: '0.74rem', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                          <span>{item.date}</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOTTOM CTA WHEN CHAT IS HIDDEN */}
                {!chatOpen && (
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <LightbulbIcon size={18} color="#FFFFFF" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#064E3B' }}>
                          Have ideas for a new solution?
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '2px' }}>
                          Collaborate with your team and submit your proposal to make an impact.
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setChatOpen(true)}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid #10B981',
                          color: '#047857',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <ChatNavIcon size={14} color="#047857" />
                        <span>Open Live Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(isUniv ? '/university/problems' : '/industry/problems')}
                        style={{
                          background: '#024D24',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        + Submit Proposal
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* =====================================================================
                RIGHT COLUMN: LIVE COLLABORATION MESSAGING + BOTTOM IDEA CTA
             ===================================================================== */}
            {chatOpen && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'sticky',
                top: '0px',
                alignSelf: 'flex-start',
                height: 'calc(100vh - 120px)',
                minHeight: '480px',
                maxHeight: 'calc(100vh - 120px)'
              }}>
                
                {/* Live Collaboration Chat Card (Fixed Height, Header & Input Static, Thread Scrollable) */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '16px 18px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}>
                  {/* Header (Fixed at top with Hide Button) */}
                  <div style={{ marginBottom: '10px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SproutIcon size={18} color="#059669" />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                          Live Collaboration
                        </h3>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
                        <span>Team Online</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setChatOpen(false)}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Hide Live Collaboration Chat"
                    >
                      <span>Hide Chat</span>
                      <span>✕</span>
                    </button>
                  </div>

                  {/* Chat Thread Area (Scrollable Inside Chat) */}
                  <div 
                    ref={chatBottomRef}
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      padding: '6px 4px 6px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    {collab?.messages?.map((msg) => {
                      const isSystem = msg.senderType === 'system' || msg.role === 'admin';
                      const isUniversity = msg.senderType === 'university' || msg.role === 'university';
                      const isIndustry = msg.senderType === 'industry' || msg.role === 'industry';

                      if (isSystem) {
                        return (
                          <div
                            key={msg.id}
                            style={{
                              background: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              borderRadius: '10px',
                              padding: '8px 10px',
                              fontSize: '0.78rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{ fontWeight: 800, color: '#0284C7', fontSize: '0.74rem' }}>{msg.sender}</span>
                              <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{msg.time}</span>
                            </div>
                            <p style={{ margin: 0, color: '#0369A1', lineHeight: 1.35, fontSize: '0.76rem' }}>
                              {msg.text}
                            </p>
                          </div>
                        );
                      }

                      if (isUniversity) {
                        return (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '2px', display: 'flex', gap: '6px' }}>
                              <span style={{ fontWeight: 700, color: '#059669' }}>{msg.sender}</span>
                              <span>{msg.time}</span>
                            </div>
                            <div style={{
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#064E3B',
                              padding: '6px 12px',
                              borderRadius: '12px 12px 2px 12px',
                              fontSize: '0.82rem',
                              fontWeight: 500,
                              maxWidth: '85%'
                            }}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      }

                      // Industry message
                      return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: '0.7rem', color: '#6B7280', marginBottom: '2px', display: 'flex', gap: '6px' }}>
                            <span style={{ fontWeight: 700, color: '#7C3AED' }}>{msg.sender}</span>
                            <span>{msg.time}</span>
                          </div>
                          <div style={{
                            background: '#F5F3FF',
                            border: '1px solid #DDD6FE',
                            color: '#4C1D95',
                            padding: '6px 12px',
                            borderRadius: '12px 12px 12px 2px',
                            fontSize: '0.82rem',
                            fontWeight: 500,
                            maxWidth: '85%'
                          }}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input Bar (Fixed at bottom of chat card) */}
                  <form onSubmit={handleSendMessage} style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSendingMessage || !messageText.trim()}
                      style={{
                        background: '#024D24',
                        color: '#FFFFFF',
                        border: 'none',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isSendingMessage || !messageText.trim() ? 'default' : 'pointer',
                        opacity: isSendingMessage || !messageText.trim() ? 0.65 : 1,
                        flexShrink: 0
                      }}
                    >
                      <SendPlaneIcon size={15} color="#FFFFFF" />
                    </button>
                  </form>
                </div>

                {/* Bottom CTA: Have ideas for a new solution? */}
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <LightbulbIcon size={18} color="#FFFFFF" />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#064E3B' }}>
                      Have ideas for a new solution?
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: '2px', lineHeight: 1.3 }}>
                      Collaborate with your team and submit your proposal to make an impact.
                    </div>
                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => navigate(isUniv ? '/university/problems' : '/industry/problems')}
                        style={{
                          background: '#024D24',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        + Submit Proposal
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Floating Dock Toggle Button (When chat is closed) */}
          {!chatOpen && (
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              style={{
                position: 'fixed',
                right: '24px',
                bottom: '24px',
                zIndex: 90,
                background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)',
                color: '#FFFFFF',
                border: '2px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '30px',
                padding: '11px 20px',
                fontWeight: 800,
                fontSize: '0.86rem',
                boxShadow: '0 4px 18px rgba(2, 77, 36, 0.35)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'fadeIn 0.2s ease'
              }}
              title="Click to Open Live Collaboration Chat"
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }}></span>
              <ChatNavIcon size={16} color="#FFFFFF" />
              <span>💬 Open Live Chat ({collab?.messages?.length || 0})</span>
            </button>
          )}

          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: POST WORK UPDATE MODAL
         ========================================================================= */}
      {showUpdateModal && (
        <div className="modal-backdrop" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
            <div className="modal-header" style={{ background: '#024D24' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Collaborative Progress Tracker
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                  Post Work Progress / Milestone Update
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowUpdateModal(false)}>
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handlePostUpdate} style={{ padding: '20px' }}>
              <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                <label className="univ-form-label">
                  <span>Milestone / Update Title <span className="required">*</span></span>
                </label>
                <input
                  type="text"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="e.g. Field Trial Testing & IoT Flow Sensor Calibration Completed"
                  className="univ-form-input"
                  required
                />
              </div>

              <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                <label className="univ-form-label">
                  <span>Detailed Progress Description <span className="required">*</span></span>
                </label>
                <textarea
                  rows={4}
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  placeholder="Describe progress achieved, test results, next actions..."
                  className="univ-form-textarea"
                  required
                />
              </div>

              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label">
                  <span>Attach Updated Drive / Repository Link</span>
                </label>
                <input
                  type="url"
                  value={updateFolderLink}
                  onChange={(e) => setUpdateFolderLink(e.target.value)}
                  placeholder="https://drive.google.com/... or https://github.com/..."
                  className="univ-form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  style={{ background: '#024D24', color: '#FFFFFF', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {isSubmittingUpdate ? 'Saving...' : 'Post Progress Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SUBMIT FINAL SOLUTION TO ADMIN
         ========================================================================= */}
      {showFinalSubmitModal && (
        <div className="modal-backdrop" onClick={() => setShowFinalSubmitModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', width: '92%' }}>
            <div className="modal-header" style={{ background: '#024D24' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Final Deliverables Submission
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Submit Final Solution to State Administration
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowFinalSubmitModal(false)}>
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleFinalSubmit} style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.84rem', color: '#4B5563', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                Once submitted, the State Admin will inspect the university and industry deliverables, test results, and final folder before clicking <strong>Proceed with the work</strong> to sanction statewide field deployment.
              </p>

              <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                <label className="univ-form-label">
                  <span>Final Solution & Deliverable Title <span className="required">*</span></span>
                </label>
                <input
                  type="text"
                  value={finalTitle}
                  onChange={(e) => setFinalTitle(e.target.value)}
                  placeholder="e.g. Complete Verified Bio-Filtration & IoT Water Purity Deployment Package"
                  className="univ-form-input"
                  required
                />
              </div>

              <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                <label className="univ-form-label">
                  <span>Comprehensive Outcome & Verification Report <span className="required">*</span></span>
                </label>
                <textarea
                  rows={4}
                  value={finalDescription}
                  onChange={(e) => setFinalDescription(e.target.value)}
                  placeholder="Detail the complete joint engineering output, hardware/software specifications, pilot trial results, and handover instructions..."
                  className="univ-form-textarea"
                  required
                />
              </div>

              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label">
                  <span>Final Deliverables Folder / Live System Link <span className="required">*</span></span>
                </label>
                <input
                  type="url"
                  value={finalFolderLink}
                  onChange={(e) => setFinalFolderLink(e.target.value)}
                  placeholder="https://drive.google.com/... (Containing CAD, source code, final test reports)"
                  className="univ-form-input"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowFinalSubmitModal(false)}
                  style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFinal}
                  style={{
                    background: '#024D24',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '9px 22px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 77, 36, 0.25)'
                  }}
                >
                  {isSubmittingFinal ? 'Submitting...' : 'Submit Final Solution to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: FINAL SUBMITTED CELEBRATION MODAL
         ========================================================================= */}
      {finalSuccessModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '520px', textAlign: 'center', padding: '26px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.8rem', fontWeight: 800 }}>
              ✓
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#024D24', marginBottom: '8px' }}>
              Final Solution Reached Admin Portal!
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '20px' }}>
              Your joint solution has been submitted to the State Administration for final verification. Admin can now inspect the works from both sides and click <strong>"Proceed with the work"</strong> to authorize field implementation.
            </p>

            <button
              type="button"
              onClick={() => setFinalSuccessModal(false)}
              style={{
                background: '#024D24',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Back to Collaboration Workspace →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
