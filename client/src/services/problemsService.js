// Client-side Problems & Challenges Service with Backend Sync and Local Storage Fallback
import { authService } from './authService';
import { API_BASE_URL } from './apiConfig';

const DEFAULT_PROBLEMS = [];

// Helper to normalize problem titles for strict duplicate prevention
export function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Strict deduplicator by unique ID
export function deduplicateProblems(list) {
  if (!Array.isArray(list)) return [];
  const map = new Map();

  for (const item of list) {
    if (!item) continue;
    const idKey = (item.id || '').trim().toUpperCase();
    const titleKey = normalizeTitle(item.title);
    // Prioritize ID so distinct submissions with similar titles are never collapsed
    const key = idKey || titleKey;

    if (!map.has(key)) {
      map.set(key, item);
    } else {
      // If same ID found, preserve 'Currently Working' status or latest updated info
      const existing = map.get(key);
      const isWorking = item.status === 'Currently Working' || existing.status === 'Currently Working';
      const adoptedBy = item.adoptedByUniversity || existing.adoptedByUniversity;
      const activeTeam = item.activeTeam || existing.activeTeam;

      map.set(key, {
        ...existing,
        ...item,
        status: isWorking ? 'Currently Working' : (item.status || existing.status),
        adoptedByUniversity: adoptedBy,
        activeTeam: activeTeam
      });
    }
  }

  return Array.from(map.values());
}

// Local storage keys
const STORAGE_KEY_PROBLEMS = 'civic_problems_repository';
const STORAGE_KEY_TEAMS = 'civic_working_teams';
const STORAGE_KEY_IND_TEAMS = 'civic_industry_teams';
const STORAGE_KEY_FUNDING = 'civic_funding_approvals';
const STORAGE_KEY_PROPOSALS = 'civic_solutions_proposals';
const STORAGE_KEY_COLLABS = 'civic_collaborations_repository';

export function getStoredLocalProblems() {
  return [];
}

export function saveLocalProblems(problems) {
  try {
    const unique = deduplicateProblems(problems);
    localStorage.setItem(STORAGE_KEY_PROBLEMS, JSON.stringify(unique));
  } catch (e) {
    console.warn('Could not save problems to localStorage', e);
  }
}

export function getStoredTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEAMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveStoredTeams(teams) {
  try {
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
  } catch (e) {}
  return teams;
}

export function getStoredIndustryTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_IND_TEAMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveStoredIndustryTeams(teams) {
  try {
    localStorage.setItem(STORAGE_KEY_IND_TEAMS, JSON.stringify(teams));
  } catch (e) {}
  return teams;
}

export const DEFAULT_PROPOSALS = [];

export function getStoredProposals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROPOSALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveStoredProposals(proposals) {
  try {
    localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(proposals));
  } catch (e) {}
  return proposals;
}

export function getStoredFundingApprovals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FUNDING);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveStoredFundingApprovals(approvals) {
  try {
    localStorage.setItem(STORAGE_KEY_FUNDING, JSON.stringify(approvals));
  } catch (e) {}
  return approvals;
}

const DEFAULT_COLLABORATIONS = [];

export function getStoredCollaborations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COLLABS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveStoredCollaborations(collabs) {
  try {
    localStorage.setItem(STORAGE_KEY_COLLABS, JSON.stringify(collabs));
  } catch (e) {}
  return collabs;
}

// Standardized 12 Official Categories across CivicConnect
export const STANDARD_DOMAINS = [
  'Education',
  'Healthcare',
  'Agriculture',
  'Water Management',
  'Sanitation',
  'Environment',
  'Rural Livelihoods',
  'Accessibility',
  'Urban Infrastructure',
  'Public Service Delivery',
  'Waste Management',
  'Unknown/Other'
];

// Helper to check domain matching
export function isProblemMatchingUniversityDomains(problem, userInterests) {
  if (!problem) return false;
  if (!userInterests || !Array.isArray(userInterests) || userInterests.length === 0) {
    return true; // No filter specified, show all
  }
  const problemCategory = (problem.category || '').toLowerCase().trim();
  const problemDomain = (problem.domain || '').toLowerCase().trim();
  const problemTitle = (problem.title || '').toLowerCase().trim();
  const problemDesc = (problem.description || '').toLowerCase().trim();
  const text = `${problemCategory} ${problemDomain} ${problemTitle} ${problemDesc}`;

  return userInterests.some(exp => {
    const e = String(exp).toLowerCase().trim();
    if (!e) return false;
    if (problemCategory === e || problemDomain === e || text.includes(e) || e.includes(problemCategory)) return true;

    // Cross-domain semantic mappings
    if (e.includes('water') && (text.includes('water') || text.includes('drainage') || text.includes('river') || text.includes('hydrology'))) return true;
    if (e.includes('agriculture') && (text.includes('agri') || text.includes('crop') || text.includes('farm') || text.includes('produce') || text.includes('cold storage'))) return true;
    if (e.includes('healthcare') && (text.includes('health') || text.includes('sensor') || text.includes('disease') || text.includes('fluoride') || text.includes('arsenic') || text.includes('medical'))) return true;
    if (e.includes('education') && (text.includes('education') || text.includes('school') || text.includes('student') || text.includes('digital') || text.includes('connectivity'))) return true;
    if (e.includes('sanitation') && (text.includes('sanitation') || text.includes('sludge') || text.includes('toilet') || text.includes('cleanliness') || text.includes('sewage'))) return true;
    if (e.includes('waste') && (text.includes('waste') || text.includes('garbage') || text.includes('recycling'))) return true;
    if (e.includes('environment') && (text.includes('environment') || text.includes('pollution') || text.includes('green') || text.includes('eco') || text.includes('solar') || text.includes('wetland'))) return true;
    if (e.includes('rural') && (text.includes('rural') || text.includes('tribal') || text.includes('village') || text.includes('livelihood'))) return true;
    if (e.includes('urban') && (text.includes('urban') || text.includes('city') || text.includes('road') || text.includes('bridge') || text.includes('pothole') || text.includes('traffic') || text.includes('infrastructure'))) return true;
    if (e.includes('accessibility') && (text.includes('access') || text.includes('disab') || text.includes('ramp') || text.includes('mobility'))) return true;
    if (e.includes('public service') && (text.includes('service') || text.includes('delivery') || text.includes('governance'))) return true;

    return false;
  });
}

