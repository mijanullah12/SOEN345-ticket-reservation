package ticketReservation.soen345.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ticketReservation.soen345.dto.response.PaymentSetupIntentResponse;
import ticketReservation.soen345.service.PaymentProfileService;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentProfileService paymentProfileService;

    @PostMapping("/setup-intent")
    public ResponseEntity<PaymentSetupIntentResponse> createSetupIntent(Authentication authentication) {
        String userId = authentication.getName();
        PaymentSetupIntentResponse response = paymentProfileService.createSetupIntent(userId);
        return ResponseEntity.ok(response);
    }
}
