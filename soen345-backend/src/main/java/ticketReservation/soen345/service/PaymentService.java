package ticketReservation.soen345.service;

import ticketReservation.soen345.domain.Payment;
import ticketReservation.soen345.domain.User;

import java.math.BigDecimal;

public interface PaymentService {
    Payment createPaymentIntent(User payer, User payee, BigDecimal amount, String currency);

    Payment confirmPayment(String paymentId);

    Payment refundPayment(String paymentId);
}