// Helper: 3-Month Deadline & Auto-Expiration Engine (90 Days standard SLA for Universities)
export function getDeadlineInfo(problemOrAssignment) {
  const assignedDateStr = problemOrAssignment?.assignedTo?.assignedDate || problemOrAssignment?.assignedDate;
  const status = problemOrAssignment?.status || 'Assigned';

  if (!assignedDateStr) {
    return {
      hasDeadline: false,
      deadlineMonths: 3,
      slaTimelineDays: 90,
      assignedDate: null,
      deadlineDate: null,
      daysRemaining: 90,
      daysElapsed: 0,
      isExpired: false,
      isNearDeadline: false,
      deadlineStatus: 'Not Yet Assigned',
      deadlineFormatted: '3 Months (90 Days) upon assignment'
    };
  }

  const assignedTime = new Date(assignedDateStr).getTime();
  const deadlineTime = assignedTime + (90 * 24 * 60 * 60 * 1000); // 90 days / 3 months
  const now = Date.now();
  const diffMs = deadlineTime - now;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.floor((now - assignedTime) / (1000 * 60 * 60 * 24)));

  const isCompleted = status === 'Resolved' || status === 'Verified' || status === 'Completion Submitted';
  const isExpired = !isCompleted && daysRemaining < 0;
  const isNearDeadline = !isCompleted && !isExpired && daysRemaining <= 15;

  let deadlineStatus = 'Active (On Track)';
  if (isCompleted) {
    deadlineStatus = status === 'Completion Submitted' ? 'Submitted within Deadline' : 'Successfully Resolved';
  } else if (isExpired) {
    deadlineStatus = 'Deadline Expired (Closed for University)';
  } else if (isNearDeadline) {
    deadlineStatus = 'Critical: Deadline Approaching (< 15 Days)';
  }

  return {
    hasDeadline: true,
    deadlineMonths: 3,
    slaTimelineDays: 90,
    assignedDate: new Date(assignedTime).toISOString(),
    deadlineDate: new Date(deadlineTime).toISOString(),
    daysRemaining: Math.max(0, daysRemaining),
    daysElapsed,
    daysOverdue: isExpired ? Math.abs(daysRemaining) : 0,
    isExpired,
    isNearDeadline,
    deadlineStatus,
    deadlineFormatted: new Date(deadlineTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  };
}

