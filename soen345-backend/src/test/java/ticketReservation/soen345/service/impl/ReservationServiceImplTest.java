package ticketReservation.soen345.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.EventStatus;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.NotificationType;
import ticketReservation.soen345.domain.Payment;
import ticketReservation.soen345.domain.PaymentInfo;
import ticketReservation.soen345.domain.PaymentStatus;
import ticketReservation.soen345.domain.Reservation;
import ticketReservation.soen345.domain.ReservationStatus;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.dto.request.CreateReservationRequest;
import ticketReservation.soen345.dto.response.ReservationResponse;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.repository.EventRepository;
import ticketReservation.soen345.repository.ReservationRepository;
import ticketReservation.soen345.repository.UserRepository;
import ticketReservation.soen345.service.NotificationService;
import ticketReservation.soen345.service.PaymentService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private PaymentService paymentService;

    private ReservationServiceImpl reservationService;

    private static final String USER_ID = "user1";
    private static final String ORG_ID = "org1";
    private static final String EVENT_ID = "evt1";
    private static final Instant EVENT_DATE = Instant.now().plus(7, ChronoUnit.DAYS);

    @BeforeEach
    void setUp() {
        reservationService = new ReservationServiceImpl(
                reservationRepository,
                eventRepository,
                userRepository,
                notificationService,
                paymentService);
    }

    private User customerWithPayment() {
        return User.builder()
                .id(USER_ID)
                .email("c@example.com")
                .firstName("C")
                .lastName("U")
                .role(UserRole.CUSTOMER)
                .preferredNotificationChannel(NotificationChannel.EMAIL)
                .paymentInfo(PaymentInfo.builder()
                        .customerId("cus_x")
                        .defaultPaymentMethodId("pm_x")
                        .build())
                .build();
    }

    private User organizerWithPayout() {
        return User.builder()
                .id(ORG_ID)
                .paymentInfo(PaymentInfo.builder().payoutAccountId("acct_x").build())
                .build();
    }

    private Event activeEvent(int capacity) {
        return Event.builder()
                .id(EVENT_ID)
                .name("Show")
                .location("Here")
                .date(EVENT_DATE)
                .capacity(capacity)
                .ticketPrice(BigDecimal.TEN)
                .organizerId(ORG_ID)
                .status(EventStatus.ACTIVE)
                .build();
    }

    @Nested
    @DisplayName("reserveTicket")
    class ReserveTicket {

        @Test
        @DisplayName("completes reservation and updates capacity")
        void success() {
            User customer = customerWithPayment();
            User organizer = organizerWithPayout();
            Event event = activeEvent(5);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customer));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
            when(userRepository.findById(ORG_ID)).thenReturn(Optional.of(organizer));
            when(reservationRepository.findByUserIdAndEventIdAndStatus(USER_ID, EVENT_ID, ReservationStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            Payment pending = Payment.builder().id("pay1").providerPaymentId("pi_1").build();
            Payment confirmed = Payment.builder().id("pay1").providerPaymentId("pi_1").status(PaymentStatus.CONFIRMED).build();
            when(paymentService.createPaymentIntent(any(), any(), any(), eq("usd"))).thenReturn(pending);
            when(paymentService.confirmPayment("pay1")).thenReturn(confirmed);

            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                r.setId("res1");
                r.setCreatedAt(Instant.now());
                return r;
            });
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(2)
                    .build();

            ReservationResponse response = reservationService.reserveTicket(USER_ID, req);

            assertThat(response.getId()).isEqualTo("res1");
            assertThat(response.getQuantity()).isEqualTo(2);
            ArgumentCaptor<Event> eventCaptor = ArgumentCaptor.forClass(Event.class);
            verify(eventRepository).save(eventCaptor.capture());
            assertThat(eventCaptor.getValue().getCapacity()).isEqualTo(3);
            verify(notificationService).sendMessage(
                    eq(NotificationChannel.EMAIL),
                    eq(NotificationType.CONFIRM_RESERVATION),
                    eq(customer),
                    eq(event),
                    eq(null));
        }

        @Test
        @DisplayName("defaults quantity to 1 when null")
        void defaultQuantity() {
            User customer = customerWithPayment();
            User organizer = organizerWithPayout();
            Event event = activeEvent(5);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customer));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
            when(userRepository.findById(ORG_ID)).thenReturn(Optional.of(organizer));
            when(reservationRepository.findByUserIdAndEventIdAndStatus(USER_ID, EVENT_ID, ReservationStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            Payment pending = Payment.builder().id("pay1").providerPaymentId("pi_1").build();
            when(paymentService.createPaymentIntent(any(), any(), any(), eq("usd"))).thenReturn(pending);
            when(paymentService.confirmPayment("pay1")).thenReturn(pending);

            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                r.setId("res1");
                return r;
            });
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(null)
                    .build();

            ReservationResponse response = reservationService.reserveTicket(USER_ID, req);
            assertThat(response.getQuantity()).isEqualTo(1);
        }

        @Test
        @DisplayName("throws when quantity < 1")
        void badQuantity() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(activeEvent(5)));

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(0)
                    .build();

            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Quantity");
            verify(paymentService, never()).createPaymentIntent(any(), any(), any(), any());
        }

        @Test
        @DisplayName("throws when event cancelled")
        void cancelledEvent() {
            Event event = activeEvent(5);
            event.setStatus(EventStatus.CANCELLED);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .build();

            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("cancelled");
        }

        @Test
        @DisplayName("throws when capacity insufficient")
        void noCapacity() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(activeEvent(1)));

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(2)
                    .build();

            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("capacity");
        }

        @Test
        @DisplayName("throws when event capacity is null")
        void nullCapacity() {
            Event event = activeEvent(5);
            event.setCapacity(null);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .build();

            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("capacity");
        }

        @Test
        @DisplayName("uses SMS notification channel when preferred")
        void smsNotificationChannel() {
            User customer = User.builder()
                    .id(USER_ID)
                    .email("c@example.com")
                    .phone("+14155552671")
                    .firstName("C")
                    .lastName("U")
                    .role(UserRole.CUSTOMER)
                    .preferredNotificationChannel(NotificationChannel.SMS)
                    .paymentInfo(PaymentInfo.builder()
                            .customerId("cus_x")
                            .defaultPaymentMethodId("pm_x")
                            .build())
                    .build();
            User organizer = organizerWithPayout();
            Event event = activeEvent(5);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customer));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
            when(userRepository.findById(ORG_ID)).thenReturn(Optional.of(organizer));
            when(reservationRepository.findByUserIdAndEventIdAndStatus(USER_ID, EVENT_ID, ReservationStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            Payment pending = Payment.builder().id("pay1").providerPaymentId("pi_1").build();
            when(paymentService.createPaymentIntent(any(), any(), any(), eq("usd"))).thenReturn(pending);
            when(paymentService.confirmPayment("pay1")).thenReturn(pending);

            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> {
                Reservation r = inv.getArgument(0);
                r.setId("res1");
                return r;
            });
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            reservationService.reserveTicket(USER_ID, CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .build());

            verify(notificationService).sendMessage(
                    eq(NotificationChannel.SMS),
                    eq(NotificationType.CONFIRM_RESERVATION),
                    eq(customer),
                    eq(event),
                    eq(null));
        }

        @Test
        @DisplayName("throws when duplicate active reservation")
        void duplicateActive() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(activeEvent(5)));
            when(reservationRepository.findByUserIdAndEventIdAndStatus(USER_ID, EVENT_ID, ReservationStatus.ACTIVE))
                    .thenReturn(Optional.of(Reservation.builder().build()));

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .build();

            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("already have an active reservation");
        }

        @Test
        @DisplayName("throws when organizer missing on event")
        void missingOrganizer() {
            Event event = activeEvent(5);
            event.setOrganizerId(" ");
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
            when(reservationRepository.findByUserIdAndEventIdAndStatus(USER_ID, EVENT_ID, ReservationStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .build();

            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("organizer");
        }

        @Test
        @DisplayName("throws when customer payment method missing")
        void payerNotReady() {
            User customer = User.builder()
                    .id(USER_ID)
                    .paymentInfo(PaymentInfo.builder().customerId("cus").build())
                    .build();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customer));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(activeEvent(5)));
            when(userRepository.findById(ORG_ID)).thenReturn(Optional.of(organizerWithPayout()));
            when(reservationRepository.findByUserIdAndEventIdAndStatus(USER_ID, EVENT_ID, ReservationStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .build();

            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("payment method");
        }

        @Test
        @DisplayName("throws when organizer payout missing")
        void payeeNotReady() {
            User organizer = User.builder().id(ORG_ID).paymentInfo(PaymentInfo.builder().build()).build();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(activeEvent(5)));
            when(userRepository.findById(ORG_ID)).thenReturn(Optional.of(organizer));
            when(reservationRepository.findByUserIdAndEventIdAndStatus(USER_ID, EVENT_ID, ReservationStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            CreateReservationRequest req = CreateReservationRequest.builder()
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .build();

            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("payout");
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when user missing")
        void userMissing() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
            CreateReservationRequest req = CreateReservationRequest.builder().eventId(EVENT_ID).quantity(1).build();
            assertThatThrownBy(() -> reservationService.reserveTicket(USER_ID, req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("cancelReservation")
    class CancelReservation {

        @Test
        @DisplayName("cancels and restores capacity")
        void success() {
            Reservation reservation = Reservation.builder()
                    .id("res1")
                    .userId(USER_ID)
                    .eventId(EVENT_ID)
                    .quantity(2)
                    .status(ReservationStatus.ACTIVE)
                    .build();
            Event event = activeEvent(3);

            when(reservationRepository.findById("res1")).thenReturn(Optional.of(reservation));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
            User customer = customerWithPayment();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customer));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            ReservationResponse response = reservationService.cancelReservation(USER_ID, "res1");

            assertThat(response.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
            ArgumentCaptor<Event> cap = ArgumentCaptor.forClass(Event.class);
            verify(eventRepository).save(cap.capture());
            assertThat(cap.getValue().getCapacity()).isEqualTo(5);
            verify(notificationService).sendMessage(
                    eq(NotificationChannel.EMAIL),
                    eq(NotificationType.CANCEL_RESERVATION),
                    eq(customer),
                    eq(event),
                    eq(null));
        }

        @Test
        @DisplayName("throws when not owner")
        void wrongUser() {
            Reservation reservation = Reservation.builder()
                    .id("res1")
                    .userId("other")
                    .eventId(EVENT_ID)
                    .status(ReservationStatus.ACTIVE)
                    .build();
            when(reservationRepository.findById("res1")).thenReturn(Optional.of(reservation));

            assertThatThrownBy(() -> reservationService.cancelReservation(USER_ID, "res1"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("only cancel your own");
        }

        @Test
        @DisplayName("throws when already cancelled")
        void alreadyCancelled() {
            Reservation reservation = Reservation.builder()
                    .id("res1")
                    .userId(USER_ID)
                    .eventId(EVENT_ID)
                    .status(ReservationStatus.CANCELLED)
                    .build();
            when(reservationRepository.findById("res1")).thenReturn(Optional.of(reservation));

            assertThatThrownBy(() -> reservationService.cancelReservation(USER_ID, "res1"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("already cancelled");
        }

        @Test
        @DisplayName("defaults quantity to 1 when null on cancel")
        void cancel_DefaultQuantityWhenNull() {
            Reservation reservation = Reservation.builder()
                    .id("res1")
                    .userId(USER_ID)
                    .eventId(EVENT_ID)
                    .quantity(null)
                    .status(ReservationStatus.ACTIVE)
                    .build();
            Event event = activeEvent(3);

            when(reservationRepository.findById("res1")).thenReturn(Optional.of(reservation));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            reservationService.cancelReservation(USER_ID, "res1");

            ArgumentCaptor<Event> cap = ArgumentCaptor.forClass(Event.class);
            verify(eventRepository).save(cap.capture());
            assertThat(cap.getValue().getCapacity()).isEqualTo(4);
        }

        @Test
        @DisplayName("cancel treats null event capacity as zero before restore")
        void cancel_EventCapacityNull() {
            Reservation reservation = Reservation.builder()
                    .id("res1")
                    .userId(USER_ID)
                    .eventId(EVENT_ID)
                    .quantity(2)
                    .status(ReservationStatus.ACTIVE)
                    .build();
            Event event = activeEvent(0);
            event.setCapacity(null);

            when(reservationRepository.findById("res1")).thenReturn(Optional.of(reservation));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(event));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customerWithPayment()));
            when(reservationRepository.save(any(Reservation.class))).thenAnswer(inv -> inv.getArgument(0));
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            reservationService.cancelReservation(USER_ID, "res1");

            ArgumentCaptor<Event> cap = ArgumentCaptor.forClass(Event.class);
            verify(eventRepository).save(cap.capture());
            assertThat(cap.getValue().getCapacity()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("getMyReservations")
    class ListReservations {

        @Test
        @DisplayName("maps each reservation to response with event details")
        void lists() {
            Reservation r = Reservation.builder()
                    .id("r1")
                    .userId(USER_ID)
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .status(ReservationStatus.ACTIVE)
                    .createdAt(Instant.now())
                    .build();
            when(reservationRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(r));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(activeEvent(10)));

            List<ReservationResponse> list = reservationService.getMyReservations(USER_ID);

            assertThat(list).hasSize(1);
            assertThat(list.getFirst().getEventName()).isEqualTo("Show");
        }

        @Test
        @DisplayName("throws when linked event no longer exists")
        void eventMissing() {
            Reservation r = Reservation.builder()
                    .id("r1")
                    .userId(USER_ID)
                    .eventId(EVENT_ID)
                    .quantity(1)
                    .status(ReservationStatus.ACTIVE)
                    .createdAt(Instant.now())
                    .build();
            when(reservationRepository.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(r));
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reservationService.getMyReservations(USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining(EVENT_ID);
        }
    }
}
