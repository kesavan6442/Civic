package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Document(collection = "industries")
public class IndustryPartner {
    @Id
    private String id;
    private String companyName;
    private String name;
    private String headquarters;
    private String location;
    private String contactPerson;
    private String contactEmail;
    private String contactPhone;
    private List<String> csrDomains;
    private List<String> csrFocus;
    private List<String> expertiseSectors;
    private List<String> technicalExpertise;
    private List<String> equipment;
    private String manufacturingCapability;
    private String fundingCapability;
    private String csrBudgetRange;
    private String totalFundingCommitted;
    private String fieldDeploymentCapability;
    private List<String> previousCsrProjects;
    private List<String> geographicCoverage;
    private String technicalResources;
    private Integer activeProjectsSupported;
    private Integer completedPPP;
    private String status;
    private List<Map<String, Object>> proposals;

    public IndustryPartner() {}

    public IndustryPartner(String id, String companyName, String headquarters, String contactPerson, String contactEmail, String contactPhone, List<String> expertiseSectors, String totalFundingCommitted, Integer activeProjectsSupported, String status, List<Map<String, Object>> proposals) {
        this.id = id;
        this.companyName = companyName;
        this.name = companyName;
        this.headquarters = headquarters;
        this.location = headquarters;
        this.contactPerson = contactPerson;
        this.contactEmail = contactEmail;
        this.contactPhone = contactPhone;
        this.expertiseSectors = expertiseSectors;
        this.csrDomains = expertiseSectors;
        this.totalFundingCommitted = totalFundingCommitted;
        this.activeProjectsSupported = activeProjectsSupported;
        this.status = status;
        this.proposals = proposals;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCompanyName() { return companyName != null ? companyName : name; }
    public void setCompanyName(String companyName) { this.companyName = companyName; this.name = companyName; }
    public String getName() { return name != null ? name : companyName; }
    public void setName(String name) { this.name = name; this.companyName = name; }
    public String getHeadquarters() { return headquarters != null ? headquarters : location; }
    public void setHeadquarters(String headquarters) { this.headquarters = headquarters; this.location = headquarters; }
    public String getLocation() { return location != null ? location : headquarters; }
    public void setLocation(String location) { this.location = location; this.headquarters = location; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public List<String> getCsrDomains() { return csrDomains != null ? csrDomains : expertiseSectors; }
    public void setCsrDomains(List<String> csrDomains) { this.csrDomains = csrDomains; this.expertiseSectors = csrDomains; }
    public List<String> getCsrFocus() { return csrFocus != null ? csrFocus : (csrDomains != null ? csrDomains : expertiseSectors); }
    public void setCsrFocus(List<String> csrFocus) { this.csrFocus = csrFocus; }
    public List<String> getExpertiseSectors() { return expertiseSectors != null ? expertiseSectors : csrDomains; }
    public void setExpertiseSectors(List<String> expertiseSectors) { this.expertiseSectors = expertiseSectors; this.csrDomains = expertiseSectors; }
    public List<String> getTechnicalExpertise() { return technicalExpertise; }
    public void setTechnicalExpertise(List<String> technicalExpertise) { this.technicalExpertise = technicalExpertise; }
    public List<String> getEquipment() { return equipment; }
    public void setEquipment(List<String> equipment) { this.equipment = equipment; }
    public String getManufacturingCapability() { return manufacturingCapability; }
    public void setManufacturingCapability(String manufacturingCapability) { this.manufacturingCapability = manufacturingCapability; }
    public String getFundingCapability() { return fundingCapability != null ? fundingCapability : totalFundingCommitted; }
    public void setFundingCapability(String fundingCapability) { this.fundingCapability = fundingCapability; this.totalFundingCommitted = fundingCapability; }
    public String getCsrBudgetRange() { return csrBudgetRange != null ? csrBudgetRange : totalFundingCommitted; }
    public void setCsrBudgetRange(String csrBudgetRange) { this.csrBudgetRange = csrBudgetRange; }
    public String getTotalFundingCommitted() { return totalFundingCommitted != null ? totalFundingCommitted : fundingCapability; }
    public void setTotalFundingCommitted(String totalFundingCommitted) { this.totalFundingCommitted = totalFundingCommitted; this.fundingCapability = totalFundingCommitted; }
    public String getFieldDeploymentCapability() { return fieldDeploymentCapability; }
    public void setFieldDeploymentCapability(String fieldDeploymentCapability) { this.fieldDeploymentCapability = fieldDeploymentCapability; }
    public List<String> getPreviousCsrProjects() { return previousCsrProjects; }
    public void setPreviousCsrProjects(List<String> previousCsrProjects) { this.previousCsrProjects = previousCsrProjects; }
    public List<String> getGeographicCoverage() { return geographicCoverage; }
    public void setGeographicCoverage(List<String> geographicCoverage) { this.geographicCoverage = geographicCoverage; }
    public String getTechnicalResources() { return technicalResources; }
    public void setTechnicalResources(String technicalResources) { this.technicalResources = technicalResources; }
    public Integer getActiveProjectsSupported() { return activeProjectsSupported; }
    public void setActiveProjectsSupported(Integer activeProjectsSupported) { this.activeProjectsSupported = activeProjectsSupported; }
    public Integer getCompletedPPP() { return completedPPP != null ? completedPPP : activeProjectsSupported; }
    public void setCompletedPPP(Integer completedPPP) { this.completedPPP = completedPPP; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<Map<String, Object>> getProposals() { return proposals; }
    public void setProposals(List<Map<String, Object>> proposals) { this.proposals = proposals; }
}

