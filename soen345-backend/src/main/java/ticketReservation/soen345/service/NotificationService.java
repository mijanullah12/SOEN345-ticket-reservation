package ticketReservation.soen345.service;

import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.NotificationType;
import ticketReservation.soen345.domain.User;

public interface NotificationService {

    void sendMessage(NotificationChannel channel,
                     NotificationType notificationType,
                     User to,
                     Event event,
                     String confirmationLink);
}
