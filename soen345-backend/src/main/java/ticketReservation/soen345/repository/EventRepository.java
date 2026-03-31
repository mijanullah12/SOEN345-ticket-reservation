package ticketReservation.soen345.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.EventStatus;

import java.util.List;

public interface EventRepository extends MongoRepository<Event, String> {
    List<Event> findByStatus(EventStatus status);
}