export const problemsService = {
  // Fetch all problems (from backend API or local cache) with domain interest filter & deadline sync
  async getAllProblems(options = {}) {
    let combined = [];
    let fetched = false;
    const { domains, userExpertise, universityId } = typeof options === 'object' ? options : {};

    try {
      const query = new URLSearchParams();
      if (domains) query.append('domains', Array.isArray(domains) ? domains.join(',') : domains);
      if (userExpertise) query.append('domains', Array.isArray(userExpertise) ? userExpertise.join(',') : userExpertise);
      if (universityId) query.append('universityId', universityId);

      const queryString = query.toString() ? `?${query.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/problems${queryString}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          combined = [...data.data];
          fetched = true;
        }
      }
    } catch (err) {
      console.warn('Backend offline, using client storage:', err.message);
    }

    if (!fetched) {
      combined = getStoredLocalProblems();
    }

    // Strictly deduplicate
    let uniqueList = deduplicateProblems(combined);

    // Sync status from active teams and industry teams
    const activeTeams = await this.getCurrentlyWorkingProjects();
    const industryTeams = await this.getIndustryTeams();
    const fundingList = await this.getFundingApprovals();

    const activeProblemIds = new Set([...activeTeams.map(t => t.problemId), ...industryTeams.map(t => t.problemId)]);
    const activeProblemTitles = new Set([...activeTeams.map(t => normalizeTitle(t.problemTitle)), ...industryTeams.map(t => normalizeTitle(t.problemTitle))]);
    const fundingProblemIds = new Set(fundingList.map(f => f.problemId));

    uniqueList = uniqueList.map(p => {
      const isWorking = activeProblemIds.has(p.id) || activeProblemTitles.has(normalizeTitle(p.title));
      const hasFunding = fundingProblemIds.has(p.id);
      const fundingInfo = fundingList.find(f => f.problemId === p.id);
      const deadlineInfo = p.deadlineInfo || getDeadlineInfo(p);

      return {
        ...p,
        status: isWorking ? 'Currently Working' : p.status,
        fundingApproved: hasFunding || p.fundingApproved,
        fundingCollaboration: fundingInfo || p.fundingCollaboration,
        deadlineInfo
      };
    });

    // Domain interest filter on client if specified
    const targetDomains = domains || userExpertise;
    if (targetDomains && Array.isArray(targetDomains) && targetDomains.length > 0) {
      uniqueList = uniqueList.filter(p => isProblemMatchingUniversityDomains(p, targetDomains));
    }

    saveLocalProblems(uniqueList);
    return uniqueList;
  },

  // Get problem by ID
  async getProblemById(id) {
    if (!id) return null;
    const cleanId = decodeURIComponent(String(id)).trim();

    // Try direct backend fetch first if available
    try {
      const res = await fetch(`${API_BASE_URL}/problems/${encodeURIComponent(cleanId)}`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {}

    const all = await this.getAllProblems();
    const idKey = cleanId.toLowerCase();
    const idHyphen = cleanId.replace(/\s+/g, '-').toLowerCase();
    const idSpaced = cleanId.replace(/-/g, ' ').toLowerCase();

    return all.find(p => {
      if (!p || !p.id) return false;
      const pid = String(p.id).trim().toLowerCase();
      return pid === idKey || pid === idHyphen || pid === idSpaced || normalizeTitle(pid) === normalizeTitle(idKey);
    }) || null;
  },

  // Get challenges submitted by the authenticated citizen (strictly isolated per user)
  async getMyChallenges(activeUser) {
    if (!activeUser) return [];
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/problems/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (err) {
      console.warn('Could not fetch user problems from backend:', err.message);
    }
    return [];
  },

  // Secure File Upload via Spring Boot validation
  async uploadMediaFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = authService.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'File upload failed');
  },

  // Submit a new Citizen Challenge
  async submitChallenge(challengeData) {
    const newProblem = {
      title: (challengeData.title || '').trim(),
      description: (challengeData.description || '').trim(),
      citizenName: (challengeData.citizenName || '').trim(),
      citizenPhone: (challengeData.citizenPhone || '').trim(),
      entityType: challengeData.entityType || 'Individual Citizen',
      submissionDate: challengeData.submissionDate || new Date().toISOString().split('T')[0],
      category: challengeData.category || 'Water Management & Drainage',
      domain: challengeData.domain || challengeData.category || 'Water Management & Drainage',
      district: challengeData.district || 'Ranchi',
      locationAddress: challengeData.locationAddress || `${challengeData.district || 'Ranchi'}, Jharkhand`,
      mediaType: challengeData.mediaType || (challengeData.mediaUrl ? 'image' : 'none'),
      mediaUrl: challengeData.mediaUrl || '',
      status: 'Pending Admin Review',
      urgency: challengeData.urgency || 'High',
      priority: challengeData.urgency || 'High'
    };

    const headers = authService.getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/problems`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newProblem)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }

    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to submit problem');
  },

  // Get currently working team projects (University)
  async getCurrentlyWorkingProjects() {
    try {
      const res = await fetch(`${API_BASE_URL}/teams`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return saveStoredTeams(data.data);
        }
      }
    } catch (e) {
      console.warn('Could not fetch teams from server, using local:', e.message);
    }
    return getStoredTeams();
  },

  // Save a university team project
  async saveTeamProject(teamData) {
    const teamProject = {
      id: `TEAM-PROJ-${Date.now()}`,
      problemId: teamData.problemId,
      problemTitle: teamData.problemTitle,
      problemCategory: teamData.problemCategory,
      district: teamData.district,
      citizenName: teamData.citizenName,
      citizenPhone: teamData.citizenPhone,
      submissionDate: teamData.submissionDate,
      universityName: teamData.universityName || 'University Innovation Lab',
      mentorName: teamData.mentorName.trim(),
      mentorDesignation: teamData.mentorDesignation.trim(),
      membersType: teamData.membersType,
      students: teamData.students || [],
      faculties: teamData.faculties || [],
      startedAt: new Date().toISOString(),
      startedDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      status: 'Currently Working'
    };

    // Save team locally
    const currentTeams = getStoredTeams();
    const updatedTeams = [teamProject, ...currentTeams.filter(t => t.problemId !== teamData.problemId)];
    saveStoredTeams(updatedTeams);

    // Update the problem status in local problems list
    const problems = getStoredLocalProblems();
    const updatedProblems = problems.map(p => {
      if (p.id === teamData.problemId || normalizeTitle(p.title) === normalizeTitle(teamData.problemTitle)) {
        return {
          ...p,
          status: 'Currently Working',
          adoptedByUniversity: teamData.universityName || 'University Innovation Lab',
          activeTeam: teamProject
        };
      }
      return p;
    });
    saveLocalProblems(updatedProblems);

    // Sync to backend
    try {
      await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamProject)
      });
    } catch (err) {
      console.warn('Team backend sync failed, saved locally:', err.message);
    }

    return teamProject;
  },

  // Get Industry Teams
  async getIndustryTeams() {
    try {
      const res = await fetch(`${API_BASE_URL}/industry/teams`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return saveStoredIndustryTeams(data.data);
        }
      }
    } catch (e) {
      console.warn('Could not fetch industry teams from server, using local:', e.message);
    }
    return getStoredIndustryTeams();
  },

  // Save an Industry Individual Team Project
  async saveIndustryTeamProject(teamData) {
    const industryProject = {
      id: `IND-PROJ-${Date.now()}`,
      problemId: teamData.problemId,
      problemTitle: teamData.problemTitle,
      problemCategory: teamData.problemCategory,
      district: teamData.district,
      citizenName: teamData.citizenName,
      citizenPhone: teamData.citizenPhone,
      companyName: teamData.companyName || 'Corporate Partner',
      teamLeadName: teamData.teamLeadName.trim(),
      teamLeadEmail: teamData.teamLeadEmail.trim(),
      teamLeadMobile: teamData.teamLeadMobile.trim(),
      teamLeadDesignation: teamData.teamLeadDesignation.trim(),
      membersCount: teamData.membersCount || (teamData.members ? teamData.members.length : 0),
      members: teamData.members || [],
      startedAt: new Date().toISOString(),
      startedDate: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      status: 'Currently Working'
    };

    const current = getStoredIndustryTeams();
    const updated = [industryProject, ...current.filter(t => t.problemId !== teamData.problemId)];
    saveStoredIndustryTeams(updated);

    // Update problem status
    const problems = getStoredLocalProblems();
    const updatedProblems = problems.map(p => {
      if (p.id === teamData.problemId || normalizeTitle(p.title) === normalizeTitle(teamData.problemTitle)) {
        return {
          ...p,
          status: 'Currently Working',
          adoptedByIndustry: teamData.companyName || 'Corporate Partner',
          industryTeam: industryProject
        };
      }
      return p;
    });
    saveLocalProblems(updatedProblems);

    // Sync to backend
    try {
      await fetch(`${API_BASE_URL}/industry/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(industryProject)
      });
    } catch (err) {}

    return industryProject;
  },

  // Get Funding Approvals (Collaborations)
  async getFundingApprovals() {
    try {
      const res = await fetch(`${API_BASE_URL}/funding-approvals`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return saveStoredFundingApprovals(data.data);
        }
      }
    } catch (e) {
      console.warn('Could not fetch funding approvals from server, using local:', e.message);
    }
    return getStoredFundingApprovals();
  },

  // Get collaborations specifically scoped to current Industry user
  async getMyCollaborations(user) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/collaborations/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch scoped collaborations from server:', e.message);
    }
    return [];
  },

  // Submit CSR Collaboration / Funding Commitment
  async submitCollaboration(collabData) {
    const headers = { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' };
    const res = await fetch(`${API_BASE_URL}/collaborations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(collabData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit collaboration commitment');
    }
    const data = await res.json();
    return data.data;
  },

  // Get Collaborations for a Problem
  async getProblemCollaborations(problemId) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/collaborations/problem/${problemId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch problem collaborations from server:', e.message);
    }
    return [];
  },

  // Save a Funding / Collaboration Approval (Industry -> University)
  async saveFundingApproval(fundingData) {
    try {
      const headers = { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_BASE_URL}/collaborations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          problemId: fundingData.problemId,
          problemTitle: fundingData.problemTitle,
          universityId: fundingData.universityId,
          universityName: fundingData.universityName,
          solutionId: fundingData.solutionId,
          solutionTitle: fundingData.solutionTitle,
          companyName: fundingData.companyName,
          fundingAmount: fundingData.fundingAmount,
          equipmentSupport: fundingData.equipmentSupport,
          technicalSupport: fundingData.technicalSupport,
          csrCommitmentDetails: fundingData.csrCommitmentDetails || fundingData.collaborationNotes,
          csrDocUrl: fundingData.csrDocUrl,
          supportTypes: fundingData.supportTypes || fundingData.offers,
          contactEmail: fundingData.officialEmail,
          contactPhone: fundingData.phoneNumber
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (err) {
      console.warn('Funding approval backend sync error:', err.message);
    }

    return fundingData;
  },

  // Get challenges submitted specifically by the current citizen user
  async getMyChallenges(user) {
    if (!user) return [];
    try {
      const query = new URLSearchParams();
      if (user.id) query.append('userId', user.id);
      if (user.email) query.append('citizenEmail', user.email);
      if (user.phone) query.append('citizenPhone', user.phone);

      const res = await fetch(`${API_BASE_URL}/problems?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data.filter(p => 
            p.userId === user.id || 
            (user.email && p.citizenEmail && p.citizenEmail.toLowerCase() === user.email.toLowerCase()) ||
            (user.phone && p.citizenPhone === user.phone)
          );
        }
      }
    } catch (err) {
      console.warn('Backend fetch for citizen problems notice:', err.message);
    }

    const localList = getStoredLocalProblems();
    return localList.filter(p => 
      p.userId === user.id || 
      (user.email && p.citizenEmail && p.citizenEmail.toLowerCase() === user.email.toLowerCase()) ||
      (user.phone && p.citizenPhone === user.phone)
    );
  },

  // =========================================================================
  // TENANT-ISOLATED UNIVERSITY & INDUSTRY API METHODS
  // =========================================================================

  // Fetch strictly isolated university profile
  async getUniversityProfile() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/university/me`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch university profile:', e.message);
    }
    return null;
  },

  // Fetch problems strictly matched/assigned to the authenticated university
  async getUniversityMatchedProblems() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/problems/matched`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch matched university problems:', e.message);
    }
    return [];
  },

  // Fetch proposals submitted by the authenticated university
  async getUniversityProposals() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/university/solutions/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch university proposals:', e.message);
    }
    return [];
  },

  // Fetch collaborations involving the authenticated university
  async getUniversityCollaborations() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/university/collaborations/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch university collaborations:', e.message);
    }
    return [];
  },

  // Fetch projects assigned to the authenticated university
  async getUniversityProjects() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/university/projects/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch university projects:', e.message);
    }
    return [];
  },

  // Fetch isolated metrics for the authenticated university
  async getUniversityMetrics() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/university/metrics`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('University metrics backend sync notice:', e.message);
    }
    return {
      matchedProblems: 0,
      myProposals: 0,
      acceptedProposals: 0,
      activeCollaborations: 0,
      activeProjects: 0,
      completedProjects: 0
    };
  },

  // Fetch strictly isolated industry profile
  async getIndustryProfile() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/industry/me`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch industry profile:', e.message);
    }
    return null;
  },

  // Fetch matched opportunities strictly for the authenticated industry
  async getIndustryMatchedOpportunities() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/industry/problems/matched`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch matched industry opportunities:', e.message);
    }
    return [];
  },

  // Fetch proposals submitted by the authenticated industry
  async getIndustryProposals() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/industry/proposals/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch industry proposals:', e.message);
    }
    return [];
  },

  // Fetch collaborations involving the authenticated industry
  async getIndustryCollaborations() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/collaborations/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch industry collaborations:', e.message);
    }
    return [];
  },

  // Fetch projects involving the authenticated industry
  async getIndustryProjects() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/industry/projects/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch industry projects:', e.message);
    }
    return [];
  },

  // Fetch isolated metrics for the authenticated industry
  async getIndustryMetrics() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/industry/metrics`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Industry metrics backend sync notice:', e.message);
    }
    return {
      matchedOpportunities: 0,
      csrCommitments: 0,
      myProposals: 0,
      activeCollaborations: 0,
      activeProjects: 0,
      totalFundingCommitted: 0,
      totalFundingCommittedFormatted: '₹ 0 Lakhs'
    };
  },

  // Legacy getMetrics wrapper
  async getMetrics(user) {
    return this.getUniversityMetrics();
  },

  // Get submitted solutions for a problem statement
  async getSubmittedSolutionsForProblem(problemId, problemTitle) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/solutions/problem/${encodeURIComponent(problemId)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch problem solutions from backend:', e.message);
    }

    const localProposals = getStoredProposals();
    if (problemId) {
      return localProposals.filter(p => p.problemId === problemId);
    }
    return localProposals;
  },

  // =========================================================================
  // SOLUTION PROPOSAL LIFECYCLE CLIENT METHODS
  // =========================================================================

  // Fetch proposals (scoped to authenticated user or filtered by params)
  async getProposals(params = {}, user = null) {
    const activeUser = user || authService.getCurrentUser();
    const token = authService.getToken();
    const headers = authService.getAuthHeaders();

    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/solutions/mine`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            return data.data;
          }
        }
      } catch (e) {
        console.warn('Could not fetch user proposals from /solutions/mine:', e.message);
      }
    }

    try {
      const query = new URLSearchParams();
      if (params.problemId) query.append('problemId', params.problemId);
      if (params.universityName) query.append('universityName', params.universityName);
      if (params.status) query.append('status', params.status);

      const res = await fetch(`${API_BASE_URL}/proposals?${query.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch proposals from server:', e.message);
    }

    const local = getStoredProposals();
    if (activeUser?.id) {
      return local.filter(p => p.userId === activeUser.id || p.universityName === activeUser.universityName);
    }
    return local;
  },

  // Get single proposal by ID
  async getProposalById(id) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/solutions/${encodeURIComponent(id)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) return data.data;
      }
    } catch (e) {
      console.warn('Could not fetch proposal by ID:', e.message);
    }
    const local = getStoredProposals();
    return local.find(p => p.id === id) || null;
  },

  // Submit a new university solution proposal
  async submitProposal(proposalData) {
    const headers = authService.getAuthHeaders();
    try {
      const res = await fetch(`${API_BASE_URL}/solutions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(proposalData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit proposal');
      }
      return data.data;
    } catch (err) {
      console.error('Error submitting proposal:', err);
      throw err;
    }
  },

  // Revise & resubmit proposal (after Modification Requested)
  async updateProposal(proposalId, updateData) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/proposals/${proposalId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to revise proposal');
      }
      return data.data;
    } catch (err) {
      console.error('Error updating proposal:', err);
      throw err;
    }
  },

  // Update project milestones and progress %
  async updateProjectProgress(problemId, progressData) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/projects/${problemId}/progress`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(progressData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update progress');
      }
      return data.data;
    } catch (err) {
      console.error('Error updating project progress:', err);
      throw err;
    }
  },

  // Submit project completion
  async submitProjectCompletion(problemId, completionData) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/projects/${problemId}/submit-completion`, {
        method: 'POST',
        headers,
        body: JSON.stringify(completionData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit project completion');
      }
      return data.data;
    } catch (err) {
      console.error('Error submitting project completion:', err);
      throw err;
    }
  },

  // Admin Proceeds Problem Statement to Universities & Industries
  async adminProceedProblem(problemId) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/admin/problems/${problemId}/proceed`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        const currentList = getStoredLocalProblems();
        const updated = currentList.map(p => p.id === problemId ? { ...p, status: 'Approved for Matching' } : p);
        saveLocalProblems(updated);
        return data.data;
      }
    } catch (e) {
      console.warn('Backend proceed notice:', e.message);
    }

    const currentList = getStoredLocalProblems();
    const updated = currentList.map(p => p.id === problemId ? { ...p, status: 'Approved for Matching' } : p);
    saveLocalProblems(updated);
    return updated.find(p => p.id === problemId) || null;
  },

  // Submit an Idea / Solution for University or Industry
  async submitIdeaSolution(payload) {
    let headers = authService.getAuthHeaders();
    try {
      let res = await fetch(`${API_BASE_URL}/solutions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      // If 403 Forbidden due to stale/expired token, retry once without Authorization header
      if (res.status === 403) {
        console.warn('403 encountered on /solutions, retrying anonymously without stale token...');
        res = await fetch(`${API_BASE_URL}/solutions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data && data.data) {
          // Cache successful solution locally
          const localProposals = getStoredProposals();
          saveStoredProposals([data.data, ...localProposals.filter(p => p.id !== data.data.id)]);
          return data.data;
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn('Backend returned non-OK status on /solutions:', res.status, errorData);
      }
    } catch (err) {
      console.warn('Network or server error while submitting idea solution to backend:', err);
    }

    // Resilient fallback: Save to local storage cache so proposal is never lost
    const fallbackSol = {
      id: `SOL-${Date.now()}`,
      problemId: payload.problemId,
      problemTitle: payload.problemTitle || 'Civic Problem Challenge',
      category: payload.category || 'General Civic Infrastructure',
      domain: payload.domain || payload.category || 'General Civic Infrastructure',
      submitterType: payload.submitterType || 'university',
      universityId: payload.universityId || '',
      universityName: payload.universityName || 'University Research Lab',
      companyId: payload.companyId || '',
      companyName: payload.companyName || '',
      teamLeadName: payload.teamLeadName || payload.mentorName || 'Lead Researcher',
      teamLeadEmail: payload.teamLeadEmail || payload.mentorEmail || '',
      teamLeadMobile: payload.teamLeadMobile || payload.mentorPhone || '',
      teamLeadDesignation: payload.teamLeadDesignation || payload.mentorDesignation || 'Project Lead',
      solutionTitle: payload.solutionTitle || 'Proposed Solution Blueprint',
      description: payload.description || payload.technicalApproach || '',
      technicalApproach: payload.technicalApproach || payload.description || '',
      estimatedCost: payload.estimatedCost || '₹ 4.5 Lakhs',
      estimatedTimeWeeks: payload.estimatedTimeWeeks || 6,
      milestones: payload.milestones || [],
      files: payload.files || [],
      folderLink: payload.folderLink || '',
      students: payload.students || [],
      faculties: payload.faculties || [],
      members: payload.members || [],
      status: 'Under Review',
      submittedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    const localProposals = getStoredProposals();
    saveStoredProposals([fallbackSol, ...localProposals.filter(p => p.id !== fallbackSol.id)]);
    return fallbackSol;
  },

  // Get all submitted solutions (both university & industry) for a problem
  async getSolutions(problemId) {
    try {
      const headers = authService.getAuthHeaders();
      const url = problemId ? `${API_BASE_URL}/solutions/problem/${encodeURIComponent(problemId)}` : `${API_BASE_URL}/solutions`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {}

    const localProposals = getStoredProposals();
    if (problemId) {
      return localProposals.filter(p => p.problemId === problemId);
    }
    return localProposals;
  },

  // Admin combines university with industry
  async combineUniversityAndIndustry(payload) {
    const collabId = `COLLAB-${Date.now()}`;
    const newCollab = {
      id: collabId,
      problemId: payload.problemId,
      problemTitle: payload.problemTitle,
      category: payload.category || 'General Civic',
      domain: payload.domain || payload.category || 'General Civic',
      universityId: payload.universityId,
      universityName: payload.universityName,
      universitySolution: payload.universitySolution || {},
      industryId: payload.industryId,
      companyName: payload.companyName,
      industrySolution: payload.industrySolution || {},
      status: 'Active Collaboration',
      collaborationNotes: payload.notes || 'Combined by State Administration.',
      messages: [
        {
          id: `MSG-WELCOME`,
          senderType: 'system',
          senderName: 'Govt. Administration System',
          message: `Official collaboration established between ${payload.universityName} and ${payload.companyName}. Coordinate deliverables here.`,
          timestamp: new Date().toISOString()
        }
      ],
      updates: [],
      finalSubmission: null,
      adminWorkSanction: null,
      collaboratedDate: new Date().toISOString().split('T')[0],
      collaboratedAt: new Date().toISOString()
    };

    const currentCollabs = getStoredCollaborations();
    saveStoredCollaborations([newCollab, ...currentCollabs.filter(c => c.problemId !== payload.problemId)]);

    // Update Problem Status locally
    const currentProblems = getStoredLocalProblems();
    const updatedProblems = currentProblems.map(p => {
      if (p.id === payload.problemId) {
        return {
          ...p,
          status: 'Currently Working',
          adoptedByUniversity: payload.universityName,
          adoptedByIndustry: payload.companyName,
          collaboration: newCollab
        };
      }
      return p;
    });
    saveLocalProblems(updatedProblems);

    // Sync to backend
    try {
      const res = await fetch(`${API_BASE_URL}/admin/combine-collaboration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) return data.data;
      }
    } catch (e) {
      console.warn('Backend combine notice:', e.message);
    }

    return newCollab;
  },

  // Get active collaborations
  async getCollaborations(filters = {}, activeUser = null) {
    let serverCollabs = [];
    try {
      const headers = authService.getAuthHeaders();
      const query = new URLSearchParams();
      if (filters.problemId) query.append('problemId', filters.problemId);
      if (filters.universityId) query.append('universityId', filters.universityId);
      if (filters.industryId) query.append('industryId', filters.industryId);
      if (filters.universityName) query.append('universityName', filters.universityName);
      if (filters.companyName) query.append('companyName', filters.companyName);
      const res = await fetch(`${API_BASE_URL}/collaborations?${query.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          serverCollabs = data.data;
          saveStoredCollaborations(data.data);
        }
      }
    } catch (e) {}

    const stored = getStoredCollaborations();
    const map = new Map();
    [...stored, ...serverCollabs].forEach(c => {
      if (c && (c.id || c.problemId)) {
        const key = c.id || c.problemId;
        map.set(key, { ...(map.get(key) || {}), ...c });
      }
    });

    let result = Array.from(map.values());
    if (filters.problemId) result = result.filter(c => c.problemId === filters.problemId);
    if (filters.universityId) result = result.filter(c => c.universityId === filters.universityId);
    if (filters.industryId) result = result.filter(c => c.industryId === filters.industryId);
    if (filters.universityName) {
      const uName = filters.universityName.toLowerCase();
      result = result.filter(c => !c.universityName || c.universityName.toLowerCase().includes(uName) || uName.includes((c.universityName || '').toLowerCase()));
    }
    if (filters.companyName) {
      const cName = filters.companyName.toLowerCase();
      result = result.filter(c => !c.companyName || c.companyName.toLowerCase().includes(cName) || cName.includes((c.companyName || '').toLowerCase()));
    }
    return result;
  },

  // Get collaborations scoped to currently logged in industry user
  async getMyCollaborations() {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/collaborations/mine`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {
      console.warn('Error fetching my collaborations:', e);
    }
    return [];
  },

  // Submit industry CSR commitment / collaboration proposal
  async submitCollaboration(payload) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/collaborations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit collaboration proposal');
      }
      return data.data;
    } catch (err) {
      console.error('Error submitting collaboration:', err);
      throw err;
    }
  },

  // Get collaboration by ID or problemId
  async getCollaborationById(id) {
    try {
      const headers = authService.getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/collaborations/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) return data.data;
      }
    } catch (e) {}

    const stored = getStoredCollaborations();
    return stored.find(c => c.id === id || c.problemId === id) || null;
  },

  // Send collaboration message
  async sendCollaborationMessage({ collabId, senderType, senderName, message }) {
    const newMsg = {
      id: `MSG-${Date.now()}`,
      senderType,
      senderName,
      message,
      timestamp: new Date().toISOString()
    };

    const collabs = getStoredCollaborations();
    const cIndex = collabs.findIndex(c => c.id === collabId || c.problemId === collabId);
    if (cIndex !== -1) {
      if (!collabs[cIndex].messages) collabs[cIndex].messages = [];
      collabs[cIndex].messages.push(newMsg);
      saveStoredCollaborations(collabs);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/${collabId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType, senderName, message })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) return data.data;
      }
    } catch (e) {}

    return newMsg;
  },

  // Post collaboration progress update
  async postCollaborationUpdate({ collabId, authorType, authorName, description, folderLink, files }) {
    const newUpdate = {
      id: `UPD-${Date.now()}`,
      authorType,
      authorName,
      description,
      folderLink: folderLink || '',
      files: files || (folderLink ? [{ name: 'Project_Update_Folder.url', size: '1 KB', type: 'link', url: folderLink }] : []),
      timestamp: new Date().toISOString()
    };

    const collabs = getStoredCollaborations();
    const cIndex = collabs.findIndex(c => c.id === collabId || c.problemId === collabId);
    if (cIndex !== -1) {
      if (!collabs[cIndex].updates) colllabs[cIndex].updates = [];
      collabs[cIndex].updates.unshift(newUpdate);
      saveStoredCollaborations(collabs);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/${collabId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorType, authorName, description, folderLink, files })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) return data.data;
      }
    } catch (e) {}

    return newUpdate;
  },

  // Submit final deliverables to Admin
  async submitFinalDeliverables({ collabId, authorType, authorName, finalDescription, folderLink, files }) {
    const finalSub = {
      authorType,
      authorName,
      finalDescription,
      folderLink: folderLink || '',
      files: files || (folderLink ? [{ name: 'Final_Project_Folder_Deliverables.zip', size: '15.4 MB', type: 'zip', url: folderLink }] : []),
      submittedAt: new Date().toISOString()
    };

    const collabs = getStoredCollaborations();
    const cIndex = collabs.findIndex(c => c.id === collabId || c.problemId === collabId);
    if (cIndex !== -1) {
      collabs[cIndex].finalSubmission = finalSub;
      collabs[cIndex].status = 'Final Deliverables Submitted';
      saveStoredCollaborations(collabs);
    }

    const problems = getStoredLocalProblems();
    const pIndex = problems.findIndex(p => p.id === collabs[cIndex]?.problemId || p.id === collabId);
    if (pIndex !== -1) {
      problems[pIndex].status = 'Completion Submitted';
      saveLocalProblems(problems);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/${collabId}/final-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorType, authorName, finalDescription, folderLink, files })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) return data.data;
      }
    } catch (e) {}

    return finalSub;
  },

  // Admin Proceeds with work (Sanction & Deployment)
  async adminProceedWithWork({ collabId, sanctionedBy, notes, workOrderNumber }) {
    const sanction = {
      sanctionedBy: sanctionedBy || 'State Administrative Authority',
      notes: notes || 'Verified and sanctioned for deployment.',
      workOrderNumber: workOrderNumber || `JH-WO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      sanctionedAt: new Date().toISOString()
    };

    const collabs = getStoredCollaborations();
    const cIndex = collabs.findIndex(c => c.id === collabId || c.problemId === collabId);
    if (cIndex !== -1) {
      collabs[cIndex].adminWorkSanction = sanction;
      collabs[cIndex].status = 'Work Approved & Deployed';
      saveStoredCollaborations(collabs);
    }

    const problems = getStoredLocalProblems();
    const pIndex = problems.findIndex(p => p.id === collabs[cIndex]?.problemId || p.id === collabId);
    if (pIndex !== -1) {
      problems[pIndex].status = 'Resolved';
      problems[pIndex].workOrder = sanction;
      saveLocalProblems(problems);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/collaborations/${collabId}/proceed-work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sanctionedBy, notes, workOrderNumber })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) return data.data;
      }
    } catch (e) {}

    return sanction;
  },

  // Citizen Clarification / More Info Response
  async respondToInformationRequest(problemId, payload) {
    const res = await fetch(`${API_BASE_URL}/problems/${encodeURIComponent(problemId)}/respond-info`, {
      method: 'POST',
      headers: { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  // University Profile & Capability Registry
  async getUniversityProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/university/me`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {}
    return null;
  },

  async updateUniversityProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/university/profile`, {
      method: 'PUT',
      headers: { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    const json = await res.json();
    return json.data || json;
  },

  async getUniversityMatchedProblems() {
    try {
      const res = await fetch(`${API_BASE_URL}/university/problems/matched`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  },

  async getUniversityMetrics() {
    try {
      const res = await fetch(`${API_BASE_URL}/university/metrics`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || {};
      }
    } catch (e) {}
    return {};
  },

  async getUniversityProposals() {
    try {
      const res = await fetch(`${API_BASE_URL}/university/solutions/mine`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  },

  async getUniversityCollaborations() {
    try {
      const res = await fetch(`${API_BASE_URL}/university/collaborations/mine`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  },

  async getUniversityProjects() {
    try {
      const res = await fetch(`${API_BASE_URL}/university/projects/mine`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  },

  // Industry Profile & CSR Capability Registry
  async getIndustryProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/industry/me`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {}
    return null;
  },

  async updateIndustryProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/industry/profile`, {
      method: 'PUT',
      headers: { ...authService.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    const json = await res.json();
    return json.data || json;
  },

  async getIndustryMatchedProblems(params) {
    try {
      const query = params ? new URLSearchParams(params).toString() : '';
      const res = await fetch(`${API_BASE_URL}/industry/problems/matched${query ? '?' + query : ''}`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  },

  async getIndustryMetrics() {
    try {
      const res = await fetch(`${API_BASE_URL}/industry/metrics`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || {};
      }
    } catch (e) {}
    return {};
  },

  async getIndustryProjects() {
    try {
      const res = await fetch(`${API_BASE_URL}/industry/projects/mine`, {
        headers: { ...authService.getAuthHeaders() }
      });
      if (res.ok) {
        const json = await res.json();
        return json.data || [];
      }
    } catch (e) {}
    return [];
  }
};


export const JHARKHAND_DISTRICTS = [
  'Bokaro',
  'Chatra',
  'Deoghar',
  'Dhanbad',
  'Dumka',
  'East Singhbhum (Jamshedpur)',
  'Garhwa',
  'Giridih',
  'Godda',
  'Gumla',
  'Hazaribagh',
  'Jamtara',
  'Khunti',
  'Koderma',
  'Latehar',
  'Lohardaga',
  'Pakur',
  'Palamu',
  'Ramgarh',
  'Ranchi',
  'Sahibganj',
  'Seraikela Kharsawan',
  'Simdega',
  'West Singhbhum (Chaibasa)'
];

export const PROBLEM_CATEGORIES = [
  'Education',
  'Healthcare',
  'Agriculture',
  'Water Management',
  'Sanitation',
  'Environment',
  'Rural Livelihoods',
  'Accessibility',
  'Urban Infrastructure',
  'Public Service Delivery',
  'Waste Management',
  'Unknown/Other'
];
