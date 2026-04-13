package ticketReservation.soen345.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationContentTest {

    @Test
    @DisplayName("ConfirmReservationContent subject and body include event details")
    void confirm() {
        User user = User.builder().firstName("Sam").build();
        Event event = Event.builder()
                .name("Gig")
                .location("Venue")
                .date(Instant.parse("2030-01-15T20:00:00Z"))
                .build();
        NotificationContext ctx = new NotificationContext(user, event, null);

        ConfirmReservationContent content = new ConfirmReservationContent();
        assertThat(content.subject(ctx)).contains("Gig");
        assertThat(content.body(ctx)).contains("Sam").contains("Gig").contains("Venue");
    }

    @Test
    @DisplayName("ConfirmReservationContent adds link when present")
    void confirmWithLink() {
        User user = User.builder().firstName("A").build();
        Event event = Event.builder().name("E").location("L").date(Instant.now()).build();
        NotificationContext ctx = new NotificationContext(user, event, "https://x.com/c");

        ConfirmReservationContent content = new ConfirmReservationContent();
        assertThat(content.body(ctx)).contains("https://x.com/c");
    }

    @Test
    @DisplayName("ConfirmReservationContent uses fallback event name")
    void confirmBlankName() {
        User user = User.builder().firstName("A").build();
        Event event = Event.builder().name("  ").location("L").date(Instant.now()).build();
        NotificationContext ctx = new NotificationContext(user, event, null);
        ConfirmReservationContent content = new ConfirmReservationContent();
        assertThat(content.subject(ctx)).contains("your event");
    }

    @Test
    @DisplayName("CancelReservationContent builds body")
    void cancel() {
        User user = User.builder().firstName("Pat").build();
        Event event = Event.builder().name("Show").location("Hall").date(Instant.now()).build();
        NotificationContext ctx = new NotificationContext(user, event, null);

        CancelReservationContent content = new CancelReservationContent();
        assertThat(content.subject(ctx)).contains("Show");
        assertThat(content.body(ctx)).contains("Pat").contains("cancelled");
    }
}
