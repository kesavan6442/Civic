package gov.jharkhand.civicconnect.security;

import gov.jharkhand.civicconnect.model.Role;
import gov.jharkhand.civicconnect.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final String id;
    private final String username;
    private final String email;
    private final String password;
    private final Role role;
    private final String fullName;
    private final String organization;
    private final String district;
    private final String universityName;
    private final String companyName;
    private final String universityId;
    private final String industryId;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(String id, String username, String email, String password, Role role,
                         String fullName, String organization, String district,
                         String universityName, String companyName,
                         String universityId, String industryId,
                         Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.fullName = fullName;
        this.organization = organization;
        this.district = district;
        this.universityName = universityName;
        this.companyName = companyName;
        this.universityId = universityId;
        this.industryId = industryId;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        String roleName = user.getRole() != null ? user.getRole().name() : "CITIZEN";
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + roleName.toUpperCase())
        );

        return new UserPrincipal(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                user.getRole(),
                user.getFullName(),
                user.getOrganization(),
                user.getDistrict(),
                user.getUniversityName(),
                user.getCompanyName(),
                user.getUniversityId(),
                user.getIndustryId(),
                authorities
        );
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public String getFullName() {
        return fullName;
    }

    public String getOrganization() {
        return organization;
    }

    public String getDistrict() {
        return district;
    }

    public String getUniversityName() {
        return universityName;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getUniversityId() {
        return universityId;
    }

    public String getIndustryId() {
        return industryId;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
