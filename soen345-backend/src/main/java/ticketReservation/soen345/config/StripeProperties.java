package ticketReservation.soen345.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {
    private String apiKey;
}
