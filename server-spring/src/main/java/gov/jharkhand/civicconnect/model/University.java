package gov.jharkhand.civicconnect.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "universities")
public class University {
    @Id
    private String id;
    private String name;
    private String location;
    private Double lat;
    private Double lng;
    private List<String> departments;
    private List<String> expertise;
    private List<String> researchAreas;
    private List<String> facultyExpertise;
    private List<String> labs;
    private List<String> equipment;
    private List<String> technologies;
    private List<String> centersOfExcellence;
    private List<String> previousProjects;
    private Integer ranking;
    private String accreditation;
    private Integer activeFacultyCount;
    private Integer completedCivicProjects;
    private String civicProjectExperience;
    private String availableResearchCapabilities;
    private String coreStrengths;
    private String contactPerson;
    private String contactEmail;
    private String contactPhone;
    private String address;

    public University() {}

    public University(String id, String name, String location, Double lat, Double lng, List<String> departments, List<String> expertise, Integer ranking, String accreditation, Integer activeFacultyCount, Integer completedCivicProjects) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.lat = lat;
        this.lng = lng;
        this.departments = departments;
        this.expertise = expertise;
        this.ranking = ranking;
        this.accreditation = accreditation;
        this.activeFacultyCount = activeFacultyCount;
        this.completedCivicProjects = completedCivicProjects;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
    public List<String> getDepartments() { return departments; }
    public void setDepartments(List<String> departments) { this.departments = departments; }
    public List<String> getExpertise() { return expertise; }
    public void setExpertise(List<String> expertise) { this.expertise = expertise; }
    public List<String> getResearchAreas() { return researchAreas; }
    public void setResearchAreas(List<String> researchAreas) { this.researchAreas = researchAreas; }
    public List<String> getFacultyExpertise() { return facultyExpertise; }
    public void setFacultyExpertise(List<String> facultyExpertise) { this.facultyExpertise = facultyExpertise; }
    public List<String> getLabs() { return labs; }
    public void setLabs(List<String> labs) { this.labs = labs; }
    public List<String> getEquipment() { return equipment; }
    public void setEquipment(List<String> equipment) { this.equipment = equipment; }
    public List<String> getTechnologies() { return technologies; }
    public void setTechnologies(List<String> technologies) { this.technologies = technologies; }
    public List<String> getCentersOfExcellence() { return centersOfExcellence; }
    public void setCentersOfExcellence(List<String> centersOfExcellence) { this.centersOfExcellence = centersOfExcellence; }
    public List<String> getPreviousProjects() { return previousProjects; }
    public void setPreviousProjects(List<String> previousProjects) { this.previousProjects = previousProjects; }
    public Integer getRanking() { return ranking; }
    public void setRanking(Integer ranking) { this.ranking = ranking; }
    public String getAccreditation() { return accreditation; }
    public void setAccreditation(String accreditation) { this.accreditation = accreditation; }
    public Integer getActiveFacultyCount() { return activeFacultyCount; }
    public void setActiveFacultyCount(Integer activeFacultyCount) { this.activeFacultyCount = activeFacultyCount; }
    public Integer getCompletedCivicProjects() { return completedCivicProjects; }
    public void setCompletedCivicProjects(Integer completedCivicProjects) { this.completedCivicProjects = completedCivicProjects; }
    public String getCivicProjectExperience() { return civicProjectExperience; }
    public void setCivicProjectExperience(String civicProjectExperience) { this.civicProjectExperience = civicProjectExperience; }
    public String getAvailableResearchCapabilities() { return availableResearchCapabilities; }
    public void setAvailableResearchCapabilities(String availableResearchCapabilities) { this.availableResearchCapabilities = availableResearchCapabilities; }
    public String getCoreStrengths() { return coreStrengths; }
    public void setCoreStrengths(String coreStrengths) { this.coreStrengths = coreStrengths; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}

