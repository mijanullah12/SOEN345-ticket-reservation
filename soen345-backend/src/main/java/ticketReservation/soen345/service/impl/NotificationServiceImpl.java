package ticketReservation.soen345.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.NotificationContext;
import ticketReservation.soen345.domain.NotificationType;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.service.NotificationFactory;
import ticketReservation.soen345.service.NotificationService;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final EmailCommunicationStrategy emailCommunicationStrategy;
    private final SmsCommunicationStrategy smsCommunicationStrategy;
    private final EmailNotificationFactory emailNotificationFactory;
    private final SmsNotificationFactory smsNotificationFactory;

    @Override
    public void sendMessage(NotificationChannel channel,
                            NotificationType notificationType,
                            User to,
                            Event event,
                            String confirmationLink) {
        NotificationContext context = new NotificationContext(to, event, confirmationLink);

        if (channel == NotificationChannel.EMAIL) {
            ensureEmailPresent(to);
            Notification notification = createNotification(emailNotificationFactory, notificationType);
            emailCommunicationStrategy.sendTo(to, notification, context);
            return;
        }

        if (channel == NotificationChannel.SMS) {
            ensurePhonePresent(to);
            Notification notification = createNotification(smsNotificationFactory, notificationType);
            smsCommunicationStrategy.sendTo(to, notification, context);
        }
    }

    private Notification createNotification(NotificationFactory factory, NotificationType type) {
        return switch (type) {
            case CONFIRM_RESERVATION -> factory.createReservationConfirmation();
            case CANCEL_RESERVATION -> factory.createReservationCancellation();
        };
    }

    private void ensureEmailPresent(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required for email notifications.");
        }
    }

    private void ensurePhonePresent(User user) {
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            throw new IllegalArgumentException("Phone number is required for SMS notifications.");
        }
    }
}
