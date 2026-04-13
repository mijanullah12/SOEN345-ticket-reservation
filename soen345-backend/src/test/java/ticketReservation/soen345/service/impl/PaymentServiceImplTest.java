package ticketReservation.soen345.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.domain.Payment;
import ticketReservation.soen345.domain.PaymentInfo;
import ticketReservation.soen345.domain.PaymentStatus;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.exception.PaymentProcessingException;
import ticketReservation.soen345.repository.PaymentRepository;
import ticketReservation.soen345.service.PaymentGateway;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentGateway paymentGateway;
    @Mock
    private PaymentRepository paymentRepository;

    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentServiceImpl(paymentGateway, paymentRepository);
    }

    @Test
    @DisplayName("createPaymentIntent persists payment with PENDING status")
    void createIntent() {
        User payer = User.builder()
                .id("p1")
                .paymentInfo(PaymentInfo.builder().customerId("cus").defaultPaymentMethodId("pm").build())
                .build();
        User payee = User.builder().id("p2").build();
        when(paymentGateway.createPaymentIntent(
                eq(BigDecimal.valueOf(20)),
                eq("usd"),
                eq("cus"),
                eq("pm"),
                argThat((Map<String, String> m) ->
                        "p1".equals(m.get("payerUserId")) && "p2".equals(m.get("payeeUserId")))))
                .thenReturn("pi_abc");

        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId("pay-db");
            return p;
        });

        Payment result = paymentService.createPaymentIntent(payer, payee, BigDecimal.valueOf(20), "usd");

        assertThat(result.getId()).isEqualTo("pay-db");
        assertThat(result.getStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(paymentGateway).createPaymentIntent(
                eq(BigDecimal.valueOf(20)),
                eq("usd"),
                eq("cus"),
                eq("pm"),
                argThat((Map<String, String> m) ->
                        "p1".equals(m.get("payerUserId")) && "p2".equals(m.get("payeeUserId"))));
    }

    @Test
    @DisplayName("createPaymentIntent throws when payer or payee null")
    void nullParties() {
        assertThatThrownBy(() -> paymentService.createPaymentIntent(null, User.builder().build(), BigDecimal.ONE, "usd"))
                .isInstanceOf(PaymentProcessingException.class);
        assertThatThrownBy(() -> paymentService.createPaymentIntent(User.builder().build(), null, BigDecimal.ONE, "usd"))
                .isInstanceOf(PaymentProcessingException.class);
    }

    @Test
    @DisplayName("confirmPayment updates status to CONFIRMED")
    void confirm() {
        Payment existing = Payment.builder()
                .id("id1")
                .providerPaymentId("pi_x")
                .status(PaymentStatus.PENDING)
                .build();
        when(paymentRepository.findById("id1")).thenReturn(Optional.of(existing));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        Payment out = paymentService.confirmPayment("id1");

        assertThat(out.getStatus()).isEqualTo(PaymentStatus.CONFIRMED);
        verify(paymentGateway).confirmPayment("pi_x");
    }

    @Test
    @DisplayName("refundPayment updates status to REFUNDED")
    void refund() {
        Payment existing = Payment.builder()
                .id("id1")
                .providerPaymentId("pi_x")
                .status(PaymentStatus.CONFIRMED)
                .build();
        when(paymentRepository.findById("id1")).thenReturn(Optional.of(existing));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentGateway.refundPayment("pi_x")).thenReturn("re_1");

        Payment out = paymentService.refundPayment("id1");

        assertThat(out.getStatus()).isEqualTo(PaymentStatus.REFUNDED);
    }

    @Test
    @DisplayName("confirmPayment throws when payment missing")
    void confirmMissing() {
        when(paymentRepository.findById("nope")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> paymentService.confirmPayment("nope"))
                .isInstanceOf(PaymentProcessingException.class)
                .hasMessageContaining("not found");
    }
}
