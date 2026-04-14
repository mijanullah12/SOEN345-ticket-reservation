package ticketReservation.soen345.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserPermissionTest {

    @Test
    @DisplayName("hasPermission delegates to role")
    void withRole() {
        User user = User.builder().role(UserRole.CUSTOMER).build();
        assertThat(user.hasPermission(Permission.RESERVE_TICKET)).isTrue();
        assertThat(user.hasPermission(Permission.CREATE_EVENT)).isFalse();
    }

    @Test
    @DisplayName("hasPermission false when role null")
    void nullRole() {
        User user = User.builder().role(null).build();
        assertThat(user.hasPermission(Permission.RESERVE_TICKET)).isFalse();
    }
}
