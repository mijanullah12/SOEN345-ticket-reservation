package ticketReservation.soen345.security;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import ticketReservation.soen345.domain.Permission;
import ticketReservation.soen345.domain.UserRole;

@Aspect
@Component
@Slf4j
public class PermissionAspect {

    private static final String ROLE_PREFIX = "ROLE_";

    @Before("@annotation(requiresPermission)")
    public void checkPermission(RequiresPermission requiresPermission) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Permission required = requiresPermission.value();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        String roleValue = authentication.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .filter(authority -> authority.startsWith(ROLE_PREFIX))
                .map(authority -> authority.substring(ROLE_PREFIX.length()))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("Role is missing from authentication"));

        UserRole role;
        try {
            role = UserRole.valueOf(roleValue);
        } catch (IllegalArgumentException ex) {
            log.warn("Unknown role value in token: {}", roleValue);
            throw new AccessDeniedException("Invalid role");
        }

        if (!role.hasPermission(required)) {
            throw new AccessDeniedException("Missing required permission: " + required);
        }
    }
}
