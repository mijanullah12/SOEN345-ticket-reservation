package ticketReservation.soen345.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import ticketReservation.soen345.service.impl.MockPaymentGateway;
import ticketReservation.soen345.service.impl.StripePaymentAdapter;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentGatewayConfigurationTest {

    private final PaymentGatewayConfiguration configuration = new PaymentGatewayConfiguration();

    @Test
    @DisplayName("Uses MockPaymentGateway when Stripe API key is null")
    void blankKey_UsesMock() {
        StripeProperties props = new StripeProperties();
        props.setApiKey(null);

        assertThat(configuration.paymentGateway(props)).isInstanceOf(MockPaymentGateway.class);
    }

    @Test
    @DisplayName("Uses MockPaymentGateway when Stripe API key is blank")
    void emptyKey_UsesMock() {
        StripeProperties props = new StripeProperties();
        props.setApiKey("   ");

        assertThat(configuration.paymentGateway(props)).isInstanceOf(MockPaymentGateway.class);
    }

    @Test
    @DisplayName("Uses StripePaymentAdapter when Stripe API key is set")
    void keySet_UsesStripeAdapter() {
        StripeProperties props = new StripeProperties();
        props.setApiKey("sk_test_123");

        assertThat(configuration.paymentGateway(props)).isInstanceOf(StripePaymentAdapter.class);
    }
}
