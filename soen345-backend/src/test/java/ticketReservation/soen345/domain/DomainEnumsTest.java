package ticketReservation.soen345.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DomainEnumsTest {

    @Test
    @DisplayName("UserRole permissions are consistent")
    void userRole() {
        assertThat(UserRole.ADMIN.hasPermission(Permission.CREATE_EVENT)).isTrue();
        assertThat(UserRole.ORGANIZER.hasPermission(Permission.EDIT_EVENT)).isTrue();
        assertThat(UserRole.CUSTOMER.hasPermission(Permission.CANCEL_TICKET)).isTrue();
    }

    @Test
    @DisplayName("valueOf works for payment and reservation enums")
    void enums() {
        assertThat(PaymentStatus.valueOf("PENDING")).isEqualTo(PaymentStatus.PENDING);
        assertThat(PaymentProvider.valueOf("STRIPE")).isEqualTo(PaymentProvider.STRIPE);
        assertThat(ReservationStatus.valueOf("ACTIVE")).isEqualTo(ReservationStatus.ACTIVE);
        assertThat(NotificationType.valueOf("CONFIRM_RESERVATION"))
                .isEqualTo(NotificationType.CONFIRM_RESERVATION);
        assertThat(EventStatus.valueOf("ACTIVE")).isEqualTo(EventStatus.ACTIVE);
        assertThat(UserStatus.valueOf("ACTIVE")).isEqualTo(UserStatus.ACTIVE);
        assertThat(NotificationChannel.valueOf("EMAIL")).isEqualTo(NotificationChannel.EMAIL);
    }
}
