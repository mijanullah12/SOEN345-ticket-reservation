package ticketReservation.soen345.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationContext;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.service.EmailSender;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailCommunicationStrategyTest {

    @Mock
    private EmailSender emailSender;

    @InjectMocks
    private EmailCommunicationStrategy emailCommunicationStrategy =
            new EmailCommunicationStrategy("no-reply@tiqthat.me", emailSender);

    @Test
    void sendTo_UsesEmailSenderWithExpectedValues() {
        User user = User.builder()
                .email("customer@example.com")
                .firstName("Sam")
                .lastName("Lee")
                .build();

        Event event = Event.builder()
                .name("Concert")
                .date(Instant.now())
                .location("Montreal")
                .capacity(100)
                .ticketPrice(BigDecimal.valueOf(25))
                .build();

        Notification notification = new Notification() {
            @Override
            public String subject(NotificationContext context) {
                return "Subject";
            }

            @Override
            public String body(NotificationContext context) {
                return "Line1\nLine2";
            }
        };

        when(emailSender.sendEmail(anyString(), anyString(), anyString(), anyString()))
                .thenReturn("email-id-1");

        emailCommunicationStrategy.sendTo(
                user,
                notification,
                new NotificationContext(user, event, null)
        );

        ArgumentCaptor<String> htmlCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailSender).sendEmail(
                anyString(),
                anyString(),
                anyString(),
                htmlCaptor.capture()
        );

        assertThat(htmlCaptor.getValue()).contains("<br/>");
    }
}
