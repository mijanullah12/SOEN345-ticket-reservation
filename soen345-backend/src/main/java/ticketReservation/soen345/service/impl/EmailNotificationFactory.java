package ticketReservation.soen345.service.impl;

import org.springframework.stereotype.Component;
import ticketReservation.soen345.domain.CancelReservationContent;
import ticketReservation.soen345.domain.ConfirmReservationContent;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.service.NotificationFactory;

@Component
public class EmailNotificationFactory implements NotificationFactory {

    @Override
    public Notification createReservationConfirmation() {
        return new ConfirmReservationContent();
    }

    @Override
    public Notification createReservationCancellation() {
        return new CancelReservationContent();
    }
}
