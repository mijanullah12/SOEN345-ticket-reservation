package ticketReservation.soen345.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MockPaymentGatewayTest {

    @Test
    @DisplayName("createPaymentIntent returns sequential mock ids")
    void create() {
        MockPaymentGateway gw = new MockPaymentGateway();
        assertThat(gw.createPaymentIntent(BigDecimal.ONE, "usd", null, null, Map.of()))
                .isEqualTo("pi_mock_1");
        assertThat(gw.createPaymentIntent(BigDecimal.ONE, "usd", null, null, Map.of()))
                .isEqualTo("pi_mock_2");
    }

    @Test
    @DisplayName("confirmPayment echoes provider id")
    void confirm() {
        MockPaymentGateway gw = new MockPaymentGateway();
        assertThat(gw.confirmPayment("pi_x")).isEqualTo("pi_x");
    }

    @Test
    @DisplayName("refundPayment returns refund id")
    void refund() {
        MockPaymentGateway gw = new MockPaymentGateway();
        assertThat(gw.refundPayment("pi_x")).startsWith("re_mock_");
    }
}
