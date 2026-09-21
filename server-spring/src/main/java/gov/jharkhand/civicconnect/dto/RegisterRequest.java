package gov.jharkhand.civicconnect.dto;

import gov.jharkhand.civicconnect.model.Role;

public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private Role role;
    private String fullName;
    private String organization;
    private String district;
    private String phone;
    private String state;
    private String city;
    private String representativeName;
    private String designation;
    private String companyName;
    private String universityName;
    private java.util.List<String> areasOfExpertise;
    private java.util.Map<String, Object> capabilities;
    private Integer capabilitiesCount;

    public RegisterRequest() {}

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public void setRole(String roleStr) {
        if (roleStr != null && !roleStr.trim().isEmpty()) {
            try {
                this.role = Role.valueOf(roleStr.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                this.role = Role.CITIZEN;
            }
        }
    }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setName(String name) { if (this.fullName == null || this.fullName.trim().isEmpty()) { this.fullName = name; } }
    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }
    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getRepresentativeName() { return representativeName; }
    public void setRepresentativeName(String representativeName) { this.representativeName = representativeName; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getUniversityName() { return universityName; }
    public void setUniversityName(String universityName) { this.universityName = universityName; }
    public java.util.List<String> getAreasOfExpertise() { return areasOfExpertise; }
    public void setAreasOfExpertise(java.util.List<String> areasOfExpertise) { this.areasOfExpertise = areasOfExpertise; }
    public java.util.Map<String, Object> getCapabilities() { return capabilities; }
    public void setCapabilities(java.util.Map<String, Object> capabilities) { this.capabilities = capabilities; }
    public Integer getCapabilitiesCount() { return capabilitiesCount; }
    public void setCapabilitiesCount(Integer capabilitiesCount) { this.capabilitiesCount = capabilitiesCount; }
}
