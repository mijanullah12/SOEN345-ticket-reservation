package ticketReservation.soen345.service;

import ticketReservation.soen345.dto.response.PaymentSetupIntentResponse;

public interface PaymentProfileService {
    PaymentSetupIntentResponse createSetupIntent(String userId);
}
