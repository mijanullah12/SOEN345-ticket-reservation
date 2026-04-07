package ticketReservation.soen345.service;

import ticketReservation.soen345.domain.Notification;

public interface NotificationFactory {

    Notification createReservationConfirmation();

    Notification createReservationCancellation();
}
