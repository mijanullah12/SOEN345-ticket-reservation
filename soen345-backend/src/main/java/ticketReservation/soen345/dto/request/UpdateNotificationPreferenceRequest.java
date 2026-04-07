package ticketReservation.soen345.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ticketReservation.soen345.domain.NotificationChannel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNotificationPreferenceRequest {

    @NotNull(message = "Notification channel is required")
    private NotificationChannel preferredNotificationChannel;
}
