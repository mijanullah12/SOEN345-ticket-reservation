package ticketReservation.soen345.domain;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class ConfirmReservationContent implements Notification {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneId.systemDefault());

    @Override
    public String subject(NotificationContext context) {
        return "Reservation confirmed: " + eventName(context.event());
    }

    @Override
    public String body(NotificationContext context) {
        User user = context.user();
        Event event = context.event();

        StringBuilder message = new StringBuilder();
        message.append("Hi ").append(user.getFirstName()).append(",\n\n")
                .append("Your reservation is confirmed.\n")
                .append("Event: ").append(eventName(event)).append("\n")
                .append("Date: ").append(DATE_FORMATTER.format(event.getDate())).append("\n")
                .append("Location: ").append(event.getLocation()).append("\n");

        if (context.hasConfirmationLink()) {
            message.append("\nConfirmation link: ").append(context.confirmationLink()).append("\n");
        }

        message.append("\nThank you for using our ticket reservation system.");

        return message.toString();
    }

    private String eventName(Event event) {
        if (event.getName() == null || event.getName().isBlank()) {
            return "your event";
        }
        return event.getName();
    }
}
