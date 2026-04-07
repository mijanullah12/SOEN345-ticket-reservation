package ticketReservation.soen345.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationContext;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.service.SmsSender;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SmsCommunicationStrategyTest {

    @Mock
    private SmsSender smsSender;

    private SmsCommunicationStrategy smsCommunicationStrategy;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        smsCommunicationStrategy =
                new SmsCommunicationStrategy("+15551234567", smsSender);
    }

    @Test
    void sendTo_UsesSmsSenderWithExpectedValues() {
        User user = User.builder()
                .phone("+15557654321")
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
                return "Sms body";
            }
        };

        when(smsSender.sendSms(anyString(), anyString(), anyString()))
                .thenReturn("sid-1");

        smsCommunicationStrategy.sendTo(
                user,
                notification,
                new NotificationContext(user, event, null)
        );

        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(smsSender).sendSms(
                anyString(),
                anyString(),
                bodyCaptor.capture()
        );

        assertThat(bodyCaptor.getValue()).isEqualTo("Sms body");
    }
}
