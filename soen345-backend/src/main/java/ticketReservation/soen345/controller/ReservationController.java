package ticketReservation.soen345.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ticketReservation.soen345.domain.Permission;
import ticketReservation.soen345.dto.request.CreateReservationRequest;
import ticketReservation.soen345.dto.response.ReservationResponse;
import ticketReservation.soen345.security.RequiresPermission;
import ticketReservation.soen345.service.ReservationService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getMyReservations(Authentication authentication) {
        String userId = authentication.getName();
        List<ReservationResponse> reservations = reservationService.getMyReservations(userId);
        return ResponseEntity.ok(reservations);
    }

    @PostMapping
    @RequiresPermission(Permission.RESERVE_TICKET)
    public ResponseEntity<ReservationResponse> createReservation(
            Authentication authentication,
            @Valid @RequestBody CreateReservationRequest request) {
        String userId = authentication.getName();
        ReservationResponse response = reservationService.reserveTicket(userId, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    @RequiresPermission(Permission.CANCEL_TICKET)
    public ResponseEntity<ReservationResponse> cancelReservation(
            Authentication authentication,
            @PathVariable String id) {
        String userId = authentication.getName();
        ReservationResponse response = reservationService.cancelReservation(userId, id);
        return ResponseEntity.ok(response);
    }
}
