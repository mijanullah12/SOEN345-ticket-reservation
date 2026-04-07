package ticketReservation.soen345.service;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentGateway {
    String createPaymentIntent(BigDecimal amount, String currency, String customerId, Map<String, String> metadata);

    String confirmPayment(String providerPaymentId);

    String refundPayment(String providerPaymentId);
}
