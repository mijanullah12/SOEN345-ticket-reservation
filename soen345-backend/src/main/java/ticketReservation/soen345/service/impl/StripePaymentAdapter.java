package ticketReservation.soen345.service.impl;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import ticketReservation.soen345.config.StripeProperties;
import ticketReservation.soen345.exception.PaymentProcessingException;
import ticketReservation.soen345.service.PaymentGateway;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@RequiredArgsConstructor
public class StripePaymentAdapter implements PaymentGateway {

    private static final String DEFAULT_PAYMENT_METHOD = "card";

    private final StripeProperties stripeProperties;

    @Override
    public String createPaymentIntent(
            BigDecimal amount,
            String currency,
            String customerId,
            String paymentMethodId,
            Map<String, String> metadata) {
        configureStripe();
        long minorUnits = toMinorUnits(amount);

        PaymentIntentCreateParams.Builder builder = PaymentIntentCreateParams.builder()
                .setAmount(minorUnits)
                .setCurrency(currency)
                .addPaymentMethodType(DEFAULT_PAYMENT_METHOD);

        if (customerId != null && !customerId.isBlank()) {
            builder.setCustomer(customerId);
        }

        if (paymentMethodId != null && !paymentMethodId.isBlank()) {
            builder.setPaymentMethod(paymentMethodId);
        }

        if (metadata != null && !metadata.isEmpty()) {
            builder.putAllMetadata(metadata);
        }

        try {
            PaymentIntent paymentIntent = PaymentIntent.create(builder.build());
            return paymentIntent.getId();
        } catch (StripeException e) {
            throw new PaymentProcessingException("Failed to create Stripe payment intent.", e);
        }
    }

    @Override
    public String confirmPayment(String providerPaymentId) {
        configureStripe();
        try {
            PaymentIntent paymentIntent = PaymentIntent.retrieve(providerPaymentId).confirm();
            return paymentIntent.getId();
        } catch (StripeException e) {
            throw new PaymentProcessingException("Failed to confirm Stripe payment intent.", e);
        }
    }

    @Override
    public String refundPayment(String providerPaymentId) {
        configureStripe();
        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(providerPaymentId)
                .build();

        try {
            Refund refund = Refund.create(params);
            return refund.getId();
        } catch (StripeException e) {
            throw new PaymentProcessingException("Failed to refund Stripe payment intent.", e);
        }
    }

    private long toMinorUnits(BigDecimal amount) {
        if (amount == null) {
            throw new PaymentProcessingException("Amount is required.");
        }
        return amount
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }

    private void configureStripe() {
        String apiKey = stripeProperties.getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new PaymentProcessingException("Stripe API key is not configured.");
        }
        Stripe.apiKey = apiKey;
    }
}
