package ticketReservation.soen345.domain;

import java.util.Objects;

public record NotificationContext(User user, Event event, String confirmationLink) {

    public NotificationContext {
        Objects.requireNonNull(user, "user is required");
        Objects.requireNonNull(event, "event is required");
    }

    public boolean hasConfirmationLink() {
        return confirmationLink != null && !confirmationLink.isBlank();
    }
}
