package ticketReservation.soen345.service.impl;

import ticketReservation.soen345.service.PaymentGateway;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Used when no Stripe API key is configured (local dev / e2e) so reservation
 * flows can run without calling Stripe.
 */
public class MockPaymentGateway implements PaymentGateway {

    private final AtomicInteger sequence = new AtomicInteger();

    @Override
    public String createPaymentIntent(
            BigDecimal amount,
            String currency,
            String customerId,
            String paymentMethodId,
            Map<String, String> metadata) {
        return "pi_mock_" + sequence.incrementAndGet();
    }

    @Override
    public String confirmPayment(String providerPaymentId) {
        return providerPaymentId;
    }

    @Override
    public String refundPayment(String providerPaymentId) {
        return "re_mock_" + sequence.incrementAndGet();
    }
}
