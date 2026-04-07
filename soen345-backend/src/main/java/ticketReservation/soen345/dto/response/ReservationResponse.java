package ticketReservation.soen345.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ticketReservation.soen345.domain.ReservationStatus;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponse {

    private String id;
    private String userId;
    private String eventId;
    private String paymentId;
    private String eventName;
    private Instant eventDate;
    private String eventLocation;
    private BigDecimal eventTicketPrice;
    private Integer quantity;
    private ReservationStatus status;
    private Instant reservedAt;
    private Instant cancelledAt;
    private Instant updatedAt;
}
