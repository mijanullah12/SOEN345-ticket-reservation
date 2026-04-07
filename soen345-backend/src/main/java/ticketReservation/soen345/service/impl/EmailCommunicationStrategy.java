package ticketReservation.soen345.service.impl;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationContext;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.service.NotificationChannelStrategy;

@Service
@Slf4j
public class EmailCommunicationStrategy implements NotificationChannelStrategy {

    private final Resend resendClient;
    private final String fromAddress;

    public EmailCommunicationStrategy(
            @Value("${resend.api-key}") String apiKey,
            @Value("${resend.from-email:no-reply@soen345.local}") String fromAddress
    ) {
        this.resendClient = new Resend(apiKey);
        this.fromAddress = fromAddress;
    }

    @Override
    public void sendTo(User to, Notification notification, NotificationContext context) {
        CreateEmailOptions params = CreateEmailOptions.builder()
                .from(fromAddress)
                .to(to.getEmail())
                .subject(notification.subject(context))
                .html(notification.body(context).replace("\n", "<br/>"))
                .build();

        try {
            CreateEmailResponse response = resendClient.emails().send(params);
            log.info("Resend email sent to {} with id {}", to.getEmail(), response.getId());
        } catch (ResendException exception) {
            throw new IllegalStateException("Failed to send email via Resend.", exception);
        }
    }
}
