package ticketReservation.soen345.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ticketReservation.soen345.domain.NotificationChannel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(
            regexp = "^\\+[1-9]\\d{9,14}$",
            message = "Phone must be in E.164 format (e.g., +14155552671)"
    )
    private String phone;

    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    private NotificationChannel preferredNotificationChannel;
}
