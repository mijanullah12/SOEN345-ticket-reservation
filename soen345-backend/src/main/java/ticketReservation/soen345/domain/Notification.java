package ticketReservation.soen345.domain;

public interface Notification {

    String subject(NotificationContext context);

    String body(NotificationContext context);
}
