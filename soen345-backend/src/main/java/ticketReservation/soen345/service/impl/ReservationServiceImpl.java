package ticketReservation.soen345.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.EventStatus;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.NotificationType;
import ticketReservation.soen345.domain.Payment;
import ticketReservation.soen345.domain.PaymentInfo;
import ticketReservation.soen345.domain.Reservation;
import ticketReservation.soen345.domain.ReservationStatus;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.dto.request.CreateReservationRequest;
import ticketReservation.soen345.dto.response.ReservationResponse;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.repository.EventRepository;
import ticketReservation.soen345.repository.ReservationRepository;
import ticketReservation.soen345.repository.UserRepository;
import ticketReservation.soen345.service.NotificationService;
import ticketReservation.soen345.service.PaymentService;
import ticketReservation.soen345.service.ReservationService;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PaymentService paymentService;

    @Override
    public ReservationResponse reserveTicket(String userId, CreateReservationRequest request) {
        User user = findUserById(userId);
        Event event = findEventById(request.getEventId());
        int quantity = request.getQuantity() != null ? request.getQuantity() : 1;

        if (quantity < 1) {
            throw new IllegalStateException("Quantity must be at least 1.");
        }

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot reserve tickets for a cancelled event.");
        }

        if (event.getCapacity() == null || event.getCapacity() < quantity) {
            throw new IllegalStateException("No remaining capacity for this event.");
        }

        reservationRepository.findByUserIdAndEventIdAndStatus(
                userId,
                event.getId(),
                ReservationStatus.ACTIVE
        ).ifPresent(existing -> {
            throw new IllegalStateException("You already have an active reservation for this event.");
        });

        User organizer = findOrganizerForEvent(event);
        ensurePaymentSetup(user, organizer);
        Payment payment = paymentService.createPaymentIntent(
                user,
                organizer,
                event.getTicketPrice().multiply(java.math.BigDecimal.valueOf(quantity)),
                "usd");
        Payment confirmedPayment = paymentService.confirmPayment(payment.getId());

        event.setCapacity(event.getCapacity() - quantity);
        eventRepository.save(event);

        Reservation reservation = Reservation.builder()
                .userId(userId)
                .eventId(event.getId())
                .paymentId(confirmedPayment.getId())
                .quantity(quantity)
                .status(ReservationStatus.ACTIVE)
                .build();
        Reservation saved = reservationRepository.save(reservation);

        sendNotificationFor(user, event, NotificationType.CONFIRM_RESERVATION);
        return mapToResponse(saved, event);
    }

    @Override
    public ReservationResponse cancelReservation(String userId, String reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "id", reservationId));
        int quantity = reservation.getQuantity() != null ? reservation.getQuantity() : 1;

        if (!reservation.getUserId().equals(userId)) {
            throw new IllegalStateException("You can only cancel your own reservations.");
        }

        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new IllegalStateException("Reservation is already cancelled.");
        }

        Event event = findEventById(reservation.getEventId());
        User user = findUserById(userId);

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(Instant.now());
        Reservation saved = reservationRepository.save(reservation);

        Integer currentCapacity = event.getCapacity() == null ? 0 : event.getCapacity();
        event.setCapacity(currentCapacity + quantity);
        eventRepository.save(event);

        sendNotificationFor(user, event, NotificationType.CANCEL_RESERVATION);
        return mapToResponse(saved, event);
    }

    @Override
    public List<ReservationResponse> getMyReservations(String userId) {
        return reservationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(reservation -> {
                    Event event = findEventById(reservation.getEventId());
                    return mapToResponse(reservation, event);
                })
                .toList();
    }

    private User findUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private Event findEventById(String eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }

    private User findOrganizerForEvent(Event event) {
        String organizerId = event.getOrganizerId();
        if (organizerId == null || organizerId.isBlank()) {
            throw new IllegalStateException("Event organizer is missing for payment.");
        }
        return findUserById(organizerId);
    }

    private void ensurePaymentSetup(User payer, User payee) {
        PaymentInfo payerInfo = payer.getPaymentInfo();
        if (payerInfo == null
                || isBlank(payerInfo.getCustomerId())
                || isBlank(payerInfo.getDefaultPaymentMethodId())) {
            throw new IllegalStateException("Please add your payment method in your profile before reserving.");
        }

        PaymentInfo payeeInfo = payee.getPaymentInfo();
        if (payeeInfo == null || isBlank(payeeInfo.getPayoutAccountId())) {
            throw new IllegalStateException("Organizer has not set up payout details.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private void sendNotificationFor(User user, Event event, NotificationType notificationType) {
        NotificationChannel channel = user.getPreferredNotificationChannel() != null
                ? user.getPreferredNotificationChannel()
                : NotificationChannel.EMAIL;
        notificationService.sendMessage(channel, notificationType, user, event, null);
    }

    private ReservationResponse mapToResponse(Reservation reservation, Event event) {
        return ReservationResponse.builder()
                .id(reservation.getId())
                .userId(reservation.getUserId())
                .eventId(reservation.getEventId())
                .paymentId(reservation.getPaymentId())
                .eventName(event.getName())
                .eventDate(event.getDate())
                .eventLocation(event.getLocation())
                .eventTicketPrice(event.getTicketPrice())
                .quantity(reservation.getQuantity())
                .status(reservation.getStatus())
                .reservedAt(reservation.getCreatedAt())
                .cancelledAt(reservation.getCancelledAt())
                .updatedAt(reservation.getUpdatedAt())
                .build();
    }
}
