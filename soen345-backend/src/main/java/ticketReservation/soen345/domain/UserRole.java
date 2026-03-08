package ticketReservation.soen345.domain;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

public enum UserRole {
    CUSTOMER(EnumSet.of(Permission.RESERVE_TICKET, Permission.CANCEL_TICKET)),
    ORGANIZER(EnumSet.of(Permission.CREATE_EVENT, Permission.EDIT_EVENT, Permission.CANCEL_EVENT)),
    ADMIN(EnumSet.allOf(Permission.class));

    private final Set<Permission> permissions;

    UserRole(Set<Permission> permissions) {
        this.permissions = Collections.unmodifiableSet(permissions);
    }

    public boolean hasPermission(Permission permission) {
        return permissions.contains(permission);
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }
}
