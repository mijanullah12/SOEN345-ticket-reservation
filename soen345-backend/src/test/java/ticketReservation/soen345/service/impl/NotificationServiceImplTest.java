package ticketReservation.soen345.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.NotificationType;
import ticketReservation.soen345.domain.User;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private EmailCommunicationStrategy emailCommunicationStrategy;
    @Mock
    private SmsCommunicationStrategy smsCommunicationStrategy;
    @Mock
    private EmailNotificationFactory emailNotificationFactory;
    @Mock
    private SmsNotificationFactory smsNotificationFactory;

    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(
                emailCommunicationStrategy,
                smsCommunicationStrategy,
                emailNotificationFactory,
                smsNotificationFactory);
    }

    @Test
    @DisplayName("sends email for CONFIRM_RESERVATION")
    void emailConfirm() {
        User user = User.builder().email("a@b.com").build();
        Event event = Event.builder().name("E").build();
        Notification n = org.mockito.Mockito.mock(Notification.class);
        when(emailNotificationFactory.createReservationConfirmation()).thenReturn(n);

        notificationService.sendMessage(
                NotificationChannel.EMAIL,
                NotificationType.CONFIRM_RESERVATION,
                user,
                event,
                null);

        verify(emailCommunicationStrategy).sendTo(eq(user), eq(n), any());
    }

    @Test
    @DisplayName("sends SMS for CANCEL_RESERVATION")
    void smsCancel() {
        User user = User.builder().phone("+15550001111").build();
        Event event = Event.builder().name("E").build();
        Notification n = org.mockito.Mockito.mock(Notification.class);
        when(smsNotificationFactory.createReservationCancellation()).thenReturn(n);

        notificationService.sendMessage(
                NotificationChannel.SMS,
                NotificationType.CANCEL_RESERVATION,
                user,
                event,
                null);

        verify(smsCommunicationStrategy).sendTo(eq(user), eq(n), any());
    }

    @Test
    @DisplayName("throws when email channel but user has no email")
    void emailMissing() {
        User user = User.builder().email("  ").build();
        assertThatThrownBy(() -> notificationService.sendMessage(
                NotificationChannel.EMAIL,
                NotificationType.CONFIRM_RESERVATION,
                user,
                Event.builder().build(),
                null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Email");
    }

    @Test
    @DisplayName("throws when SMS channel but user has no phone")
    void phoneMissing() {
        User user = User.builder().phone(null).build();
        assertThatThrownBy(() -> notificationService.sendMessage(
                NotificationChannel.SMS,
                NotificationType.CONFIRM_RESERVATION,
                user,
                Event.builder().build(),
                null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Phone");
    }

    @Test
    @DisplayName("sends email for CANCEL_RESERVATION")
    void emailCancel() {
        User user = User.builder().email("a@b.com").build();
        Event event = Event.builder().name("E").build();
        Notification n = org.mockito.Mockito.mock(Notification.class);
        when(emailNotificationFactory.createReservationCancellation()).thenReturn(n);

        notificationService.sendMessage(
                NotificationChannel.EMAIL,
                NotificationType.CANCEL_RESERVATION,
                user,
                event,
                null);

        verify(emailCommunicationStrategy).sendTo(eq(user), eq(n), any());
    }
}
