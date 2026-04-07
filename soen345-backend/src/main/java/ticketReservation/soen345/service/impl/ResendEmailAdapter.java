package ticketReservation.soen345.service.impl;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ticketReservation.soen345.service.EmailSender;

@Component
public class ResendEmailAdapter implements EmailSender {

    private final Resend resendClient;

    public ResendEmailAdapter(@Value("${resend.api-key}") String apiKey) {
        this.resendClient = new Resend(apiKey);
    }

    @Override
    public String sendEmail(String from, String to, String subject, String htmlBody) {
        CreateEmailOptions params = CreateEmailOptions.builder()
                .from(from)
                .to(to)
                .subject(subject)
                .html(htmlBody)
                .build();

        try {
            CreateEmailResponse response = resendClient.emails().send(params);
            return response.getId();
        } catch (ResendException exception) {
            throw new IllegalStateException("Failed to send email via Resend.", exception);
        }
    }
}
