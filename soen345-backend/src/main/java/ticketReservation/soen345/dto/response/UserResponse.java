package ticketReservation.soen345.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.domain.UserStatus;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private NotificationChannel preferredNotificationChannel;
    private PaymentInfoResponse paymentInfo;
    private UserRole role;
    private UserStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
