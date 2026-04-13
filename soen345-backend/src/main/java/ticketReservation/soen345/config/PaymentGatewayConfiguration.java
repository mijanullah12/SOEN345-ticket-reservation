package ticketReservation.soen345.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import ticketReservation.soen345.service.PaymentGateway;
import ticketReservation.soen345.service.impl.MockPaymentGateway;
import ticketReservation.soen345.service.impl.StripePaymentAdapter;

@Configuration
public class PaymentGatewayConfiguration {

    @Bean
    public PaymentGateway paymentGateway(StripeProperties stripeProperties) {
        if (stripeProperties.getApiKey() == null || stripeProperties.getApiKey().isBlank()) {
            return new MockPaymentGateway();
        }
        return new StripePaymentAdapter(stripeProperties);
    }
}
