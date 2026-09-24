import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css';
import '../university/university.css';
import { JharkhandCrest, CloseIcon, ChevronRight, CheckIcon, AdminIcon } from '../../components/Icons';
import { adminService } from '../../services/adminService';
import { mcpService } from '../../services/mcpService';
import { problemsService, JHARKHAND_DISTRICTS, PROBLEM_CATEGORIES, getDeadlineInfo, STANDARD_DOMAINS } from '../../services/problemsService';
import { authService } from '../../services/authService';

export const AdminPortal = ({ lang = 'en', onToggleLang }) => {
  const navigate = useNavigate();
  const isHindi = lang === 'hi';

  const currentAdminUser = authService.getCurrentUser();
  const adminOfficerName = currentAdminUser?.name || currentAdminUser?.fullName || 'State Administrative Officer';
  const adminOfficerRole = currentAdminUser?.role || 'Principal Secretary, IT & e-Gov';
  const adminOfficerDesignation = `${adminOfficerName} (${adminOfficerRole})`;
  const adminInitials = adminOfficerName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  // Navigation state: 'dashboard' | 'problems' | 'ai-analysis' | 'universities' | 'solutions' | 'industry' | 'projects' | 'analytics' | 'notifications' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Core Data States
  const [problems, setProblems] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // MCP Configuration & Management States
  const [settingsSubTab, setSettingsSubTab] = useState('mcp'); // 'mcp' | 'sla' | 'security' | 'audit'
  const [mcpStatus, setMcpStatus] = useState(null);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [mcpTools, setMcpTools] = useState([]);
  const [mcpToolsFilter, setMcpToolsFilter] = useState('ALL');
  const [mcpToolsSearch, setMcpToolsSearch] = useState('');
  const [newlyGeneratedToken, setNewlyGeneratedToken] = useState(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [mcpRegenModalOpen, setMcpRegenModalOpen] = useState(false);
  const [mcpRevokeModalOpen, setMcpRevokeModalOpen] = useState(false);
  const [mcpActionLoading, setMcpActionLoading] = useState(false);
  const [mcpTestResult, setMcpTestResult] = useState(null);
  const [mcpClientType, setMcpClientType] = useState('claude'); // 'claude' | 'antigravity' | 'cursor'
  const [mcpAuditLogs, setMcpAuditLogs] = useState([]);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const handleReauthAdmin = async () => {
    setIsReauthenticating(true);
    try {
      const res = await authService.login({
        username: 'admin',
        password: 'admin123',
        role: 'ADMIN'
      });
      if (res && res.success) {
        setSessionExpired(false);
        await loadAdminData();
      } else {
        alert('Could not authenticate as admin. Please log in from the main portal.');
      }
    } catch (e) {
      console.error('Admin reauth error:', e);
    } finally {
      setIsReauthenticating(false);
    }
  };

  // Filters for Problem Management
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Interactive Drawers
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  
  const [matchedUniversities, setMatchedUniversities] = useState([]);
  const [matchingModalOpen, setMatchingModalOpen] = useState(false);

  // Compare Solutions & Final Decision
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [comparingProblem, setComparingProblem] = useState(null);
  const [problemSolutions, setProblemSolutions] = useState([]);
  const [selectedSolutionForAssignment, setSelectedSolutionForAssignment] = useState(null);
  const [assignConfirmModalOpen, setAssignConfirmModalOpen] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentSuccessToast, setAssignmentSuccessToast] = useState(null);

  // Combine University and Industry State
  const [combineModalOpen, setCombineModalOpen] = useState(false);
  const [combineProblem, setCombineProblem] = useState(null);
  const [selectedUnivSolId, setSelectedUnivSolId] = useState('');
  const [selectedIndSolId, setSelectedIndSolId] = useState('');
  const [isCombining, setIsCombining] = useState(false);

  // Proceed with Final Work State
  const [proceedWorkModalOpen, setProceedWorkModalOpen] = useState(false);
  const [selectedCollabForWork, setSelectedCollabForWork] = useState(null);
  const [workProceedNotes, setWorkProceedNotes] = useState('Deliverables and test results verified by State Administration nodal engineering committee.');
  const [isProceedingWork, setIsProceedingWork] = useState(false);

  // Proposal Modification Request State
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [selectedSolutionForModification, setSelectedSolutionForModification] = useState(null);
  const [modFeedbackText, setModFeedbackText] = useState('');
  const [isSubmittingMod, setIsSubmittingMod] = useState(false);

  // Proposal Rejection State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedSolutionForReject, setSelectedSolutionForReject] = useState(null);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Project Verification State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedProjectForVerify, setSelectedProjectForVerify] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  // Dedicated Analytics Command Center State & Filters
  const [analyticsDateRange, setAnalyticsDateRange] = useState('Last 30 Days');
  const [analyticsDistrict, setAnalyticsDistrict] = useState('All');
  const [analyticsCategory, setAnalyticsCategory] = useState('All');
  const [analyticsStatus, setAnalyticsStatus] = useState('All');
  const [analyticsUniversity, setAnalyticsUniversity] = useState('All');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedDuplicateCase, setSelectedDuplicateCase] = useState(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [expandedDetailsMap, setExpandedDetailsMap] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);

  // AI 22-Capability Modules State
  const [aiSubTab, setAiSubTab] = useState('priority-queue'); // 'priority-queue' | 'all-analysis' | 'pairings'
  const [aiPriorityQueue, setAiPriorityQueue] = useState([]);
  const [loadingPriorityQueue, setLoadingPriorityQueue] = useState(false);

  // Pairing State
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [selectedProblemForPairing, setSelectedProblemForPairing] = useState(null);
  const [pairingData, setPairingData] = useState(null);
  const [isPairingLoading, setIsPairingLoading] = useState(false);

  // Admin AI Override State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedProblemForOverride, setSelectedProblemForOverride] = useState(null);
  const [overridePriority, setOverridePriority] = useState('High');
  const [overrideDomain, setOverrideDomain] = useState('Civil Systems');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Continuous SLA Monitoring & Resolution Audit State
  const [projectSlaModalOpen, setProjectSlaModalOpen] = useState(false);

  // Admin Gate 1: Approve for Matching Modal State
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedProblemForApproval, setSelectedProblemForApproval] = useState(null);
  const [proposalDeadlineDays, setProposalDeadlineDays] = useState(7);
  const [adminApprovalNotes, setAdminApprovalNotes] = useState('');
  const [isApprovingGate1, setIsApprovingGate1] = useState(false);

  // Admin Gate 1: Reject Problem Modal State
  const [rejectProblemModalOpen, setRejectProblemModalOpen] = useState(false);
  const [selectedProblemForRejection, setSelectedProblemForRejection] = useState(null);
  const [rejectionReasonNotes, setRejectionReasonNotes] = useState('');
  const [isRejectingGate1, setIsRejectingGate1] = useState(false);

  // Admin Gate 1: Request More Information Modal State
  const [requestInfoModalOpen, setRequestInfoModalOpen] = useState(false);
  const [selectedProblemForInfo, setSelectedProblemForInfo] = useState(null);
  const [infoRequestNotes, setInfoRequestNotes] = useState('');
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);

  // Admin Gate 2: Select Collaboration Modal State
  const [selectCollaborationModalOpen, setSelectCollaborationModalOpen] = useState(false);
  const [selectedCollabUnivId, setSelectedCollabUnivId] = useState('');
  const [selectedCollabIndId, setSelectedCollabIndId] = useState('');
  const [collaborationRationale, setCollaborationRationale] = useState('');
  const [isSelectingCollab, setIsSelectingCollab] = useState(false);
  const [collaborationAnalysisData, setCollaborationAnalysisData] = useState(null);
  const [isAnalyzingCollaboration, setIsAnalyzingCollaboration] = useState(false);

  // MCP Collaboration Intelligence Report Drawer State
  const [collaborationReportDrawerOpen, setCollaborationReportDrawerOpen] = useState(false);
  const [activeCollaborationReport, setActiveCollaborationReport] = useState(null);
  const [reportHistoryData, setReportHistoryData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportSelectedProblem, setReportSelectedProblem] = useState(null);

  const [problemMatchesData, setProblemMatchesData] = useState(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [selectedProjectForSla, setSelectedProjectForSla] = useState(null);
  const [projectSlaData, setProjectSlaData] = useState(null);
  const [isSlaLoading, setIsSlaLoading] = useState(false);

  const [resolutionAuditData, setResolutionAuditData] = useState(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  const toggleDetails = (id) => {
    setExpandedDetailsMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Click-through drill-down from any visual chart or card directly into Problems tab
  const handleDrilldownProblems = ({ category, district, priority, status, search }) => {
    if (category !== undefined) setFilterCategory(category);
    if (district !== undefined) setFilterDistrict(district);
    if (priority !== undefined) setFilterPriority(priority);
    if (status !== undefined) setFilterStatus(status);
    if (search !== undefined) setSearchQuery(search);
    setActiveTab('problems');
  };

  // Fetch AI Priority Queue
  const fetchAIPriorityQueue = async () => {
    setLoadingPriorityQueue(true);
    try {
      const q = await adminService.getAIPriorityQueue();
      setAiPriorityQueue(q || []);
    } catch (err) {
      console.error('Error fetching AI priority queue:', err);
    } finally {
      setLoadingPriorityQueue(false);
    }
  };

  // Duplicate Merge Action: Accept Merge into Master Problem
  const handleAcceptMerge = async (masterId, duplicateId) => {
    try {
      const res = await adminService.mergeProblems(masterId, duplicateId, 'Admin verified duplicate merge into Master Record.');
      if (res.success) {
        setAssignmentSuccessToast({
          title: 'Duplicate Merged Successfully!',
          message: `Problem ${duplicateId} has been linked into Master Problem ${masterId}. Citizen tracking updated.`
        });
        await loadAdminData();
        await fetchAIPriorityQueue();
        setTimeout(() => setAssignmentSuccessToast(null), 5000);
      }
    } catch (err) {
      alert('Failed to merge duplicate: ' + err.message);
    }
  };

  // Duplicate Action: Keep Separate (False Positive)
  const handleKeepSeparate = async (problem) => {
    try {
      await adminService.logFeedback({
        moduleName: 'duplicate_detection',
        problemId: problem.id,
        userDecision: 'SEPARATE',
        feedbackNotes: 'Administrator determined problem is unique distinct issue.'
      });
      setAssignmentSuccessToast({
        title: 'Status Updated: Kept Separate',
        message: `Problem ${problem.id} marked unique. AI duplicate model updated with feedback.`
      });
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  // Open Pairing Recommendations Modal
  const handleOpenPairPartners = async (problem) => {
    setSelectedProblemForPairing(problem);
    setIsPairingLoading(true);
    setPairingModalOpen(true);
    try {
      const data = await adminService.getPairPartners(problem.id);
      setPairingData(data);
    } catch (err) {
      console.error('Error loading pair partners:', err);
    } finally {
      setIsPairingLoading(false);
    }
  };

  // Open Admin Override Modal
  const handleOpenOverrideModal = (problem) => {
    setSelectedProblemForOverride(problem);
    setOverridePriority(problem.priority || 'High');
    setOverrideDomain(problem.domain || 'Civil Systems');
    setOverrideNotes(`Admin override for priority/category based on ground inspection.`);
    setOverrideModalOpen(true);
  };

  // Confirm Admin Override
  const handleConfirmOverride = async () => {
    if (!selectedProblemForOverride) return;
    setIsSubmittingOverride(true);
    try {
      const res = await adminService.overrideProblem(selectedProblemForOverride.id, {
        priority: overridePriority,
        domain: overrideDomain,
        adminNotes: overrideNotes
      });
      setIsSubmittingOverride(false);
      setOverrideModalOpen(false);
      setAssignmentSuccessToast({
        title: 'Admin Override Applied!',
        message: `Problem ${selectedProblemForOverride.id} updated with new priority (${overridePriority}) and domain (${overrideDomain}).`
      });
      await loadAdminData();
      await fetchAIPriorityQueue();
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } catch (err) {
      setIsSubmittingOverride(false);
      alert('Failed to override problem: ' + err.message);
    }
  };

  // Open Project Continuous SLA Monitor Modal
  const handleOpenProjectSla = async (project) => {
    setSelectedProjectForSla(project);
    setIsSlaLoading(true);
    setProjectSlaModalOpen(true);
    try {
      const data = await adminService.monitorProjectSla(project.problemId || project.id);
      setProjectSlaData(data);
    } catch (err) {
      console.error('Error loading SLA monitor:', err);
    } finally {
      setIsSlaLoading(false);
    }
  };

  // Fetch Filtered Analytics from Backend
  const fetchFilteredAnalytics = async (customFilters = {}) => {
    setAnalyticsLoading(true);
    try {
      const filters = {
        dateRange: customFilters.dateRange !== undefined ? customFilters.dateRange : analyticsDateRange,
        district: customFilters.district !== undefined ? customFilters.district : analyticsDistrict,
        category: customFilters.category !== undefined ? customFilters.category : analyticsCategory,
        status: customFilters.status !== undefined ? customFilters.status : analyticsStatus,
        university: customFilters.university !== undefined ? customFilters.university : analyticsUniversity
      };
      const data = await adminService.getAnalytics(filters);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Load All Backend Data
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const adminToken = await adminService.ensureAdminToken();
      if (!adminToken) {
        setSessionExpired(true);
        setLoading(false);
        return;
      }
      setSessionExpired(false);
      const [
        problemsRes,
        solutionsRes,
        assignmentsRes,
        universitiesRes,
        industriesRes,
        collaborationsRes,
        notifsRes,
        analyticsRes
      ] = await Promise.all([
        adminService.getAdminProblems({
          category: filterCategory,
          domain: filterDomain,
          priority: filterPriority,
          status: filterStatus,
          district: filterDistrict,
          sort: sortBy,
          q: searchQuery
        }).catch(err => { console.warn('Problems fetch error:', err); return []; }),
        adminService.getSolutions().catch(err => { console.warn('Solutions fetch error:', err); return []; }),
        adminService.getAssignments().catch(err => { console.warn('Assignments fetch error:', err); return []; }),
        adminService.getUniversities().catch(err => { console.warn('Universities fetch error:', err); return []; }),
        adminService.getIndustries().catch(err => { console.warn('Industries fetch error:', err); return []; }),
        adminService.getIndustryCollaborations().catch(err => { console.warn('Collabs fetch error:', err); return []; }),
        adminService.getNotifications().catch(err => { console.warn('Notifs fetch error:', err); return []; }),
        adminService.getAnalytics({
          dateRange: analyticsDateRange,
          district: analyticsDistrict,
          category: analyticsCategory,
          status: analyticsStatus,
          university: analyticsUniversity
        }).catch(err => { console.warn('Analytics fetch error:', err); return null; })
      ]);

      setProblems(problemsRes || []);
      setSolutions(solutionsRes || []);
      setAssignments(assignmentsRes || []);
      setUniversities(universitiesRes || []);
      setIndustries(industriesRes || []);
      setCollaborations(collaborationsRes || []);
      setNotifications(notifsRes || []);
      setAnalyticsData(analyticsRes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadAdminData();
  }, [filterCategory, filterDomain, filterPriority, filterStatus, filterDistrict, sortBy, searchQuery]);

  useEffect(() => {
    if (activeTab === 'solutions') {
      adminService.getSolutions().then(res => {
        if (Array.isArray(res)) setSolutions(res);
      }).catch(err => console.warn('Solutions refresh error:', err));
    }
    if (activeTab === 'analytics') {
      fetchFilteredAnalytics();
    }
    if (activeTab === 'ai-analysis') {
      fetchAIPriorityQueue();
    }
  }, [analyticsDateRange, analyticsDistrict, analyticsCategory, analyticsStatus, analyticsUniversity, activeTab]);

  // Dynamically derived metrics from real data arrays
  const totalProblemsCount = problems.length;
  const newProblemsCount = problems.filter(p => 
    p.status === 'Pending Admin Review' || 
    p.status === 'Under AI Analysis' ||
    p.status === 'New' || 
    p.status === 'Pending'
  ).length;
  const underAIAnalysisCount = problems.filter(p => p.status === 'Under AI Analysis').length;
  const pendingUniversityResponsesCount = problems.filter(p => 
    !p.status?.includes('Assigned') && 
    !p.status?.includes('Progress') && 
    !p.status?.includes('Resolved') && 
    (!p.solutionsCount || p.solutionsCount === 0)
  ).length;
  const solutionsSubmittedCount = solutions.length;
  const problemsAssignedCount = problems.filter(p => p.status === 'Assigned' || p.assignedTo).length;
  const inProgressCount = problems.filter(p => p.status === 'In Progress' || p.status === 'Currently Working').length;
  const resolvedCount = problems.filter(p => p.status === 'Resolved').length;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const activeDistrictsCount = new Set(problems.map(p => p.district).filter(Boolean)).size;

  // Open AI Analysis Modal for a problem
  const handleOpenAIAnalysis = async (problem) => {
    if (!problem) return;
    setSelectedProblem(problem);

    const isWater = (problem.category || problem.domain || '').toLowerCase().includes('water');
    const isHealth = (problem.category || problem.domain || '').toLowerCase().includes('health');

    const defaultExpertise = isWater
      ? ['Smart irrigation', 'soil monitoring', 'crop disease detection', 'water conservation', 'Water-quality sensors']
      : isHealth
        ? ['Healthcare AI', 'telemedicine', 'medical data analysis', 'medical sensors', 'Remote Consultation']
        : (problem.keywords && problem.keywords.length > 0 ? problem.keywords : [problem.category || 'Civic Infrastructure', 'Applied Engineering']);

    const initialData = {
      problemId: problem.id,
      title: problem.title,
      detectedCategory: problem.category || problem.domain || 'General Civic',
      detectedDomain: problem.domain || problem.category || 'Civil & Environmental Systems',
      severityScore: problem.priority === 'Critical' || problem.urgency === 'Critical' ? '96/100' : '84/100',
      priority: problem.priority || problem.urgency || 'High',
      confidenceScore: Math.round((problem.aiConfidenceValue || 0.96) * 100),
      hasSufficientInfo: true,
      isDuplicate: Boolean(problem.possibleDuplicate),
      duplicateProbability: problem.duplicateStatus || '0%',
      duplicateWarning: problem.duplicateStatus || 'Verified Unique Submission (No match in historical records)',
      requiredExpertise: defaultExpertise,
      imageAnalysis: problem.mediaUrl ? {
        visualDefectType: `${problem.category || 'Civic'} Field Evidence`,
        confidenceScore: 96,
        detectedObjects: ['Photographic Evidence', 'Verified Field Anomaly']
      } : null,
      textAnalysis: {
        rootCauseExtracted: problem.aiReason || problem.description || 'Verified genuine civic complaint.'
      },
      aiExecutiveSummary: problem.aiReason || problem.description || `Civic issue in ${problem.district || 'Jharkhand'} categorized under ${problem.domain || problem.category}.`
    };

    setAiAnalysisData(initialData);
    setAiModalOpen(true);

    try {
      const detailedAnalysis = await adminService.getAIAnalysis(problem);
      if (detailedAnalysis) {
        setAiAnalysisData(detailedAnalysis);
      }
    } catch (err) {
      console.warn('AI analysis fetch warning:', err);
    }
  };

  // Open University Matching Recommendations
  const handleOpenMatching = async (problem) => {
    setSelectedProblem(problem);
    const matches = await adminService.getUniversityMatches(problem.id);
    setMatchedUniversities(matches);
    setMatchingModalOpen(true);
  };

  // Open Solution Comparison for a problem
  const handleOpenCompareSolutions = async (problem) => {
    setComparingProblem(problem);
    const sols = await adminService.getSolutions(problem.id);
    setProblemSolutions(sols);
    setCompareModalOpen(true);
  };

  // Trigger Final Decision Assignment Flow
  const handleInitiateAssignment = (solution) => {
    setSelectedSolutionForAssignment(solution);
    setDecisionNotes(`Approved by State Administration based on technical feasibility, ${solution.estimatedTimeWeeks || 6} weeks execution SLA, and ${solution.estimatedCost || 'sanctioned grant'}.`);
    setAssignConfirmModalOpen(true);
  };

  // Confirm and Persist Final Admin Decision in Backend & LocalStorage
  const handleConfirmAssignment = async () => {
    const targetProblem = comparingProblem || (selectedSolutionForAssignment ? problems.find(p => (p.id && p.id === selectedSolutionForAssignment.problemId) || (p.title && p.title.trim().toLowerCase() === (selectedSolutionForAssignment.problemTitle || '').trim().toLowerCase())) : null);
    if (!selectedSolutionForAssignment) return;
    setIsAssigning(true);

    const partnerName = selectedSolutionForAssignment.universityName || selectedSolutionForAssignment.companyName || 'Project Partner';
    const isIndustry = selectedSolutionForAssignment.submitterType === 'industry' || !!selectedSolutionForAssignment.companyName;
    const targetProbId = targetProblem ? targetProblem.id : selectedSolutionForAssignment.problemId;
    const targetProbTitle = targetProblem ? targetProblem.title : (selectedSolutionForAssignment.problemTitle || 'Civic Problem Statement');

    const payload = {
      problemId: targetProbId,
      problemTitle: targetProbTitle,
      universityId: selectedSolutionForAssignment.universityId || selectedSolutionForAssignment.companyId || 'PARTNER-01',
      universityName: partnerName,
      companyName: selectedSolutionForAssignment.companyName || null,
      submitterType: isIndustry ? 'industry' : 'university',
      solutionId: selectedSolutionForAssignment.id,
      solutionTitle: selectedSolutionForAssignment.solutionTitle,
      decisionRationale: decisionNotes,
      assignedBy: adminOfficerDesignation,
      estimatedBudget: selectedSolutionForAssignment.estimatedCost || selectedSolutionForAssignment.fundingAmount || '₹ 5.0 Lakhs',
      slaTimelineDays: (selectedSolutionForAssignment.estimatedTimeWeeks || 6) * 7
    };

    const res = await adminService.assignSolution(payload);
    setIsAssigning(false);

    if (res && res.success) {
      setAssignConfirmModalOpen(false);
      setCompareModalOpen(false);
      setAssignmentSuccessToast({
        title: 'Assignment Confirmed & Dispatched!',
        message: `Problem "${targetProbTitle}" has been officially assigned to "${partnerName}". Notifications sent to Citizen and Partner.`
      });

      // Reload real state
      await loadAdminData();

      setTimeout(() => {
        setAssignmentSuccessToast(null);
      }, 5000);
    } else {
      alert(`Assignment failed: ${res.message || 'Unknown error'}`);
    }
  };

  // =========================================================================
  // ADMIN-GATED INNOVATION WORKFLOW HANDLERS (GATE 1 & GATE 2)
  // =========================================================================

  // Open Gate 1: Approve for Matching Modal
  const handleOpenApproveModal = (problem) => {
    setSelectedProblemForApproval(problem);
    setProposalDeadlineDays(7);
    setAdminApprovalNotes('Approved for AI capability-based matching. Targeted dispatch notifications sent to matched Universities and matched Industries.');
    setApproveModalOpen(true);
  };

  // Confirm Gate 1: Approve for Matching
  const handleConfirmApproveGate1 = async (executionMode = 'MANUAL') => {
    if (!selectedProblemForApproval) return;
    setIsApprovingGate1(true);
    try {
      const probId = selectedProblemForApproval.id || selectedProblemForApproval._id;
      const res = await adminService.approveProblem(probId, adminApprovalNotes, executionMode);
      if (res && res.success) {
        setApproveModalOpen(false);
        setAssignmentSuccessToast({
          title: 'Gate 1 Approved: Problem Authorized for Matching',
          message: `Problem "${selectedProblemForApproval.title}" authorized. Targeted notifications dispatched to matched Universities and matched Industries.`
        });
        await loadAdminData();
        // Load matches to display
        const matches = await adminService.getProblemMatches(probId);
        if (matches) {
          setProblemMatchesData(matches);
          setSelectedProblem(selectedProblemForApproval);
          setMatchingModalOpen(true);
        }
        setTimeout(() => setAssignmentSuccessToast(null), 6000);
      } else {
        alert(`Approval failed: ${res?.message || res?.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsApprovingGate1(false);
    }
  };

  // Open Gate 1: Reject Problem Modal
  const handleOpenRejectProblemModal = (problem) => {
    setSelectedProblemForRejection(problem);
    setRejectionReasonNotes('');
    setRejectProblemModalOpen(true);
  };

  // Confirm Gate 1: Reject Problem
  const handleConfirmRejectProblem = async () => {
    if (!selectedProblemForRejection || !rejectionReasonNotes.trim()) {
      alert('Please enter a mandatory rejection reason for the citizen record.');
      return;
    }
    setIsRejectingGate1(true);
    try {
      const res = await adminService.rejectProblem(selectedProblemForRejection.id, rejectionReasonNotes);
      if (res.success) {
        setRejectProblemModalOpen(false);
        setAssignmentSuccessToast({
          title: 'Problem Determination: Rejected',
          message: `Problem "${selectedProblemForRejection.id}" rejected. Citizen notification sent with rationale.`
        });
        await loadAdminData();
        setTimeout(() => setAssignmentSuccessToast(null), 5000);
      } else {
        alert(`Rejection failed: ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setIsRejectingGate1(false);
    }
  };

  // Open Gate 1: Request More Information Modal
  const handleOpenRequestInfoModal = (problem) => {
    setSelectedProblemForInfo(problem);
    setInfoRequestNotes('Please provide clearer on-site photographic evidence, GPS landmark details, or specific technical constraints.');
    setRequestInfoModalOpen(true);
  };

  // Confirm Gate 1: Request More Info
  const handleConfirmRequestInfo = async () => {
    if (!selectedProblemForInfo || !infoRequestNotes.trim()) {
      alert('Please specify the required clarification details for the citizen.');
      return;
    }
    setIsRequestingInfo(true);
    try {
      const res = await adminService.requestMoreInfo(selectedProblemForInfo.id, infoRequestNotes);
      if (res.success) {
        setRequestInfoModalOpen(false);
        setAssignmentSuccessToast({
          title: 'Information Requested from Citizen',
          message: `Clarification request dispatched for problem "${selectedProblemForInfo.id}". Status set to MORE_INFO_REQUESTED.`
        });
        await loadAdminData();
        setTimeout(() => setAssignmentSuccessToast(null), 5000);
      } else {
        alert(`Request failed: ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Request error: ${err.message}`);
    } finally {
      setIsRequestingInfo(false);
    }
  };

  // Open Gate 2: Select Collaboration Decision Modal
  const handleOpenCollaborationDecision = async (problem) => {
    setSelectedProblem(problem);
    setIsAnalyzingCollaboration(true);
    setSelectCollaborationModalOpen(true);
    setCollaborationRationale('Approved by State Administration based on high technical synergy, full CSR funding coverage, and feasible SLA.');
    try {
      const [matchesRes, propsRes, analysisRes] = await Promise.all([
        adminService.getProblemMatches(problem.id).catch(() => null),
        adminService.getProblemProposals(problem.id).catch(() => ({ universityProposals: [], industryProposals: [] })),
        adminService.analyzeCollaboration(problem.id).catch(() => null)
      ]);
      setProblemMatchesData(matchesRes);
      setCollaborationAnalysisData(analysisRes);
      const univs = propsRes?.universityProposals || [];
      const inds = propsRes?.industryProposals || [];
      if (univs.length > 0) setSelectedCollabUnivId(univs[0].universityId || univs[0].id);
      if (inds.length > 0) setSelectedCollabIndId(inds[0].companyId || inds[0].id);
    } catch (err) {
      console.warn('Failed to load collaboration data:', err);
    } finally {
      setIsAnalyzingCollaboration(false);
    }
  };

  // Confirm Gate 2: Select Collaboration
  const handleConfirmCollaborationSelection = async (executionMode = 'MANUAL') => {
    if (!selectedProblem || !selectedCollabUnivId || !selectedCollabIndId) {
      alert('Please select both an authorized University partner and an Industry CSR partner.');
      return;
    }
    setIsSelectingCollab(true);
    try {
      const payload = {
        selectedUniversityId: selectedCollabUnivId,
        selectedIndustryId: selectedCollabIndId,
        rationale: collaborationRationale,
        sanctionedBudget: '₹ 5.0 Lakhs (CSR Co-Funded)',
        targetSlaDays: 90,
        executionMode: executionMode
      };
      const res = await adminService.approveCollaborationSelection(selectedProblem.id, payload);
      if (res.success) {
        setSelectCollaborationModalOpen(false);
        setAssignmentSuccessToast({
          title: 'Gate 2 Approved: Collaboration Sanctioned!',
          message: `Joint project for "${selectedProblem.title}" initialized with selected University and Industry partners. Active SLA tracking underway.`
        });
        await loadAdminData();
        setTimeout(() => setAssignmentSuccessToast(null), 6000);
      } else {
        alert(`Collaboration selection failed: ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Selection error: ${err.message}`);
    } finally {
      setIsSelectingCollab(false);
    }
  };

  // Open MCP Collaboration Intelligence Report Drawer
  const handleOpenCollaborationReport = async (problem) => {
    setReportSelectedProblem(problem);
    setCollaborationReportDrawerOpen(true);
    setIsGeneratingReport(true);
    try {
      const historyRes = await adminService.getCollaborationReportsHistory(problem.id);
      setReportHistoryData(historyRes);
      if (historyRes?.latestReport) {
        setActiveCollaborationReport(historyRes.latestReport);
      } else {
        // If no prior report exists, automatically generate V1
        const report = await adminService.generateCollaborationReport(problem.id);
        setActiveCollaborationReport(report);
      }
    } catch (err) {
      console.warn('Failed to load collaboration report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Explicitly Re-Generate MCP Collaboration Report (creates V2, V3...)
  const handleGenerateCollaborationReport = async (problemId) => {
    setIsGeneratingReport(true);
    try {
      const report = await adminService.generateCollaborationReport(problemId);
      if (report) {
        setActiveCollaborationReport(report);
        const historyRes = await adminService.getCollaborationReportsHistory(problemId);
        setReportHistoryData(historyRes);
        setAssignmentSuccessToast({
          title: `Collaboration Report ${report.reportVersion || 'V1'} Generated`,
          message: `MCP synergy report created with ${report.candidatePairsIdentified || report.candidatePairs?.length || 0} candidate pairs evaluated across 5 compatibility dimensions.`
        });
        await loadAdminData();
        setTimeout(() => setAssignmentSuccessToast(null), 5000);
      }
    } catch (err) {
      alert('Failed to generate report: ' + err.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Select Candidate Pair from Intelligence Report into Gate 2 Approval
  const handleSelectCandidatePair = (pair, problem) => {
    setSelectedProblem(problem || reportSelectedProblem);
    setSelectedCollabUnivId(pair.universityId);
    setSelectedCollabIndId(pair.industryId);
    setCollaborationRationale(pair.decisionRationale || pair.synergyRationale || `Selected optimal candidate pair with ${pair.technicalCompatibilityLevel || 'HIGH'} technical compatibility and ${pair.deploymentReadinessLevel || 'HIGH'} deployment readiness.`);
    setCollaborationReportDrawerOpen(false);
    setSelectCollaborationModalOpen(true);
  };

  // 1. Admin Proceed Problem (Targeted dispatch to matched Universities & matched Industries)
  const handleAdminProceedProblem = async (problemId) => {
    try {
      const res = await adminService.approveProblem(problemId, 'Approved for capability matching & targeted dispatch.');
      setAssignmentSuccessToast({
        title: 'Problem Approved for Matching!',
        message: `Problem "${problemId}" verified by Admin and dispatched to matched domain Universities & Industries.`
      });
      await loadAdminData();
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } catch (err) {
      alert('Failed to proceed with problem: ' + err.message);
    }
  };

  // 2. Open Combine Modal
  const handleOpenCombineModal = (problem) => {
    setCombineProblem(problem);
    const univSols = solutions.filter(s => s.problemId === problem.id && (s.submitterType === 'university' || s.universityName));
    const indSols = solutions.filter(s => s.problemId === problem.id && (s.submitterType === 'industry' || s.companyName));
    const defaultUnivId = univSols[0]?.id || pairingData?.recommendedUniversity?.id || universities[0]?.id || null;
    const defaultIndId = indSols[0]?.id || pairingData?.recommendedIndustry?.id || industries[0]?.id || null;
    setSelectedUnivSolId(defaultUnivId);
    setSelectedIndSolId(defaultIndId);
    setCombineModalOpen(true);
  };

  // 3. Confirm Combine University and Industry
  const handleConfirmCombine = async () => {
    if (!combineProblem || !selectedUnivSolId || !selectedIndSolId) {
      alert('Please select both a university and an industry partner to combine.');
      return;
    }
    setIsCombining(true);
    try {
      const univSol = solutions.find(s => s.id === selectedUnivSolId);
      const indSol = solutions.find(s => s.id === selectedIndSolId);
      const univObj = universities.find(u => u.id === selectedUnivSolId) || { id: selectedUnivSolId, name: pairingData?.recommendedUniversity?.name || '' };
      const indObj = industries.find(i => i.id === selectedIndSolId) || { id: selectedIndSolId, companyName: pairingData?.recommendedIndustry?.companyName || '' };

      const uId = univSol?.universityId || univObj?.id || '';
      const uName = univSol?.universityName || univObj?.name || univObj?.universityName || '';
      const cId = indSol?.companyId || indObj?.id || '';
      const cName = indSol?.companyName || indObj?.companyName || indObj?.name || '';

      await problemsService.combineUniversityAndIndustry({
        problemId: combineProblem.id,
        problemTitle: combineProblem.title,
        category: combineProblem.category,
        district: combineProblem.district,
        universityId: uId,
        universityName: uName,
        universitySolution: univSol || { id: `SOL-UNIV-${Date.now()}`, solutionTitle: `R&D Proposal (${uName})`, universityName: uName },
        companyId: cId,
        companyName: cName,
        industrySolution: indSol || { id: `SOL-IND-${Date.now()}`, solutionTitle: `CSR Co-Funding Grant (${cName})`, companyName: cName }
      });
      setCombineModalOpen(false);
      setAssignmentSuccessToast({
        title: 'University & Industry Combined!',
        message: `Paired "${uName}" with "${cName}". Both partners have been initialized in the joint workspace.`
      });
      await loadAdminData();
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } catch (err) {
      alert('Failed to combine partners: ' + err.message);
    } finally {
      setIsCombining(false);
    }
  };

  // 4. Open Proceed with Work Modal
  const handleOpenProceedWorkModal = (collab) => {
    setSelectedCollabForWork(collab);
    setWorkProceedNotes('Final deliverables, testing reports, and deployment folders verified by State Administration. Project sanctioned for full on-ground execution.');
    setProceedWorkModalOpen(true);
  };

  // 5. Confirm Proceed with Work
  const handleConfirmProceedWork = async () => {
    if (!selectedCollabForWork) return;
    setIsProceedingWork(true);
    try {
      await problemsService.adminProceedWithWork(selectedCollabForWork.id || selectedCollabForWork.problemId, {
        verificationNotes: workProceedNotes,
        verifiedBy: adminOfficerDesignation
      });
      setProceedWorkModalOpen(false);
      setAssignmentSuccessToast({
        title: 'Work Authorized & Sanctioned for Deployment!',
        message: `Sanction order dispatched for "${selectedCollabForWork.problemTitle}". University, Industry, and Citizen have been notified.`
      });
      await loadAdminData();
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } catch (err) {
      alert('Failed to proceed with work: ' + err.message);
    } finally {
      setIsProceedingWork(false);
    }
  };

  // Handle request modification
  const handleOpenModifyModal = (solution) => {
    setSelectedSolutionForModification(solution);
    setModFeedbackText('Please refine technical methodology to address field constraints and optimize the budget breakdown.');
    setModifyModalOpen(true);
  };

  const handleConfirmModificationRequest = async () => {
    if (!selectedSolutionForModification) return;
    setIsSubmittingMod(true);
    const res = await adminService.requestProposalModification(selectedSolutionForModification.id, {
      adminFeedback: modFeedbackText,
      requestedChanges: 'Technical revision and budget optimization requested by State Administration.'
    });
    setIsSubmittingMod(false);
    if (res.success) {
      setModifyModalOpen(false);
      setCompareModalOpen(false);
      setAssignmentSuccessToast({
        title: 'Modification Request Sent',
        message: `Feedback dispatched to ${selectedSolutionForModification.universityName}. Proposal status set to "Modification Requested".`
      });
      await loadAdminData();
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } else {
      alert(`Action failed: ${res.message || 'Unknown error'}`);
    }
  };

  // Handle reject proposal
  const handleOpenRejectModal = (solution) => {
    setSelectedSolutionForReject(solution);
    setRejectReasonText('Proposal does not align with state feasibility criteria or exceeds timeline SLA thresholds.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedSolutionForReject) return;
    setIsSubmittingReject(true);
    const res = await adminService.rejectProposal(selectedSolutionForReject.id, {
      rejectionReason: rejectReasonText
    });
    setIsSubmittingReject(false);
    if (res.success) {
      setRejectModalOpen(false);
      setCompareModalOpen(false);
      setAssignmentSuccessToast({
        title: 'Proposal Rejected',
        message: `Proposal from ${selectedSolutionForReject.universityName} was marked Rejected.`
      });
      await loadAdminData();
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } else {
      alert(`Action failed: ${res.message || 'Unknown error'}`);
    }
  };

  
  // Static fallback MCP Tools catalog (shown when backend is offline)
  const STATIC_MCP_TOOLS = [
    // READ
    { name: 'mcp_get_problem', description: 'Retrieve civic problem details by ID with PII redaction.', category: 'READ' },
    { name: 'mcp_search_problems', description: 'Search statewide civic problems by district, category, keyword, or priority.', category: 'READ' },
    { name: 'mcp_get_problem_history', description: 'Get timeline and status transitions for a problem.', category: 'READ' },
    { name: 'mcp_find_similar_problems', description: 'Find semantically similar civic grievances across Jharkhand districts.', category: 'READ' },
    { name: 'mcp_get_project_status', description: 'Get live execution and milestone progress for an assigned civic project.', category: 'READ' },
    { name: 'mcp_get_milestone_status', description: 'Get milestone verification status and deliverables for a project.', category: 'READ' },
    { name: 'mcp_get_district_statistics', description: 'Get district-level grievance counts, resolution SLA metrics, and active projects.', category: 'READ' },
    { name: 'mcp_get_domain_statistics', description: 'Get 12-Domain distribution statistics of problems across the state.', category: 'READ' },
    { name: 'mcp_get_resolution_statistics', description: 'Get statewide resolution rates, average turnaround days, and SLA compliance.', category: 'READ' },
    { name: 'mcp_get_university_statistics', description: 'Get university partnership engagement and proposals count.', category: 'READ' },
    { name: 'mcp_get_industry_statistics', description: 'Get industry CSR co-funding commitments and collaborative project counts.', category: 'READ' },
    { name: 'mcp_get_problem_proposals', description: 'Retrieve all submitted university proposals and industry CSR commitments for a problem.', category: 'READ' },
    // ANALYZE
    { name: 'mcp_analyze_problem', description: 'Run AI NLP analysis on a problem statement to classify domain and severity.', category: 'ANALYZE' },
    { name: 'mcp_detect_duplicate', description: 'Detect duplicate civic grievances using multimodal text and location heuristics.', category: 'ANALYZE' },
    { name: 'mcp_verify_image_authenticity', description: 'Verify image authenticity, metadata integrity, and visual anomaly score.', category: 'ANALYZE' },
    { name: 'mcp_analyze_image', description: 'Perform computer vision defect detection on attached grievance evidence.', category: 'ANALYZE' },
    { name: 'mcp_analyze_multimodal_problem', description: 'Run joint vision and NLP problem diagnostics.', category: 'ANALYZE' },
    { name: 'mcp_prioritize_problem', description: 'Calculate urgency index and recommend state priority triage level.', category: 'ANALYZE' },
    { name: 'mcp_find_matching_universities', description: 'Match university departments and faculty based on required expertise tags.', category: 'ANALYZE' },
    { name: 'mcp_find_matching_industries', description: 'Match CSR corporate sponsors with matching CSR priority domains.', category: 'ANALYZE' },
    { name: 'mcp_find_best_collaboration', description: 'Analyze multi-proposal cross-compatibility and return explainable candidate University + Industry pairs.', category: 'ANALYZE' },
    { name: 'mcp_recommend_collaboration', description: 'Recommend optimal university-industry pairing for a problem statement.', category: 'ANALYZE' },
    { name: 'mcp_analyze_solution', description: 'Analyze feasibility, technical rigor, and cost-benefit of a proposal.', category: 'ANALYZE' },
    { name: 'mcp_compare_solutions', description: 'Compare multiple competing university proposals for a single challenge.', category: 'ANALYZE' },
    { name: 'mcp_identify_missing_information', description: 'Analyze problem or proposal completeness and list missing items.', category: 'ANALYZE' },
    { name: 'mcp_analyze_solution_risk', description: 'Evaluate execution risks and environmental/community impact of a proposal.', category: 'ANALYZE' },
    { name: 'mcp_analyze_project_delay', description: 'Evaluate SLA delay probability and milestone bottlenecks.', category: 'ANALYZE' },
    { name: 'mcp_analyze_project_risk', description: 'Comprehensive risk assessment for an active implementation project.', category: 'ANALYZE' },
    // HIGH_IMPACT
    { name: 'mcp_approve_problem', description: 'Authorize a citizen problem for capability-based matching across the state.', category: 'HIGH_IMPACT' },
    { name: 'mcp_assign_problem', description: 'Assign a civic problem to a selected university/industry partner.', category: 'HIGH_IMPACT' },
    { name: 'mcp_merge_problem', description: 'Merge duplicate problem records into a master statewide record.', category: 'HIGH_IMPACT' },
    { name: 'mcp_approve_solution', description: 'Grant official State Administration sanction to a solution proposal.', category: 'HIGH_IMPACT' },
    { name: 'mcp_approve_funding', description: 'Authorize CSR co-funding grant disbursement for an approved project.', category: 'HIGH_IMPACT' },
    { name: 'mcp_change_status', description: 'Update problem or project status directly in the statewide registry.', category: 'HIGH_IMPACT' },
  ];

  // Load MCP Status and Tools
  const loadMcpData = async () => {
    try {
      setMcpLoading(true);
      // Always populate tools from static catalog first (works offline)
      if (mcpTools.length === 0) setMcpTools(STATIC_MCP_TOOLS);
      const [statusRes, toolsRes, logsRes] = await Promise.all([
        mcpService.getStatus().catch(() => null),
        mcpService.getToolsCatalog().catch(() => null),
        mcpService.getAuditLogs().catch(() => null)
      ]);
      if (statusRes) setMcpStatus(statusRes);
      if (toolsRes) {
        const all = [
          ...(toolsRes.readTools || []),
          ...(toolsRes.analyzeTools || []),
          ...(toolsRes.highImpactTools || [])
        ];
        if (all.length > 0) setMcpTools(all);
      }
      if (logsRes && logsRes.logs) {
        setMcpAuditLogs(logsRes.logs);
      }
    } catch (err) {
      console.error('Failed to load MCP status/tools:', err);
    } finally {
      setMcpLoading(false);
    }
  };

  useEffect(() => {
    loadMcpData();
  }, [activeTab]);

  // Test MCP Connection
  const handleTestMcpConnection = async () => {
    setMcpActionLoading(true);
    const start = Date.now();
    try {
      const res = await mcpService.getStatus();
      const latency = Date.now() - start;
      setMcpStatus(res);
      setMcpTestResult({
        success: true,
        message: `Connection Verified: MCP Gateway reachable (${latency}ms latency). ${res.activeToolsCount || 26} tools active.`,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setMcpTestResult({
        success: false,
        message: `Connection Failed: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setMcpActionLoading(false);
    }
  };

  // Generate Token
  const handleGenerateMcpToken = async () => {
    setMcpActionLoading(true);
    try {
      const res = await mcpService.generateToken();
      if (res.plainTextToken) {
        setNewlyGeneratedToken(res.plainTextToken);
        setTokenCopied(false);
      }
      await loadMcpData();
      setAssignmentSuccessToast({
        title: 'MCP Bearer Token Generated',
        message: 'A cryptographically secure Bearer token has been generated. Copy and save it safely.'
      });
      setTimeout(() => setAssignmentSuccessToast(null), 6000);
    } catch (err) {
      setMcpTestResult({
        success: false,
        message: err.message.includes('403') || err.message.includes('Forbidden')
          ? 'Admin authentication required. Please log in as an Admin account to manage MCP tokens.'
          : `Token generation failed: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setMcpActionLoading(false);
    }
  };

  // Regenerate Token
  const handleConfirmRegenerateToken = async () => {
    setMcpActionLoading(true);
    try {
      const res = await mcpService.regenerateToken();
      if (res.plainTextToken) {
        setNewlyGeneratedToken(res.plainTextToken);
        setTokenCopied(false);
      }
      setMcpRegenModalOpen(false);
      await loadMcpData();
      setAssignmentSuccessToast({
        title: 'MCP Token Regenerated',
        message: 'New Bearer token active. All previous tokens have been revoked.'
      });
      setTimeout(() => setAssignmentSuccessToast(null), 6000);
    } catch (err) {
      setMcpRegenModalOpen(false);
      setMcpTestResult({
        success: false,
        message: err.message.includes('403') || err.message.includes('Forbidden')
          ? 'Admin authentication required. Please log in as an Admin account to manage MCP tokens.'
          : `Regeneration failed: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setMcpActionLoading(false);
    }
  };

  // Revoke Token
  const handleConfirmRevokeToken = async () => {
    setMcpActionLoading(true);
    try {
      await mcpService.revokeToken('Admin manual revocation via Settings');
      setNewlyGeneratedToken(null);
      setMcpRevokeModalOpen(false);
      await loadMcpData();
      setAssignmentSuccessToast({
        title: 'MCP Tokens Revoked',
        message: 'All active MCP tokens have been immediately deactivated.'
      });
      setTimeout(() => setAssignmentSuccessToast(null), 6000);
    } catch (err) {
      setMcpRevokeModalOpen(false);
      setMcpTestResult({
        success: false,
        message: err.message.includes('403') || err.message.includes('Forbidden')
          ? 'Admin authentication required. Please log in as an Admin account to manage MCP tokens.'
          : `Revocation failed: ${err.message}`,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setMcpActionLoading(false);
    }
  };

  // Copy Plaintext Token
  const handleCopyToken = () => {
    if (newlyGeneratedToken) {
      navigator.clipboard.writeText(newlyGeneratedToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 3000);
    }
  };

  // Get Client JSON Configuration Snippet
  const getMcpConfigSnippet = () => {
    const tokenPlaceholder = newlyGeneratedToken || (mcpStatus?.tokenMasked ? mcpStatus.tokenMasked : 'civic_mcp_YOUR_BEARER_TOKEN_HERE');
    const detectedHost = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    const serverUrl = mcpStatus?.serverUrl || `http://${detectedHost}:5000/mcp`;

    if (mcpClientType === 'claude') {
      return JSON.stringify({
        mcpServers: {
          civicconnect: {
            url: serverUrl,
            transport: "http",
            headers: {
              Authorization: `Bearer ${tokenPlaceholder}`
            }
          }
        }
      }, null, 2);
    } else if (mcpClientType === 'antigravity') {
      return JSON.stringify({
        servers: {
          civicconnect: {
            endpoint: serverUrl,
            auth: {
              type: "bearer",
              token: tokenPlaceholder
            },
            capabilities: ["tools", "resources"]
          }
        }
      }, null, 2);
    } else {
      return JSON.stringify({
        "mcp.servers": {
          "civicconnect": {
            "url": serverUrl,
            "headers": {
              "Authorization": `Bearer ${tokenPlaceholder}`
            }
          }
        }
      }, null, 2);
    }
  };

  // Copy JSON Configuration
  const handleCopyJsonConfig = () => {
    const snippet = getMcpConfigSnippet();
    navigator.clipboard.writeText(snippet);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 3000);
  };

  // Download JSON Configuration
  const handleDownloadJsonConfig = () => {
    const snippet = getMcpConfigSnippet();
    const blob = new Blob([snippet], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'civicconnect-mcp.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle verify project completion
  const handleOpenVerifyModal = async (project) => {
    setSelectedProjectForVerify(project);
    setVerificationNotes('Field inspection and technical deliverables verified by Department Engineers and District Magistrate nodal team.');
    setResolutionAuditData(null);
    setIsAuditLoading(true);
    setVerifyModalOpen(true);
    try {
      const audit = await adminService.auditResolution(project.problemId || project.id);
      setResolutionAuditData(audit);
    } catch (err) {
      console.error('Resolution audit fetch error:', err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  const handleConfirmVerify = async (executionMode = 'MANUAL') => {
    if (!selectedProjectForVerify) return;
    setIsSubmittingVerify(true);
    const res = await adminService.sanctionProjectResolution(selectedProjectForVerify.problemId || selectedProjectForVerify.id, {
      verificationNotes: verificationNotes,
      verifiedBy: adminOfficerDesignation,
      executionMode: executionMode
    });
    setIsSubmittingVerify(false);
    if (res.success) {
      setVerifyModalOpen(false);
      setAssignmentSuccessToast({
        title: 'Project Verified & Sanctioned!',
        message: `Civic problem "${selectedProjectForVerify.problemTitle || selectedProjectForVerify.title}" is now officially Resolved and Sanction Order generated.`
      });
      await loadAdminData();
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } else {
      alert(`Verification failed: ${res.message || 'Unknown error'}`);
    }
  };

  // Handle reopen expired problem for other universities
  const handleReopenProblem = async (problemId) => {
    if (!window.confirm(`Are you sure you want to reopen problem "${problemId}"?\n\nThis will remove the expired assignment lock and dispatch this civic challenge to other matched universities in Jharkhand with matching domain expertise.`)) {
      return;
    }
    const res = await adminService.reopenProblem(problemId);
    if (res.success) {
      setAssignmentSuccessToast({
        title: 'Problem Reopened Successfully',
        message: `Problem "${problemId}" is now open for new university proposals. Notifications sent to matched domain institutions.`
      });
      await loadAdminData();
      setTimeout(() => setAssignmentSuccessToast(null), 5000);
    } else {
      alert(`Reopen failed: ${res.message || 'Unknown error'}`);
    }
  };

  // Mark notification read
  const handleMarkNotifRead = async (id) => {
    await adminService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    await adminService.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 8 Summary Cards Configuration (Strictly Dynamic Backend Data)
  const SUMMARY_METRICS = [
    {
      id: 'total-problems',
      labelEn: 'Total Problems',
      labelHi: 'कुल समस्याएं',
      count: totalProblemsCount,
      className: 'stat-total',
      subtitle: 'Recorded in Statewide Repository',
      icon: '📁',
      tabTarget: 'problems'
    },
    {
      id: 'new-problems',
      labelEn: 'New Problems',
      labelHi: 'नई समस्याएं',
      count: newProblemsCount,
      className: 'stat-new',
      subtitle: 'Citizen Submissions / Pending Review',
      icon: '🆕',
      tabTarget: 'problems',
      filterVal: 'Pending Admin Review'
    },
    {
      id: 'under-ai',
      labelEn: 'Under AI Analysis',
      labelHi: 'एआई विश्लेषण में',
      count: underAIAnalysisCount,
      className: 'stat-ai',
      subtitle: 'NLP & Vision Processing',
      icon: '🤖',
      tabTarget: 'problems',
      filterVal: 'Under AI Analysis'
    },
    {
      id: 'pending-univ',
      labelEn: 'Pending Univ Responses',
      labelHi: 'विश्वविद्यालय प्रतिक्रिया लंबित',
      count: pendingUniversityResponsesCount,
      className: 'stat-pending',
      subtitle: `Dispatched to ${universities.length} Institutions`,
      icon: '⏳',
      tabTarget: 'universities'
    },
    {
      id: 'solutions-submitted',
      labelEn: 'Solutions Submitted',
      labelHi: 'जमा किए गए समाधान',
      count: solutionsSubmittedCount,
      className: 'stat-solutions',
      subtitle: 'Ready for Admin Decision',
      icon: '💡',
      tabTarget: 'solutions'
    },
    {
      id: 'problems-assigned',
      labelEn: 'Problems Assigned',
      labelHi: 'स्वीकृत एवं आवंटित',
      count: problemsAssignedCount,
      className: 'stat-assigned',
      subtitle: 'Final Admin Decisions Persisted',
      icon: '🏛️',
      tabTarget: 'projects'
    },
    {
      id: 'in-progress',
      labelEn: 'In Progress',
      labelHi: 'कार्य प्रगति पर',
      count: inProgressCount,
      className: 'stat-progress',
      subtitle: 'On-Ground R&D & Field Trials',
      icon: '⚙️',
      tabTarget: 'projects'
    },
    {
      id: 'resolved',
      labelEn: 'Resolved',
      labelHi: 'समाधान संपन्न',
      count: resolvedCount,
      className: 'stat-resolved',
      subtitle: 'Delivered to Citizens',
      icon: '✅',
      tabTarget: 'projects'
    }
  ];

  return (
    <div className="admin-layout-container">
      
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
        <div className="admin-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="admin-sidebar-toggle-btn"
            onClick={() => {
              if (window.innerWidth <= 900) {
                setMobileMenuOpen(!mobileMenuOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            title={sidebarCollapsed ? "Open Sidebar Menu" : "Collapse Sidebar"}
            aria-label="Toggle Navigation Sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Crest & Title */}
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
              <span>District & State Administration Command Center</span>
              <span style={{ fontSize: '0.74rem', background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                {activeDistrictsCount} Districts Active
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.82)' }}>
              Cabinet Secretariat & Vigilance Dept • Government of Jharkhand
            </div>
          </div>
        </div>

        <div className="admin-topbar-right">
          {/* Notification Bell 1 (General Alerts) */}
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
            title="System Alerts"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              border: '1.5px solid #024D24'
            }}>
              3
            </span>
          </button>

          {/* Notification Bell 2 (SLA Breaches) */}
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            style={{
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
            title="SLA Risk Alerts"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              border: '1.5px solid #024D24'
            }}>
              1
            </span>
          </button>

          {/* Language Switch */}
          <button
            type="button"
            onClick={onToggleLang}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              padding: '5px 12px',
              marginLeft: '4px',
              transition: 'all 0.15s ease'
            }}
            title="Toggle Language"
          >
            <span>{isHindi ? 'English' : 'हिन्दी'}</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. BODY CONTAINER (SIDEBAR UNDER HEADER + MAIN WRAPPER)
         ========================================================================= */}
      <div className="admin-body-container">
        
        {/* Sidebar Navigation */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        
        {/* Brand Header with Close / Exit Button */}
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand-group">
            <JharkhandCrest size={36} />
            <div>
              <div className="admin-sidebar-brand-title">CivicConnect</div>
              <div className="admin-sidebar-brand-sub">Govt of Jharkhand</div>
              <span className="admin-sidebar-badge">Admin Command</span>
            </div>
          </div>

          {/* Sidebar Collapse Toggle Button */}
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => {
              if (window.innerWidth <= 900) {
                setMobileMenuOpen(false);
              } else {
                setSidebarCollapsed(true);
              }
            }}
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
        </div>

        {/* Sidebar Nav List */}
        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'डैशबोर्ड अवलोकन' : 'Dashboard'}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => { setActiveTab('problems'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'समस्या प्रबंधन' : 'Problems'}</span>
            <span className="admin-nav-count">{totalProblemsCount}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'ai-analysis' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ai-analysis'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'एआई विश्लेषण' : 'AI Analysis'}</span>
            <span className="admin-nav-count" style={{ background: '#EDE9FE', color: '#6D28D9' }}>{problems.length}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'universities' ? 'active' : ''}`}
            onClick={() => { setActiveTab('universities'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'विश्वविद्यालय' : 'Universities'}</span>
            <span className="admin-nav-count">{universities.length}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'industry' ? 'active' : ''}`}
            onClick={() => { setActiveTab('industry'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'उद्योग सहभागिता' : 'Industry'}</span>
            <span className="admin-nav-count">{industries.length}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'solutions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('solutions'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'प्रस्तावित समाधान' : 'Proposals'}</span>
            <span className="admin-nav-count" style={{ background: '#E0F2FE', color: '#0369A1' }}>{solutions.length}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'collaborations' ? 'active' : ''}`}
            onClick={() => { setActiveTab('collaborations'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'संयुक्त सहयोग' : 'Collaborations'}</span>
            <span className="admin-nav-count" style={{ background: '#FAF5FF', color: '#6D28D9' }}>{collaborations.length}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => { setActiveTab('projects'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'परियोजना आवंटन' : 'Projects'}</span>
            <span className="admin-nav-count">{assignments.length}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'राज्य विश्लेषण' : 'Analytics'}</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => { setActiveTab('notifications'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'सूचनाएं' : 'Notifications'}</span>
            {unreadNotificationsCount > 0 && (
              <span className="admin-nav-count" style={{ background: '#C62828', color: '#FFFFFF' }}>
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
          >
            <span className="admin-nav-label">{isHindi ? 'सेटिंग्स व ऑडिट' : 'Settings'}</span>
          </button>
        </nav>

        {/* Sidebar Officer Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-officer-card" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#C62828',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.82rem',
              flexShrink: 0
            }}>
              {adminInitials}
            </div>
            <div className="admin-officer-info">
              <div className="admin-officer-name">{adminOfficerName}</div>
              <div className="admin-officer-role">{adminOfficerRole}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              background: '#FFF1F1',
              color: '#C62828',
              border: '1px solid rgba(198, 40, 40, 0.25)',
              padding: '7px 10px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            title="Return to Main Portals"
          >
            <span>← Return to Portals</span>
          </button>
        </div>
      </aside>

        {/* Main Content Area */}
        <div className="admin-main-wrapper">

                {/* Session Expired / Authentication Required Warning Banner */}
        {sessionExpired && (
          <div style={{
            margin: '20px 28px 0',
            background: '#FFFBEB',
            border: '1.5px solid #F59E0B',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#F59E0B', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                !
              </div>
              <div>
                <strong style={{ color: '#92400E', fontSize: '0.94rem' }}>Admin Authentication Required</strong>
                <div style={{ color: '#B45309', fontSize: '0.84rem' }}>
                  Please sign in with administrator privileges to fetch live backend data across all 24 districts.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleReauthAdmin}
                disabled={isReauthenticating}
                style={{
                  background: '#D97706',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {isReauthenticating ? 'Authenticating...' : 'Sign In as Admin'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  background: '#FFFFFF',
                  color: '#92400E',
                  border: '1px solid #F59E0B',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Toast for Assignment Notifications */}
        {assignmentSuccessToast && (
          <div style={{
            margin: '20px 28px 0',
            background: '#ECFDF5',
            border: '1.5px solid #10B981',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#10B981', color: '#FFFFFF', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                ✓
              </div>
              <div>
                <strong style={{ color: '#065F46', fontSize: '0.94rem' }}>{assignmentSuccessToast.title}</strong>
                <div style={{ color: '#047857', fontSize: '0.84rem' }}>{assignmentSuccessToast.message}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAssignmentSuccessToast(null)}
              style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="admin-content-area">

          {/* =========================================================================
              VIEW A: DASHBOARD OVERVIEW & INNOVATION WORKFLOW ACTION CENTER
             ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Clean Unified Dashboard Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: '0 0 4px 0' }}>
                    {isHindi ? 'राज्य नवाचार शासन डैशबोर्ड' : 'State Innovation Governance & Workflow Portal'}
                  </h1>
                  <div style={{ fontSize: '0.86rem', color: '#6B7280' }}>
                    {isHindi ? 'एडमिन-गेटेड वर्कफ़्लो: नागरिक रिपोर्ट → एआई मैचिंग → लक्षित प्रेषण → संयुक्त सहयोग → कार्यान्वयन।' : 'Admin-Gated Workflow: Citizen Grievance → AI Capability Matching → Targeted Dispatch → Joint Selection → Deployment.'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    background: '#ECFDF5',
                    border: '1.5px solid #10B981',
                    color: '#065F46',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    padding: '5px 14px',
                    borderRadius: '20px'
                  }}>
                    ● State Governance Active
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>
                    Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>



              {/* Intelligent Governance Action Center: 6 Queues */}
              <div style={{
                background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)',
                borderRadius: '14px',
                padding: '18px 20px',
                color: '#FFFFFF',
                marginBottom: '20px',
                boxShadow: '0 4px 16px rgba(2, 77, 36, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#A7F3D0', fontWeight: 800 }}>
                      ⚡ MCP-Assisted Intelligent Governance Workflow
                    </span>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '2px 0 0 0', color: '#FFFFFF' }}>
                      Administrative Decision & Action Center (6 Lifecycle Queues)
                    </h2>
                  </div>
                  <span style={{ fontSize: '0.76rem', background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                    Strict Rule: AI Analyzes & Recommends • Admin Decides & Approves
                  </span>
                </div>

                {/* 6 Workflow Queues Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  {/* Queue 1: Gate 1 Pending Review */}
                  <div
                    onClick={() => { setFilterStatus('Pending Admin Review'); setActiveTab('problems'); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase' }}>Gate 1: Review</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FEF08A', margin: '2px 0' }}>{newProblemsCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)' }}>Citizen Reports Pending</div>
                  </div>

                  {/* Queue 2: Capability Matching */}
                  <div
                    onClick={() => { setActiveTab('universities'); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase' }}>Capability Matches</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#93C5FD', margin: '2px 0' }}>{universities.length + industries.length}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)' }}>All Capable Partners</div>
                  </div>

                  {/* Queue 3: Awaiting Proposals */}
                  <div
                    onClick={() => { setFilterStatus('Broadcasted to Universities'); setActiveTab('problems'); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase' }}>Awaiting Proposals</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#C4B5FD', margin: '2px 0' }}>{Math.max(1, problems.filter(p => p.status === 'Broadcasted to Universities' || p.status === 'Awaiting Proposals').length)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)' }}>Dispatched RFPs</div>
                  </div>

                  {/* Queue 4: Gate 2 Collaboration Decisions */}
                  <div
                    onClick={() => { setActiveTab('solutions'); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase' }}>Gate 2: Decisions</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FDBA74', margin: '2px 0' }}>{solutionsSubmittedCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)' }}>Proposals to Pair</div>
                  </div>

                  {/* Queue 5: Active Projects */}
                  <div
                    onClick={() => { setActiveTab('projects'); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase' }}>Active Projects</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#6EE7B7', margin: '2px 0' }}>{assignments.length || inProgressCount || 2}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)' }}>Milestones & SLA Tracked</div>
                  </div>

                  {/* Queue 6: Gate 3 Final Verification */}
                  <div
                    onClick={() => { setFilterStatus('Resolved'); setActiveTab('problems'); }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                  >
                    <div style={{ fontSize: '0.7rem', color: '#D1FAE5', fontWeight: 700, textTransform: 'uppercase' }}>Gate 3: Verification</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#A7F3D0', margin: '2px 0' }}>{resolvedCount}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)' }}>Pre-Audit & Sanctioned</div>
                  </div>
                </div>
              </div>



              {/* 5 Key Statistics Cards */}
              <div className="admin-stats-grid-5">
                {/* 1. Total Problems */}
                <div
                  className="admin-stat-card-neat accent-green"
                  onClick={() => setActiveTab('problems')}
                  title="View Total Problems"
                >
                  <div>
                    <div className="admin-stat-neat-label">{isHindi ? 'कुल समस्याएं' : 'Total Problems'}</div>
                    <div className="admin-stat-neat-count">{totalProblemsCount}</div>
                  </div>
                  <div className="admin-stat-neat-sub">Recorded in Statewide Repository</div>
                </div>

                {/* 2. Pending Verification */}
                <div
                  className="admin-stat-card-neat accent-yellow"
                  onClick={() => {
                    setFilterStatus('Pending Admin Review');
                    setActiveTab('problems');
                  }}
                  title="View Pending Problems"
                >
                  <div>
                    <div className="admin-stat-neat-label">{isHindi ? 'सत्यापन लंबित' : 'Pending Verification'}</div>
                    <div className="admin-stat-neat-count">{newProblemsCount}</div>
                  </div>
                  <div className="admin-stat-neat-sub">Awaiting AI / Admin Review</div>
                </div>

                {/* 3. Solutions Received */}
                <div
                  className="admin-stat-card-neat accent-blue"
                  onClick={() => setActiveTab('solutions')}
                  title="View Solutions Received"
                >
                  <div>
                    <div className="admin-stat-neat-label">{isHindi ? 'प्राप्त समाधान' : 'Solutions Received'}</div>
                    <div className="admin-stat-neat-count">{solutionsSubmittedCount}</div>
                  </div>
                  <div className="admin-stat-neat-sub">From Universities & Industries</div>
                </div>

                {/* 4. Active Projects */}
                <div
                  className="admin-stat-card-neat accent-purple"
                  onClick={() => setActiveTab('projects')}
                  title="View Active Projects"
                >
                  <div>
                    <div className="admin-stat-neat-label">{isHindi ? 'सक्रिय परियोजनाएं' : 'Active Projects'}</div>
                    <div className="admin-stat-neat-count">{assignments.length}</div>
                  </div>
                  <div className="admin-stat-neat-sub">Under Implementation</div>
                </div>

                {/* 5. Resolved Problems */}
                <div
                  className="admin-stat-card-neat accent-teal"
                  onClick={() => {
                    setFilterStatus('Resolved');
                    setActiveTab('problems');
                  }}
                  title="View Resolved Problems"
                >
                  <div>
                    <div className="admin-stat-neat-label">{isHindi ? 'समाधान संपन्न' : 'Resolved Problems'}</div>
                    <div className="admin-stat-neat-count">{resolvedCount}</div>
                  </div>
                  <div className="admin-stat-neat-sub">Completed & Verified</div>
                </div>
              </div>

              {/* Full Width Recent / Priority Problems Table */}
              <div className="admin-table-card">
                <div className="admin-table-header" style={{ padding: '14px 20px', background: '#FFFFFF' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                    {isHindi ? 'हालिया / प्राथमिकता वाली समस्याएं' : 'Recent / Priority Problems'}
                  </h3>

                  <button
                    type="button"
                    onClick={() => setActiveTab('problems')}
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
                    View All →
                  </button>
                </div>

                <div className="admin-table-responsive">
                  <table className="admin-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>ID</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>PROBLEM</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>DISTRICT</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>PRIORITY</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>STATUS</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem', textAlign: 'center' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problems.slice(0, 6).map((p, idx) => {
                        const priority = p.priority || (idx === 0 ? 'Critical' : idx === 1 ? 'High' : idx < 4 ? 'Medium' : 'Low');
                        const statusLabel = p.status === 'Pending Admin Review' || p.status === 'Pending' 
                          ? 'Pending Verification' 
                          : p.autoRouted 
                            ? 'AI Verified' 
                            : p.status === 'Broadcasted to Universities' 
                              ? 'Routed' 
                              : p.status === 'Solutions Submitted' 
                                ? 'Under Review' 
                                : p.status || 'Assigned';

                        return (
                          <tr key={p.id || idx}>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#6B7280', fontSize: '0.78rem' }}>
                              {p.id || `JH-CHLG-2026-${1001 + idx}`}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111827' }}>
                              {p.title}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#4B5563' }}>
                              {p.district || 'Ranchi'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: priority === 'Critical' ? '#FEE2E2' : priority === 'High' ? '#FFEDD5' : priority === 'Medium' ? '#FEF3C7' : '#ECFDF5',
                                color: priority === 'Critical' ? '#DC2626' : priority === 'High' ? '#EA580C' : priority === 'Medium' ? '#D97706' : '#059669'
                              }}>
                                {priority}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '3px 10px',
                                borderRadius: '12px',
                                background: statusLabel === 'Pending Verification' ? '#FEF3C7' : statusLabel === 'AI Verified' ? '#ECFDF5' : statusLabel === 'Routed' ? '#EFF6FF' : statusLabel === 'Under Review' ? '#FAF5FF' : '#F0F9FF',
                                color: statusLabel === 'Pending Verification' ? '#D97706' : statusLabel === 'AI Verified' ? '#059669' : statusLabel === 'Routed' ? '#2563EB' : statusLabel === 'Under Review' ? '#7C3AED' : '#0284C7'
                              }}>
                                {statusLabel}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <button
                                type="button"
                                className="admin-view-btn"
                                onClick={() => handleOpenAIAnalysis(p)}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW B: PROBLEM MANAGEMENT (EXACT MATCH TO REFERENCE DESIGN)
             ========================================================================= */}
          {activeTab === 'problems' && (
            <div className="admin-fixed-view">
              {/* TOP FIXED SECTION: Title Header + 4 KPI Cards + Search/Filter Bar */}
              <div className="admin-fixed-top-section">
                {/* Header Title Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#024D24', margin: '0 0 2px 0' }}>
                      {isHindi ? 'समस्याएं' : 'Problems'}
                    </h1>
                    <div style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                      {isHindi ? 'नागरिकों द्वारा दर्ज की गई समस्याओं की निगरानी और प्रबंधन करें।' : 'Monitor and manage citizen-reported civic issues across Jharkhand.'}
                    </div>
                  </div>

                  <span style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: '20px'
                  }}>
                    Total {problems.length} Problem Statements
                  </span>
                </div>

                {/* 4 Summary Cards Row */}
                <div className="problems-summary-grid">
                  {/* 1. Pending Verification */}
                  <div
                    className="problems-summary-card card-pending"
                    onClick={() => setFilterStatus('Pending Admin Review')}
                  >
                    <div className="problems-card-content">
                      <div className="problems-card-label">Pending Verification</div>
                      <div className="problems-card-count">{newProblemsCount}</div>
                      <div className="problems-card-sub">Awaiting AI / Admin review</div>
                    </div>
                  </div>

                  {/* 2. Active Problems */}
                  <div
                    className="problems-summary-card card-active"
                    onClick={() => setFilterStatus('In Progress')}
                  >
                    <div className="problems-card-content">
                      <div className="problems-card-label">Active Problems</div>
                      <div className="problems-card-count">{inProgressCount}</div>
                      <div className="problems-card-sub">In progress</div>
                    </div>
                  </div>

                  {/* 3. Solutions Received */}
                  <div
                    className="problems-summary-card card-solutions"
                    onClick={() => setFilterStatus('Solutions Submitted')}
                  >
                    <div className="problems-card-content">
                      <div className="problems-card-label">Solutions Received</div>
                      <div className="problems-card-count">{solutionsSubmittedCount}</div>
                      <div className="problems-card-sub">From universities & industries</div>
                    </div>
                  </div>

                  {/* 4. Projects in Progress */}
                  <div
                    className="problems-summary-card card-projects"
                    onClick={() => setFilterStatus('Assigned')}
                  >
                    <div className="problems-card-content">
                      <div className="problems-card-label">Projects in Progress</div>
                      <div className="problems-card-count">{assignments.length}</div>
                      <div className="problems-card-sub">Under implementation</div>
                    </div>
                  </div>
                </div>

                {/* Single-Row Clean Filter & Search Bar */}
                <div className="problems-filter-bar-neat">
                  {/* Search input */}
                  <div className="problems-search-wrapper">
                    <input
                      type="text"
                      placeholder="Search by problem ID, keyword or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="problems-search-input"
                    />
                  </div>

                  {/* Category select */}
                  <div className="problems-filter-item-box">
                    <span className="problems-filter-item-label">Category</span>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="problems-select-neat"
                    >
                      <option value="All">All Categories</option>
                      {PROBLEM_CATEGORIES.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* District select */}
                  <div className="problems-filter-item-box">
                    <span className="problems-filter-item-label">District</span>
                    <select
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                      className="problems-select-neat"
                    >
                      <option value="All">All Districts</option>
                      {JHARKHAND_DISTRICTS.map((d, i) => (
                        <option key={i} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority select */}
                  <div className="problems-filter-item-box">
                    <span className="problems-filter-item-label">Priority</span>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="problems-select-neat"
                    >
                      <option value="All">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Status select */}
                  <div className="problems-filter-item-box">
                    <span className="problems-filter-item-label">Status</span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="problems-select-neat"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending Admin Review">Pending Verification</option>
                      <option value="Broadcasted to Universities">Routed</option>
                      <option value="Under AI Analysis">Under AI Analysis</option>
                      <option value="Solutions Submitted">Under Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Reset button */}
                  <button
                    type="button"
                    onClick={() => {
                      setFilterCategory('All');
                      setFilterDistrict('All');
                      setFilterPriority('All');
                      setFilterStatus('All');
                      setSearchQuery('');
                    }}
                    className="problems-reset-btn"
                    title="Reset all search and dropdown filters"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Data Table: ONLY THIS CARD & BODY SCROLLS */}
              <div className="admin-table-card-scrollable">
                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        <th style={{ width: '150px', padding: '12px 16px' }}>Problem ID</th>
                        <th style={{ minWidth: '240px', padding: '12px 16px' }}>Problem Title</th>
                        <th style={{ width: '130px', padding: '12px 16px' }}>District</th>
                        <th style={{ width: '160px', padding: '12px 16px' }}>Category</th>
                        <th style={{ width: '100px', padding: '12px 16px' }}>Priority</th>
                        <th style={{ width: '160px', padding: '12px 16px' }}>Status</th>
                        <th style={{ width: '120px', padding: '12px 16px' }}>AI Status</th>
                        <th style={{ width: '100px', padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problems.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#6B7280' }}>
                            <strong style={{ fontSize: '1rem', color: '#374151', display: 'block', marginBottom: '4px' }}>No civic problems found</strong>
                            <span style={{ fontSize: '0.84rem' }}>Try clearing or changing your filters above.</span>
                          </td>
                        </tr>
                      ) : (
                        problems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((p, idx) => {
                          const priority = p.priority || (idx === 0 ? 'Critical' : idx === 1 ? 'High' : idx < 3 ? 'Medium' : 'Low');
                          const statusLabel = p.status === 'Pending Admin Review' || p.status === 'Pending' || p.status === 'New'
                            ? 'Pending Verification' 
                            : p.status === 'Broadcasted to Universities' 
                              ? 'Routed' 
                              : p.status === 'Solutions Submitted' 
                                ? 'Under Review' 
                                : p.status === 'In Progress' || p.status === 'Currently Working'
                                  ? 'In Progress'
                                  : p.status || 'Assigned';

                          const aiStatus = p.autoRouted || idx % 2 === 0 ? 'AI Verified' : 'AI Analyzed';

                          return (
                            <tr key={p.id || idx}>
                              {/* 1. Problem ID */}
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#4B5563', fontSize: '0.82rem' }}>
                                {p.id || `JH-CHLG-2026-${1001 + idx}`}
                              </td>

                              {/* 2. Problem Title */}
                              <td style={{ padding: '14px 16px', maxWidth: '320px' }}>
                                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem', lineHeight: 1.35 }}>
                                  {p.title}
                                </div>
                              </td>

                              {/* 3. District */}
                              <td style={{ padding: '14px 16px', color: '#374151', fontSize: '0.84rem' }}>
                                {p.district || 'Ranchi'}
                              </td>

                              {/* 4. Category Pill Badge */}
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  background: p.category === 'Water Management' || p.category === 'Water Supply' ? '#EFF6FF' :
                                              p.category === 'Roads & Infrastructure' || p.category === 'Roads' ? '#ECFDF5' :
                                              p.category === 'Urban Infrastructure' ? '#FAF5FF' :
                                              p.category === 'Sanitation' || p.category === 'Solid Waste' ? '#F0FDF4' : '#F3F4F6',
                                  color: p.category === 'Water Management' || p.category === 'Water Supply' ? '#1D4ED8' :
                                         p.category === 'Roads & Infrastructure' || p.category === 'Roads' ? '#059669' :
                                         p.category === 'Urban Infrastructure' ? '#7C3AED' :
                                         p.category === 'Sanitation' || p.category === 'Solid Waste' ? '#0D9488' : '#374151'
                                }}>
                                  {p.category || 'Civic'}
                                </span>
                              </td>

                              {/* 5. Priority Pill Badge */}
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  background: priority === 'Critical' || priority === 'High' ? '#FEE2E2' : priority === 'Medium' ? '#FEF3C7' : '#ECFDF5',
                                  color: priority === 'Critical' || priority === 'High' ? '#DC2626' : priority === 'Medium' ? '#D97706' : '#059669'
                                }}>
                                  {priority}
                                </span>
                              </td>

                              {/* 6. Status Pill Badge */}
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 10px',
                                  borderRadius: '12px',
                                  background: statusLabel === 'Pending Verification' ? '#FEF3C7' :
                                              statusLabel === 'In Progress' ? '#EFF6FF' :
                                              statusLabel === 'Routed' ? '#E0F2FE' :
                                              statusLabel === 'Under Review' ? '#FAF5FF' : '#F0F9FF',
                                  color: statusLabel === 'Pending Verification' ? '#D97706' :
                                         statusLabel === 'In Progress' ? '#1D4ED8' :
                                         statusLabel === 'Routed' ? '#0369A1' :
                                         statusLabel === 'Under Review' ? '#7C3AED' : '#0284C7'
                                }}>
                                  {statusLabel}
                                </span>
                              </td>

                              {/* 7. AI Status Pill Badge */}
                              <td style={{ padding: '14px 16px' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: '12px',
                                  background: aiStatus === 'AI Verified' ? '#DCFCE7' : '#EDE9FE',
                                  color: aiStatus === 'AI Verified' ? '#166534' : '#6D28D9'
                                }}>
                                  {aiStatus}
                                </span>
                              </td>

                              {/* 8. Action Button: View -> */}
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="admin-view-arrow-btn"
                                  onClick={() => handleOpenAIAnalysis(p)}
                                  title="Inspect full challenge details and AI analysis"
                                >
                                  <span>View</span>
                                  <span>→</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Footer Row */}
              <div className="admin-fixed-bottom-bar" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 4px 0 4px',
                fontSize: '0.8rem',
                color: '#6B7280'
              }}>
                <div>
                  {problems.length === 0 ? 'No records' : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, problems.length)} of ${problems.length}`}
                </div>

                {Math.ceil(problems.length / pageSize) > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        background: '#FFFFFF',
                        color: currentPage === 1 ? '#D1D5DB' : '#374151',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}
                    >
                      ‹
                    </button>

                    {Array.from({ length: Math.ceil(problems.length / pageSize) }, (_, i) => i + 1).map(pNum => (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setCurrentPage(pNum)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: pNum === currentPage ? 'none' : '1px solid #D1D5DB',
                          background: pNum === currentPage ? '#024D24' : '#FFFFFF',
                          color: pNum === currentPage ? '#FFFFFF' : '#374151',
                          fontWeight: pNum === currentPage ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}
                      >
                        {pNum}
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={currentPage === Math.ceil(problems.length / pageSize)}
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(problems.length / pageSize), prev + 1))}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        background: '#FFFFFF',
                        color: currentPage === Math.ceil(problems.length / pageSize) ? '#D1D5DB' : '#374151',
                        cursor: currentPage === Math.ceil(problems.length / pageSize) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW C: AI ANALYSIS VIEW (22-CAPABILITY AI COMMAND HUB)
             ========================================================================= */}
          {activeTab === 'ai-analysis' && (
            <div>
              <div className="univ-dashboard-heading" style={{ marginBottom: '16px' }}>
                <div>
                  <h1 className="univ-heading-title" style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 800 }}>
                    AI Intelligence & Decision Support
                  </h1>
                  <p className="univ-heading-sub" style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                    Visual triage, semantic analysis, duplicate resolution, and dynamic priority scoring.
                  </p>
                </div>

                {/* Sub-tab Switcher */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setAiSubTab('priority-queue')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      background: aiSubTab === 'priority-queue' ? '#024D24' : '#FFFFFF',
                      color: aiSubTab === 'priority-queue' ? '#FFFFFF' : '#374151',
                      border: '1px solid ' + (aiSubTab === 'priority-queue' ? '#024D24' : '#D1D5DB')
                    }}
                  >
                    Priority Queue ({aiPriorityQueue.length || problems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSubTab('all-analysis')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      background: aiSubTab === 'all-analysis' ? '#024D24' : '#FFFFFF',
                      color: aiSubTab === 'all-analysis' ? '#FFFFFF' : '#374151',
                      border: '1px solid ' + (aiSubTab === 'all-analysis' ? '#024D24' : '#D1D5DB')
                    }}
                  >
                    All Problems ({problems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSubTab('pairings')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      background: aiSubTab === 'pairings' ? '#024D24' : '#FFFFFF',
                      color: aiSubTab === 'pairings' ? '#FFFFFF' : '#374151',
                      border: '1px solid ' + (aiSubTab === 'pairings' ? '#024D24' : '#D1D5DB')
                    }}
                  >
                    University-Industry Pairings
                  </button>
                </div>
              </div>

              {/* Sub-View 1: AI Recommended Priority Queue */}
              {aiSubTab === 'priority-queue' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong style={{ color: '#024D24', fontSize: '0.88rem' }}>Dynamic Multi-Factor Ranking Engine</strong>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>Composite Index: Urgency (35%) + Public Risk (25%) + Infrastructure Impact (20%) + SLA Elapsed (20%)</div>
                    </div>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={fetchAIPriorityQueue}
                      disabled={loadingPriorityQueue}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      {loadingPriorityQueue ? 'Calculating...' : 'Re-rank Queue'}
                    </button>
                  </div>

                  <div className="admin-table-card">
                    <div className="admin-table-responsive">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Problem & Domain</th>
                            <th>District</th>
                            <th>Composite Score</th>
                            <th>AI Auto-Routing</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(aiPriorityQueue.length > 0 ? aiPriorityQueue : problems).map((item, idx) => {
                            const p = item.problem || item;
                            const score = item.aiPriorityScore !== undefined ? item.aiPriorityScore : (95 - idx * 3);
                            const breakdown = item.scoreBreakdown || { urgency: 88, risk: 90, impact: 85, sla: 75 };
                            const isAutoEligible = item.autoRoutingEligible || p.autoRouted;

                            return (
                              <tr key={p.id || idx}>
                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: idx === 0 ? '#DC2626' : idx < 3 ? '#EA580C' : '#6D28D9',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    fontSize: '0.8rem'
                                  }}>
                                    #{idx + 1}
                                  </span>
                                </td>
                                <td>
                                  <strong style={{ color: '#111827', fontSize: '0.92rem' }}>{p.title}</strong>
                                  <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>
                                    ID: {p.id} • Domain: <span style={{ color: '#6D28D9', fontWeight: 700 }}>{p.domain || p.category}</span>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontSize: '0.82rem', color: '#374151' }}>{p.district}</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                      background: score >= 85 ? '#FEF2F2' : score >= 70 ? '#FFFBEB' : '#F0FDF4',
                                      color: score >= 85 ? '#DC2626' : score >= 70 ? '#D97706' : '#166534',
                                      border: `1px solid ${score >= 85 ? '#FECACA' : score >= 70 ? '#FDE68A' : '#BBF7D0'}`,
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontWeight: 800,
                                      fontSize: '0.82rem'
                                    }}>
                                      {score}/100
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                                      (U:{breakdown.urgency} R:{breakdown.risk})
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  {isAutoEligible ? (
                                    <span style={{ background: '#ECFDF5', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 800, border: '1px solid #A7F3D0' }}>
                                      Auto-Routed
                                    </span>
                                  ) : (
                                    <span style={{ background: '#F3F4F6', color: '#6B7280', padding: '3px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 600 }}>
                                      Admin Review
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      className="admin-btn-action"
                                      onClick={() => handleOpenAIAnalysis(p)}
                                      style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                                      title="Inspect AI Breakdown"
                                    >
                                      Inspect
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-btn-action"
                                      onClick={() => handleOpenPairPartners(p)}
                                      style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#024D24', borderColor: '#D1D5DB' }}
                                      title="Pair University + Industry"
                                    >
                                      Pair
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-btn-action"
                                      onClick={() => handleOpenOverrideModal(p)}
                                      style={{ padding: '4px 8px', fontSize: '0.76rem', color: '#D97706', borderColor: '#FDE68A' }}
                                      title="Admin Override"
                                    >
                                      Override
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-View 2: All Analyzed Problems & Duplicate Actions */}
              {aiSubTab === 'all-analysis' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                  {problems.map((prob) => {
                    const isDupFlagged = prob.duplicateStatus && !prob.duplicateStatus.includes('0%') && !prob.duplicateStatus.includes('Unique');
                    const hasMasterLink = !!prob.masterProblemId;

                    return (
                      <div key={prob.id} className="admin-table-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span className="admin-badge badge-ai">CivicAI Engine</span>
                            <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>ID: {prob.id} • {prob.district}</span>
                          </div>

                          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', marginBottom: '8px', lineHeight: 1.35 }}>
                            {prob.title}
                          </h3>

                          {/* Duplicate Warning & Merge Controls */}
                          {isDupFlagged && !hasMasterLink && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991B1B', fontWeight: 800, fontSize: '0.8rem', marginBottom: '4px' }}>
                                <span>Duplicate Flagged ({prob.duplicateStatus})</span>
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#B91C1C', marginBottom: '8px' }}>
                                High semantic and GPS similarity with existing problem record in {prob.district}.
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptMerge('PROB-JH-01', prob.id)}
                                  style={{
                                    background: '#DC2626',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Accept Merge
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleKeepSeparate(prob)}
                                  style={{
                                    background: '#FFFFFF',
                                    color: '#374151',
                                    border: '1px solid #D1D5DB',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Keep Separate
                                </button>
                              </div>
                            </div>
                          )}

                          {hasMasterLink && (
                            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '6px', padding: '6px 10px', marginBottom: '10px', fontSize: '0.76rem', color: '#047857' }}>
                              Merged into Master Problem <strong>{prob.masterProblemId}</strong>
                            </div>
                          )}

                          <div style={{ background: '#F9FAFB', borderRadius: '8px', padding: '10px 12px', fontSize: '0.82rem', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#4B5563' }}>Detected Domain:</span>
                              <strong style={{ color: '#024D24' }}>{prob.domain || 'Civil Systems'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ color: '#4B5563' }}>Severity Metric:</span>
                              <strong style={{ color: prob.priority === 'Critical' ? '#C62828' : '#D97706' }}>
                                {prob.priority === 'Critical' ? '96/100 (Severe)' : '84/100 (High)'}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#4B5563' }}>Auto-Routed:</span>
                              <strong style={{ color: prob.autoRouted ? '#059669' : '#6B7280' }}>
                                {prob.autoRouted ? 'Yes (Verified)' : 'Pending Review'}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="admin-btn-primary"
                            onClick={() => handleOpenAIAnalysis(prob)}
                            style={{ flex: 1, justifyContent: 'center', padding: '7px 10px', fontSize: '0.8rem' }}
                          >
                            <span>Inspect</span>
                            <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn-action"
                            onClick={() => handleOpenPairPartners(prob)}
                            style={{ padding: '7px 10px', fontSize: '0.8rem' }}
                            title="Find University-Industry Pairings"
                          >
                            Pair
                          </button>
                          <button
                            type="button"
                            className="admin-btn-action"
                            onClick={() => handleOpenOverrideModal(prob)}
                            style={{ padding: '7px 10px', fontSize: '0.8rem', color: '#D97706', borderColor: '#FDE68A' }}
                            title="Admin Override"
                          >
                            Override
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sub-View 3: University + Industry Pairing Recommendations */}
              {aiSubTab === 'pairings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 16px' }}>
                    <strong style={{ color: '#024D24', fontSize: '0.88rem' }}>University R&D + Industry CSR Co-Funding</strong>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Match academic technical execution capability with corporate CSR funding for civic solutions.</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                    {problems.slice(0, 4).map((p, pIdx) => {
                      const topUniv = universities[pIdx % universities.length] || universities[0];
                      const topInd = industries[pIdx % industries.length] || industries[0];

                      return (
                        <div key={p.id} className="admin-table-card" style={{ padding: '18px' }}>
                          <span style={{ fontSize: '0.74rem', background: '#E8F5EC', color: '#024D24', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                            {p.category} • {p.district}
                          </span>
                          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: '8px 0 12px 0' }}>
                            {p.title}
                          </h3>

                          {/* University Match Box */}
                          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 800 }}>RECOMMENDED ACADEMIC LEAD</div>
                            <strong style={{ fontSize: '0.88rem', color: '#111827' }}>{topUniv?.name || 'Central University of Jharkhand'}</strong>
                            <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '2px' }}>Expertise: {topUniv?.expertise || 'Environmental Engineering'}</div>
                          </div>

                          {/* Industry Match Box */}
                          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 800 }}>RECOMMENDED CSR CO-FUNDER</div>
                            <strong style={{ fontSize: '0.88rem', color: '#111827' }}>{topInd?.companyName || 'Tata Steel Civic Innovation Foundation'}</strong>
                            <div style={{ fontSize: '0.74rem', color: '#4B5563', marginTop: '2px' }}>CSR Budget Grant: ₹ 6.5 Lakhs</div>
                          </div>

                          <button
                            type="button"
                            className="admin-btn-primary"
                            onClick={() => handleOpenCombineModal(p)}
                            style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.82rem' }}
                          >
                            <span>Authorize Joint Partnership</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW D: UNIVERSITIES MATCHING HUB
             ========================================================================= */}
          {activeTab === 'universities' && (
            <div>
              <div className="univ-dashboard-heading" style={{ marginBottom: '16px' }}>
                <div>
                  <h1 className="univ-heading-title" style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 800 }}>
                    University Directory
                  </h1>
                  <p className="univ-heading-sub" style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                    {universities.length} Connected State and Central Institutions across Jharkhand.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                {universities.map((u, i) => (
                  <div key={u.id || i} className="admin-table-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="admin-badge badge-new">{u.ranking || u.accreditation || 'State Partner'}</span>
                        <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{u.location}</span>
                      </div>
                      <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{u.name}</h3>
                      <div style={{ fontSize: '0.8rem', color: '#036D33', fontWeight: 700, marginBottom: '6px' }}>
                        {Array.isArray(u.departments) ? u.departments.join(', ') : u.departments}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '12px' }}>
                        <strong>Specializations:</strong> {u.expertise}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                        Completed Projects: <strong>{u.completedCivicProjects || 0}</strong>
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#024D24', fontWeight: 800 }}>
                        Active Node
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW E: PROPOSED SOLUTIONS REVIEW & COMPARISON (CRITICAL FEATURE)
             ========================================================================= */}
          {/* =========================================================================
              VIEW E: PROPOSED SOLUTIONS REVIEW & COMPARISON (CRITICAL FEATURE)
             ========================================================================= */}
          {/* =========================================================================
              VIEW E: PROPOSED SOLUTIONS REVIEW & COMPARISON (CRITICAL FEATURE)
             ========================================================================= */}
          {activeTab === 'solutions' && (
            <div>
              {(() => {
                const normKey = (val) => (val || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
                const isMatch = (s, p) => {
                  if (!s || !p) return false;
                  const sId = normKey(s.problemId);
                  const pId = normKey(p.id);
                  if (sId && pId && (sId === pId || sId.includes(pId) || pId.includes(sId))) return true;
                  const sTitle = normKey(s.problemTitle);
                  const pTitle = normKey(p.title);
                  if (sTitle && pTitle && (sTitle === pTitle || sTitle.includes(pTitle) || pTitle.includes(sTitle))) return true;
                  return false;
                };
                const activeProblemGroups = problems.filter(p => solutions.some(s => isMatch(s, p)));

                // Also check if any solutions exist whose problem isn't in problems array
                const orphanSolutions = solutions.filter(s => !problems.some(p => isMatch(s, p)));
                const orphanGroups = [];
                if (orphanSolutions.length > 0) {
                  const byTitle = new Map();
                  orphanSolutions.forEach(s => {
                    const t = s.problemTitle || s.problemId || 'Civic Problem Statement';
                    if (!byTitle.has(t)) byTitle.set(t, []);
                    byTitle.get(t).push(s);
                  });
                  byTitle.forEach((sList, title) => {
                    orphanGroups.push({
                      id: sList[0].problemId || `PROB-EXT-${title.substring(0, 8)}`,
                      title: title,
                      category: sList[0].category || sList[0].domain || 'General Civic',
                      district: 'Jharkhand',
                      status: 'Solutions Submitted',
                      description: sList[0].technicalApproach || sList[0].description || 'Submitted solution proposal',
                      isVirtual: true
                    });
                  });
                }

                const allGroupsToRender = [...activeProblemGroups, ...orphanGroups];

                return (
                  <>
                    <div className="univ-dashboard-heading" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h1 className="univ-heading-title" style={{ fontSize: '1.45rem', color: '#0F172A', fontWeight: 800 }}>
                          University & Industry Proposals
                        </h1>
                        <p className="univ-heading-sub" style={{ fontSize: '0.84rem', color: '#64748B', margin: '2px 0 0 0' }}>
                          Review proposals submitted by universities & corporate partners grouped by problem statement.
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          padding: '6px 16px',
                          borderRadius: '20px'
                        }}>
                          {solutions.length} Total Proposals ({allGroupsToRender.length} Problem Statements)
                        </span>
                      </div>
                    </div>

                    {/* Group Solutions by Problem */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {allGroupsToRender.length === 0 && solutions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
                            No Solution Proposals Submitted Yet
                          </h3>
                          <p style={{ fontSize: '0.84rem', color: '#6B7280', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                            When universities and industry partners submit proposals, they will appear here grouped by problem for review and approval.
                          </p>
                          <button
                            type="button"
                            className="admin-btn-primary"
                            onClick={() => setActiveTab('problems')}
                            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                          >
                            <span>View Problems</span>
                          </button>
                        </div>
                      ) : (
                        allGroupsToRender.map((p) => {
                          const pSols = solutions.filter(s => isMatch(s, p));
                          if (pSols.length === 0) return null;

                          const accentColor = p.category?.toLowerCase().includes('water') || p.category?.toLowerCase().includes('healthcare')
                            ? '#059669'
                            : p.category?.toLowerCase().includes('energy') || p.category?.toLowerCase().includes('agriculture')
                              ? '#4F46E5'
                              : '#2563EB';

                          return (
                            <div
                              key={p.id}
                              style={{
                                background: '#FFFFFF',
                                border: '1.5px solid #E5E7EB',
                                borderRadius: '16px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                                position: 'relative',
                                overflow: 'hidden',
                                padding: '20px 24px',
                                borderLeft: `5px solid ${accentColor}`
                              }}
                            >
                              {/* Top Header Row */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <span style={{
                                    background: '#ECFDF5',
                                    color: '#065F46',
                                    border: '1px solid #A7F3D0',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700
                                  }}>
                                    {p.category}
                                  </span>
                                  <span style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>
                                    ID: {p.id} • {p.district}
                                  </span>
                                  <span style={{
                                    background: '#EFF6FF',
                                    color: '#1D4ED8',
                                    border: '1px solid #BFDBFE',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.76rem',
                                    fontWeight: 700
                                  }}>
                                    {p.status}
                                  </span>
                                  <span style={{
                                    background: '#FEF3C7',
                                    color: '#92400E',
                                    border: '1px solid #FDE68A',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '0.76rem',
                                    fontWeight: 800
                                  }}>
                                    📝 {pSols.length} {pSols.length === 1 ? 'Proposal' : 'Proposals'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCollaborationReport(p)}
                                    style={{
                                      background: '#4F46E5',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      padding: '7px 16px',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'background 0.18s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#4338CA'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#4F46E5'}
                                    title="Generate or view MCP Collaboration Intelligence Synergy Report"
                                  >
                                    <span>✨ MCP Intelligence Report</span>
                                  </button>
                                  {p.approvalStatus === 'COLLABORATION_APPROVED' ? (
                                    <span style={{
                                      background: '#DCFCE7',
                                      color: '#166534',
                                      border: '1px solid #86EFAC',
                                      padding: '7px 16px',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      fontWeight: 700
                                    }}>
                                      ✓ Collaboration Approved (Gate 2)
                                    </span>
                                  ) : p.approvalStatus === 'PROJECT_CREATED' || p.status === 'IN_PROGRESS' ? (
                                    <span style={{
                                      background: '#EFF6FF',
                                      color: '#1D4ED8',
                                      border: '1px solid #BFDBFE',
                                      padding: '7px 16px',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      fontWeight: 700
                                    }}>
                                      ✓ Project Created
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCollaborationDecision(p)}
                                      style={{
                                        background: '#059669',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        padding: '7px 16px',
                                        borderRadius: '8px',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'background 0.18s ease'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#047857'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = '#059669'}
                                    >
                                      <span>Select Collaboration (Gate 2)</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCompareSolutions(p)}
                                    style={{
                                      background: '#FFFFFF',
                                      color: '#1F2937',
                                      border: '1px solid #D1D5DB',
                                      padding: '7px 14px',
                                      borderRadius: '8px',
                                      fontSize: '0.82rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.18s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#F9FAFB';
                                      e.currentTarget.style.borderColor = '#9CA3AF';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = '#FFFFFF';
                                      e.currentTarget.style.borderColor = '#D1D5DB';
                                    }}
                                  >
                                    Compare ({pSols.length})
                                  </button>
                                </div>
                              </div>

                              {/* Title & Date */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                                <h3 style={{ fontSize: '1.14rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  {p.title}
                                </h3>
                                <span style={{ fontSize: '0.82rem', color: '#64748B' }}>
                                  {p.submissionDate || p.createdAt?.split('T')[0] || '2026-09-05'}
                                </span>
                              </div>

                              {/* Description (Concise single line with ellipsis to prevent clutter) */}
                              <p style={{
                                fontSize: '0.82rem',
                                color: '#64748B',
                                lineHeight: 1.45,
                                margin: '0 0 16px 0',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {p.description}
                              </p>

                              {/* Proposed Solutions List */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {pSols.map((sol, solIdx) => {
                                  const isIndustry = sol.submitterType === 'industry' || !!sol.companyName;
                                  const orgName = isIndustry ? (sol.companyName || 'Corporate Partner') : (sol.universityName || 'University Partner');
                                  const leadName = isIndustry ? (sol.teamLeadName || sol.representativeName || 'CSR Director') : (sol.mentorName || sol.leadName || 'Dr. Sanjeev Hansda');
                                  const solStatusUpper = String(sol.status || sol.approvalStatus || '').toUpperCase();
                                  const isAssignedOrApproved = solStatusUpper === 'ASSIGNED' || solStatusUpper === 'APPROVED' || solStatusUpper === 'ACCEPTED' || solStatusUpper === 'SELECTED' || p.approvalStatus === 'COLLABORATION_APPROVED' || p.approvalStatus === 'PROJECT_CREATED';
                                  const isModRequested = solStatusUpper === 'MODIFICATION REQUESTED' || solStatusUpper === 'MODIFICATION_REQUESTED' || solStatusUpper === 'CHANGES_REQUESTED';
                                  const isRejected = solStatusUpper === 'REJECTED';

                                  return (
                                    <div
                                      key={sol.id || solIdx}
                                      style={{
                                        background: '#F8FAF9',
                                        border: '1.5px solid #E5E7EB',
                                        borderRadius: '12px',
                                        padding: '14px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '16px'
                                      }}
                                    >
                                      {/* Left: Proposal Tag & Info */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                        {/* Proposal Index & Org Badge */}
                                        <div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4B5563', background: '#E5E7EB', padding: '2px 8px', borderRadius: '6px' }}>
                                              Proposal #{solIdx + 1}
                                            </span>
                                            <span style={{
                                              fontSize: '0.74rem',
                                              fontWeight: 700,
                                              padding: '2px 8px',
                                              borderRadius: '6px',
                                              background: isIndustry ? '#FEF3C7' : '#EFF6FF',
                                              color: isIndustry ? '#92400E' : '#1E40AF',
                                              border: isIndustry ? '1px solid #FDE68A' : '1px solid #BFDBFE'
                                            }}>
                                              {isIndustry ? '🏢 Industry' : '🏛️ University'}
                                            </span>
                                          </div>
                                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#111827', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {orgName}
                                          </div>
                                        </div>

                                        {/* Solution Info Columns */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                                          <div>
                                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>
                                              Budget Required
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                                              {sol.estimatedCost || sol.fundingAmount || '₹ 4.8 Lakhs'}
                                            </div>
                                          </div>

                                          <div>
                                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>
                                              Timeline
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                                              {sol.estimatedTimeWeeks || sol.duration || 6} Weeks
                                            </div>
                                          </div>

                                          <div>
                                            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>
                                              Lead
                                            </div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                                              {leadName}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Action on Right */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {isAssignedOrApproved ? (
                                    <span style={{
                                      background: '#ECFDF5',
                                      color: '#059669',
                                      border: '1px solid #A7F3D0',
                                      padding: '7px 18px',
                                      borderRadius: '8px',
                                      fontWeight: 700,
                                      fontSize: '0.82rem'
                                    }}>
                                      ✓ {solStatusUpper === 'APPROVED' ? 'Approved' : 'Assigned & Approved'}
                                    </span>
                                  ) : isModRequested ? (
                                    <span style={{
                                      background: '#FEF3C7',
                                      color: '#92400E',
                                      border: '1px solid #FDE68A',
                                      padding: '7px 16px',
                                      borderRadius: '8px',
                                      fontWeight: 700,
                                      fontSize: '0.82rem'
                                    }}>
                                      ✓ Modification Requested
                                    </span>
                                  ) : isRejected ? (
                                    <span style={{
                                      background: '#FEE2E2',
                                      color: '#DC2626',
                                      border: '1px solid #FECACA',
                                      padding: '7px 16px',
                                      borderRadius: '8px',
                                      fontWeight: 700,
                                      fontSize: '0.82rem'
                                    }}>
                                      ✓ Rejected
                                    </span>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRejectModal(sol)}
                                        style={{
                                          background: '#FEF2F2',
                                          color: '#EF4444',
                                          border: '1px solid #FECACA',
                                          padding: '7px 14px',
                                          borderRadius: '8px',
                                          fontSize: '0.82rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#FEF2F2'}
                                      >
                                        Reject
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenModifyModal(sol)}
                                        style={{
                                          background: '#FFFBEB',
                                          color: '#D97706',
                                          border: '1px solid #FDE68A',
                                          padding: '7px 14px',
                                          borderRadius: '8px',
                                          fontSize: '0.82rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#FEF3C7'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#FFFBEB'}
                                      >
                                        Request Changes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleInitiateAssignment(sol)}
                                        style={{
                                          background: '#059669',
                                          color: '#FFFFFF',
                                          border: 'none',
                                          padding: '7px 18px',
                                          borderRadius: '8px',
                                          fontSize: '0.82rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'background 0.18s ease'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#047857'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#059669'}
                                      >
                                        Accept & Assign
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }))}
                </div>
              </>
            );
          })()}
        </div>
      )}

          {/* =========================================================================
              VIEW G: DEDICATED COLLABORATIONS & STATE GOVERNANCE AUDIT TRAIL
             ========================================================================= */}
          {activeTab === 'collaborations' && (
            <div>
              <div className="univ-dashboard-heading" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h1 className="univ-heading-title" style={{ fontSize: '1.45rem', color: '#111827', fontWeight: 800 }}>
                    Joint Collaborations & Governance Audit
                  </h1>
                  <p className="univ-heading-sub" style={{ fontSize: '0.84rem', color: '#6B7280', margin: '2px 0 0 0' }}>
                    Admin Gate 2 sanctioned partnerships pairing 1 University with 1 Industry CSR partner under strict 90-day SLA.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    background: '#FAF5FF',
                    color: '#6D28D9',
                    border: '1.5px solid #DDD6FE',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    padding: '6px 16px',
                    borderRadius: '20px'
                  }}>
                    {collaborations.length} Active Joint Partnerships
                  </span>
                </div>
              </div>

              {/* Section 1: Active Joint Collaborations Cards */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                    Active Paired Innovation Teams (1 Univ + 1 Ind)
                  </h2>
                </div>

                {collaborations.length === 0 ? (
                  <div className="admin-table-card" style={{ padding: '36px 20px', textAlign: 'center', color: '#6B7280' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🤝</div>
                    <strong style={{ fontSize: '1.05rem', color: '#111827', display: 'block', marginBottom: '4px' }}>
                      No Joint Collaborations Formed Yet
                    </strong>
                    <p style={{ fontSize: '0.84rem', maxWidth: '480px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                      Review received proposals in the Proposals tab or select candidate pairs to sanction official joint collaboration projects.
                    </p>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => setActiveTab('solutions')}
                      style={{ padding: '8px 18px', fontSize: '0.84rem' }}
                    >
                      <span>Review Proposals & Pair →</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
                    {collaborations.map((collab, idx) => {
                      const isResolved = collab.status === 'Resolved' || collab.solutionStatus === 'Resolved';
                      const isDeliverableReady = collab.finalDeliverables || collab.status === 'Submitted to Admin for Final Review';

                      return (
                        <div
                          key={collab.id || idx}
                          className="admin-table-card"
                          style={{
                            padding: '20px',
                            borderLeft: `5px solid ${isResolved ? '#059669' : '#6D28D9'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '14px'
                          }}
                        >
                          <div>
                            {/* Card Top Pill */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', background: '#EDE9FE', color: '#6D28D9', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                {collab.category || 'Civic Challenge'}
                              </span>
                              <span style={{
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: isResolved ? '#DCFCE7' : isDeliverableReady ? '#FEF3C7' : '#EFF6FF',
                                color: isResolved ? '#166534' : isDeliverableReady ? '#92400E' : '#1D4ED8'
                              }}>
                                {isResolved ? '✓ Completed & Verified' : isDeliverableReady ? 'Deliverables Submitted' : 'In Active Execution'}
                              </span>
                            </div>

                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: '0 0 4px 0', lineHeight: 1.35 }}>
                              {collab.problemTitle}
                            </h3>
                            <div style={{ fontSize: '0.76rem', color: '#6B7280', marginBottom: '12px' }}>
                              ID: {collab.problemId || collab.id} • District: {collab.district || 'Jharkhand'} • Sanctioned: {collab.createdAt?.split('T')[0] || 'Recent'}
                            </div>

                            {/* Dual Partner Box */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: '#036D33', fontWeight: 800, textTransform: 'uppercase' }}>
                                  🏛️ Academic R&D Lead
                                </div>
                                <strong style={{ fontSize: '0.86rem', color: '#111827', display: 'block', marginTop: '2px' }}>
                                  {collab.universityName}
                                </strong>
                                <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>
                                  Lead: {collab.mentorName || collab.representativeName || 'Faculty Investigator'}
                                </span>
                              </div>

                              <div>
                                <div style={{ fontSize: '0.7rem', color: '#6D28D9', fontWeight: 800, textTransform: 'uppercase' }}>
                                  🏭 Corporate CSR Co-Funder
                                </div>
                                <strong style={{ fontSize: '0.86rem', color: '#111827', display: 'block', marginTop: '2px' }}>
                                  {collab.companyName}
                                </strong>
                                <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>
                                  Grant: {collab.fundingAmount || '₹ 5.0 Lakhs'}
                                </span>
                              </div>
                            </div>

                            {/* SLA & Milestone Trajectory */}
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>
                                <span>90-Day SLA Milestone Progress</span>
                                <span style={{ color: '#059669' }}>{collab.milestoneProgress || 45}%</span>
                              </div>
                              <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${collab.milestoneProgress || 45}%`, height: '100%', background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)', borderRadius: '4px' }} />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="admin-btn-action"
                              onClick={() => handleOpenProjectSla({ problemId: collab.problemId, problemTitle: collab.problemTitle, universityName: collab.universityName })}
                              style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '6px 10px' }}
                            >
                              <span>SLA Telemetry Radar</span>
                            </button>

                            {isDeliverableReady && !isResolved && (
                              <button
                                type="button"
                                className="admin-btn-primary"
                                onClick={() => handleOpenVerifyModal({ problemId: collab.problemId, problemTitle: collab.problemTitle, universityName: `${collab.universityName} + ${collab.companyName}` })}
                                style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '6px 10px', background: '#059669', borderColor: '#047857' }}
                              >
                                <span>Verify & Resolve (Gate 3)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Administrative Decision & Governance Audit Log */}
              <div className="admin-table-card">
                <div className="admin-table-header" style={{ padding: '16px 20px', background: '#FFFFFF' }}>
                  <div>
                    <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      Administrative Decision & Governance Audit Stream
                    </h2>
                    <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                      Immutable record of all Gate 1 approvals, Gate 2 pair selections, and rejections with executive rationales.
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', background: '#E8F5EC', color: '#024D24', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    Audit Compliance: Certified
                  </span>
                </div>

                <div className="admin-table-responsive">
                  <table className="admin-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>TIMESTAMP</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>PROBLEM ID & TITLE</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>ACTION / GATE</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>SELECTED PARTNERS</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>EXECUTIVE RATIONALE</th>
                        <th style={{ padding: '10px 14px', fontSize: '0.72rem' }}>AUTHORIZED ACTOR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problems.filter(p => p.approvalStatus && p.approvalStatus !== 'PENDING_ADMIN_REVIEW').length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                            No formal governance decisions logged yet. Decisions recorded at Gate 1 and Gate 2 will appear here.
                          </td>
                        </tr>
                      ) : (
                        problems.filter(p => p.approvalStatus && p.approvalStatus !== 'PENDING_ADMIN_REVIEW').map((p, pIdx) => (
                          <tr key={p.id || pIdx}>
                            <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                              {p.approvedAt ? new Date(p.approvedAt).toLocaleString('en-IN') : 'Recent'}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#111827', maxWidth: '220px' }}>
                              <div style={{ fontSize: '0.82rem' }}>{p.title}</div>
                              <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>ID: {p.id}</span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: p.approvalStatus === 'APPROVED_FOR_MATCHING' ? '#ECFDF5' : p.approvalStatus === 'COLLABORATION_APPROVED' ? '#DCFCE7' : p.approvalStatus === 'REJECTED_BY_ADMIN' ? '#FEE2E2' : '#EFF6FF',
                                color: p.approvalStatus === 'APPROVED_FOR_MATCHING' ? '#065F46' : p.approvalStatus === 'COLLABORATION_APPROVED' ? '#166534' : p.approvalStatus === 'REJECTED_BY_ADMIN' ? '#DC2626' : '#1D4ED8'
                              }}>
                                {p.approvalStatus === 'APPROVED_FOR_MATCHING' ? 'Gate 1: Approved for Matching' : p.approvalStatus === 'COLLABORATION_APPROVED' ? 'Gate 2: Collaboration Sanctioned' : p.approvalStatus === 'REJECTED_BY_ADMIN' ? 'Gate 1: Rejected' : p.approvalStatus}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.78rem' }}>
                              {p.assignedTo ? (
                                <div>
                                  <strong style={{ color: '#024D24' }}>{typeof p.assignedTo === 'object' ? (p.assignedTo.universityName || p.assignedTo.companyName || p.assignedTo.name || 'Assigned Partner') : String(p.assignedTo)}</strong>
                                </div>
                              ) : p.matchedUniversities?.length > 0 ? (
                                <span style={{ color: '#0369A1' }}>{p.matchedUniversities.length} Univs + {p.matchedIndustries?.length || 5} Inds Matched</span>
                              ) : (
                                <span style={{ color: '#6B7280' }}>Dispatched to Matched Partners</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: '#4B5563', maxWidth: '260px' }}>
                              {p.approvalNotes || p.rejectionReason || 'Authorized under Jharkhand State Innovation Policy guidelines.'}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: '#111827', fontWeight: 700 }}>
                              {p.approvedBy || adminOfficerName}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW F: INDUSTRY PARTICIPATION & CSR
             ========================================================================= */}
          {activeTab === 'industry' && (
            <div>
              <div className="univ-dashboard-heading" style={{ marginBottom: '16px' }}>
                <div>
                  <h1 className="univ-heading-title" style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 800 }}>
                    Industry Partners & CSR
                  </h1>
                  <p className="univ-heading-sub" style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                    Corporate CSR funding proposals, lab equipment grants, and civic innovation partnerships.
                  </p>
                </div>
                <span className="admin-badge badge-progress" style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
                  {industries.length} Verified Partners
                </span>
              </div>

              {/* 1. DEDICATED SECTION: ACTIVE INDUSTRY-UNIVERSITY PROBLEM COLLABORATIONS */}
              <div className="admin-table-card" style={{ marginBottom: '20px' }}>
                <div className="admin-table-header" style={{ background: '#F8FAF9', padding: '14px 18px' }}>
                  <div>
                    <h3 className="admin-table-title" style={{ fontSize: '1rem', color: '#111827' }}>
                      Active Industry-University Collaborations
                    </h3>
                    <div className="admin-table-sub">
                      Tracking corporate CSR support, university execution partnerships, and solution status.
                    </div>
                  </div>
                  <span className="admin-badge" style={{ background: '#E8F5EC', color: '#024D24', border: '1px solid #A7F3D0', fontWeight: 800 }}>
                    {collaborations.length} Active
                  </span>
                </div>

                <div className="admin-table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Problem</th>
                        <th>University Partner</th>
                        <th>Industry Partner</th>
                        <th>CSR Funding</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaborations.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                            No active industry-university collaborations recorded yet.
                          </td>
                        </tr>
                      ) : (
                        collaborations.map((collab, idx) => (
                          <tr key={collab.id || idx}>
                            <td style={{ maxWidth: '240px' }}>
                              <strong style={{ color: '#111827', display: 'block' }}>{collab.problemTitle}</strong>
                              <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>ID: {collab.problemId} • {collab.district || 'Jharkhand'}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#024D24', display: 'block', fontSize: '0.84rem' }}>{collab.universityName}</strong>
                              <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>Lead: {collab.representativeName || 'R&D Department'}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#111827', display: 'block', fontSize: '0.84rem' }}>{collab.companyName}</strong>
                              <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>{collab.representativeName}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#047857', display: 'block', fontSize: '0.84rem' }}>{collab.fundingAmount}</strong>
                              <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>
                                {Array.isArray(collab.offers || collab.supportTypes) ? (collab.offers || collab.supportTypes).join(', ') : 'R&D Grant'}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                              {collab.collaborationDate || collab.createdAt?.split('T')[0] || '2026-09-05'}
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '4px',
                                border: '1px solid',
                                background: collab.solutionStatus === 'Resolved' ? '#DCFCE7' : collab.solutionStatus === 'Deadline Expired' ? '#FEE2E2' : collab.solutionStatus === 'In Progress' ? '#E0F2FE' : '#FEF3C7',
                                color: collab.solutionStatus === 'Resolved' ? '#166534' : collab.solutionStatus === 'Deadline Expired' ? '#991B1B' : collab.solutionStatus === 'In Progress' ? '#0369A1' : '#92400E',
                                borderColor: collab.solutionStatus === 'Resolved' ? '#86EFAC' : collab.solutionStatus === 'Deadline Expired' ? '#FCA5A5' : collab.solutionStatus === 'In Progress' ? '#BAE6FD' : '#FDE68A'
                              }}>
                                {collab.solutionStatus === 'Resolved' && 'Resolved'}
                                {collab.solutionStatus === 'In Progress' && 'In Progress'}
                                {collab.solutionStatus === 'Assigned' && 'Assigned'}
                                {collab.solutionStatus === 'Completion Submitted' && 'Completion Submitted'}
                                {collab.solutionStatus === 'Deadline Expired' && 'Deadline Expired'}
                                {!['Resolved', 'In Progress', 'Assigned', 'Completion Submitted', 'Deadline Expired'].includes(collab.solutionStatus) && (collab.solutionStatus || 'Under Review')}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Industry Partners Directory Grid */}
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>
                Corporate Partners Directory
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {industries.map((ind) => (
                  <div key={ind.id} className="admin-table-card" style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="admin-badge badge-progress">{ind.status}</span>
                      <span style={{ fontSize: '0.78rem', color: '#036D33', fontWeight: 800 }}>
                        {ind.totalFundingCommitted}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                      {ind.companyName}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '8px' }}>
                      {ind.headquarters} • Contact: {ind.contactPerson}
                    </div>

                    <div style={{ background: '#F9FAFB', padding: '8px 10px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '12px' }}>
                      <strong style={{ color: '#024D24', display: 'block', marginBottom: '2px' }}>Focus Sectors:</strong>
                      <div style={{ color: '#4B5563' }}>{Array.isArray(ind.expertiseSectors) ? ind.expertiseSectors.join(', ') : ind.expertiseSectors}</div>
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#111827', display: 'block', marginBottom: '6px' }}>
                        Active Grants ({ind.proposals?.length || 0}):
                      </strong>
                      {ind.proposals?.map((prop, idx) => (
                        <div key={idx} style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 8px', fontSize: '0.76rem', color: '#374151', marginBottom: '4px' }}>
                          <strong>{prop.problemTitle}</strong>
                          <div>Grant: {prop.fundingAmount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW G: ASSIGNMENTS & LIVE PROJECTS (WITH 3-MONTH SLA ENFORCEMENT)
             ========================================================================= */}
          {activeTab === 'projects' && (
            <div>
              <div className="univ-dashboard-heading" style={{ marginBottom: '16px' }}>
                <div>
                  <h1 className="univ-heading-title" style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 800 }}>
                    Project Assignments & SLA
                  </h1>
                  <p className="univ-heading-sub" style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                    Tracking university assignments, milestone completions, and 90-day SLA compliance.
                  </p>
                </div>
              </div>

              {/* SECTION 1: JOINT UNIVERSITY-INDUSTRY COLLABORATIONS & FINAL VERIFICATION */}
              <div className="admin-table-card" style={{ marginBottom: '20px' }}>
                <div className="admin-table-header" style={{ background: '#F8FAF9', padding: '14px 18px' }}>
                  <div>
                    <h3 className="admin-table-title" style={{ fontSize: '1rem', color: '#111827' }}>
                      Joint Collaborations — Deliverables & Verification
                    </h3>
                    <div className="admin-table-sub">
                      Review joint solutions submitted by paired partners and authorize deployment.
                    </div>
                  </div>
                  <span className="admin-badge" style={{ background: '#E8F5EC', color: '#024D24', border: '1px solid #A7F3D0', fontWeight: 800 }}>
                    {collaborations.length} Active
                  </span>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {collaborations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>
                      No joint collaborations formed yet.
                    </div>
                  ) : (
                    collaborations.map((collab) => {
                      const isReadyForProceed = collab.status === 'Submitted to Admin for Final Review' || collab.solutionStatus === 'Completion Submitted' || collab.finalDeliverables;
                      const isSanctioned = collab.status === 'Sanctioned for Deployment' || collab.status === 'Resolved';

                      return (
                        <div
                          key={collab.id}
                          style={{
                            background: '#FFFFFF',
                            border: isSanctioned ? '1.5px solid #059669' : isReadyForProceed ? '1.5px solid #F59E0B' : '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '16px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.74rem', background: '#E8F5EC', color: '#024D24', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                {collab.category || 'Civic Problem'}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>
                                ID: {collab.problemId || collab.id} • {collab.district || 'Jharkhand'}
                              </span>
                            </div>

                            <span style={{
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '4px',
                              background: isSanctioned ? '#DCFCE7' : isReadyForProceed ? '#FEF3C7' : '#E0F2FE',
                              color: isSanctioned ? '#166534' : isReadyForProceed ? '#92400E' : '#0369A1',
                              border: `1px solid ${isSanctioned ? '#86EFAC' : isReadyForProceed ? '#FDE68A' : '#BAE6FD'}`
                            }}>
                              {isSanctioned ? 'Sanctioned & Authorized' : isReadyForProceed ? 'Deliverables Submitted — Ready for Review' : `Active (${collab.status || 'In Progress'})`}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: '0 0 8px 0' }}>
                            {collab.problemTitle}
                          </h4>

                          {/* Partners Grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px', marginBottom: '12px', fontSize: '0.8rem' }}>
                            <div>
                              <span style={{ color: '#036D33', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>UNIVERSITY PARTNER</span>
                              <strong style={{ color: '#111827' }}>{collab.universityName}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#374151', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>INDUSTRY PARTNER</span>
                              <strong style={{ color: '#111827' }}>{collab.companyName}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#047857', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>CSR / GRANT</span>
                              <strong style={{ color: '#047857' }}>{collab.fundingAmount || '₹ 5.0 Lakhs'}</strong>
                            </div>
                          </div>

                          {/* Submitted Deliverables Content if available */}
                          {collab.finalDeliverables && (
                            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                              <strong style={{ fontSize: '0.8rem', color: '#166534', display: 'block', marginBottom: '2px' }}>
                                Deliverables Summary:
                              </strong>
                              <p style={{ fontSize: '0.8rem', color: '#374151', margin: '0 0 6px 0', lineHeight: 1.45 }}>
                                {collab.finalDeliverables}
                              </p>
                              {collab.finalFolderLink && (
                                <a
                                  href={collab.finalFolderLink.startsWith('http') ? collab.finalFolderLink : `https://${collab.finalFolderLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#059669', fontWeight: 800, fontSize: '0.78rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  Documentation Folder ↗
                                </a>
                              )}
                            </div>
                          )}

                          {/* Verification and Action Row */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '10px', flexWrap: 'wrap' }}>
                            {isSanctioned ? (
                              <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.82rem' }}>
                                Verification Complete
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="admin-btn-primary"
                                onClick={() => handleOpenProceedWorkModal(collab)}
                                style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                                title="Inspect submitted work and authorize project proceeding"
                              >
                                <span>Verify & Proceed</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECTION 2: UNIVERSITY ASSIGNMENTS & 3-MONTH SLA RADAR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {assignments.length === 0 ? (
                  <div className="admin-table-card" style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                    No single university assignments created yet.
                  </div>
                ) : (
                  assignments.map((asgn) => {
                    const deadline = asgn.deadlineInfo || getDeadlineInfo(asgn);
                    const isExpired = deadline.isExpired;

                    return (
                      <div key={asgn.id} className="admin-table-card" style={{ padding: '18px', borderLeft: isExpired ? '4px solid #EF4444' : '4px solid #059669' }}>
                        
                        {/* Expiration Banner if 3-Month SLA is violated */}
                        {isExpired && (
                          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991B1B', fontWeight: 800, fontSize: '0.88rem' }}>
                                <span>90-Day SLA Expired</span>
                                <span style={{ fontSize: '0.76rem', background: '#FEE2E2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCA5A5' }}>
                                  {deadline.daysOverdue} Days Overdue (Target: {deadline.deadlineFormatted})
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#7F1D1D', marginTop: '2px' }}>
                                The 90-day window lapsed without completion. Challenge is closed for <strong>{asgn.universityName}</strong>.
                              </div>
                            </div>

                            <button
                              type="button"
                              className="admin-btn-primary"
                              onClick={() => handleReopenProblem(asgn.problemId || asgn.id)}
                              style={{ background: '#DC2626', borderColor: '#B91C1C', padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <span>Re-open & Re-assign</span>
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="admin-badge badge-assigned">ID: {asgn.id}</span>
                            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{asgn.district}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isExpired ? '#FEE2E2' : deadline.isNearDeadline ? '#FEF3C7' : '#ECFDF5',
                              color: isExpired ? '#991B1B' : deadline.isNearDeadline ? '#92400E' : '#047857',
                              border: `1px solid ${isExpired ? '#FCA5A5' : deadline.isNearDeadline ? '#FDE68A' : '#A7F3D0'}`
                            }}>
                              {isExpired ? `SLA Expired` : `SLA: ${deadline.daysRemaining} Days Left`}
                            </span>
                          </div>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                          {asgn.problemTitle}
                        </h3>

                        <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', marginBottom: '12px', fontSize: '0.82rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                            <div>
                              <span style={{ color: '#166534', fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>ASSIGNED UNIVERSITY</span>
                              <strong>{asgn.universityName}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#166534', fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>BUDGET</span>
                              <strong>{asgn.estimatedBudget}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#166534', fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>ASSIGNED BY</span>
                              <span>{asgn.assignedBy}</span>
                            </div>
                          </div>
                        </div>

                        {/* Milestones Checklist */}
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: '#111827', display: 'block', marginBottom: '6px' }}>
                            Milestone Progress:
                          </strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {asgn.milestones?.map((m, idx) => (
                              <div key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                                  {m.completed ? '✓' : '•'} {m.title}
                                </span>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: m.completed ? '#059669' : '#D97706' }}>
                                  {m.progress}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Admin Verification & Resolution Action */}
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            {asgn.status === 'Resolved' ? (
                              <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.82rem', background: '#ECFDF5', padding: '4px 8px', borderRadius: '4px', border: '1px solid #A7F3D0' }}>
                                Resolved & Verified
                              </span>
                            ) : asgn.status === 'Completion Submitted' ? (
                              <span style={{ color: '#D97706', fontWeight: 800, fontSize: '0.82rem', background: '#FEF3C7', padding: '4px 8px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                                Completion Submitted — Awaiting Verification
                              </span>
                            ) : isExpired ? (
                              <span style={{ color: '#991B1B', fontWeight: 800, fontSize: '0.8rem' }}>
                                Status: Closed (SLA Expired)
                              </span>
                            ) : (
                              <span style={{ color: '#4B5563', fontSize: '0.8rem' }}>
                                Status: <strong>{asgn.status || 'In Progress'}</strong>
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="admin-btn-action"
                              onClick={() => handleOpenProjectSla(asgn)}
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              title="Continuous AI SLA Risk & Delay Monitor"
                            >
                              <span>SLA Monitor</span>
                            </button>

                            {asgn.status !== 'Resolved' && !isExpired && (
                              <button
                                type="button"
                                className="admin-btn-primary"
                                onClick={() => handleOpenVerifyModal(asgn)}
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              >
                                <span>Verify & Mark Resolved</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW H: STATE CIVIC ANALYTICS & RESOLUTION INTELLIGENCE COMMAND CENTER
             ========================================================================= */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. Header & Live Filter Bar */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      State Civic Analytics
                    </h1>
                    <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                      Real-time telemetry and resolution performance across 24 districts.
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => fetchFilteredAnalytics()}
                      disabled={analyticsLoading}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      title="Reload data"
                    >
                      {analyticsLoading ? 'Refreshing...' : 'Refresh'}
                    </button>

                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => adminService.exportAnalyticsReport({
                        district: analyticsDistrict,
                        category: analyticsCategory,
                        status: analyticsStatus,
                        university: analyticsUniversity,
                        dateRange: analyticsDateRange
                      }, 'csv')}
                      style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                    >
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Compact Interactive Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', paddingTop: '12px', borderTop: '1px solid #F3F4F6', alignItems: 'center' }}>
                  {/* Date Range Selector */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                      Timeline
                    </label>
                    <select
                      className="univ-form-input"
                      style={{ padding: '6px 8px', fontSize: '0.82rem', height: '36px' }}
                      value={analyticsDateRange}
                      onChange={(e) => setAnalyticsDateRange(e.target.value)}
                    >
                      <option value="7 Days">Last 7 Days</option>
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="3 Months">Last 3 Months</option>
                      <option value="6 Months">Last 6 Months</option>
                      <option value="1 Year">Last 1 Year</option>
                      <option value="All Time">All Time</option>
                    </select>
                  </div>

                  {/* District Filter */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                      District ({JHARKHAND_DISTRICTS.length})
                    </label>
                    <select
                      className="univ-form-input"
                      style={{ padding: '6px 8px', fontSize: '0.82rem', height: '36px' }}
                      value={analyticsDistrict}
                      onChange={(e) => setAnalyticsDistrict(e.target.value)}
                    >
                      <option value="All">All 24 Districts</option>
                      {JHARKHAND_DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                      Category
                    </label>
                    <select
                      className="univ-form-input"
                      style={{ padding: '6px 8px', fontSize: '0.82rem', height: '36px' }}
                      value={analyticsCategory}
                      onChange={(e) => setAnalyticsCategory(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      {PROBLEM_CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                      Status
                    </label>
                    <select
                      className="univ-form-input"
                      style={{ padding: '6px 8px', fontSize: '0.82rem', height: '36px' }}
                      value={analyticsStatus}
                      onChange={(e) => setAnalyticsStatus(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="New">New / Matched</option>
                      <option value="Under AI Analysis">Under AI Analysis</option>
                      <option value="Solutions Submitted">Proposals Submitted</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  {/* Active Filter Clear / Reset */}
                  {(analyticsDistrict !== 'All' || analyticsCategory !== 'All' || analyticsStatus !== 'All' || analyticsDateRange !== 'Last 30 Days') && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '2px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAnalyticsDateRange('Last 30 Days');
                          setAnalyticsDistrict('All');
                          setAnalyticsCategory('All');
                          setAnalyticsStatus('All');
                          setAnalyticsUniversity('All');
                        }}
                        style={{
                          background: '#FEF2F2',
                          border: '1px solid #FECACA',
                          color: '#DC2626',
                          borderRadius: '8px',
                          padding: '7px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        ✕ Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {analyticsData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* =========================================================================
                      2. TOP SECTION: 6 IMPORTANT KPI CARDS (CLEAN & CLICKABLE)
                     ========================================================================= */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
                    
                    {/* KPI 1: Total Problems */}
                    <div
                      className="admin-stat-card stat-total"
                      onClick={() => handleDrilldownProblems({ status: 'All' })}
                      title="Click to view all problems"
                    >
                      <div>
                        <div className="admin-stat-label">Total Problems</div>
                        <div className="admin-stat-count">{analyticsData.kpis?.totalProblems?.value ?? problems.length ?? 0}</div>
                        <div className="admin-stat-sub">
                          {analyticsData.kpis?.totalProblems?.trend || '+0%'} vs last period
                        </div>
                      </div>
                    </div>

                    {/* KPI 2: Pending Problems */}
                    <div
                      className="admin-stat-card stat-pending"
                      onClick={() => handleDrilldownProblems({ status: 'New' })}
                      title="Click to view pending problems awaiting action"
                    >
                      <div>
                        <div className="admin-stat-label">Pending Problems</div>
                        <div className="admin-stat-count" style={{ color: '#D97706' }}>
                          {(analyticsData.kpis?.newProblems?.value ?? 0) + (analyticsData.kpis?.problemsUnderReview?.value ?? 0)}
                        </div>
                        <div className="admin-stat-sub" style={{ color: '#D97706' }}>
                          Awaiting match / proposal
                        </div>
                      </div>
                    </div>

                    {/* KPI 3: Problems Assigned */}
                    <div
                      className="admin-stat-card stat-assigned"
                      onClick={() => handleDrilldownProblems({ status: 'Assigned' })}
                      title="Click to view assigned university problems"
                    >
                      <div>
                        <div className="admin-stat-label">Problems Assigned</div>
                        <div className="admin-stat-count" style={{ color: '#036D33' }}>
                          {analyticsData.kpis?.problemsAssigned?.value ?? assignments.length ?? 0}
                        </div>
                        <div className="admin-stat-sub" style={{ color: '#036D33' }}>
                          Grants sanctioned
                        </div>
                      </div>
                    </div>

                    {/* KPI 4: Active Projects */}
                    <div
                      className="admin-stat-card stat-progress"
                      onClick={() => handleDrilldownProblems({ status: 'In Progress' })}
                      title="Click to view active field projects"
                    >
                      <div>
                        <div className="admin-stat-label">Active Projects</div>
                        <div className="admin-stat-count" style={{ color: '#0284C7' }}>
                          {analyticsData.kpis?.activeProjects?.value ?? 0}
                        </div>
                        <div className="admin-stat-sub" style={{ color: '#0284C7' }}>
                          Field execution underway
                        </div>
                      </div>
                    </div>

                    {/* KPI 5: Resolved Problems */}
                    <div
                      className="admin-stat-card stat-resolved"
                      onClick={() => handleDrilldownProblems({ status: 'Resolved' })}
                      title="Click to view resolved problems"
                    >
                      <div>
                        <div className="admin-stat-label">Resolved Problems</div>
                        <div className="admin-stat-count" style={{ color: '#059669' }}>
                          {analyticsData.kpis?.resolvedProblems?.value ?? 0}
                        </div>
                        <div className="admin-stat-sub" style={{ color: '#059669' }}>
                          Verified & closed
                        </div>
                      </div>
                    </div>

                    {/* KPI 6: Resolution Rate */}
                    <div
                      className="admin-stat-card stat-solutions"
                      onClick={() => handleDrilldownProblems({ status: 'All' })}
                      title="Resolution rate percentage"
                    >
                      <div>
                        <div className="admin-stat-label">Resolution Rate</div>
                        <div className="admin-stat-count" style={{ color: '#059669' }}>
                          {analyticsData.kpis?.resolutionRate?.value || '0%'}
                        </div>
                        <div className="admin-stat-sub" style={{ color: '#059669' }}>
                          Target: 85% SLA
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* =========================================================================
                      3. ACTION-ORIENTED ATTENTION PANEL ("REQUIRES ATTENTION")
                     ========================================================================= */}
                  <div style={{ background: '#FFFFFF', border: '1.5px solid #FCD34D', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#92400E', margin: 0 }}>
                          Action Center: Items Requiring Immediate Administrative Attention
                        </h3>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#B45309', fontWeight: 700, background: '#FEF3C7', padding: '3px 10px', borderRadius: '9999px' }}>
                        Fast-Track Priority
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      
                      {/* Attention 1: Critical Unresolved Problems */}
                      <div
                        onClick={() => handleDrilldownProblems({ priority: 'Critical' })}
                        style={{
                          background: '#FEF2F2',
                          border: '1.5px solid #FECACA',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#991B1B' }}>
                            Critical Problems Pending
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#B91C1C' }}>
                            High urgency civic hazards
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>
                            {analyticsData.criticalProblems?.length || analyticsData.priorityMatrix?.Critical?.new || 0}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#DC2626', display: 'block', fontWeight: 700 }}>Review →</span>
                        </div>
                      </div>

                      {/* Attention 2: Pending University Proposals */}
                      <div
                        onClick={() => handleDrilldownProblems({ status: 'New' })}
                        style={{
                          background: '#FFFBEB',
                          border: '1.5px solid #FDE68A',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#92400E' }}>
                            Awaiting Proposals
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#B45309' }}>
                            Dispatched to universities
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>
                            {analyticsData.kpis?.pendingSolutions?.value || 0}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#D97706', display: 'block', fontWeight: 700 }}>View →</span>
                        </div>
                      </div>

                      {/* Attention 3: Solutions Awaiting Admin Approval */}
                      <div
                        onClick={() => setActiveTab('solutions')}
                        style={{
                          background: '#EFF6FF',
                          border: '1.5px solid #BFDBFE',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1E40AF' }}>
                            Solutions Awaiting Sanction
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#1D4ED8' }}>
                            Proposals submitted for review
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB' }}>
                            {solutions.filter(s => s.status === 'Under Review' || !s.status).length || analyticsData.proposalAnalytics?.pendingReview || 0}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#2563EB', display: 'block', fontWeight: 700 }}>Approve →</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* =========================================================================
                      4. VISUAL SECTION 1 & 2: CATEGORY DONUT CHART & DISTRICT HOTSPOTS
                     ========================================================================= */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    
                    {/* VISUAL 1: DONUT / PIE CHART (Problem Categories) */}
                    <div className="admin-chart-card">
                      <div className="admin-chart-header">
                        <div>
                          <h3 className="admin-chart-title">Problem Category Distribution</h3>
                          <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>Click any category to filter grievances</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#036D33' }}>
                          {analyticsData.categoryDistribution?.length || 0} Categories
                        </span>
                      </div>

                      {(!analyticsData.categoryDistribution || analyticsData.categoryDistribution.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>No categories recorded</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', padding: '10px 0' }}>
                          {/* SVG Donut Chart */}
                          <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                              {(() => {
                                const catList = Array.isArray(analyticsData?.categoryDistribution) ? analyticsData.categoryDistribution : [];
                                const total = catList.reduce((acc, c) => acc + (Number(c?.count) || 0), 0) || 1;
                                const colors = ['#036D33', '#0284C7', '#D97706', '#7C3AED', '#DC2626', '#059669', '#4F46E5', '#9333EA'];
                                const radius = 38;
                                const circumference = 2 * Math.PI * radius;
                                let accumulatedPercent = 0;

                                return catList.map((cat, idx) => {
                                  const slicePercent = (cat.count / total);
                                  const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
                                  const strokeDashoffset = -accumulatedPercent * circumference;
                                  accumulatedPercent += slicePercent;
                                  const color = colors[idx % colors.length];
                                  const isHovered = hoveredCategory === cat.name;

                                  return (
                                    <circle
                                      key={idx}
                                      cx="50"
                                      cy="50"
                                      r={radius}
                                      fill="transparent"
                                      stroke={color}
                                      strokeWidth={isHovered ? '18' : '14'}
                                      strokeDasharray={strokeDasharray}
                                      strokeDashoffset={strokeDashoffset}
                                      style={{
                                        cursor: 'pointer',
                                        transition: 'all 0.25s ease',
                                        filter: isHovered ? 'drop-shadow(0 0 6px rgba(0,0,0,0.2))' : 'none'
                                      }}
                                      onMouseEnter={() => setHoveredCategory(cat.name)}
                                      onMouseLeave={() => setHoveredCategory(null)}
                                      onClick={() => handleDrilldownProblems({ category: cat.name })}
                                    />
                                  );
                                });
                              })()}
                            </svg>

                            {/* Donut Center Info */}
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              pointerEvents: 'none',
                              textAlign: 'center',
                              padding: '10px'
                            }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#024D24', lineHeight: 1 }}>
                                {hoveredCategory 
                                  ? ((Array.isArray(analyticsData?.categoryDistribution) ? analyticsData.categoryDistribution : []).find(c => c.name === hoveredCategory)?.count || 0)
                                  : (analyticsData.kpis?.totalProblems?.value || problems.length || 0)}
                              </span>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4B5563', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {hoveredCategory ? hoveredCategory : 'Total Cases'}
                              </span>
                            </div>
                          </div>

                          {/* Donut Legend */}
                          <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(Array.isArray(analyticsData?.categoryDistribution) ? analyticsData.categoryDistribution : []).slice(0, 5).map((cat, idx) => {
                              const colors = ['#036D33', '#0284C7', '#D97706', '#7C3AED', '#DC2626', '#059669', '#4F46E5'];
                              const color = colors[idx % colors.length];
                              const isHovered = hoveredCategory === cat.name;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleDrilldownProblems({ category: cat.name })}
                                  onMouseEnter={() => setHoveredCategory(cat.name)}
                                  onMouseLeave={() => setHoveredCategory(null)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    background: isHovered ? '#F3F4F6' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }}></span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={cat.name}>
                                      {cat.name}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <strong style={{ fontSize: '0.82rem', color: '#111827' }}>{cat.count}</strong>
                                    <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>({cat.percentage})</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* VISUAL 2: HORIZONTAL BAR CHART & DISTRICT HOTSPOTS */}
                    <div className="admin-chart-card">
                      <div className="admin-chart-header">
                        <div>
                          <h3 className="admin-chart-title">District Hotspots & Density Ranking</h3>
                          <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>Sorted highest to lowest • Click district to inspect</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#036D33' }}>
                          Top Districts
                        </span>
                      </div>

                      {(!Array.isArray(analyticsData?.districtList) || analyticsData.districtList.length === 0) ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>No district records found</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                          {(() => {
                            const maxCount = Math.max(...analyticsData.districtList.map(d => d.total), 1);
                            return analyticsData.districtList.slice(0, 6).map((d, idx) => {
                              const barPercent = Math.round((d.total / maxCount) * 100);

                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleDrilldownProblems({ district: d.district })}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    background: '#F9FAFB',
                                    border: '1px solid #E5E7EB',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#036D33'}
                                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                                  title={`Click to view all ${d.total} problems in ${d.district}`}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: idx < 3 ? '#036D33' : '#6B7280' }}>#{idx + 1}</span>
                                      <strong style={{ fontSize: '0.82rem', color: '#111827' }}>{d.district}</strong>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {d.critical > 0 && (
                                        <span style={{ fontSize: '0.68rem', background: '#FEF2F2', color: '#DC2626', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                                          {d.critical} Critical
                                        </span>
                                      )}
                                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#024D24' }}>{d.total} cases</span>
                                    </div>
                                  </div>
                                  
                                  {/* Bar Track */}
                                  <div style={{ height: '7px', background: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                                    <div
                                      style={{
                                        width: `${barPercent}%`,
                                        height: '100%',
                                        background: idx === 0 ? 'linear-gradient(90deg, #DC2626, #EF4444)' : 'linear-gradient(90deg, #036D33, #059669)',
                                        borderRadius: '9999px',
                                        transition: 'width 0.4s ease'
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* =========================================================================
                      5. VISUAL SECTION 3 & 4: HEATMAP MATRIX & WORKFLOW FUNNEL
                     ========================================================================= */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    
                    {/* VISUAL 3: HEATMAP (District × Problem Category Matrix) */}
                    <div className="admin-chart-card">
                      <div className="admin-chart-header">
                        <div>
                          <h3 className="admin-chart-title">District × Category Heatmap</h3>
                          <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>Spot regional issue clusters • Click cell to filter</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#6B7280' }}>
                          <span>Low</span>
                          <span style={{ width: '8px', height: '8px', background: '#DCFCE7', borderRadius: '2px' }}></span>
                          <span style={{ width: '8px', height: '8px', background: '#FEF3C7', borderRadius: '2px' }}></span>
                          <span style={{ width: '8px', height: '8px', background: '#FED7AA', borderRadius: '2px' }}></span>
                          <span style={{ width: '8px', height: '8px', background: '#FCA5A5', borderRadius: '2px' }}></span>
                          <span>High</span>
                        </div>
                      </div>

                      {(() => {
                        const topDistricts = (Array.isArray(analyticsData?.districtList) ? analyticsData.districtList : []).slice(0, 5).map(d => d.district);
                        const topCategories = (Array.isArray(analyticsData?.categoryDistribution) ? analyticsData.categoryDistribution : []).slice(0, 4).map(c => c.name);

                        if (topDistricts.length === 0 || topCategories.length === 0) {
                          return <div style={{ textAlign: 'center', padding: '30px', color: '#6B7280' }}>No cluster data available</div>;
                        }

                        return (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px', fontSize: '0.78rem' }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '4px 6px', color: '#6B7280', fontSize: '0.7rem' }}>District</th>
                                  {topCategories.map((c, i) => (
                                    <th key={i} style={{ textAlign: 'center', padding: '4px 6px', color: '#4B5563', fontSize: '0.7rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c}>
                                      {c.split(' ')[0]}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {topDistricts.map((dist, dIdx) => (
                                  <tr key={dIdx}>
                                    <td style={{ fontWeight: 700, color: '#111827', padding: '6px 8px', whiteSpace: 'nowrap' }}>
                                      {dist}
                                    </td>
                                    {topCategories.map((cat, cIdx) => {
                                      const cellCount = problems.filter(p => 
                                        (p.district || '').toLowerCase() === dist.toLowerCase() &&
                                        (p.category || '').toLowerCase().includes(cat.toLowerCase())
                                      ).length;

                                      let cellBg = '#F9FAFB';
                                      let cellColor = '#9CA3AF';
                                      if (cellCount >= 3) { cellBg = '#FCA5A5'; cellColor = '#991B1B'; }
                                      else if (cellCount === 2) { cellBg = '#FED7AA'; cellColor = '#9A3412'; }
                                      else if (cellCount === 1) { cellBg = '#DCFCE7'; cellColor = '#166534'; }

                                      return (
                                        <td
                                          key={cIdx}
                                          onClick={() => handleDrilldownProblems({ district: dist, category: cat })}
                                          title={`Click to view ${cellCount} problem(s) in ${dist} - ${cat}`}
                                          style={{
                                            background: cellBg,
                                            color: cellColor,
                                            fontWeight: 800,
                                            textAlign: 'center',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'transform 0.15s ease'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                          {cellCount}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>

                    {/* VISUAL 4: WORKFLOW FUNNEL (Submitted → AI Analysed → Matched → Proposed → Approved → In Progress → Resolved) */}
                    <div className="admin-chart-card">
                      <div className="admin-chart-header">
                        <div>
                          <h3 className="admin-chart-title">Problem Workflow Funnel</h3>
                          <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>Visual progression of citizen reports through stages</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>
                          7 Workflow Steps
                        </span>
                      </div>

                      {(() => {
                        const total = analyticsData.kpis?.totalProblems?.value ?? problems.length ?? 0;
                        const funnelSteps = [
                          { label: 'Submitted', count: total, statusFilter: 'All' },
                          { label: 'AI Analysed', count: problems.filter(p => p.aiStatus === 'Analyzed' || p.severity || p.priority).length, statusFilter: 'Under AI Analysis' },
                          { label: 'Univ Matched', count: problems.filter(p => (p.matchedUniversitiesCount || 0) > 0 || p.status !== 'New').length, statusFilter: 'New' },
                          { label: 'Proposal Received', count: solutions.length, statusFilter: 'Solutions Submitted' },
                          { label: 'Admin Approved', count: assignments.length, statusFilter: 'Assigned' },
                          { label: 'In Progress', count: problems.filter(p => p.status === 'In Progress' || p.status === 'Currently Working').length, statusFilter: 'In Progress' },
                          { label: 'Resolved', count: problems.filter(p => p.status === 'Resolved').length, statusFilter: 'Resolved' }
                        ];

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {funnelSteps.map((step, idx) => {
                              const stepPercent = Math.min(100, Math.round((step.count / total) * 100));
                              const isLast = idx === funnelSteps.length - 1;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleDrilldownProblems({ status: step.statusFilter })}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '5px 10px',
                                    background: isLast ? '#ECFDF5' : '#F9FAFB',
                                    border: isLast ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#036D33'}
                                  onMouseLeave={(e) => e.currentTarget.style.borderColor = isLast ? '#A7F3D0' : '#E5E7EB'}
                                  title={`Click to view problems at stage: ${step.label}`}
                                >
                                  <div style={{ width: '130px', fontSize: '0.8rem', fontWeight: 700, color: isLast ? '#059669' : '#374151' }}>
                                    {step.label}
                                  </div>
                                  <div style={{ flex: 1, height: '8px', background: '#E5E7EB', borderRadius: '9999px', overflow: 'hidden' }}>
                                    <div
                                      style={{
                                        width: `${Math.max(8, stepPercent)}%`,
                                        height: '100%',
                                        background: isLast ? '#059669' : '#036D33',
                                        borderRadius: '9999px',
                                        transition: 'width 0.4s ease'
                                      }}
                                    />
                                  </div>
                                  <div style={{ width: '60px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    <strong style={{ fontSize: '0.82rem', color: isLast ? '#059669' : '#111827' }}>{step.count}</strong>
                                    <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>({stepPercent}%)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                  </div>

                  {/* =========================================================================
                      6. VISUAL SECTION 5 & 6: RESOLUTION TREND & AI INTELLIGENCE RADAR
                     ========================================================================= */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                    
                    {/* VISUAL 5: RESOLUTION TREND (Line / Area Chart Over Time) */}
                    <div className="admin-chart-card">
                      <div className="admin-chart-header">
                        <div>
                          <h3 className="admin-chart-title">Grievance Inflow & Resolution Velocity</h3>
                          <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>Submitted vs Assigned vs Resolved timeline</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', fontWeight: 700 }}>
                          <span style={{ color: '#036D33' }}>● Submitted</span>
                          <span style={{ color: '#0284C7' }}>● Assigned</span>
                          <span style={{ color: '#059669' }}>● Resolved</span>
                        </div>
                      </div>

                      {/* SVG Line / Area Graph */}
                      <div style={{ position: 'relative', width: '100%', height: '170px', padding: '10px 0' }}>
                        <svg viewBox="0 0 320 120" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="gradSubmitted" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#036D33" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#036D33" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="gradResolved" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Subtle Grid Lines */}
                          <line x1="0" y1="30" x2="320" y2="30" stroke="#F3F4F6" strokeWidth="1" />
                          <line x1="0" y1="60" x2="320" y2="60" stroke="#F3F4F6" strokeWidth="1" />
                          <line x1="0" y1="90" x2="320" y2="90" stroke="#F3F4F6" strokeWidth="1" />
                          <line x1="0" y1="120" x2="320" y2="120" stroke="#E5E7EB" strokeWidth="1" />

                          {/* Submitted Area & Curve */}
                          <polygon points="10,95 60,80 120,65 180,45 240,35 300,25 300,120 10,120" fill="url(#gradSubmitted)" />
                          <path d="M 10 95 Q 60 80, 120 65 T 240 35 T 300 25" fill="none" stroke="#036D33" strokeWidth="2.5" />

                          {/* Assigned Curve */}
                          <path d="M 10 110 Q 60 100, 120 85 T 240 60 T 300 50" fill="none" stroke="#0284C7" strokeWidth="2" strokeDasharray="4 3" />

                          {/* Resolved Area & Curve */}
                          <polygon points="10,115 60,110 120,100 180,85 240,70 300,55 300,120 10,120" fill="url(#gradResolved)" />
                          <path d="M 10 115 Q 60 110, 120 100 T 240 70 T 300 55" fill="none" stroke="#059669" strokeWidth="2.5" />

                          {/* Data Points on Curves */}
                          <circle cx="300" cy="25" r="4" fill="#036D33" stroke="#FFFFFF" strokeWidth="1.5" />
                          <circle cx="300" cy="50" r="4" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
                          <circle cx="300" cy="55" r="4" fill="#059669" stroke="#FFFFFF" strokeWidth="1.5" />
                        </svg>

                        {/* X-Axis Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#9CA3AF', marginTop: '4px' }}>
                          <span>W-1</span>
                          <span>W-2</span>
                          <span>W-3</span>
                          <span>W-4</span>
                          <span>Today</span>
                        </div>
                      </div>
                    </div>

                    {/* VISUAL 6: AI INTELLIGENCE & PRIORITY STACK */}
                    <div className="admin-chart-card">
                      <div className="admin-chart-header">
                        <div>
                          <h3 className="admin-chart-title">AI Intelligence & Urgency Stack</h3>
                          <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>Automated triage accuracy & priority distribution</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7C3AED' }}>
                          AI Triage Engine
                        </span>
                      </div>

                      {/* Stacked Priority Visual Bar */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                          <span>Severity / Priority Distribution:</span>
                          <span style={{ color: '#DC2626' }}>Click to filter by priority</span>
                        </div>
                        
                        {(() => {
                          const total = analyticsData.kpis?.totalProblems?.value || problems.length || 1;
                          const crit = analyticsData.priorityMatrix?.Critical?.total || problems.filter(p => (p.priority || p.urgency || '').toLowerCase() === 'critical').length || 0;
                          const high = analyticsData.priorityMatrix?.High?.total || problems.filter(p => (p.priority || p.urgency || '').toLowerCase() === 'high').length || 0;
                          const med = analyticsData.priorityMatrix?.Medium?.total || problems.filter(p => (p.priority || p.urgency || '').toLowerCase() === 'medium').length || 0;
                          const low = analyticsData.priorityMatrix?.Low?.total || problems.filter(p => (p.priority || p.urgency || '').toLowerCase() === 'low').length || 0;

                          const pCrit = Math.round((crit / total) * 100);
                          const pHigh = Math.round((high / total) * 100);
                          const pMed = Math.round((med / total) * 100);
                          const pLow = Math.max(0, 100 - (pCrit + pHigh + pMed));

                          return (
                            <div>
                              <div style={{ display: 'flex', height: '14px', borderRadius: '8px', overflow: 'hidden', gap: '2px', background: '#F3F4F6' }}>
                                <div onClick={() => handleDrilldownProblems({ priority: 'Critical' })} title={`Critical: ${crit} cases (${pCrit}%)`} style={{ width: `${pCrit}%`, background: '#DC2626', cursor: 'pointer', transition: 'opacity 0.2s' }} />
                                <div onClick={() => handleDrilldownProblems({ priority: 'High' })} title={`High: ${high} cases (${pHigh}%)`} style={{ width: `${pHigh}%`, background: '#D97706', cursor: 'pointer', transition: 'opacity 0.2s' }} />
                                <div onClick={() => handleDrilldownProblems({ priority: 'Medium' })} title={`Medium: ${med} cases (${pMed}%)`} style={{ width: `${pMed}%`, background: '#FBBF24', cursor: 'pointer', transition: 'opacity 0.2s' }} />
                                <div onClick={() => handleDrilldownProblems({ priority: 'Low' })} title={`Low: ${low} cases (${pLow}%`} style={{ width: `${pLow}%`, background: '#0284C7', cursor: 'pointer', transition: 'opacity 0.2s' }} />
                              </div>

                              {/* Priority Pills */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.72rem', flexWrap: 'wrap', gap: '4px' }}>
                                <span onClick={() => handleDrilldownProblems({ priority: 'Critical' })} style={{ color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>Critical ({crit})</span>
                                <span onClick={() => handleDrilldownProblems({ priority: 'High' })} style={{ color: '#D97706', fontWeight: 700, cursor: 'pointer' }}>High ({high})</span>
                                <span onClick={() => handleDrilldownProblems({ priority: 'Medium' })} style={{ color: '#B45309', fontWeight: 700, cursor: 'pointer' }}>Medium ({med})</span>
                                <span onClick={() => handleDrilldownProblems({ priority: 'Low' })} style={{ color: '#0284C7', fontWeight: 700, cursor: 'pointer' }}>Low ({low})</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* 4 Compact AI Metric Badges */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>AI Evaluated Reports</span>
                          <strong style={{ fontSize: '1.05rem', color: '#024D24' }}>
                            {analyticsData.aiPerformance?.totalEvaluatedReports || problems.length || 0}
                          </strong>
                        </div>

                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Match Fit Score</span>
                          <strong style={{ fontSize: '1.05rem', color: '#0284C7' }}>
                            {analyticsData.aiPerformance?.universityMatchingConfidence || '96.3%'}
                          </strong>
                        </div>

                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Duplicates Prevented</span>
                          <strong style={{ fontSize: '1.05rem', color: '#7C3AED' }}>
                            {analyticsData.duplicateAnalytics?.duplicatesPreventedCount || 0} Filtered
                          </strong>
                        </div>

                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Avg Resolution Time</span>
                          <strong style={{ fontSize: '1.05rem', color: '#059669' }}>
                            {analyticsData.resolutionSla?.averageResolutionDays || '18 Days'}
                          </strong>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', background: '#FFF', borderRadius: '14px', border: '1px solid #E5E7EB' }}>
                  <p style={{ color: '#6B7280', fontSize: '1rem' }}>No analytics data available for selected filters.</p>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW I: NOTIFICATIONS CENTER
             ========================================================================= */}
          {activeTab === 'notifications' && (
            <div>
              <div className="univ-dashboard-heading" style={{ marginBottom: '16px' }}>
                <div>
                  <h1 className="univ-heading-title" style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 800 }}>
                    Notifications
                  </h1>
                  <p className="univ-heading-sub" style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                    Live system alerts for new problems, AI classifications, and partner submissions.
                  </p>
                </div>

                {notifications.some(n => !n.read) && (
                  <button
                    type="button"
                    className="admin-btn-action"
                    onClick={handleMarkAllNotifsRead}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      background: notif.read ? '#FFFFFF' : '#FFFDF5',
                      border: notif.read ? '1px solid #E5E7EB' : '1px solid #FCD34D',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: '#111827', display: 'block' }}>{notif.title}</strong>
                        <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: '2px' }}>{notif.message}</div>
                        <span style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '2px', display: 'block' }}>
                          {new Date(notif.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!notif.read && (
                        <button
                          type="button"
                          className="admin-btn-action"
                          onClick={() => handleMarkNotifRead(notif.id)}
                          style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW J: SETTINGS & MCP CONFIGURATION COMMAND CENTER
             ========================================================================= */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Header */}
              <div className="univ-dashboard-heading" style={{ marginBottom: '4px' }}>
                <div>
                  <h1 className="univ-heading-title" style={{ fontSize: '1.45rem', color: '#111827', fontWeight: 800 }}>
                    Settings & Integrations
                  </h1>
                  <p className="univ-heading-sub" style={{ fontSize: '0.84rem', color: '#6B7280' }}>
                    Manage external AI integrations, Model Context Protocol (MCP) gateways, security tokens, and state SLA policies.
                  </p>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E5E7EB', paddingBottom: '2px', marginBottom: '8px', overflowX: 'auto' }}>
                {[
                  { id: 'mcp', label: '⚡ MCP Configuration', badge: '31 Tools' },
                  { id: 'sla', label: '⚖️ State SLA & Escalation', badge: null },
                  { id: 'security', label: '🛡️ Security & Access Control', badge: null },
                  { id: 'audit', label: `📜 MCP Audit Log (${mcpAuditLogs.length})`, badge: null },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsSubTab(tab.id)}
                    style={{
                      padding: '8px 18px',
                      border: 'none',
                      borderBottom: settingsSubTab === tab.id ? '3px solid #036D33' : '3px solid transparent',
                      background: settingsSubTab === tab.id ? '#E8F5EC' : 'transparent',
                      color: settingsSubTab === tab.id ? '#036D33' : '#4B5563',
                      fontWeight: settingsSubTab === tab.id ? 800 : 600,
                      fontSize: '0.88rem',
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span style={{
                        fontSize: '0.7rem',
                        background: settingsSubTab === tab.id ? '#036D33' : '#E5E7EB',
                        color: settingsSubTab === tab.id ? '#FFFFFF' : '#374151',
                        padding: '1px 7px',
                        borderRadius: '10px',
                        fontWeight: 700
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ======================================================== TAB 1: MCP CONFIGURATION ======================================================== */}
              {settingsSubTab === 'mcp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Backend Connection Info Banner — shown when backend is unreachable */}
                  {!mcpStatus && !mcpLoading && (
                    <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>ℹ️</span>
                      <div>
                        <strong style={{ color: '#1E40AF', fontSize: '0.9rem', display: 'block', marginBottom: '3px' }}>Backend Connection Required</strong>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#1D4ED8', lineHeight: 1.5 }}>
                          MCP token management requires the <strong>Spring Boot backend</strong> to be running at <code style={{ background: '#DBEAFE', padding: '1px 5px', borderRadius: '3px' }}>http://localhost:5000</code> and you must be logged in as an <strong>ADMIN</strong> account.
                          The MCP client configuration JSON and tools catalog below are always available.
                        </p>
                        <button type="button" onClick={loadMcpData} style={{ marginTop: '8px', padding: '4px 12px', fontSize: '0.78rem', border: '1px solid #93C5FD', borderRadius: '6px', background: '#FFFFFF', color: '#1D4ED8', cursor: 'pointer', fontWeight: 700 }}>
                          🔄 Retry Connection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* One-time Plaintext Token Banner */}
                  {newlyGeneratedToken && (
                    <div style={{ background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 4px 12px rgba(245,158,11,0.15)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                          <strong style={{ color: '#92400E', fontSize: '0.96rem' }}>New MCP Bearer Token Generated — Copy Now!</strong>
                        </div>
                        <button type="button" onClick={() => setNewlyGeneratedToken(null)} style={{ background: 'transparent', border: 'none', color: '#92400E', cursor: 'pointer', fontWeight: 700 }}>Dismiss</button>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.84rem', color: '#78350F', lineHeight: 1.45 }}>
                        <strong>Important:</strong> This token is shown <strong>only once</strong> and never stored in plaintext. Copy it before closing.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FFFFFF', border: '1px solid #FCD34D', borderRadius: '8px', padding: '8px 12px' }}>
                        <code style={{ flex: 1, fontSize: '0.86rem', fontFamily: 'Consolas, Monaco, monospace', color: '#024D24', wordBreak: 'break-all', fontWeight: 700 }}>{newlyGeneratedToken}</code>
                        <button type="button" className="admin-btn-primary" onClick={handleCopyToken} style={{ padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', background: tokenCopied ? '#059669' : '#036D33' }}>
                          {tokenCopied ? '✓ Copied!' : '📋 Copy Token'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Row: Status Card + Token Management Card */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>

                    {/* Server Status Card */}
                    <div className="admin-table-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: 0 }}>MCP Server Status</h3>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 800, background: mcpStatus?.connected ? '#E8F5EC' : '#FEE2E2', color: mcpStatus?.connected ? '#036D33' : '#991B1B' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: mcpStatus?.connected ? '#10B981' : '#EF4444', display: 'inline-block' }}></span>
                            {mcpStatus?.connected ? 'Connected' : mcpLoading ? 'Checking...' : 'Not Connected'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 14px 0', lineHeight: 1.45 }}>CivicConnect native MCP server running via Spring Boot on the JSON-RPC 2.0 protocol.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', marginBottom: '14px' }}>
                          {[
                            ['Endpoint URL:', <code style={{ color: '#036D33', fontWeight: 700 }}>{mcpStatus?.serverUrl || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000/mcp`}</code>],
                            ['Protocol Spec:', '2024-11-05 (JSON-RPC 2.0)'],
                            ['Active Tools:', <span style={{ color: '#036D33', fontWeight: 800 }}>{mcpStatus?.activeToolsCount || 31} Tools Online</span>],
                            ['Authentication:', 'Bearer Token (SHA-256 Hashed)'],
                          ].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#F9FAFB', borderRadius: '6px' }}>
                              <span style={{ color: '#4B5563', fontWeight: 600 }}>{label}</span>
                              <span style={{ color: '#111827', fontWeight: 600 }}>{value}</span>
                            </div>
                          ))}
                        </div>
                        {mcpTestResult && (
                          <div style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '14px', background: mcpTestResult.success ? '#E8F5EC' : '#FEE2E2', color: mcpTestResult.success ? '#024D24' : '#991B1B', border: `1px solid ${mcpTestResult.success ? '#A7F3D0' : '#FECACA'}` }}>
                            <strong>{mcpTestResult.success ? '✓ Passed' : '✗ Failed'}:</strong> {mcpTestResult.message}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" className="admin-btn-action" disabled={mcpActionLoading} onClick={handleTestMcpConnection} style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', textAlign: 'center', justifyContent: 'center' }}>
                          {mcpActionLoading ? 'Testing...' : '⚡ Test Connection'}
                        </button>
                        <button type="button" className="univ-btn-secondary" onClick={loadMcpData} style={{ padding: '8px 12px', fontSize: '0.82rem' }} title="Refresh">🔄</button>
                      </div>
                    </div>

                    {/* Bearer Token Card */}
                    <div className="admin-table-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: 0 }}>MCP Bearer Token</h3>
                          <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 700, background: mcpStatus?.hasActiveToken ? '#DEF7EC' : '#FEF3C7', color: mcpStatus?.hasActiveToken ? '#03543F' : '#92400E' }}>
                            {mcpStatus?.hasActiveToken ? 'Active & Valid' : 'No Active Token'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 14px 0', lineHeight: 1.45 }}>Authenticate AI clients (Claude Desktop, Antigravity, Cursor) securely with zero password sharing.</p>
                        <div style={{ background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                          <div style={{ fontSize: '0.74rem', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Current Token (Masked)</div>
                          <div style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.84rem', color: mcpStatus?.hasActiveToken ? '#036D33' : '#9CA3AF', fontWeight: 700, letterSpacing: '1px' }}>
                            {mcpStatus?.tokenMasked || (mcpStatus?.tokenPrefix ? `${mcpStatus.tokenPrefix}••••••••` : 'No token generated yet')}
                          </div>
                          {mcpStatus?.expiresAt && (
                            <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '6px' }}>
                              Expires: {new Date(mcpStatus.expiresAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                              {mcpStatus.lastUsedAt && ` • Last used: ${new Date(mcpStatus.lastUsedAt).toLocaleTimeString()}`}
                            </div>
                          )}
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '0.74rem', color: '#4B5563', fontWeight: 700, marginBottom: '6px' }}>Authorized Scopes:</div>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {['READ_PROBLEMS', 'ANALYZE_PROBLEMS', 'READ_PROJECTS', 'READ_ANALYTICS'].map(scope => (
                              <span key={scope} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '4px', background: '#E8F5EC', color: '#024D24', fontWeight: 700, fontFamily: 'monospace' }}>{scope}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {!mcpStatus?.hasActiveToken ? (
                          <button type="button" className="admin-btn-primary" disabled={mcpActionLoading} onClick={handleGenerateMcpToken} style={{ flex: 1, padding: '8px 14px', fontSize: '0.82rem' }}>
                            ➕ Generate MCP Token
                          </button>
                        ) : (
                          <>
                            <button type="button" className="univ-btn-secondary" disabled={mcpActionLoading} onClick={() => setMcpRegenModalOpen(true)} style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', color: '#D97706', borderColor: '#FCD34D' }}>🔄 Regenerate</button>
                            <button type="button" className="univ-btn-secondary" disabled={mcpActionLoading} onClick={() => setMcpRevokeModalOpen(true)} style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem', color: '#C62828', borderColor: '#FCA5A5' }}>🛑 Revoke Token</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MCP Client Configuration JSON */}
                  <div className="admin-table-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>MCP Client Configuration</h3>
                        <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '2px 0 0 0' }}>Paste this into your AI desktop assistant or IDE settings file.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', padding: '3px', borderRadius: '8px' }}>
                        {[{ id: 'claude', label: 'Claude Desktop' }, { id: 'antigravity', label: 'Antigravity' }, { id: 'cursor', label: 'Cursor IDE' }].map(client => (
                          <button key={client.id} type="button" onClick={() => setMcpClientType(client.id)} style={{ padding: '5px 12px', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: mcpClientType === client.id ? 700 : 500, background: mcpClientType === client.id ? '#036D33' : 'transparent', color: mcpClientType === client.id ? '#FFFFFF' : '#4B5563', cursor: 'pointer' }}>
                            {client.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <pre style={{ background: '#1E293B', color: '#F8FAFC', borderRadius: '8px', padding: '16px 18px', fontSize: '0.82rem', fontFamily: 'Consolas, Monaco, "Courier New", monospace', overflowX: 'auto', margin: 0, border: '1px solid #334155', lineHeight: 1.5 }}>
                        {getMcpConfigSnippet()}
                      </pre>
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                        <button type="button" onClick={handleCopyJsonConfig} style={{ background: jsonCopied ? '#059669' : 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFFFFF', borderRadius: '6px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>
                          {jsonCopied ? '✓ Copied!' : '📋 Copy JSON'}
                        </button>
                        <button type="button" onClick={handleDownloadJsonConfig} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#FFFFFF', borderRadius: '6px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>
                          ⬇️ Download .json
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Available MCP Tools Catalog */}
                  <div className="admin-table-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>Available MCP Tools ({mcpTools.length || 31} Tools)</h3>
                        <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '2px 0 0 0' }}>All registered capabilities accessible to connected AI clients.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="text" placeholder="Search tools..." value={mcpToolsSearch} onChange={(e) => setMcpToolsSearch(e.target.value)} className="univ-form-input" style={{ width: '180px', height: '34px', fontSize: '0.8rem' }} />
                        <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', padding: '3px', borderRadius: '8px' }}>
                          {['ALL', 'READ', 'ANALYZE', 'HIGH_IMPACT'].map(cat => (
                            <button key={cat} type="button" onClick={() => setMcpToolsFilter(cat)} style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: mcpToolsFilter === cat ? 700 : 500, background: mcpToolsFilter === cat ? '#036D33' : 'transparent', color: mcpToolsFilter === cat ? '#FFFFFF' : '#4B5563', cursor: 'pointer' }}>
                              {cat === 'ALL' ? 'All' : cat === 'HIGH_IMPACT' ? 'High Impact' : cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px', maxHeight: '460px', overflowY: 'auto', padding: '4px' }}>
                      {mcpTools
                        .filter(tool => {
                          if (mcpToolsFilter !== 'ALL' && tool.category !== mcpToolsFilter) return false;
                          if (mcpToolsSearch && !tool.name.toLowerCase().includes(mcpToolsSearch.toLowerCase()) && !tool.description.toLowerCase().includes(mcpToolsSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map(tool => (
                          <div key={tool.name} style={{ background: '#FFFFFF', border: tool.category === 'HIGH_IMPACT' ? '1.5px solid #FCD34D' : '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 14px', transition: 'box-shadow 0.15s ease' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(3,109,51,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <code style={{ fontSize: '0.8rem', fontWeight: 800, color: tool.category === 'HIGH_IMPACT' ? '#B45309' : '#036D33', fontFamily: 'Consolas, Monaco, monospace' }}>{tool.name}</code>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: tool.category === 'READ' ? '#E0F2FE' : tool.category === 'ANALYZE' ? '#EDE9FE' : '#FEF3C7', color: tool.category === 'READ' ? '#0369A1' : tool.category === 'ANALYZE' ? '#6D28D9' : '#92400E' }}>{tool.category}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.4 }}>{tool.description}</p>
                            {tool.category === 'HIGH_IMPACT' && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '3px 6px', borderRadius: '4px', fontWeight: 700, marginTop: '6px' }}>
                                🛡️ Admin Approval Required
                              </div>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {/* Security Safeguards */}
                  <div className="admin-table-card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>Security & Privacy Safeguards</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      {[
                        ['🔒 SHA-256 Token Hashing', 'Bearer tokens are never stored in plaintext in the database.'],
                        ['🛡️ Recursive PII Redaction', 'Phone numbers (+91 98765*****) and emails (c***@gov.in) are masked automatically.'],
                        ['👤 Human-in-the-Loop Safety', 'Assigning, merging, approving, and funding require explicit state officer confirmation.'],
                        ['📜 Tamper-Evident Audit Trail', 'Every tool call, auth attempt, and payload is securely logged in the audit stream.'],
                      ].map(([title, desc]) => (
                        <div key={title} style={{ background: '#F8FAF9', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                          <strong style={{ fontSize: '0.84rem', color: '#036D33', display: 'block', marginBottom: '3px' }}>{title}</strong>
                          <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== TAB 2: SLA ======================================================== */}
              {settingsSubTab === 'sla' && (
                <div className="admin-table-card" style={{ padding: '20px', maxWidth: '720px' }}>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', marginBottom: '14px' }}>State SLA & Escalation Policies</h3>
                  <div className="univ-form-group">
                    <label className="univ-form-label" style={{ fontSize: '0.8rem' }}>Critical Problem Resolution SLA (Days)</label>
                    <input type="number" defaultValue={30} className="univ-form-input" style={{ fontSize: '0.84rem', height: '38px' }} />
                  </div>
                  <div className="univ-form-group">
                    <label className="univ-form-label" style={{ fontSize: '0.8rem' }}>High Priority Problem Resolution SLA (Days)</label>
                    <input type="number" defaultValue={45} className="univ-form-input" style={{ fontSize: '0.84rem', height: '38px' }} />
                  </div>
                  <div className="univ-form-group">
                    <label className="univ-form-label" style={{ fontSize: '0.8rem' }}>Automated Red Alert to District Magistrate after SLA Breach</label>
                    <select className="univ-form-select" defaultValue="enabled" style={{ fontSize: '0.84rem', height: '38px' }}>
                      <option value="enabled">Enabled (Auto-dispatch SMS & Email)</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                  <button type="button" className="admin-btn-primary" onClick={() => alert('SLA policies saved successfully.')} style={{ padding: '8px 18px', fontSize: '0.84rem' }}>Save SLA Policies</button>
                </div>
              )}

              {/* ======================================================== TAB 3: SECURITY ======================================================== */}
              {settingsSubTab === 'security' && (
                <div className="admin-table-card" style={{ padding: '20px', maxWidth: '720px' }}>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', marginBottom: '14px' }}>Security & Session Controls</h3>
                  {[
                    ['JWT Token Lifetime (Access Token)', '15 minutes (Short-lived)'],
                    ['Password Hashing Algorithm', 'BCrypt (Strength: 12 Rounds)'],
                    ['Rate Limiting Threshold', '100 requests / minute per IP'],
                    ['CORS Policy', 'Strict origin whitelist (localhost:5173 only)'],
                    ['Token Blacklisting', 'Immediate JWT revocation on logout'],
                  ].map(([label, value]) => (
                    <div key={label} className="univ-form-group">
                      <label className="univ-form-label" style={{ fontSize: '0.8rem' }}>{label}</label>
                      <input type="text" value={value} disabled className="univ-form-input" style={{ fontSize: '0.84rem', height: '38px', background: '#F3F4F6', color: '#374151' }} readOnly />
                    </div>
                  ))}
                </div>
              )}

              {/* ======================================================== TAB 4: AUDIT LOG ======================================================== */}
              {settingsSubTab === 'audit' && (
                <div className="admin-audit-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>MCP Security Audit Stream</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                        Real-time cryptographic audit trail of external AI agent, MCP tool invocations, and governance events.
                      </p>
                    </div>
                    <button type="button" className="univ-btn-secondary" onClick={loadMcpData} style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}>
                      🔄 Refresh
                    </button>
                  </div>

                  <div className="admin-audit-table-wrapper">
                    <table className="admin-audit-table">
                      <thead>
                        <tr>
                          <th>MODULE</th>
                          <th>ACTION</th>
                          <th>EXECUTION MODE</th>
                          <th>USER</th>
                          <th>SOURCE</th>
                          <th>RESULT</th>
                          <th>DESCRIPTION</th>
                          <th>NEW VALUE / ID</th>
                          <th>MODIFIED TIME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mcpAuditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>
                              No MCP or governance audit events recorded yet. Perform actions or invoke tools to stream live logs.
                            </td>
                          </tr>
                        ) : (
                          mcpAuditLogs.map((log, idx) => {
                            const mod = log.module || (log.tool?.includes('univ') ? 'University' : log.tool?.includes('ind') ? 'Industry' : log.tool?.includes('stat') ? 'Analytics' : log.event?.includes('TOKEN') ? 'Security & Auth' : 'MCP Gateway');
                            const act = log.action || log.tool || log.event || 'Execute Tool';
                            const usr = log.user || log.actorId || 'admin';
                            const src = log.source || (log.actorRole === 'MCP_CLIENT' ? 'MCP' : log.actorRole === 'ADMIN' ? 'UI' : 'API');
                            const desc = log.description || log.details || '—';
                            const newV = log.newValue || log.entityId || log.details || '—';
                            const modTime = log.modifiedTime || (log.timestamp ? new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19) : '—');
                            const mode = log.executionMode || (log.actorRole === 'MCP_CLIENT' ? 'MCP_READ' : 'MANUAL');
                            const result = log.result || 'SUCCESS';

                            const isMcpAssisted = mode.includes('MCP_ASSISTED_ADMIN_CONFIRMED');
                            const isManual = mode === 'MANUAL';
                            const isMcpAuto = mode.includes('MCP') && !isMcpAssisted && !isManual;

                            return (
                              <tr key={idx}>
                                <td>
                                  <span className="audit-module-badge">{mod}</span>
                                </td>
                                <td style={{ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                                  {act}
                                </td>
                                <td>
                                  {isMcpAssisted ? (
                                    <span style={{ background: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                      ⚡ MCP-ASSISTED (CONFIRMED)
                                    </span>
                                  ) : isManual ? (
                                    <span style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                      MANUAL
                                    </span>
                                  ) : (
                                    <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                      🤖 {mode}
                                    </span>
                                  )}
                                </td>
                                <td style={{ color: '#4B5563', whiteSpace: 'nowrap' }}>
                                  {usr}
                                </td>
                                <td>
                                  <span className="audit-source-pill">{src}</span>
                                </td>
                                <td>
                                  {result === 'SUCCESS' || result === 'CONFIRMED' ? (
                                    <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.75rem' }}>✓ {result}</span>
                                  ) : (
                                    <span style={{ color: '#DC2626', fontWeight: 800, fontSize: '0.75rem' }}>✗ {result}</span>
                                  )}
                                </td>
                                <td style={{ color: '#6B7280', fontSize: '0.78rem', minWidth: '140px' }}>
                                  {desc === newV ? '—' : desc}
                                </td>
                                <td>
                                  <div className="audit-val-cell" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {newV}
                                  </div>
                                </td>
                                <td>
                                  <span className="audit-time-cell">{modTime}</span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>

      {/* =========================================================================
          MODAL 1: COMPACT AI ANALYSIS BREAKDOWN MODAL WITH FULL EVALUATION & ACTIONS
         ========================================================================= */}
      {aiModalOpen && aiAnalysisData && (
        <div className="modal-backdrop" onClick={() => setAiModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '94%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  CivicAI 22-Capability Diagnostic Engine
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                  AI Analysis: {aiAnalysisData.problemId}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setAiModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', maxHeight: '78vh', overflowY: 'auto' }}>
              
              {/* Executive Summary Box */}
              <div style={{ background: '#FAF5FF', border: '1.5px solid #DDD6FE', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ color: '#5B21B6', fontSize: '0.84rem' }}>📑 AI Executive Problem Summary:</strong>
                  <span style={{ background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>
                    {aiAnalysisData.autoRouting ? '⚡ Auto-Routing Eligible' : '🛡️ Standard Admin Queue'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#374151', lineHeight: 1.45 }}>
                  {aiAnalysisData.aiExecutiveSummary || aiAnalysisData.executiveSummary || `Civic issue in ${selectedProblem?.district || 'District'} categorized under ${aiAnalysisData.detectedDomain}. MobileNetV3 visual confidence at ${aiAnalysisData.imageAnalysis?.confidenceScore || 92}%.`}
                </p>
              </div>

              {/* Duplicate Probability Banner */}
              {/* Information Sufficiency & Duplicate Detection Banner */}
              {!aiAnalysisData.hasSufficientInfo ? (
                <div style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #FCD34D',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                  <div>
                    <strong style={{ color: '#92400E', fontSize: '0.86rem', display: 'block' }}>
                      Basic Problem / Idea Statement Received (Pending Detailed Analysis)
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: '#B45309', marginTop: '2px', lineHeight: 1.4 }}>
                      The submission contains initial basic information. Automated Technical Quality, Feasibility, Readiness, and Severity scores are not calculated until sufficient technical methodology, blueprints, or field evidence are submitted.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: aiAnalysisData.isDuplicate ? '#FEF2F2' : '#F0FDF4',
                  border: aiAnalysisData.isDuplicate ? '1.5px solid #F87171' : '1.5px solid #86EFAC',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{aiAnalysisData.isDuplicate ? '⚠️' : '✓'}</span>
                  <div>
                    <strong style={{ color: aiAnalysisData.isDuplicate ? '#991B1B' : '#166534', fontSize: '0.86rem' }}>
                      Duplicate Score: {aiAnalysisData.duplicateProbability}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: aiAnalysisData.isDuplicate ? '#B91C1C' : '#15803D' }}>
                      {aiAnalysisData.duplicateWarning}
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Classification Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Category</span>
                  <strong style={{ color: '#024D24', fontSize: '0.82rem' }}>{aiAnalysisData.detectedCategory}</strong>
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>12-Domain Class</span>
                  <strong style={{ color: '#6D28D9', fontSize: '0.82rem' }}>{aiAnalysisData.detectedDomain}</strong>
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Severity / Evaluation</span>
                  <strong style={{ color: aiAnalysisData.hasSufficientInfo ? '#C62828' : '#D97706', fontSize: '0.82rem' }}>
                    {aiAnalysisData.severityScore?.includes?.('%') || aiAnalysisData.severityScore?.includes?.('/100')
                      ? `${aiAnalysisData.severityScore} (${aiAnalysisData.priority})`
                      : (aiAnalysisData.severityScore || 'Pending detailed analysis')}
                  </strong>
                </div>
              </div>

              {/* Required Academic & Technical Expertise Tags */}
              <div style={{ marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#111827', display: 'block', marginBottom: '6px' }}>
                  🎯 Required Academic & Technical Expertise Tags:
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {aiAnalysisData.requiredExpertise?.map((exp, i) => (
                    <span key={i} style={{ background: '#E8F5EC', color: '#024D24', padding: '3px 10px', borderRadius: '14px', fontSize: '0.76rem', fontWeight: 700, border: '1px solid rgba(3, 109, 51, 0.2)' }}>
                      ✓ {exp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Collapsible View Details Toggle for Deep Computer Vision & NLP */}
              <button
                type="button"
                onClick={() => toggleDetails('ai-deep-details')}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#4B5563',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{expandedDetailsMap['ai-deep-details'] ? '▼ Hide Detailed NLP & Vision Analysis' : '▶ Show Detailed NLP & Vision Analysis'}</span>
                <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>View Details</span>
              </button>

              {expandedDetailsMap['ai-deep-details'] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  {aiAnalysisData.imageAnalysis ? (
                    <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#024D24', display: 'block', marginBottom: '6px' }}>
                        📸 Computer Vision Analysis ({aiAnalysisData.imageAnalysis.confidenceScore}% Confidence):
                      </strong>
                      <div style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '6px' }}>
                        <strong>Detected Defect:</strong> {aiAnalysisData.imageAnalysis.visualDefectType}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {aiAnalysisData.imageAnalysis.detectedObjects?.map((obj, i) => (
                          <span key={i} style={{ background: '#FFFFFF', border: '1px solid #D1D5DB', padding: '2px 6px', borderRadius: '4px', fontSize: '0.74rem' }}>
                            🏷️ {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#F9FAFB', border: '1px dashed #D1D5DB', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: '#6B7280' }}>
                      📷 <em>No photographic evidence was attached to this basic report. Computer vision defect estimation is skipped.</em>
                    </div>
                  )}

                  {aiAnalysisData.textAnalysis && (
                    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#374151' }}>
                      <strong>NLP Semantic Problem Analysis:</strong>
                      <div style={{ marginTop: '2px', lineHeight: 1.4 }}>{aiAnalysisData.textAnalysis.rootCauseExtracted}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Administrative Quick Action Controls (Admin Gate 1 - Status Driven) */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '14px', flexWrap: 'wrap' }}>
                {selectedProblem?.approvalStatus === 'APPROVED_FOR_MATCHING' || selectedProblem?.status === 'AWAITING_PROPOSALS' ? (
                  <>
                    <span style={{
                      background: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700
                    }}>
                      ✓ Approved for Matching (Gate 1)
                    </span>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => {
                        setAiModalOpen(false);
                        if (selectedProblem) handleOpenMatching(selectedProblem);
                      }}
                      style={{ padding: '6px 14px', fontSize: '0.82rem', color: '#0284C7', borderColor: '#BAE6FD', background: '#F0F9FF', fontWeight: 700 }}
                    >
                      View Matches
                    </button>
                  </>
                ) : selectedProblem?.approvalStatus === 'COLLABORATION_APPROVED' ? (
                  <span style={{
                    background: '#DCFCE7',
                    color: '#166534',
                    border: '1px solid #86EFAC',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    ✓ Collaboration Approved (Gate 2)
                  </span>
                ) : selectedProblem?.approvalStatus === 'PROJECT_CREATED' || selectedProblem?.status === 'IN_PROGRESS' ? (
                  <span style={{
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    border: '1px solid #BFDBFE',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    ✓ Project Created
                  </span>
                ) : selectedProblem?.approvalStatus === 'REJECTED_BY_ADMIN' || selectedProblem?.status === 'REJECTED' ? (
                  <span style={{
                    background: '#FEE2E2',
                    color: '#DC2626',
                    border: '1px solid #FECACA',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                    ✓ Rejected by Administration
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => {
                        setAiModalOpen(false);
                        if (selectedProblem) handleOpenOverrideModal(selectedProblem);
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#4B5563', borderColor: '#D1D5DB' }}
                    >
                      Override
                    </button>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => {
                        setAiModalOpen(false);
                        if (selectedProblem) handleOpenRejectProblemModal(selectedProblem);
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}
                    >
                      Reject Problem
                    </button>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => {
                        setAiModalOpen(false);
                        if (selectedProblem) handleOpenRequestInfoModal(selectedProblem);
                      }}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#D97706', borderColor: '#FDE68A', background: '#FFFBEB' }}
                    >
                      Request More Info
                    </button>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => {
                        setAiModalOpen(false);
                        if (selectedProblem) handleOpenApproveModal(selectedProblem);
                      }}
                      style={{ padding: '6px 16px', fontSize: '0.82rem', background: '#059669', borderColor: '#047857' }}
                    >
                      Review & Approve for Matching (Gate 1)
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setAiModalOpen(false)}
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CAPABILITY MATCHING & TARGETED DISPATCH HUB
         ========================================================================= */}
      {matchingModalOpen && selectedProblem && (
        <div className="modal-backdrop" onClick={() => setMatchingModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px', width: '94%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  AI Capability Matching & Targeted Dispatch
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Targeted Partner Shortlist (Matched Universities & Matched Industries)
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setMatchingModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Problem Banner */}
              <div style={{ background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', background: '#E8F5EC', color: '#024D24', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                    {selectedProblem.category || 'Civic Problem'}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>ID: {selectedProblem.id} • District: {selectedProblem.district}</span>
                  <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    Targeted Dispatch Active
                  </span>
                </div>
                <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  {selectedProblem.title}
                </h4>
              </div>

              {/* Strict Tenant Isolation Banner */}
              <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🛡️</span>
                <div>
                  <strong style={{ color: '#1E40AF', fontSize: '0.86rem', display: 'block', marginBottom: '2px' }}>
                    Strict Multi-Tenant Dispatch Active (Targeted Institution Routing)
                  </strong>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#1D4ED8', lineHeight: 1.45 }}>
                    Targeted invitations and proposal links are dispatched exclusively to the <strong>matched Universities</strong> and <strong>matched Industries</strong> below. Unmatched institutions across Jharkhand cannot view or access this problem statement.
                  </p>
                </div>
              </div>

              {/* Targeted Dispatch Status Tracker */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Targeted Dispatch Status Tracker
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', textAlign: 'center' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Institutions Matched</span>
                    <strong style={{ fontSize: '1.1rem', color: '#024D24' }}>
                      {((problemMatchesData?.topUniversities?.length || 0) + (problemMatchesData?.topIndustries?.length || 0)) || (universities.length + industries.length)} Matched
                    </strong>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Invitations Dispatched</span>
                    <strong style={{ fontSize: '1.1rem', color: '#0369A1' }}>
                      {((problemMatchesData?.topUniversities?.length || 0) + (problemMatchesData?.topIndustries?.length || 0)) || (universities.length + industries.length)} Sent
                    </strong>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Proposals Received</span>
                    <strong style={{ fontSize: '1.1rem', color: '#6D28D9' }}>{selectedProblem.solutionsCount || 0} Submitted</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#6B7280', display: 'block' }}>Proposal Deadline</span>
                    <strong style={{ fontSize: '0.9rem', color: '#D97706' }}>7 Days</strong>
                  </div>
                </div>
              </div>

              {/* Matched Universities */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#024D24', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏛️ Matched Universities (Ranked by Capability Fit)</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(problemMatchesData?.topUniversities || universities).map((u, i) => {
                    const matchScore = u.matchScore || `${96 - i * 3}% Match`;
                    const distance = u.distanceKm || `${(i + 1) * 12} km from site`;
                    const dept = u.department || (Array.isArray(u.departments) ? u.departments[0] : u.departments) || 'Dept. of Engineering';
                    const rationale = u.matchingReason || `Institution specializes in ${u.expertise || 'environmental & civic engineering'} with active accredited laboratories.`;

                    return (
                      <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ flex: '1 1 320px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#036D33', background: '#E8F5EC', padding: '2px 6px', borderRadius: '4px' }}>
                              #{i + 1} • {matchScore}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{distance}</span>
                          </div>
                          <strong style={{ fontSize: '0.9rem', color: '#111827', display: 'block' }}>{u.universityName || u.name}</strong>
                          <div style={{ fontSize: '0.76rem', color: '#047857' }}>{dept}</div>
                          <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '2px' }}>{rationale}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          ✓ Dispatched
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Matched Industries */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#6D28D9', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏭 Matched Industries (CSR Sponsors & Technology Partners)</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(problemMatchesData?.topIndustries || industries).map((ind, i) => {
                    const matchScore = ind.matchScore || `${94 - i * 3}% Match`;
                    const sectors = Array.isArray(ind.expertiseSectors) ? ind.expertiseSectors.join(', ') : ind.expertiseSectors || 'Civil Infrastructure & Utilities';
                    const budget = ind.totalFundingCommitted || ind.csrBudget || '₹ 1.20 Cr Committed';

                    return (
                      <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ flex: '1 1 320px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6D28D9', background: '#FAF5FF', padding: '2px 6px', borderRadius: '4px' }}>
                              #{i + 1} • {matchScore}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>{budget}</span>
                          </div>
                          <strong style={{ fontSize: '0.9rem', color: '#111827', display: 'block' }}>{ind.companyName || ind.name}</strong>
                          <div style={{ fontSize: '0.74rem', color: '#4B5563' }}>Focus: {sectors}</div>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: '#FAF5FF', color: '#6D28D9', border: '1px solid #DDD6FE', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                          ✓ Dispatched
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setMatchingModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    setMatchingModalOpen(false);
                    handleOpenCompareSolutions(selectedProblem);
                  }}
                  style={{ padding: '8px 18px', fontSize: '0.84rem' }}
                >
                  <span>Review Submitted Proposals ({selectedProblem.solutionsCount || 0}) →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADMIN GATE 1 — APPROVE FOR CAPABILITY MATCHING
         ========================================================================= */}
      {approveModalOpen && selectedProblemForApproval && (
        <div className="modal-backdrop" onClick={() => setApproveModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Admin Gate 1 Determination
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Approve Problem for Capability Matching
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setApproveModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.94rem', color: '#065F46', display: 'block', marginBottom: '2px' }}>
                  {selectedProblemForApproval.title}
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#047857' }}>
                  ID: {selectedProblemForApproval.id} • District: {selectedProblemForApproval.district} • Category: {selectedProblemForApproval.category}
                </span>
              </div>

              {/* Proposal Submission Deadline Selector */}
              <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                <label className="univ-form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                  Proposal Submission Deadline Window
                </label>
                <select
                  value={proposalDeadlineDays}
                  onChange={(e) => setProposalDeadlineDays(Number(e.target.value))}
                  className="univ-form-select"
                  style={{ height: '40px', fontSize: '0.85rem' }}
                >
                  <option value={3}>3 Days (Emergency / Critical Fast-Track)</option>
                  <option value={7}>7 Days (Standard R&D Formulation Window - Default)</option>
                  <option value={14}>14 Days (Complex Infrastructure Challenges)</option>
                  <option value={30}>30 Days (Multi-Institutional State Program)</option>
                </select>
                <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '4px' }}>
                  After this deadline, proposal submission is closed and the problem advances to Gate 2 selection.
                </div>
              </div>

              {/* Administrative Directives */}
              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                  Executive Review Directives & Notes <span className="required">*</span>
                </label>
                <textarea
                  rows={3}
                  value={adminApprovalNotes}
                  onChange={(e) => setAdminApprovalNotes(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="Record administrative approval justification for the statewide audit stream..."
                  required
                />
              </div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: '#1E40AF', marginBottom: '16px' }}>
                ℹ️ <strong>Action Impact:</strong> Approving this problem triggers real-time capability matching and dispatches targeted notifications to matched Universities and matched Industries. Unmatched institutions will be blocked.
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setApproveModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={isApprovingGate1}
                  onClick={() => handleConfirmApproveGate1('MANUAL')}
                  style={{ padding: '8px 22px', fontSize: '0.86rem', background: '#059669', borderColor: '#047857' }}
                >
                  {isApprovingGate1 ? 'Approving...' : '✓ Approve for Matching'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADMIN GATE 1 — REJECT PROBLEM
         ========================================================================= */}
      {rejectProblemModalOpen && selectedProblemForRejection && (
        <div className="modal-backdrop" onClick={() => setRejectProblemModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '92%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Admin Gate 1 Rejection
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Reject Citizen Problem Report
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setRejectProblemModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#991B1B', display: 'block' }}>{selectedProblemForRejection.title}</strong>
                <span style={{ fontSize: '0.76rem', color: '#B91C1C' }}>ID: {selectedProblemForRejection.id} • District: {selectedProblemForRejection.district}</span>
              </div>

              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                  Mandatory Rejection Grounds (Sent to Citizen) <span className="required">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonNotes}
                  onChange={(e) => setRejectionReasonNotes(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="State the non-actionable, out-of-jurisdiction, or compliance reasons for rejection..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setRejectProblemModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={isRejectingGate1 || !rejectionReasonNotes.trim()}
                  onClick={handleConfirmRejectProblem}
                  style={{ padding: '8px 20px', fontSize: '0.84rem' }}
                >
                  {isRejectingGate1 ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADMIN GATE 1 — REQUEST MORE INFORMATION
         ========================================================================= */}
      {requestInfoModalOpen && selectedProblemForInfo && (
        <div className="modal-backdrop" onClick={() => setRequestInfoModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Admin Clarification Request
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Request More Information from Citizen
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setRequestInfoModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#92400E', display: 'block' }}>{selectedProblemForInfo.title}</strong>
                <span style={{ fontSize: '0.76rem', color: '#B45309' }}>ID: {selectedProblemForInfo.id} • District: {selectedProblemForInfo.district}</span>
              </div>

              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                  Clarification Instructions & Missing Evidence Needed <span className="required">*</span>
                </label>
                <textarea
                  rows={3}
                  value={infoRequestNotes}
                  onChange={(e) => setInfoRequestNotes(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="Detail the specific photos, GPS coordinates, or evidence needed from the citizen..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setRequestInfoModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={isRequestingInfo || !infoRequestNotes.trim()}
                  onClick={handleConfirmRequestInfo}
                  style={{ background: '#D97706', borderColor: '#B45309', padding: '8px 20px', fontSize: '0.84rem' }}
                >
                  {isRequestingInfo ? 'Dispatching...' : 'Dispatch Request to Citizen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADMIN GATE 2 — SELECT JOINT COLLABORATION (1 UNIV + 1 IND)
         ========================================================================= */}
      {selectCollaborationModalOpen && selectedProblem && (
        <div className="modal-backdrop" onClick={() => setSelectCollaborationModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '840px', width: '94%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)', padding: '18px 22px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Admin Gate 2 Innovation Governance
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Select Collaboration: 1 University + 1 Industry Pair
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectCollaborationModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '22px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '0.96rem', color: '#111827', display: 'block' }}>{selectedProblem.title}</strong>
                <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>ID: {selectedProblem.id} • District: {selectedProblem.district}</span>
              </div>

              {/* AI Pairwise Synergy Evaluation (5 Factors) */}
              <div style={{ background: '#FAF5FF', border: '1.5px solid #DDD6FE', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ color: '#5B21B6', fontSize: '0.88rem' }}>
                    🤖 AI Multi-Proposal Synergy Analysis (5 Key Factors)
                  </strong>
                  <span style={{ background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 800 }}>
                    Synergy Index: {collaborationAnalysisData?.synergyScore || 94}/100
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#6B7280', display: 'block' }}>Technical Feasibility</span>
                    <strong style={{ fontSize: '0.9rem', color: '#036D33' }}>95/100</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#6B7280', display: 'block' }}>CSR Budget Coverage</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0369A1' }}>100% Full</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#6B7280', display: 'block' }}>SLA Realism</span>
                    <strong style={{ fontSize: '0.9rem', color: '#D97706' }}>90/100</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#6B7280', display: 'block' }}>Risk Assessment</span>
                    <strong style={{ fontSize: '0.9rem', color: '#059669' }}>Low Risk</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#6B7280', display: 'block' }}>Complementarity</span>
                    <strong style={{ fontSize: '0.9rem', color: '#6D28D9' }}>96/100</strong>
                  </div>
                </div>

                {/* Explainability Box: "Why this collaboration?" */}
                <div style={{ background: '#FFFFFF', border: '1px solid #DDD6FE', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: '#374151' }}>
                  <strong style={{ color: '#5B21B6', display: 'block', marginBottom: '3px' }}>Why this collaboration? (Explainability):</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', lineHeight: 1.45 }}>
                    <li>The Academic Lead provides lab testing infrastructure, IoT sensor calibration, and student innovation teams.</li>
                    <li>The Industry CSR Partner covers 100% of the equipment, manufacturing prototypes, and on-site deployment expenses.</li>
                    <li>Combined SLA timeline fits well within the 90-day municipal resolution threshold with low execution risk.</li>
                  </ul>
                </div>
              </div>

              {/* Select University Partner */}
              <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                <label className="univ-form-label" style={{ fontWeight: 800, fontSize: '0.84rem', color: '#024D24' }}>
                  Select Academic Lead (1 University) <span className="required">*</span>
                </label>
                <select
                  value={selectedCollabUnivId}
                  onChange={(e) => setSelectedCollabUnivId(e.target.value)}
                  className="univ-form-select"
                  style={{ height: '40px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Approved University --</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.location}) — Expertise: {u.expertise}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Industry Partner */}
              <div className="univ-form-group" style={{ marginBottom: '14px' }}>
                <label className="univ-form-label" style={{ fontWeight: 800, fontSize: '0.84rem', color: '#6D28D9' }}>
                  Select Corporate CSR Sponsor (1 Industry) <span className="required">*</span>
                </label>
                <select
                  value={selectedCollabIndId}
                  onChange={(e) => setSelectedCollabIndId(e.target.value)}
                  className="univ-form-select"
                  style={{ height: '40px', fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose Verified Industry Partner --</option>
                  {industries.map(ind => (
                    <option key={ind.id} value={ind.id}>
                      {ind.companyName} ({ind.headquarters}) — Committed: {ind.totalFundingCommitted}
                    </option>
                  ))}
                </select>
              </div>

              {/* Administrative Governance Rationale */}
              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label" style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                  Administrative Sanction Rationale <span className="required">*</span>
                </label>
                <textarea
                  rows={2}
                  value={collaborationRationale}
                  onChange={(e) => setCollaborationRationale(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="Record executive rationale for pairing this University + Industry..."
                  required
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setSelectCollaborationModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={isSelectingCollab || !selectedCollabUnivId || !selectedCollabIndId}
                  onClick={() => handleConfirmCollaborationSelection('MANUAL')}
                  style={{ padding: '8px 22px', fontSize: '0.86rem', background: '#059669', borderColor: '#047857' }}
                >
                  {isSelectingCollab ? 'Sanctioning...' : '✓ Approve Collaboration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: COMPACT COMPARE SOLUTIONS MODAL WITH VIEW DETAILS ACCORDION
         ========================================================================= */}
      {compareModalOpen && comparingProblem && (
        <div className="modal-backdrop" onClick={() => setCompareModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '860px', width: '95%' }}>
            
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)', padding: '18px 24px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Solution Comparison & Decision Hub
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '2px' }}>
                  Review Proposals ({problemSolutions.length})
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setCompareModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '22px', maxHeight: '80vh', overflowY: 'auto' }}>
              
              {/* Problem Details */}
              <div style={{ background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '12px', padding: '14px 16px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="admin-badge badge-new" style={{ fontSize: '0.74rem' }}>{comparingProblem.category || comparingProblem.domain || 'Civic'}</span>
                  <span style={{ fontSize: '0.76rem', color: '#6B7280' }}>{comparingProblem.district} • ID: <strong style={{ color: '#036D33' }}>{comparingProblem.id}</strong></span>
                  <span className={`admin-badge ${comparingProblem.status === 'Assigned' ? 'badge-assigned' : 'badge-solutions'}`} style={{ fontSize: '0.72rem' }}>
                    Status: {comparingProblem.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '4px 0 4px 0' }}>
                  {comparingProblem.title}
                </h3>
                {comparingProblem.description && (
                  <p style={{ fontSize: '0.8rem', color: '#4B5563', margin: 0, lineHeight: 1.45 }}>
                    {comparingProblem.description}
                  </p>
                )}
              </div>

              {/* If no proposals yet */}
              {problemSolutions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', background: '#F9FAFB', borderRadius: '12px', border: '1.5px dashed #D1D5DB', margin: '8px 0' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
                    No Solution Proposals Submitted Yet
                  </h4>
                  <p style={{ fontSize: '0.86rem', color: '#6B7280', maxWidth: '540px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                    This challenge is open for domain-matched universities and industry partners. You can directly pair a university and industry partner, or review recommended academic institutions.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => {
                        setCompareModalOpen(false);
                        handleOpenCombineModal(comparingProblem);
                      }}
                      style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)', borderColor: '#5B21B6', padding: '10px 18px', fontSize: '0.86rem' }}
                    >
                      <span>Combine University & Industry</span>
                    </button>
                    <button
                      type="button"
                      className="admin-btn-action"
                      onClick={() => {
                        setCompareModalOpen(false);
                        handleOpenMatching(comparingProblem);
                      }}
                      style={{ padding: '10px 18px', fontSize: '0.86rem' }}
                    >
                      <span>View Matched Institutions</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Side-by-Side Comparison Cards Grid */
                <div className="admin-compare-grid">
                  {problemSolutions.map((sol, solIdx) => {
                    const isIndustry = sol.submitterType === 'industry' || !!sol.companyName;
                    const institutionName = sol.universityName || sol.companyName || 'Registered Partner';
                    const cleanName = (institutionName || 'Partner').split(',')[0];
                    const leadPerson = sol.mentorName || sol.teamLeadName || sol.contactPerson || 'Lead Investigator';
                    const leadTitle = sol.mentorDesignation || sol.teamLeadDesignation || (isIndustry ? 'CSR & R&D Lead' : 'Principal Investigator');

                    return (
                      <div
                        key={sol.id}
                        className={`admin-compare-card ${sol.status === 'Assigned' ? 'selected' : ''}`}
                        style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: isIndustry ? '1.5px solid #DDD6FE' : '1.5px solid #E5E7EB' }}
                      >
                        <div>
                          {/* Institution Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                color: isIndustry ? '#6D28D9' : '#036D33',
                                background: isIndustry ? '#FAF5FF' : '#E8F5EC',
                                border: `1px solid ${isIndustry ? '#E9D5FF' : '#C8E6C9'}`,
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                {isIndustry ? 'Industry' : 'University'}: {cleanName}
                              </span>
                              <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', margin: '6px 0 2px 0', lineHeight: 1.35 }}>
                                {sol.solutionTitle}
                              </h4>
                              <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>
                                {sol.department || (isIndustry ? 'CSR & Technical Projects Unit' : 'Dept. of Engineering & Applied Sciences')}
                              </div>
                            </div>

                            {sol.status === 'Assigned' && (
                              <span className="admin-badge badge-assigned" style={{ fontSize: '0.72rem' }}>✓ Assigned</span>
                            )}
                          </div>

                          {/* Cost & Timeline Badges */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.78rem', marginBottom: '12px' }}>
                            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '8px', borderRadius: '8px' }}>
                              <span style={{ color: '#6B7280', fontSize: '0.68rem', display: 'block' }}>ESTIMATED COST / GRANT</span>
                              <strong style={{ color: '#024D24', fontSize: '0.86rem' }}>{sol.estimatedCost || sol.fundingAmount || '₹ 4.5 Lakhs'}</strong>
                            </div>

                            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', padding: '8px', borderRadius: '8px' }}>
                              <span style={{ color: '#6B7280', fontSize: '0.68rem', display: 'block' }}>EXECUTION TIMELINE</span>
                              <strong style={{ color: '#111827', fontSize: '0.86rem' }}>{sol.estimatedTimeWeeks || sol.duration || 6} Weeks</strong>
                            </div>
                          </div>

                          {/* Team Lead */}
                          <div style={{ fontSize: '0.78rem', color: '#4B5563', marginBottom: '12px', background: '#F9FAFB', padding: '8px 10px', borderRadius: '6px' }}>
                            <div><strong>Lead:</strong> {leadPerson} ({leadTitle})</div>
                            {(sol.mentorEmail || sol.teamLeadEmail) && (
                              <div style={{ color: '#6B7280', fontSize: '0.72rem', marginTop: '2px' }}>
                                {sol.mentorEmail || sol.teamLeadEmail}
                              </div>
                            )}
                            {sol.folderLink && (
                              <div style={{ marginTop: '4px' }}>
                                <a
                                  href={sol.folderLink.startsWith('http') ? sol.folderLink : `https://${sol.folderLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#059669', fontWeight: 700, textDecoration: 'none', fontSize: '0.74rem' }}
                                >
                                  View Project Drive Folder ↗
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Collapsible View Details Toggle */}
                          <button
                            type="button"
                            onClick={() => toggleDetails(`sol-details-${solIdx}`)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              background: '#F9FAFB',
                              border: '1px solid #E5E7EB',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#4B5563',
                              cursor: 'pointer',
                              marginBottom: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{expandedDetailsMap[`sol-details-${solIdx}`] ? '▲ Hide Technical Details & Methodology' : '▼ View Technical Approach & Scores'}</span>
                          </button>

                          {expandedDetailsMap[`sol-details-${solIdx}`] && (
                            <div style={{ marginBottom: '12px' }}>
                              <p style={{ fontSize: '0.78rem', color: '#374151', lineHeight: 1.45, background: '#FAFCFA', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', margin: '0 0 8px 0' }}>
                                {sol.technicalApproach || sol.description || 'Comprehensive technical methodology submitted.'}
                              </p>
                              <div style={{ background: '#F9FAFB', padding: '8px 10px', borderRadius: '6px', fontSize: '0.74rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                  <span>Technical Quality Score:</span>
                                  {sol.technicalQualityScore != null ? (
                                    <strong style={{ color: '#036D33' }}>{sol.technicalQualityScore}%</strong>
                                  ) : (
                                    <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.74rem' }}>Not enough information</span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Feasibility & Readiness:</span>
                                  {sol.feasibilityScore != null ? (
                                    <strong style={{ color: '#036D33' }}>{sol.feasibilityScore}%</strong>
                                  ) : (
                                    <span style={{ color: '#6B7280', fontWeight: 600, fontSize: '0.74rem' }}>Pending detailed analysis</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                          {sol.status === 'Assigned' ? (
                            <div style={{ textAlign: 'center', background: '#ECFDF5', color: '#059669', padding: '8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.82rem' }}>
                              ✓ Officially Selected & Assigned
                            </div>
                          ) : sol.status === 'Modification Requested' ? (
                            <div style={{ textAlign: 'center', background: '#FEF3C7', color: '#92400E', padding: '8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                              Modification Requested
                            </div>
                          ) : sol.status === 'Rejected' ? (
                            <div style={{ textAlign: 'center', background: '#FEE2E2', color: '#991B1B', padding: '8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                              Proposal Rejected
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <button
                                type="button"
                                className="admin-btn-primary"
                                onClick={() => handleInitiateAssignment(sol)}
                                style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.84rem', background: '#059669', borderColor: '#047857' }}
                              >
                                <span>Accept Proposal & Assign</span>
                              </button>

                              <button
                                type="button"
                                className="admin-btn-action"
                                onClick={() => {
                                  setCompareModalOpen(false);
                                  handleOpenCombineModal(comparingProblem);
                                }}
                                style={{ width: '100%', justifyContent: 'center', padding: '6px 10px', fontSize: '0.78rem', background: '#FAF5FF', color: '#6D28D9', borderColor: '#DDD6FE', fontWeight: 700 }}
                              >
                                <span>Combine with Industry / University</span>
                              </button>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="admin-btn-action"
                                  onClick={() => handleOpenModifyModal(sol)}
                                  style={{ width: '100%', justifyContent: 'center', padding: '6px 8px', fontSize: '0.74rem', background: '#FEF3C7', color: '#92400E', borderColor: '#FDE68A' }}
                                >
                                  <span>Request Changes</span>
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn-action"
                                  onClick={() => handleOpenRejectModal(sol)}
                                  style={{ width: '100%', justifyContent: 'center', padding: '6px 8px', fontSize: '0.74rem', background: '#FEE2E2', color: '#991B1B', borderColor: '#FECACA' }}
                                >
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: COMPACT FINAL DECISION ASSIGNMENT CONFIRMATION
         ========================================================================= */}
      {assignConfirmModalOpen && selectedSolutionForAssignment && comparingProblem && (
        <div className="modal-backdrop" onClick={() => setAssignConfirmModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '92%' }}>
            <div className="modal-header admin-modal" style={{ padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Official Administrative Order
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                  Confirm Solution Assignment
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setAssignConfirmModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
                Assign civic problem to <u>{selectedSolutionForAssignment.universityName}</u>?
              </p>

              <div style={{ background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px', marginBottom: '14px', fontSize: '0.82rem' }}>
                <div style={{ marginBottom: '4px' }}><strong>Problem:</strong> {comparingProblem.title}</div>
                <div style={{ marginBottom: '4px' }}><strong>Solution:</strong> {selectedSolutionForAssignment.solutionTitle}</div>
                <div><strong>Grant Budget:</strong> {selectedSolutionForAssignment.estimatedCost}</div>
              </div>

              <div className="univ-form-group">
                <label className="univ-form-label">
                  <span>Executive Directives <span className="required">*</span></span>
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="Enter executive rationale for audit trail..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setAssignConfirmModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={isAssigning}
                  onClick={handleConfirmAssignment}
                  style={{ minWidth: '160px', justifyContent: 'center', padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  {isAssigning ? 'Persisting...' : 'Confirm & Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: COMPACT REQUEST MODIFICATION MODAL
         ========================================================================= */}
      {modifyModalOpen && selectedSolutionForModification && (
        <div className="modal-backdrop" onClick={() => setModifyModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '92%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Revision Request
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                  Request Proposal Changes
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setModifyModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '0.82rem' }}>
                <div><strong>University:</strong> {selectedSolutionForModification.universityName}</div>
                <div style={{ marginTop: '2px' }}><strong>Proposal:</strong> {selectedSolutionForModification.solutionTitle}</div>
              </div>

              <div className="univ-form-group">
                <label className="univ-form-label">
                  <span>Required Modifications Feedback <span className="required">*</span></span>
                </label>
                <textarea
                  rows={3}
                  value={modFeedbackText}
                  onChange={(e) => setModFeedbackText(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="Specify budget, timeline, or technical changes required..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setModifyModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={isSubmittingMod}
                  onClick={handleConfirmModificationRequest}
                  style={{ background: '#D97706', borderColor: '#B45309', padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  {isSubmittingMod ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: COMPACT REJECT PROPOSAL MODAL
         ========================================================================= */}
      {rejectModalOpen && selectedSolutionForReject && (
        <div className="modal-backdrop" onClick={() => setRejectModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '92%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Administrative Determination
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                  Reject Solution Proposal
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setRejectModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '0.82rem' }}>
                <div><strong>University:</strong> {selectedSolutionForReject.universityName}</div>
                <div style={{ marginTop: '2px' }}><strong>Proposal:</strong> {selectedSolutionForReject.solutionTitle}</div>
              </div>

              <div className="univ-form-group">
                <label className="univ-form-label">
                  <span>Rejection Grounds <span className="required">*</span></span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="State the technical or SLA reasons for rejection..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setRejectModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-danger"
                  disabled={isSubmittingReject}
                  onClick={handleConfirmReject}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  {isSubmittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 7: COMPACT VERIFY PROJECT COMPLETION MODAL
         ========================================================================= */}
      {verifyModalOpen && selectedProjectForVerify && (
        <div className="modal-backdrop" onClick={() => setVerifyModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  State Verification & Closure
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                  Verify & Mark Problem Resolved
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setVerifyModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '0.84rem' }}>
                <div style={{ marginBottom: '4px' }}><strong>Problem:</strong> {selectedProjectForVerify.problemTitle || selectedProjectForVerify.title}</div>
                <div><strong>University:</strong> {selectedProjectForVerify.universityName}</div>
              </div>

              {/* AI Resolution Audit Evidence Checklist */}
              {isAuditLoading ? (
                <div style={{ padding: '10px', textAlign: 'center', color: '#6B7280', fontSize: '0.8rem' }}>
                  Analyzing deliverable integrity & SLA audit trail...
                </div>
              ) : resolutionAuditData ? (
                <div style={{ background: '#FAF5FF', border: '1.5px solid #DDD6FE', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#5B21B6', fontSize: '0.82rem' }}>AI Resolution Audit Support:</strong>
                    <span style={{ background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem', fontWeight: 800 }}>
                      Audit Score: {resolutionAuditData.auditScore || 94}/100
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#374151' }}>
                    {resolutionAuditData.checklist?.map((chk, cIdx) => (
                      <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#059669', fontWeight: 800 }}>✓</span>
                        <span>{chk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="univ-form-group">
                <label className="univ-form-label">
                  <span>Inspection Audit Notes <span className="required">*</span></span>
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="Record department sign-off and field inspection audit findings..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setVerifyModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={isSubmittingVerify}
                  onClick={() => handleConfirmVerify('MANUAL')}
                  style={{ background: '#059669', borderColor: '#047857', padding: '8px 22px', fontSize: '0.86rem' }}
                >
                  {isSubmittingVerify ? 'Verifying...' : '✓ Verify & Sanction Resolution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 8: DUPLICATE CASE SIDE-BY-SIDE INSPECTION MODAL
         ========================================================================= */}
      {duplicateModalOpen && selectedDuplicateCase && (
        <div className="modal-backdrop" onClick={() => setDuplicateModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '94%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Multimodal AI Vision & NLP Inspector
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Duplicate Grievance Comparison ({selectedDuplicateCase.id})
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setDuplicateModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', maxHeight: '78vh', overflowY: 'auto' }}>
              
              {/* Similarity Score Chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '8px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6D28D9', display: 'block' }}>Text Similarity</span>
                  <strong style={{ color: '#5B21B6', fontSize: '1.1rem' }}>{selectedDuplicateCase.textSimilarity}</strong>
                </div>
                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '8px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6D28D9', display: 'block' }}>Image Similarity</span>
                  <strong style={{ color: '#5B21B6', fontSize: '1.1rem' }}>{selectedDuplicateCase.imageSimilarity}</strong>
                </div>
                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '8px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6D28D9', display: 'block' }}>GPS Distance</span>
                  <strong style={{ color: '#5B21B6', fontSize: '1.1rem' }}>{selectedDuplicateCase.locationDistanceMeters}</strong>
                </div>
              </div>

              {/* Side-by-Side Original vs Duplicate Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                
                {/* Original Report */}
                <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: '10px', padding: '12px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', background: '#D1FAE5', padding: '2px 6px', borderRadius: '4px' }}>
                    ORIGINAL RECORD
                  </span>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', margin: '6px 0 4px 0' }}>
                    {selectedDuplicateCase.originalProblem.title}
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#4B5563' }}>
                    {selectedDuplicateCase.originalProblem.location}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                    {selectedDuplicateCase.originalProblem.date}
                  </div>
                </div>

                {/* Duplicate Report */}
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '10px', padding: '12px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>
                    FLAGGED DUPLICATE
                  </span>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', margin: '6px 0 4px 0' }}>
                    {selectedDuplicateCase.duplicateReport.title}
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#4B5563' }}>
                    {selectedDuplicateCase.duplicateReport.location}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                    {selectedDuplicateCase.duplicateReport.date}
                  </div>
                </div>

              </div>

              {/* AI Reasoning Text */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#374151', marginBottom: '16px' }}>
                <strong style={{ color: '#5B21B6' }}>AI Multimodal Reasoning:</strong>
                <p style={{ margin: '4px 0 0 0', lineHeight: 1.4 }}>{selectedDuplicateCase.aiReasoning}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => setDuplicateModalOpen(false)}
                  style={{ background: '#6D28D9', borderColor: '#5B21B6', padding: '6px 18px', fontSize: '0.82rem' }}
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 9: COMBINE UNIVERSITY & INDUSTRY PARTNERS MODAL
         ========================================================================= */}
      {combineModalOpen && combineProblem && (() => {
        const univSols = solutions.filter(s => s.problemId === combineProblem.id && (s.submitterType === 'university' || s.universityName));
        const indSols = solutions.filter(s => s.problemId === combineProblem.id && (s.submitterType === 'industry' || s.companyName));

        return (
          <div className="modal-backdrop" onClick={() => setCombineModalOpen(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '92%' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%)', padding: '16px 20px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                    State Innovation Matching
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                    Combine University & Industry Partners
                  </h3>
                </div>
                <button className="modal-close-btn" onClick={() => setCombineModalOpen(false)}>
                  <CloseIcon size={16} />
                </button>
              </div>

              <div className="modal-body" style={{ padding: '20px', maxHeight: '78vh', overflowY: 'auto' }}>
                {/* Problem Info */}
                <div style={{ background: '#FAF5FF', border: '1.5px solid #DDD6FE', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.74rem', background: '#EDE9FE', color: '#6D28D9', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                      {combineProblem.category}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>ID: {combineProblem.id} • {combineProblem.district}</span>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                    {combineProblem.title}
                  </h4>
                </div>

                {/* Select University Proposal */}
                <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                  <label className="univ-form-label" style={{ color: '#024D24', fontWeight: 800, fontSize: '0.88rem' }}>
                    Select University Solution Proposal <span className="required">*</span>
                  </label>
                  {univSols.length === 0 ? (
                    <div>
                      <div style={{ padding: '8px 12px', background: '#FEF3C7', color: '#92400E', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #FDE68A', marginBottom: '8px' }}>
                        No specific proposal documents submitted yet. Select from registered Academic Institutions in Jharkhand:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        {(universities.length > 0 ? universities : [
                          { id: 'UNI-JH-001', name: 'Jharkhand Institute of Agricultural Technology', department: 'Agricultural Engineering & Water Sciences', expertise: ['Water Management', 'Agriculture'] },
                          { id: 'UNI-JH-002', name: 'Jharkhand Institute of Health & Computing', department: 'Biomedical Engineering & Computer Science', expertise: ['Healthcare', 'AI / Digital Services'] }
                        ]).map((univ) => (
                          <label
                            key={univ.id}
                            style={{
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: selectedUnivSolId === univ.id ? '2px solid #059669' : '1px solid #E5E7EB',
                              background: selectedUnivSolId === univ.id ? '#ECFDF5' : '#FFFFFF',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="radio"
                              name="selectedUnivSol"
                              checked={selectedUnivSolId === univ.id}
                              onChange={() => setSelectedUnivSolId(univ.id)}
                              style={{ marginTop: '3px' }}
                            />
                            <div style={{ fontSize: '0.84rem' }}>
                              <strong style={{ color: '#111827', display: 'block' }}>{univ.name || univ.universityName}</strong>
                              <div style={{ color: '#036D33', fontSize: '0.78rem', fontWeight: 700 }}>
                                {univ.department || 'Institutional Research Team'} • {univ.location || 'Jharkhand'}
                              </div>
                              <div style={{ color: '#4B5563', fontSize: '0.76rem', marginTop: '2px' }}>
                                Domains: {Array.isArray(univ.expertise) ? univ.expertise.join(', ') : 'Civil & Water Systems'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      {univSols.map((sol) => (
                        <label
                          key={sol.id}
                          style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: selectedUnivSolId === sol.id ? '2px solid #059669' : '1px solid #E5E7EB',
                            background: selectedUnivSolId === sol.id ? '#ECFDF5' : '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="radio"
                            name="selectedUnivSol"
                            checked={selectedUnivSolId === sol.id}
                            onChange={() => setSelectedUnivSolId(sol.id)}
                            style={{ marginTop: '3px' }}
                          />
                          <div style={{ fontSize: '0.84rem' }}>
                            <strong style={{ color: '#111827', display: 'block' }}>{sol.solutionTitle}</strong>
                            <div style={{ color: '#036D33', fontSize: '0.78rem', fontWeight: 700 }}>
                              {sol.universityName} • Lead: {sol.mentorName}
                            </div>
                            <div style={{ color: '#4B5563', fontSize: '0.76rem', marginTop: '2px' }}>
                              Budget: {sol.estimatedCost} • {sol.estimatedTimeWeeks} wks
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Select Industry Proposal */}
                <div className="univ-form-group" style={{ marginBottom: '20px' }}>
                  <label className="univ-form-label" style={{ color: '#6D28D9', fontWeight: 800, fontSize: '0.88rem' }}>
                    Select Industry Solution / CSR Partner <span className="required">*</span>
                  </label>
                  {indSols.length === 0 ? (
                    <div>
                      <div style={{ padding: '8px 12px', background: '#FEF3C7', color: '#92400E', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #FDE68A', marginBottom: '8px' }}>
                        No specific CSR proposals submitted yet. Select from verified Corporate & CSR Partners in Jharkhand:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        {(industries.length > 0 ? industries : [
                          { id: 'IND-TATA-01', companyName: 'Tata Steel Civic Foundation', sector: 'Civil Infrastructure & CSR', csrBudget: '₹ 25 Lakhs' },
                          { id: 'IND-CCL-01', companyName: 'Coal India / CCL CSR Foundation', sector: 'Mining & Community Livelihoods', csrBudget: '₹ 50 Lakhs' },
                          { id: 'IND-USHA-01', companyName: 'Usha Martin Civic Foundation', sector: 'Rural Infrastructure & Education', csrBudget: '₹ 15 Lakhs' },
                          { id: 'IND-JINDAL-01', companyName: 'Jindal Steel & Power Ltd', sector: 'Water & Environment CSR', csrBudget: '₹ 30 Lakhs' }
                        ]).map((ind) => (
                          <label
                            key={ind.id}
                            style={{
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: selectedIndSolId === ind.id ? '2px solid #6D28D9' : '1px solid #E5E7EB',
                              background: selectedIndSolId === ind.id ? '#FAF5FF' : '#FFFFFF',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="radio"
                              name="selectedIndSol"
                              checked={selectedIndSolId === ind.id}
                              onChange={() => setSelectedIndSolId(ind.id)}
                              style={{ marginTop: '3px' }}
                            />
                            <div style={{ fontSize: '0.84rem' }}>
                              <strong style={{ color: '#111827', display: 'block' }}>{ind.companyName || ind.name}</strong>
                              <div style={{ color: '#6D28D9', fontSize: '0.78rem', fontWeight: 700 }}>
                                {ind.sector || 'Corporate CSR Foundation'} • {ind.district || 'Jharkhand'}
                              </div>
                              <div style={{ color: '#4B5563', fontSize: '0.76rem', marginTop: '2px' }}>
                                CSR Commitment: {ind.csrBudget || '₹ 15 - 25 Lakhs Co-Funding'}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      {indSols.map((sol) => (
                        <label
                          key={sol.id}
                          style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: selectedIndSolId === sol.id ? '2px solid #6D28D9' : '1px solid #E5E7EB',
                            background: selectedIndSolId === sol.id ? '#FAF5FF' : '#FFFFFF',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="radio"
                            name="selectedIndSol"
                            checked={selectedIndSolId === sol.id}
                            onChange={() => setSelectedIndSolId(sol.id)}
                            style={{ marginTop: '3px' }}
                          />
                          <div style={{ fontSize: '0.84rem' }}>
                            <strong style={{ color: '#111827', display: 'block' }}>{sol.solutionTitle}</strong>
                            <div style={{ color: '#6D28D9', fontSize: '0.78rem', fontWeight: 700 }}>
                              {sol.companyName} • Lead: {sol.teamLeadName || sol.representativeName}
                            </div>
                            <div style={{ color: '#4B5563', fontSize: '0.76rem', marginTop: '2px' }}>
                              CSR Grant: {sol.estimatedCost || sol.fundingAmount} • {sol.estimatedTimeWeeks || 8} wks
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#4B5563', marginBottom: '16px' }}>
                  Once combined, both the University and Industry will enter into a shared workspace for this problem where works from both sides will be visible, allowing joint chat, progress updates, and submission of the final solution to the Admin.
                </div>

                {/* Modal Footer Buttons */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="univ-btn-secondary"
                    onClick={() => setCombineModalOpen(false)}
                    style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={isCombining || !selectedUnivSolId || !selectedIndSolId}
                    onClick={handleConfirmCombine}
                    style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)', borderColor: '#4C1D95', padding: '8px 20px', fontSize: '0.84rem' }}
                  >
                    {isCombining ? 'Combining...' : 'Pair & Combine Partners'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          MODAL 11: PAIRING PARTNERS RECOMMENDATION MODAL
         ========================================================================= */}
      {pairingModalOpen && selectedProblemForPairing && (
        <div className="modal-backdrop" onClick={() => setPairingModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '94%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  AI Synergistic Partner Recommendation
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Pair University & Industry Partners
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setPairingModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px', maxHeight: '78vh', overflowY: 'auto' }}>
              <div style={{ background: '#FAF5FF', border: '1.5px solid #DDD6FE', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.74rem', background: '#EDE9FE', color: '#6D28D9', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                  {selectedProblemForPairing.category} • {selectedProblemForPairing.district}
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: '6px 0 2px 0' }}>
                  {selectedProblemForPairing.title}
                </h4>
              </div>

              {isPairingLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#6D28D9', fontWeight: 700 }}>
                  Computing synergistic match matrix between universities and CSR sponsors...
                </div>
              ) : pairingData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 14px' }}>
                    <strong style={{ color: '#166534', fontSize: '0.84rem' }}>Recommended Academic Lead:</strong>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                      {pairingData.recommendedUniversity?.name || pairingData.recommendedUniversity?.universityName || 'Central University of Jharkhand'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                      Score: {pairingData.recommendedUniversity?.matchScore || 95}% • Distance: {pairingData.recommendedUniversity?.distanceKm || '12 km'}
                    </div>
                  </div>

                  <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '10px', padding: '12px 14px' }}>
                    <strong style={{ color: '#6D28D9', fontSize: '0.84rem' }}>Recommended Corporate Sponsor:</strong>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                      {pairingData.recommendedIndustry?.companyName || pairingData.recommendedIndustry?.name || 'Tata Steel Civic Foundation'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#7C3AED', marginTop: '2px' }}>
                      Funding: {pairingData.recommendedIndustry?.csrBudget || '₹ 5.0 - 7.5 Lakhs'} • Sector: {pairingData.recommendedIndustry?.sector || 'Civil & Infrastructure'}
                    </div>
                  </div>

                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#374151' }}>
                    <strong>Synergy Rationale:</strong> {pairingData.pairingRationale || 'Optimal pairing uniting university laboratory testing infrastructure with corporate CSR sponsorship and project management.'}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="univ-btn-secondary"
                      onClick={() => setPairingModalOpen(false)}
                      style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => {
                        setPairingModalOpen(false);
                        handleOpenCombineModal(selectedProblemForPairing);
                      }}
                      style={{ background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)', borderColor: '#4C1D95', padding: '8px 18px', fontSize: '0.84rem' }}
                    >
                      Combine Selected Partners
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 12: ADMIN OVERRIDE PRIORITY / CATEGORY MODAL
         ========================================================================= */}
      {overrideModalOpen && selectedProblemForOverride && (
        <div className="modal-backdrop" onClick={() => setOverrideModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', width: '92%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Administrative Governance
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                  Admin Override AI Decision
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setOverrideModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '0.82rem' }}>
                <div><strong>Problem:</strong> {selectedProblemForOverride.title}</div>
                <div style={{ marginTop: '2px' }}><strong>Current:</strong> Priority {selectedProblemForOverride.priority || 'High'} • Domain: {selectedProblemForOverride.domain || 'Civil Systems'}</div>
              </div>

              <div className="univ-form-group" style={{ marginBottom: '12px' }}>
                <label className="univ-form-label">Override Priority Level</label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value)}
                  className="univ-form-select"
                >
                  <option value="Critical">Critical (Immediate State Action)</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                </select>
              </div>

              <div className="univ-form-group" style={{ marginBottom: '12px' }}>
                <label className="univ-form-label">Override 12-Domain Classification</label>
                <select
                  value={overrideDomain}
                  onChange={(e) => setOverrideDomain(e.target.value)}
                  className="univ-form-select"
                >
                  {STANDARD_DOMAINS.map((dom, dIdx) => (
                    <option key={dIdx} value={dom}>{dom}</option>
                  ))}
                </select>
              </div>

              <div className="univ-form-group" style={{ marginBottom: '16px' }}>
                <label className="univ-form-label">Override Rationale & Audit Trail <span className="required">*</span></label>
                <textarea
                  rows={2}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  className="univ-form-textarea"
                  placeholder="State reason for overriding AI classification..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setOverrideModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={isSubmittingOverride}
                  onClick={handleConfirmOverride}
                  style={{ background: '#D97706', borderColor: '#B45309', padding: '8px 18px', fontSize: '0.84rem' }}
                >
                  {isSubmittingOverride ? 'Persisting...' : 'Apply Admin Override'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {/* =========================================================================
          MODAL: REGENERATE MCP TOKEN CONFIRMATION
         ========================================================================= */}
      {mcpRegenModalOpen && (
        <div className="modal-backdrop" onClick={() => setMcpRegenModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)', padding: '16px 20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Regenerate MCP Bearer Token
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setMcpRegenModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.86rem', color: '#374151', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Are you sure you want to regenerate the MCP Bearer token? 
                <strong> All currently active tokens will be immediately revoked</strong>, and any AI agents currently using the previous token will lose access until reconfigured.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setMcpRegenModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={mcpActionLoading}
                  onClick={handleConfirmRegenerateToken}
                  style={{ background: '#D97706', borderColor: '#B45309', padding: '8px 18px', fontSize: '0.84rem' }}
                >
                  {mcpActionLoading ? 'Regenerating...' : 'Yes, Regenerate Token'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REVOKE MCP TOKEN CONFIRMATION
         ========================================================================= */}
      {mcpRevokeModalOpen && (
        <div className="modal-backdrop" onClick={() => setMcpRevokeModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #991B1B 0%, #C62828 100%)', padding: '16px 20px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Revoke MCP Bearer Token
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setMcpRevokeModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.86rem', color: '#374151', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Are you sure you want to deactivate all MCP tokens? All external AI clients will immediately be denied access.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setMcpRevokeModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn-primary"
                  disabled={mcpActionLoading}
                  onClick={handleConfirmRevokeToken}
                  style={{ background: '#C62828', borderColor: '#991B1B', padding: '8px 18px', fontSize: '0.84rem' }}
                >
                  {mcpActionLoading ? 'Revoking...' : 'Yes, Revoke All Tokens'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 13: CONTINUOUS SLA RADAR & DELAY RISK MONITOR
         ========================================================================= */}
      {projectSlaModalOpen && selectedProjectForSla && (
        <div className="modal-backdrop" onClick={() => setProjectSlaModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '92%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #024D24 0%, #036D33 100%)', padding: '16px 20px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>
                  Jharkhand Continuous SLA Radar
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                  Continuous Project SLA Monitor
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setProjectSlaModalOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.94rem', color: '#111827' }}>{selectedProjectForSla.problemTitle || selectedProjectForSla.title}</strong>
                <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                  Assigned to: {selectedProjectForSla.universityName}
                </div>
              </div>

              {isSlaLoading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#036D33', fontSize: '0.86rem' }}>
                  Analyzing continuous milestone velocity and SLA breach probability...
                </div>
              ) : projectSlaData ? (
                <div>
                  {/* Status Banner */}
                  <div style={{
                    background: projectSlaData.status === 'CRITICAL_BREACH_RISK' ? '#FEF2F2' : projectSlaData.status === 'WARNING' ? '#FFFBEB' : '#ECFDF5',
                    border: `1.5px solid ${projectSlaData.status === 'CRITICAL_BREACH_RISK' ? '#FCA5A5' : projectSlaData.status === 'WARNING' ? '#FDE68A' : '#A7F3D0'}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div>
                      <strong style={{
                        color: projectSlaData.status === 'CRITICAL_BREACH_RISK' ? '#991B1B' : projectSlaData.status === 'WARNING' ? '#92400E' : '#166534',
                        fontSize: '0.92rem'
                      }}>
                        {projectSlaData.status === 'CRITICAL_BREACH_RISK' ? 'Critical SLA Delay Risk' : projectSlaData.status === 'WARNING' ? 'Milestone Delay Warning' : 'Milestone Trajectory Healthy'}
                      </strong>
                      <div style={{ fontSize: '0.78rem', color: '#4B5563', marginTop: '2px' }}>
                        Delay Risk Score: <strong>{projectSlaData.delayRiskScore || 15}/100</strong> • Est. Delay: <strong>{projectSlaData.estimatedDelayDays || 0} Days</strong>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Directive */}
                  <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', fontSize: '0.82rem', color: '#374151', marginBottom: '16px' }}>
                    <strong>Recommended Directive:</strong>
                    <p style={{ margin: '4px 0 0 0', lineHeight: 1.45 }}>{projectSlaData.recommendedAction || 'Continue active field execution and milestone submissions.'}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => setProjectSlaModalOpen(false)}
                      style={{ padding: '6px 18px', fontSize: '0.82rem' }}
                    >
                      Close Radar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 14: MCP COLLABORATION INTELLIGENCE REPORT DRAWER (V1, V2, V3...)
         ========================================================================= */}
      {collaborationReportDrawerOpen && reportSelectedProblem && (
        <div className="modal-backdrop" onClick={() => setCollaborationReportDrawerOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '880px', width: '95%' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', padding: '18px 22px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700, color: '#E0E7FF' }}>
                    MCP Proposal Synergy Intelligence
                  </span>
                  <span style={{ background: '#312E81', color: '#818CF8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, border: '1px solid #4338CA' }}>
                    {activeCollaborationReport?.reportVersion || 'V1'}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: '#FFFFFF' }}>
                  Collaboration Intelligence Report: {reportSelectedProblem.title}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setCollaborationReportDrawerOpen(false)}>
                <CloseIcon size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '22px', maxHeight: '80vh', overflowY: 'auto' }}>
              {/* Problem & Report Metadata */}
              <div style={{ background: '#F8FAF9', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                    Problem ID: <strong>{reportSelectedProblem.id}</strong> • District: <strong>{reportSelectedProblem.district || 'Jharkhand'}</strong> • Domain: <strong>{reportSelectedProblem.domain || reportSelectedProblem.category}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#4B5563', marginTop: '3px' }}>
                    Report Generated: {activeCollaborationReport?.generatedAt ? new Date(activeCollaborationReport.generatedAt).toLocaleString('en-IN') : 'Live Inferred'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {reportHistoryData?.reports?.length > 1 && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', color: '#6B7280', fontWeight: 700 }}>Version History:</span>
                      {reportHistoryData.reports.map((rep, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => setActiveCollaborationReport(rep)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            background: activeCollaborationReport?.reportVersion === rep.reportVersion ? '#4F46E5' : '#F3F4F6',
                            color: activeCollaborationReport?.reportVersion === rep.reportVersion ? '#FFFFFF' : '#374151',
                            border: '1px solid #D1D5DB'
                          }}
                        >
                          {rep.reportVersion || `V${rIdx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="admin-btn-action"
                    disabled={isGeneratingReport}
                    onClick={() => handleGenerateCollaborationReport(reportSelectedProblem.id)}
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    title="Run fresh MCP intelligence multi-proposal evaluation"
                  >
                    <span>{isGeneratingReport ? 'Evaluating...' : '↻ Re-Run MCP Analysis'}</span>
                  </button>
                </div>
              </div>

              {/* Proposals Analyzed Summary Banner */}
              <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '0.84rem', color: '#312E81' }}>
                  📊 <strong>{activeCollaborationReport?.summary || `Analyzed proposals and identified collaborative partnerships.`}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ background: '#E0E7FF', color: '#4338CA', padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800 }}>
                    {activeCollaborationReport?.proposalsAnalyzed?.universitiesCount || 1} Univ Proposals
                  </span>
                  <span style={{ background: '#EDE9FE', color: '#6D28D9', padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800 }}>
                    {activeCollaborationReport?.proposalsAnalyzed?.industriesCount || 1} CSR Proposals
                  </span>
                </div>
              </div>

              {/* Candidate Pairs Grid */}
              <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>
                Evaluated Candidate Partnerships ({activeCollaborationReport?.candidatePairs?.length || 0})
              </h4>

              {(!activeCollaborationReport?.candidatePairs || activeCollaborationReport.candidatePairs.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '32px', background: '#F9FAFB', borderRadius: '10px', border: '1px dashed #D1D5DB', color: '#6B7280' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🔍</div>
                  <strong>No candidate pairs evaluated yet.</strong>
                  <p style={{ fontSize: '0.82rem', margin: '4px 0 12px 0' }}>Proposals are currently awaiting formulation from matched institutions.</p>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    disabled={isGeneratingReport}
                    onClick={() => handleGenerateCollaborationReport(reportSelectedProblem.id)}
                    style={{ padding: '6px 16px', fontSize: '0.8rem', background: '#4F46E5', borderColor: '#4338CA' }}
                  >
                    <span>Compute MCP Match Now</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeCollaborationReport.candidatePairs.map((pair, pIdx) => {
                    const uniName = pair.universityName || 'Central University of Jharkhand';
                    const indName = pair.industryName || pair.companyName || 'Tata Steel Civic Foundation';
                    const score = pair.synergyScore || pair.overallScore || 92;

                    return (
                      <div
                        key={pIdx}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid #E5E7EB',
                          borderRadius: '12px',
                          padding: '18px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Pair Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#065F46', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                                PAIR #{pIdx + 1}
                              </span>
                              <span style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 600 }}>
                                {pair.pairId || `CP-${pIdx + 1}`}
                              </span>
                            </div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                              {uniName} <span style={{ color: '#6B7280', fontWeight: 400 }}>+</span> {indName}
                            </h3>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700 }}>OVERALL SYNERGY</div>
                            <span style={{
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              color: score >= 85 ? '#059669' : score >= 70 ? '#D97706' : '#DC2626'
                            }}>
                              {score}/100
                            </span>
                          </div>
                        </div>

                        {/* 5 Compatibility Dimensions Badges */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                          <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.66rem', color: '#6B7280', display: 'block' }}>Technical</span>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#036D33' }}>
                              {pair.technicalCompatibilityLevel || 'HIGH'}
                            </span>
                          </div>

                          <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.66rem', color: '#6B7280', display: 'block' }}>Resource</span>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0369A1' }}>
                              {pair.resourceCompatibilityLevel || 'HIGH'}
                            </span>
                          </div>

                          <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.66rem', color: '#6B7280', display: 'block' }}>Budget Alignment</span>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#059669' }}>
                              {pair.budgetAlignmentLevel || 'HIGH'}
                            </span>
                          </div>

                          <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.66rem', color: '#6B7280', display: 'block' }}>Timeline SLA</span>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#D97706' }}>
                              {pair.timelineCompatibilityLevel || 'HIGH'}
                            </span>
                          </div>

                          <div style={{ background: '#F8FAF9', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.66rem', color: '#6B7280', display: 'block' }}>Deployment</span>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#6D28D9' }}>
                              {pair.deploymentReadinessLevel || 'HIGH'}
                            </span>
                          </div>
                        </div>

                        {/* Synergistic Strengths and Risks */}
                        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', marginBottom: '14px' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <strong style={{ color: '#065F46', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', marginBottom: '3px' }}>
                              ✨ Synergistic Strengths:
                            </strong>
                            <div style={{ color: '#374151', lineHeight: 1.45 }}>
                              {pair.synergisticStrengths || pair.synergyRationale || 'Strong technical overlap with corporate CSR sponsorship and student laboratory deployment capabilities.'}
                            </div>
                          </div>

                          {pair.keyRisks && (
                            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '8px' }}>
                              <strong style={{ color: '#B45309', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', marginBottom: '3px' }}>
                                ⚠️ Execution Risk & Mitigation:
                              </strong>
                              <div style={{ color: '#4B5563', lineHeight: 1.45 }}>
                                {pair.keyRisks} {pair.mitigationStrategy ? `• Mitigation: ${pair.mitigationStrategy}` : ''}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Row */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button
                            type="button"
                            className="admin-btn-primary"
                            onClick={() => handleSelectCandidatePair(pair, reportSelectedProblem)}
                            style={{ padding: '8px 18px', fontSize: '0.82rem', background: '#059669', borderColor: '#047857' }}
                          >
                            <span>Select This Pair (Gate 2) →</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Drawer Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #E5E7EB', paddingTop: '14px' }}>
                <button
                  type="button"
                  className="univ-btn-secondary"
                  onClick={() => setCollaborationReportDrawerOpen(false)}
                  style={{ padding: '8px 18px', fontSize: '0.84rem' }}
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
