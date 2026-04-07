package ticketReservation.soen345.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationContext;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.service.EmailSender;
import ticketReservation.soen345.service.NotificationChannelStrategy;

@Service
@Slf4j
public class EmailCommunicationStrategy implements NotificationChannelStrategy {

    private final String fromAddress;
    private final EmailSender emailSender;

    public EmailCommunicationStrategy(
            @Value("${resend.from-email:no-reply@soen345.local}") String fromAddress,
            EmailSender emailSender
    ) {
        this.fromAddress = fromAddress;
        this.emailSender = emailSender;
    }

    @Override
    public void sendTo(User to, Notification notification, NotificationContext context) {
        String emailId = emailSender.sendEmail(
                fromAddress,
                to.getEmail(),
                notification.subject(context),
                notification.body(context).replace("\n", "<br/>")
        );
        log.info("Resend email sent to {} with id {}", to.getEmail(), emailId);
    }
}
