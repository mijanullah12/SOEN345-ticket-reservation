package ticketReservation.soen345.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import ticketReservation.soen345.domain.Reservation;
import ticketReservation.soen345.domain.ReservationStatus;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends MongoRepository<Reservation, String> {

    List<Reservation> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<Reservation> findByUserIdAndEventIdAndStatus(String userId, String eventId, ReservationStatus status);
}
