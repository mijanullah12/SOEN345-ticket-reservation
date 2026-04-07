package ticketReservation.soen345.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Payment;
import ticketReservation.soen345.domain.PaymentStatus;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.exception.PaymentProcessingException;
import ticketReservation.soen345.repository.PaymentRepository;
import ticketReservation.soen345.service.PaymentGateway;
import ticketReservation.soen345.service.PaymentService;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentGateway paymentGateway;
    private final PaymentRepository paymentRepository;

    @Override
    public Payment createPaymentIntent(User payer, User payee, BigDecimal amount, String currency) {
        if (payer == null || payee == null) {
            throw new PaymentProcessingException("Both payer and payee are required.");
        }

        String customerId = payer.getPaymentInfo() != null ? payer.getPaymentInfo().getCustomerId() : null;
        Map<String, String> metadata = new HashMap<>();
        metadata.put("payerUserId", payer.getId());
        metadata.put("payeeUserId", payee.getId());

        String providerPaymentId = paymentGateway.createPaymentIntent(amount, currency, customerId, metadata);

        Payment payment = Payment.builder()
                .payerUserId(payer.getId())
                .payeeUserId(payee.getId())
                .providerPaymentId(providerPaymentId)
                .amount(amount)
                .currency(currency)
                .status(PaymentStatus.PENDING)
                .build();

        return paymentRepository.save(payment);
    }

    @Override
    public Payment confirmPayment(String paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentProcessingException("Payment not found."));

        paymentGateway.confirmPayment(payment.getProviderPaymentId());
        payment.setStatus(PaymentStatus.CONFIRMED);

        return paymentRepository.save(payment);
    }

    @Override
    public Payment refundPayment(String paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentProcessingException("Payment not found."));

        paymentGateway.refundPayment(payment.getProviderPaymentId());
        payment.setStatus(PaymentStatus.REFUNDED);

        return paymentRepository.save(payment);
    }
}
