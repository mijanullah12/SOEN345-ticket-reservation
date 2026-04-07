package ticketReservation.soen345.domain;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class CancelReservationContent implements Notification {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault());

    @Override
    public String subject(NotificationContext context) {
        return "Reservation cancelled: " + eventName(context.event());
    }

    @Override
    public String body(NotificationContext context) {
        User user = context.user();
        Event event = context.event();

        return "Hi " + user.getFirstName() + ",\n\n"
                + "Your reservation has been cancelled.\n"
                + "Event: " + eventName(event) + "\n"
                + "Date: " + DATE_FORMATTER.format(event.getDate()) + "\n"
                + "Location: " + event.getLocation() + "\n\n"
                + "If this was a mistake, please make a new reservation.";
    }

    private String eventName(Event event) {
        if (event.getName() == null || event.getName().isBlank()) {
            return "your event";
        }
        return event.getName();
    }
}
