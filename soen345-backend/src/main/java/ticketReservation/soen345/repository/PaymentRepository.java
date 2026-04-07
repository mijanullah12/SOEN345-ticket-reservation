package ticketReservation.soen345.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import ticketReservation.soen345.domain.Payment;

public interface PaymentRepository extends MongoRepository<Payment, String> {
}
