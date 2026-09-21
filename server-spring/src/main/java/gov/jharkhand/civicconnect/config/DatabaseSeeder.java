package gov.jharkhand.civicconnect.config;

import gov.jharkhand.civicconnect.model.*;
import gov.jharkhand.civicconnect.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    @Autowired
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UniversityRepository universityRepository;

    @Autowired
    private IndustryRepository industryRepository;

    @Autowired
    private SolutionRepository solutionRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private CollaborationRepository collaborationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AIAnalysisRepository aiAnalysisRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            ensureAllCollectionsExist();
            purgeUnwantedHardcodedData();
            seedUniversities();
            seedIndustries();
            seedUsers();
            seedProblems();
            seedSolutions();
            seedAssignments();
            seedCollaborations();
            seedProjects();
            seedNotifications();
            seedAiAnalysis();
            logger.info("✅ MongoDB Database cleanly synced with user-provided problems & universities.");
        } catch (Exception e) {
            logger.error("❌ MongoDB Database initialization error: {}", e.getMessage(), e);
        }
    }

    private void ensureAllCollectionsExist() {
        List<String> collections = List.of(
                "users", "problems", "universities", "industries", "solutions",
                "projects", "collaborations", "mcp_tokens", "ai_analysis",
                "audit_logs", "notifications", "feedback", "assignments"
        );
        for (String col : collections) {
            if (!mongoTemplate.collectionExists(col)) {
                mongoTemplate.createCollection(col);
                logger.info("Created MongoDB collection: {}", col);
            }
        }
    }

    private void purgeUnwantedHardcodedData() {
        Set<String> validUnivIds = Set.of("UNI-JH-001", "UNI-JH-002");
        universityRepository.findAll().stream()
                .filter(u -> !validUnivIds.contains(u.getId()))
                .forEach(u -> universityRepository.deleteById(u.getId()));

        Set<String> validIndIds = Set.of("IND-JH-001", "IND-JH-002");
        industryRepository.findAll().stream()
                .filter(i -> !validIndIds.contains(i.getId()))
                .forEach(i -> industryRepository.deleteById(i.getId()));

        Set<String> validProblemIds = Set.of("JH-CHLG-2026-1001", "JH-CHLG-2026-1002");
        problemRepository.findAll().stream()
                .filter(p -> !validProblemIds.contains(p.getId()))
                .forEach(p -> problemRepository.deleteById(p.getId()));

        Set<String> validSolutionIds = Set.of("SOL-1001-JIAT", "SOL-1002-JIHC");
        solutionRepository.findAll().stream()
                .filter(s -> !validSolutionIds.contains(s.getId()))
                .forEach(s -> solutionRepository.deleteById(s.getId()));

        Set<String> validCollabIds = Set.of("COLLAB-1001-AGRI-AQUA", "COLLAB-1002-HLTH-GVOLT");
        collaborationRepository.findAll().stream()
                .filter(c -> !validCollabIds.contains(c.getId()))
                .forEach(c -> collaborationRepository.deleteById(c.getId()));

        Set<String> validProjectIds = Set.of("PRJ-JH-2026-1001", "PRJ-JH-2026-1002");
        projectRepository.findAll().stream()
                .filter(p -> !validProjectIds.contains(p.getId()))
                .forEach(p -> projectRepository.deleteById(p.getId()));

        logger.info("Purged unwanted hardcoded records from MongoDB.");
    }

    private void seedUniversities() {
        University u1 = new University(
                "UNI-JH-001",
                "Jharkhand Institute of Agricultural Technology",
                "Ranchi, Jharkhand", 23.3441, 85.3096,
                List.of("Agricultural Engineering", "Soil Science", "Environmental Engineering"),
                List.of("Smart irrigation", "soil monitoring", "crop disease detection", "water conservation", "Agriculture", "Water Management"),
                1, "NAAC A Grade / ICAR Approved", 40, 6
        );
        u1.setFacultyExpertise(List.of("IoT Sensors", "ESP32", "Python", "Machine Learning", "GIS Mapping"));
        u1.setLabs(List.of("Water Quality Testing Lab", "Precision Agriculture IoT Center"));
        u1.setTechnologies(List.of("IoT sensors", "ESP32", "Python", "Machine Learning", "MongoDB", "GIS"));
        u1.setAvailableResearchCapabilities("Smart Rural Water Quality Monitoring & Purification System R&D");
        u1.setContactPerson("Dr. Ramesh K. Soren");
        u1.setContactEmail("agri.university@test.civicconnect.in");
        u1.setContactPhone("+91 94311 11001");

        University u2 = new University(
                "UNI-JH-002",
                "Jharkhand Institute of Health & Computing",
                "East Singhbhum, Jharkhand", 22.8046, 86.2029,
                List.of("Computer Science", "Biomedical Engineering", "Public Health"),
                List.of("Healthcare AI", "telemedicine", "medical data analysis", "Healthcare", "AI / Digital Services"),
                2, "NAAC A+ Grade / Tier 1 NBA", 35, 5
        );
        u2.setFacultyExpertise(List.of("Healthcare Informatics", "Biomedical Signal Processing", "Telemedicine"));
        u2.setLabs(List.of("Digital Health Innovation Lab", "Medical Telemetry Center"));
        u2.setTechnologies(List.of("Telemedicine Platform", "ECG Diagnostics", "Cloud Health Records"));
        u2.setAvailableResearchCapabilities("AI-Powered Telemedicine & Remote Diagnostic Health Kiosk R&D");
        u2.setContactPerson("Dr. Ananya Sen");
        u2.setContactEmail("health.university@test.civicconnect.in");
        u2.setContactPhone("+91 94311 22002");

        for (University u : List.of(u1, u2)) {
            universityRepository.save(u);
        }
        logger.info("Seeded user-specified universities (UNI-JH-001, UNI-JH-002) to MongoDB.");
    }

    private void seedIndustries() {
        IndustryPartner ind1 = new IndustryPartner(
                "IND-JH-001",
                "AquaGrid Infrastructure Solutions",
                "Bokaro, Jharkhand",
                "CSR Lead & Operations Director",
                "aquagrid.industry@test.civicconnect.in",
                "+91 94340 33001",
                List.of("Water Management", "Infrastructure", "Water treatment", "smart water monitoring"),
                "₹ 75 Lakhs", 3, "Verified State Partner", new ArrayList<>()
        );
        ind1.setCsrFocus(List.of("Drinking Water Purification", "Rural Water Supply"));
        ind1.setManufacturingCapability("Turnkey Water Purification Plants and Sensor Enclosures");
        ind1.setFundingCapability("₹ 75 Lakhs");

        IndustryPartner ind2 = new IndustryPartner(
                "IND-JH-002",
                "GreenVolt Energy Systems",
                "Dhanbad, Jharkhand",
                "Head of CSR & Sustainability",
                "greenvolt.industry@test.civicconnect.in",
                "+91 94317 44002",
                List.of("Healthcare", "AI / Digital Services", "Renewable Energy", "Rural Development", "Solar energy"),
                "₹ 1.2 Crore", 5, "Verified State Partner", new ArrayList<>()
        );
        ind2.setCsrFocus(List.of("Rural Healthcare Clinics", "Solar-Powered Medical Kiosks"));
        ind2.setManufacturingCapability("Solar Power Backup & Hardware Telemetry Enclosures");
        ind2.setFundingCapability("₹ 1.2 Crore");

        for (IndustryPartner ind : List.of(ind1, ind2)) {
            industryRepository.save(ind);
        }
        logger.info("Seeded user-specified industries (IND-JH-001, IND-JH-002) to MongoDB.");
    }

    private void seedProblems() {
        // Problem 1: Unsafe Drinking Water in Rural Village
        Problem p1 = new Problem();
        p1.setId("JH-CHLG-2026-1001");
        p1.setTitle("Unsafe Drinking Water in Rural Village");
        p1.setCategory("Water Management");
        p1.setDomain("Water Management");
        p1.setDescription("Residents of a rural village are facing poor drinking-water quality. The existing water source frequently becomes contaminated and residents need a reliable water-quality monitoring and purification solution.");
        p1.setCitizenName("Rural Community Representative");
        p1.setCitizenPhone("+91 94311 87290");
        p1.setSubmissionDate("2026-09-21");
        p1.setDistrict("Ranchi");
        p1.setLocationAddress("Rural Village, Ranchi, Jharkhand");
        p1.setMediaType("image");
        p1.setMediaUrl("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80");
        p1.setStatus("Broadcasted to Universities");
        p1.setApprovalStatus("APPROVED_FOR_MATCHING");
        p1.setUrgency("High");
        p1.setPriority("High");
        p1.setCreatedAt("2026-09-21T10:00:00.000Z");
        p1.setAiStatus("Analyzed");
        p1.setDuplicateStatus("Unique (0% duplicate match)");
        p1.setMatchedUniversitiesCount(1);
        p1.setMatchedUniversityIds(List.of("UNI-JH-001", "Jharkhand Institute of Agricultural Technology"));
        p1.setMatchedIndustryIds(List.of("IND-JH-001", "AquaGrid Infrastructure Solutions"));
        p1.setAdoptedByUniversity("Jharkhand Institute of Agricultural Technology");
        p1.setAdoptedByIndustry("AquaGrid Infrastructure Solutions");
        p1.setSolutionsCount(1);
        p1.setAiVerification("Valid");
        p1.setAiConfidence("97.5%");
        p1.setAiConfidenceValue(0.975);
        p1.setAiReason("High-priority rural drinking water quality degradation requiring smart sensor monitoring and purification solution.");
        p1.setKeywords(List.of("Water Management", "Smart irrigation", "water conservation", "water-quality sensors", "purification"));

        // Problem 2: Lack of Remote Healthcare Access in Rural Area
        Problem p2 = new Problem();
        p2.setId("JH-CHLG-2026-1002");
        p2.setTitle("Lack of Remote Healthcare Access in Rural Area");
        p2.setCategory("Healthcare");
        p2.setDomain("Healthcare");
        p2.setDescription("People in remote villages have difficulty accessing specialist doctors. A digital healthcare and remote consultation system is required to connect patients with healthcare professionals.");
        p2.setCitizenName("Village Health Committee");
        p2.setCitizenPhone("+91 94311 22002");
        p2.setSubmissionDate("2026-09-21");
        p2.setDistrict("East Singhbhum");
        p2.setLocationAddress("Remote Rural Area, East Singhbhum, Jharkhand");
        p2.setMediaType("image");
        p2.setMediaUrl("https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=800&q=80");
        p2.setStatus("Broadcasted to Universities");
        p2.setApprovalStatus("APPROVED_FOR_MATCHING");
        p2.setUrgency("High");
        p2.setPriority("High");
        p2.setCreatedAt("2026-09-21T11:00:00.000Z");
        p2.setAiStatus("Analyzed");
        p2.setDuplicateStatus("Unique (0% duplicate match)");
        p2.setMatchedUniversitiesCount(1);
        p2.setMatchedUniversityIds(List.of("UNI-JH-002", "Jharkhand Institute of Health & Computing"));
        p2.setMatchedIndustryIds(List.of("IND-JH-002", "GreenVolt Energy Systems"));
        p2.setAdoptedByUniversity("Jharkhand Institute of Health & Computing");
        p2.setAdoptedByIndustry("GreenVolt Energy Systems");
        p2.setSolutionsCount(1);
        p2.setAiVerification("Valid");
        p2.setAiConfidence("96.8%");
        p2.setAiConfidenceValue(0.968);
        p2.setAiReason("High-priority rural digital healthcare and telemedicine access requirement.");
        p2.setKeywords(List.of("Healthcare", "Healthcare AI", "telemedicine", "medical data analysis", "medical sensors"));

        problemRepository.save(p1);
        problemRepository.save(p2);
        logger.info("Seeded user-specified problems (JH-CHLG-2026-1001, JH-CHLG-2026-1002) to MongoDB.");
    }

    private void seedSolutions() {
        Solution s1 = new Solution();
        s1.setId("SOL-1001-JIAT");
        s1.setProblemId("JH-CHLG-2026-1001");
        s1.setProblemTitle("Unsafe Drinking Water in Rural Village");
        s1.setUniversityId("UNI-JH-001");
        s1.setUniversityName("Jharkhand Institute of Agricultural Technology");
        s1.setDepartment("Agricultural Engineering & Water Sciences");
        s1.setSolutionTitle("Smart IoT-Based Rural Water Quality Monitoring & Purification System");
        s1.setTechnicalApproach("Develop a low-cost system to continuously monitor drinking-water quality and identify contamination at village water sources. Includes IoT water-quality sensors, pH, turbidity and TDS monitoring, real-time dashboard, GIS-based water-source mapping, automatic contamination alerts, and water purification recommendation.");
        s1.setEstimatedCost("₹ 30 Lakhs");
        s1.setEstimatedTimeWeeks(12);
        s1.setRelevanceScore(97);
        s1.setFeasibilityScore(94);
        s1.setTechnicalQualityScore(96);
        s1.setImpactScore(98);
        s1.setSubmittedDate("2026-09-21");
        s1.setMentorName("Dr. Ramesh K. Soren");
        s1.setMentorDesignation("Dean, Agricultural Engineering & Water Systems");
        s1.setMentorEmail("agri.university@test.civicconnect.in");
        s1.setMentorPhone("+91 94311 11001");
        s1.setTeamMembersCount(5);
        s1.setStatus("Submitted");

        Solution s2 = new Solution();
        s2.setId("SOL-1002-JIHC");
        s2.setProblemId("JH-CHLG-2026-1002");
        s2.setProblemTitle("Lack of Remote Healthcare Access in Rural Area");
        s2.setUniversityId("UNI-JH-002");
        s2.setUniversityName("Jharkhand Institute of Health & Computing");
        s2.setDepartment("Biomedical Engineering & AI Lab");
        s2.setSolutionTitle("AI-Powered Telemedicine & Remote Diagnostic Health Kiosk for Rural Clinics");
        s2.setTechnicalApproach("Solar-compatible digital telemedicine kiosk equipped with automated ECG, SpO2, and blood pressure telemetry, integrated with AI diagnostic triage assistance and video link to specialist doctors.");
        s2.setEstimatedCost("₹ 28 Lakhs");
        s2.setEstimatedTimeWeeks(10);
        s2.setRelevanceScore(96);
        s2.setFeasibilityScore(93);
        s2.setTechnicalQualityScore(95);
        s2.setImpactScore(97);
        s2.setSubmittedDate("2026-09-21");
        s2.setMentorName("Dr. Ananya Sen");
        s2.setMentorDesignation("Head of Biomedical Computing");
        s2.setMentorEmail("health.university@test.civicconnect.in");
        s2.setMentorPhone("+91 94311 22002");
        s2.setTeamMembersCount(4);
        s2.setStatus("Submitted");

        solutionRepository.save(s1);
        solutionRepository.save(s2);
        logger.info("Seeded user-specified proposals (SOL-1001-JIAT, SOL-1002-JIHC) to MongoDB.");
    }

    private void seedAssignments() {
        assignmentRepository.deleteAll();
    }

    private void seedCollaborations() {
        Collaboration c1 = new Collaboration();
        c1.setId("COLLAB-1001-AGRI-AQUA");
        c1.setProblemId("JH-CHLG-2026-1001");
        c1.setProblemTitle("Unsafe Drinking Water in Rural Village");
        c1.setCategory("Water Management");
        c1.setDomain("Water Management");
        c1.setUniversityId("UNI-JH-001");
        c1.setUniversityName("Jharkhand Institute of Agricultural Technology");
        c1.setDepartment("Agricultural Engineering & Water Sciences");
        c1.setIndustryId("IND-JH-001");
        c1.setCompanyName("AquaGrid Infrastructure Solutions");
        c1.setContactPerson("CSR Lead & Operations Director");
        c1.setContactEmail("aquagrid.industry@test.civicconnect.in");
        c1.setContactPhone("+91 94340 33001");
        c1.setFundingAmount("₹ 30 Lakhs");
        c1.setSupportTypes(List.of("Capital Funding", "IoT Water Testing Equipment", "Field Deployment Mentorship"));
        c1.setSolutionId("SOL-1001-JIAT");
        c1.setSolutionTitle("Smart IoT-Based Rural Water Quality Monitoring & Purification System");
        c1.setCollaboratedDate("2026-09-21");
        c1.setCollaboratedAt(Instant.now().toString());
        c1.setStatus("Active Collaboration");
        c1.setSolutionStatus("Submitted");

        Collaboration c2 = new Collaboration();
        c2.setId("COLLAB-1002-HLTH-GVOLT");
        c2.setProblemId("JH-CHLG-2026-1002");
        c2.setProblemTitle("Lack of Remote Healthcare Access in Rural Area");
        c2.setCategory("Healthcare");
        c2.setDomain("Healthcare");
        c2.setUniversityId("UNI-JH-002");
        c2.setUniversityName("Jharkhand Institute of Health & Computing");
        c2.setDepartment("Biomedical Engineering & AI Lab");
        c2.setIndustryId("IND-JH-002");
        c2.setCompanyName("GreenVolt Energy Systems");
        c2.setContactPerson("Head of CSR & Sustainability");
        c2.setContactEmail("greenvolt.industry@test.civicconnect.in");
        c2.setContactPhone("+91 94317 44002");
        c2.setFundingAmount("₹ 28 Lakhs");
        c2.setSupportTypes(List.of("Solar Power Backup Hardware", "CSR Capital Grant"));
        c2.setSolutionId("SOL-1002-JIHC");
        c2.setSolutionTitle("AI-Powered Telemedicine & Remote Diagnostic Health Kiosk for Rural Clinics");
        c2.setCollaboratedDate("2026-09-21");
        c2.setCollaboratedAt(Instant.now().toString());
        c2.setStatus("Active Collaboration");
        c2.setSolutionStatus("Submitted");

        collaborationRepository.save(c1);
        collaborationRepository.save(c2);
        logger.info("Seeded user-specified collaborations (COLLAB-1001-AGRI-AQUA, COLLAB-1002-HLTH-GVOLT) to MongoDB.");
    }

    private void seedUsers() {
        String hashedPwd = passwordEncoder.encode("admin123");

        // 1. Admin
        User admin = userRepository.findByUsername("admin").orElse(null);
        if (admin == null) {
            admin = new User("USR-ADM-01", "admin", hashedPwd, "admin@jharkhand.gov.in", Role.ADMIN, "State Nodal Administrator", "Department of Planning & Development, Govt. of Jharkhand", "Ranchi", "+91 94311 00001");
        } else {
            admin.setPassword(hashedPwd);
        }
        userRepository.save(admin);

        // 2. University 1: Jharkhand Institute of Agricultural Technology
        User u1 = userRepository.findByEmailIgnoreCase("agri.university@test.civicconnect.in").orElse(null);
        if (u1 == null) {
            u1 = userRepository.findByUsername("university").orElse(new User());
        }
        u1.setId("USR-UNI-JH-001");
        u1.setUsername("agri.university@test.civicconnect.in");
        u1.setPassword(hashedPwd);
        u1.setEmail("agri.university@test.civicconnect.in");
        u1.setRole(Role.UNIVERSITY);
        u1.setFullName("Jharkhand Institute of Agricultural Technology");
        u1.setUniversityId("UNI-JH-001");
        u1.setUniversityName("Jharkhand Institute of Agricultural Technology");
        u1.setOrganization("Jharkhand Institute of Agricultural Technology");
        u1.setDistrict("Ranchi");
        u1.setPhone("+91 94311 11001");
        u1.setAreasOfExpertise(List.of("Agriculture", "Water Management", "Smart irrigation", "soil monitoring", "crop disease detection", "water conservation"));
        userRepository.save(u1);

        // 3. University 2: Jharkhand Institute of Health & Computing
        User u2 = userRepository.findByEmailIgnoreCase("health.university@test.civicconnect.in").orElse(new User());
        u2.setId("USR-UNI-JH-002");
        u2.setUsername("health.university@test.civicconnect.in");
        u2.setPassword(hashedPwd);
        u2.setEmail("health.university@test.civicconnect.in");
        u2.setRole(Role.UNIVERSITY);
        u2.setFullName("Jharkhand Institute of Health & Computing");
        u2.setUniversityId("UNI-JH-002");
        u2.setUniversityName("Jharkhand Institute of Health & Computing");
        u2.setOrganization("Jharkhand Institute of Health & Computing");
        u2.setDistrict("East Singhbhum");
        u2.setPhone("+91 94311 22002");
        u2.setAreasOfExpertise(List.of("Healthcare", "AI / Digital Services", "Healthcare AI", "telemedicine", "medical data analysis"));
        userRepository.save(u2);

        // 4. Industry 1: AquaGrid Infrastructure Solutions
        User ind1 = userRepository.findByEmailIgnoreCase("aquagrid.industry@test.civicconnect.in").orElse(null);
        if (ind1 == null) {
            ind1 = userRepository.findByUsername("industry").orElse(new User());
        }
        ind1.setId("USR-IND-JH-001");
        ind1.setUsername("aquagrid.industry@test.civicconnect.in");
        ind1.setPassword(hashedPwd);
        ind1.setEmail("aquagrid.industry@test.civicconnect.in");
        ind1.setRole(Role.INDUSTRY);
        ind1.setFullName("AquaGrid Infrastructure Solutions");
        ind1.setIndustryId("IND-JH-001");
        ind1.setCompanyName("AquaGrid Infrastructure Solutions");
        ind1.setOrganization("AquaGrid Infrastructure Solutions");
        ind1.setDistrict("Bokaro");
        ind1.setPhone("+91 94340 33001");
        ind1.setAreasOfExpertise(List.of("Water Management", "Infrastructure", "Water treatment", "smart water monitoring"));
        userRepository.save(ind1);

        // 5. Industry 2: GreenVolt Energy Systems
        User ind2 = userRepository.findByEmailIgnoreCase("greenvolt.industry@test.civicconnect.in").orElse(new User());
        ind2.setId("USR-IND-JH-002");
        ind2.setUsername("greenvolt.industry@test.civicconnect.in");
        ind2.setPassword(hashedPwd);
        ind2.setEmail("greenvolt.industry@test.civicconnect.in");
        ind2.setRole(Role.INDUSTRY);
        ind2.setFullName("GreenVolt Energy Systems");
        ind2.setIndustryId("IND-JH-002");
        ind2.setCompanyName("GreenVolt Energy Systems");
        ind2.setOrganization("GreenVolt Energy Systems");
        ind2.setDistrict("Dhanbad");
        ind2.setPhone("+91 94317 44002");
        ind2.setAreasOfExpertise(List.of("Renewable Energy", "Rural Development", "Solar energy", "microgrids", "Healthcare"));
        userRepository.save(ind2);

        // 6. Citizen
        User ctz = userRepository.findByUsername("citizen").orElse(null);
        if (ctz == null) {
            ctz = new User("USR-CTZ-01", "citizen", hashedPwd, "sunil.mahato@gmail.com", Role.CITIZEN, "Rural Community Representative", "Citizen of Ranchi", "Ranchi", "+91 94311 87290");
        } else {
            ctz.setPassword(hashedPwd);
        }
        userRepository.save(ctz);

        // Remove any other legacy users
        Set<String> validUsernames = Set.of(
                "admin", "agri.university@test.civicconnect.in", "health.university@test.civicconnect.in",
                "aquagrid.industry@test.civicconnect.in", "greenvolt.industry@test.civicconnect.in", "citizen"
        );
        userRepository.findAll().stream()
                .filter(u -> !validUsernames.contains(u.getUsername()) && !validUsernames.contains(u.getEmail()))
                .forEach(u -> userRepository.deleteById(u.getId()));

        logger.info("Cleaned and seeded user accounts in MongoDB.");
    }

    private void seedProjects() {
        Project prj1 = new Project();
        prj1.setId("PRJ-JH-2026-1001");
        prj1.setProblemId("JH-CHLG-2026-1001");
        prj1.setProblemTitle("Unsafe Drinking Water in Rural Village");
        prj1.setCategory("Water Management");
        prj1.setDomain("Water Management");
        prj1.setDistrict("Ranchi");
        prj1.setUniversityId("UNI-JH-001");
        prj1.setUniversityName("Jharkhand Institute of Agricultural Technology");
        prj1.setIndustryId("IND-JH-001");
        prj1.setCompanyName("AquaGrid Infrastructure Solutions");
        prj1.setSolutionId("SOL-1001-JIAT");
        prj1.setCollaborationId("COLLAB-1001-AGRI-AQUA");
        prj1.setStatus("IN_PROGRESS");
        prj1.setProgress(35);
        prj1.setBudgetSanctioned("₹ 30 Lakhs");
        prj1.setStartDate("2026-09-21");
        prj1.setDeadlineDate("2026-12-20");
        prj1.setApprovedSlaDays(90);
        prj1.setDaysElapsed(1);
        prj1.setDaysRemaining(89);
        prj1.setRiskLevel("Low");

        Project prj2 = new Project();
        prj2.setId("PRJ-JH-2026-1002");
        prj2.setProblemId("JH-CHLG-2026-1002");
        prj2.setProblemTitle("Lack of Remote Healthcare Access in Rural Area");
        prj2.setCategory("Healthcare");
        prj2.setDomain("Healthcare");
        prj2.setDistrict("East Singhbhum");
        prj2.setUniversityId("UNI-JH-002");
        prj2.setUniversityName("Jharkhand Institute of Health & Computing");
        prj2.setIndustryId("IND-JH-002");
        prj2.setCompanyName("GreenVolt Energy Systems");
        prj2.setSolutionId("SOL-1002-JIHC");
        prj2.setCollaborationId("COLLAB-1002-HLTH-GVOLT");
        prj2.setStatus("IN_PROGRESS");
        prj2.setProgress(20);
        prj2.setBudgetSanctioned("₹ 28 Lakhs");
        prj2.setStartDate("2026-09-21");
        prj2.setDeadlineDate("2026-12-20");
        prj2.setApprovedSlaDays(90);
        prj2.setDaysElapsed(1);
        prj2.setDaysRemaining(89);
        prj2.setRiskLevel("Low");

        projectRepository.save(prj1);
        projectRepository.save(prj2);
        logger.info("Seeded projects for user problems to MongoDB.");
    }

    private void seedNotifications() {
        notificationRepository.deleteAll();
        List<Notification> notifs = List.of(
                new Notification("NOTIF-01", "NEW_PROBLEM", "Unsafe Drinking Water in Rural Village", "New water management grievance in Ranchi queued for university proposals.", "Recent", false),
                new Notification("NOTIF-02", "NEW_PROBLEM", "Lack of Remote Healthcare Access in Rural Area", "Healthcare telemetry challenge in East Singhbhum broadcasted.", "Recent", false)
        );
        notificationRepository.saveAll(notifs);
        logger.info("Seeded clean notifications to MongoDB.");
    }

    private void seedAiAnalysis() {
        aiAnalysisRepository.deleteAll();

        AIAnalysis a1 = new AIAnalysis();
        a1.setId("AI-JH-CHLG-2026-1001");
        a1.setProblemId("JH-CHLG-2026-1001");
        a1.setCategory("Water Management");
        a1.setDomain("Water Management");
        a1.setUrgency("High");
        a1.setConfidence(0.975);
        a1.setNeedsHumanReview(false);
        a1.setVerificationRecommendation("High-priority rural drinking water quality degradation requiring smart sensor monitoring and purification solution.");
        a1.setModelVersion("CivicConnect Master Multimodal Pipeline v5.2.0");
        a1.setAnalyzedAt("2026-09-21T10:00:00.000Z");

        AIAnalysis a2 = new AIAnalysis();
        a2.setId("AI-JH-CHLG-2026-1002");
        a2.setProblemId("JH-CHLG-2026-1002");
        a2.setCategory("Healthcare");
        a2.setDomain("Healthcare");
        a2.setUrgency("High");
        a2.setConfidence(0.968);
        a2.setNeedsHumanReview(false);
        a2.setVerificationRecommendation("High-priority rural digital healthcare and telemedicine access requirement.");
        a2.setModelVersion("CivicConnect Master Multimodal Pipeline v5.2.0");
        a2.setAnalyzedAt("2026-09-21T11:00:00.000Z");

        aiAnalysisRepository.save(a1);
        aiAnalysisRepository.save(a2);
        logger.info("Seeded clean AI Analysis records to MongoDB.");
    }
}
