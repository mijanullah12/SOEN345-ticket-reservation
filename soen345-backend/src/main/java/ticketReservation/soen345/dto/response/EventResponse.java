package ticketReservation.soen345.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ticketReservation.soen345.domain.EventStatus;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {

    private String id;
    private String name;
    private String description;
    private Instant date;
    private String location;
    private Integer capacity;
    private BigDecimal ticketPrice;
    private String organizerId;
    private Boolean organizerPayoutReady;
    private String organizerName;
    private String organizerEmail;
    private EventStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
