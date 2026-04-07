package ticketReservation.soen345.service;

import ticketReservation.soen345.dto.request.CreateReservationRequest;
import ticketReservation.soen345.dto.response.ReservationResponse;

import java.util.List;

public interface ReservationService {

    ReservationResponse reserveTicket(String userId, CreateReservationRequest request);

    ReservationResponse cancelReservation(String userId, String reservationId);

    List<ReservationResponse> getMyReservations(String userId);
}
