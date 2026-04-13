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

    private final String apiKey;
    private final Resend resendClient;

    public ResendEmailAdapter(@Value("${resend.api-key}") String apiKey) {
        this.apiKey = apiKey != null ? apiKey : "";
        this.resendClient =
                isDevEmailMode(this.apiKey) ? null : new Resend(this.apiKey);
    }

    private static boolean isDevEmailMode(String key) {
        String trimmed = key.trim();
        return trimmed.isEmpty() || "resend_test_key".equalsIgnoreCase(trimmed);
    }

    @Override
    public String sendEmail(String from, String to, String subject, String htmlBody) {
        if (isDevEmailMode(apiKey)) {
            return "dev-email-mock";
        }

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
