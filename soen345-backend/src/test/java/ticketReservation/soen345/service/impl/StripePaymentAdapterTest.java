package ticketReservation.soen345.service.impl;

import com.stripe.exception.StripeException;
import com.stripe.exception.InvalidRequestException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.config.StripeProperties;
import ticketReservation.soen345.exception.PaymentProcessingException;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StripePaymentAdapterTest {

    @Test
    @DisplayName("createPaymentIntent skips Stripe for Playwright E2E placeholder wallet")
    void createIntent_E2ePlaceholder() {
        StripeProperties props = mock(StripeProperties.class);
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);

        try (MockedStatic<PaymentIntent> pis = mockStatic(PaymentIntent.class)) {
            String id = adapter.createPaymentIntent(
                    BigDecimal.TEN, "usd", "cus_e2e_test", "pm_e2e_test", Map.of("a", "b"));
            assertThat(id).startsWith("pi_e2e_");
            pis.verify(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class)), never());
        }
    }

    @Test
    @DisplayName("createPaymentIntent calls Stripe and returns id")
    void createIntent() {
        StripeProperties props = mock(StripeProperties.class);
        when(props.getApiKey()).thenReturn("sk_test_123");
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);

        PaymentIntent pi = mock(PaymentIntent.class);
        when(pi.getId()).thenReturn("pi_abc");

        try (MockedStatic<PaymentIntent> pis = mockStatic(PaymentIntent.class)) {
            pis.when(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class))).thenReturn(pi);
            String id = adapter.createPaymentIntent(BigDecimal.valueOf(10.5), "usd", "cus_1", "pm_1", Map.of("a", "b"));
            assertThat(id).isEqualTo("pi_abc");
        }
    }

    @Test
    @DisplayName("createPaymentIntent omits customer, method, and metadata when blank or empty")
    void createIntent_MinimalParams() {
        StripeProperties props = mock(StripeProperties.class);
        when(props.getApiKey()).thenReturn("sk_test_123");
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);

        PaymentIntent pi = mock(PaymentIntent.class);
        when(pi.getId()).thenReturn("pi_min");

        try (MockedStatic<PaymentIntent> pis = mockStatic(PaymentIntent.class)) {
            pis.when(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class))).thenReturn(pi);
            String id = adapter.createPaymentIntent(BigDecimal.ONE, "usd", "  ", null, Map.of());
            assertThat(id).isEqualTo("pi_min");
        }
    }

    @Test
    @DisplayName("createPaymentIntent wraps StripeException")
    void createIntent_StripeFailure() {
        StripeProperties props = mock(StripeProperties.class);
        when(props.getApiKey()).thenReturn("sk_test_123");
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);

        try (MockedStatic<PaymentIntent> pis = mockStatic(PaymentIntent.class)) {
            pis.when(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class)))
                    .thenThrow(new InvalidRequestException("x", "p", "m", "c", 400, null));

            assertThatThrownBy(() -> adapter.createPaymentIntent(BigDecimal.ONE, "usd", null, null, null))
                    .isInstanceOf(PaymentProcessingException.class)
                    .hasMessageContaining("Failed to create Stripe payment intent");
        }
    }

    @Test
    @DisplayName("configureStripe throws when api key blank")
    void missingKey() {
        StripeProperties props = mock(StripeProperties.class);
        when(props.getApiKey()).thenReturn("  ");
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);
        assertThatThrownBy(() -> adapter.createPaymentIntent(BigDecimal.ONE, "usd", null, null, Map.of()))
                .isInstanceOf(PaymentProcessingException.class)
                .hasMessageContaining("API key");
    }

    @Test
    @DisplayName("toMinorUnits throws when amount null")
    void nullAmount() {
        StripeProperties props = mock(StripeProperties.class);
        when(props.getApiKey()).thenReturn("sk_test");
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);
        try (MockedStatic<PaymentIntent> pis = mockStatic(PaymentIntent.class)) {
            assertThatThrownBy(() -> adapter.createPaymentIntent(null, "usd", null, null, Map.of()))
                    .isInstanceOf(PaymentProcessingException.class)
                    .hasMessageContaining("Amount");
        }
    }

    @Test
    @DisplayName("confirmPayment skips Stripe for E2E placeholder intent ids")
    void confirm_E2ePlaceholder() {
        StripeProperties props = mock(StripeProperties.class);
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);

        try (MockedStatic<PaymentIntent> pis = mockStatic(PaymentIntent.class)) {
            assertThat(adapter.confirmPayment("pi_e2e_1")).isEqualTo("pi_e2e_1");
            pis.verify(() -> PaymentIntent.retrieve(any()), never());
        }
    }

    @Test
    @DisplayName("confirmPayment retrieves and confirms intent")
    void confirm() throws StripeException {
        StripeProperties props = mock(StripeProperties.class);
        when(props.getApiKey()).thenReturn("sk_test");
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);

        PaymentIntent retrieved = mock(PaymentIntent.class);
        PaymentIntent confirmed = mock(PaymentIntent.class);
        when(confirmed.getId()).thenReturn("pi_done");
        when(retrieved.confirm()).thenReturn(confirmed);

        try (MockedStatic<PaymentIntent> pis = mockStatic(PaymentIntent.class)) {
            pis.when(() -> PaymentIntent.retrieve("pi_x")).thenReturn(retrieved);
            assertThat(adapter.confirmPayment("pi_x")).isEqualTo("pi_done");
        }
    }

    @Test
    @DisplayName("refundPayment creates refund")
    void refund() {
        StripeProperties props = mock(StripeProperties.class);
        when(props.getApiKey()).thenReturn("sk_test");
        StripePaymentAdapter adapter = new StripePaymentAdapter(props);

        Refund refund = mock(Refund.class);
        when(refund.getId()).thenReturn("re_1");

        try (MockedStatic<Refund> rs = mockStatic(Refund.class)) {
            rs.when(() -> Refund.create(any(RefundCreateParams.class))).thenReturn(refund);
            assertThat(adapter.refundPayment("pi_x")).isEqualTo("re_1");
        }
    }
}
