package ticketReservation.soen345.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInfoResponse {
    private String customerId;
    private String defaultPaymentMethodId;
    private String payoutAccountId;
    private String payoutEmail;
    private String payoutDisplayName;
}
