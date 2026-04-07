package ticketReservation.soen345.service;

import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationContext;
import ticketReservation.soen345.domain.User;

public interface NotificationChannelStrategy {

    void sendTo(User to, Notification notification, NotificationContext context);
}
