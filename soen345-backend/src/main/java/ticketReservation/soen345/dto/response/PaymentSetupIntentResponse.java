package ticketReservation.soen345.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSetupIntentResponse {
    private String clientSecret;
    private String customerId;
}
