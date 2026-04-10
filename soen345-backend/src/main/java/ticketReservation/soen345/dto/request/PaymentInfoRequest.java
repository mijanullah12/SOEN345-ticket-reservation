package ticketReservation.soen345.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInfoRequest {

    @Size(max = 255, message = "Customer ID must not exceed 255 characters")
    private String customerId;

    @Size(max = 255, message = "Default payment method ID must not exceed 255 characters")
    private String defaultPaymentMethodId;

    @Size(max = 255, message = "Payout account ID must not exceed 255 characters")
    private String payoutAccountId;

    @Email(message = "Payout email must be a valid email address")
    @Size(max = 255, message = "Payout email must not exceed 255 characters")
    private String payoutEmail;

    @Size(max = 255, message = "Payout display name must not exceed 255 characters")
    private String payoutDisplayName;

    private Boolean createFakePayoutAccount;
}
