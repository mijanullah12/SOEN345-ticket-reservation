package ticketReservation.soen345.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {

    @Id
    private String id;

    private String payerUserId;

    private String payeeUserId;

    private String providerPaymentId;

    @Builder.Default
    private PaymentProvider provider = PaymentProvider.STRIPE;

    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    private BigDecimal amount;

    private String currency;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
