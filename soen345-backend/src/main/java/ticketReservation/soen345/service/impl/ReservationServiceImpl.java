package ticketReservation.soen345.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.EventStatus;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.NotificationType;
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

    @Override
    public ReservationResponse reserveTicket(String userId, CreateReservationRequest request) {
        User user = findUserById(userId);
        Event event = findEventById(request.getEventId());

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Cannot reserve tickets for a cancelled event.");
        }

        if (event.getCapacity() == null || event.getCapacity() < 1) {
            throw new IllegalStateException("No remaining capacity for this event.");
        }

        reservationRepository.findByUserIdAndEventIdAndStatus(
                userId,
                event.getId(),
                ReservationStatus.ACTIVE
        ).ifPresent(existing -> {
            throw new IllegalStateException("You already have an active reservation for this event.");
        });

        if (!processDummyPayment(user, event)) {
            throw new IllegalStateException("Payment failed.");
        }

        event.setCapacity(event.getCapacity() - 1);
        eventRepository.save(event);

        Reservation reservation = Reservation.builder()
                .userId(userId)
                .eventId(event.getId())
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
        event.setCapacity(currentCapacity + 1);
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

    private boolean processDummyPayment(User user, Event event) {
        return true;
    }

    private User findUserById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private Event findEventById(String eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
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
                .eventName(event.getName())
                .eventDate(event.getDate())
                .eventLocation(event.getLocation())
                .eventTicketPrice(event.getTicketPrice())
                .status(reservation.getStatus())
                .reservedAt(reservation.getCreatedAt())
                .cancelledAt(reservation.getCancelledAt())
                .updatedAt(reservation.getUpdatedAt())
                .build();
    }
}
