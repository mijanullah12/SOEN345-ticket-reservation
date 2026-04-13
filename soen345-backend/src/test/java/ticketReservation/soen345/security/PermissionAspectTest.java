package ticketReservation.soen345.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PermissionAspectTest {

    private PermissionAspect aspect;

    @BeforeEach
    void setUp() {
        aspect = new PermissionAspect();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void loginAs(String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
    }

    @Test
    @DisplayName("allows CUSTOMER to RESERVE_TICKET")
    void customerReserve() {
        loginAs("CUSTOMER");
        RequiresPermission ann = mock(RequiresPermission.class);
        when(ann.value()).thenReturn(ticketReservation.soen345.domain.Permission.RESERVE_TICKET);
        assertThatCode(() -> aspect.checkPermission(ann)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("denies CUSTOMER from CREATE_EVENT")
    void customerCannotCreateEvent() {
        loginAs("CUSTOMER");
        RequiresPermission ann = mock(RequiresPermission.class);
        when(ann.value()).thenReturn(ticketReservation.soen345.domain.Permission.CREATE_EVENT);
        assertThatThrownBy(() -> aspect.checkPermission(ann))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("permission");
    }

    @Test
    @DisplayName("throws when not authenticated")
    void unauthenticated() {
        RequiresPermission ann = mock(RequiresPermission.class);
        when(ann.value()).thenReturn(ticketReservation.soen345.domain.Permission.RESERVE_TICKET);
        assertThatThrownBy(() -> aspect.checkPermission(ann))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Authentication");
    }

    @Test
    @DisplayName("throws when role unknown")
    void badRole() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_NOT_A_ROLE"))));
        RequiresPermission ann = mock(RequiresPermission.class);
        when(ann.value()).thenReturn(ticketReservation.soen345.domain.Permission.RESERVE_TICKET);
        assertThatThrownBy(() -> aspect.checkPermission(ann))
                .isInstanceOf(AccessDeniedException.class);
    }
}
