package ticketReservation.soen345.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import ticketReservation.soen345.config.SecurityConfig;
import ticketReservation.soen345.domain.ReservationStatus;
import ticketReservation.soen345.dto.request.CreateReservationRequest;
import ticketReservation.soen345.dto.response.ReservationResponse;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.security.JwtService;
import ticketReservation.soen345.security.PermissionAspect;
import ticketReservation.soen345.service.ReservationService;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReservationController.class)
@Import({SecurityConfig.class, PermissionAspect.class})
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ReservationService reservationService;

    @MockitoBean
    private JwtService jwtService;

    private static final String BASE_URL = "/api/v1/reservations";
    private static final String RESERVATION_ID = "res123";
    private static final String EVENT_ID = "event456";
    private static final String USER_ID = "user789";

    // ================================================================
    // GET /api/v1/reservations
    // ================================================================

    @Nested
    @DisplayName("GET /api/v1/reservations")
    class GetMyReservationsTests {

        @Test
        @DisplayName("Should return list of reservations for authenticated CUSTOMER")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void getMyReservations_WithCustomerRole_Returns200() throws Exception {
            List<ReservationResponse> reservations = List.of(
                    buildReservationResponse(RESERVATION_ID, ReservationStatus.ACTIVE),
                    buildReservationResponse("res456", ReservationStatus.ACTIVE)
            );

            when(reservationService.getMyReservations(USER_ID)).thenReturn(reservations);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].id").value(RESERVATION_ID))
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should return list of reservations for authenticated ADMIN")
        @WithMockUser(username = USER_ID, roles = "ADMIN")
        void getMyReservations_WithAdminRole_Returns200() throws Exception {
            List<ReservationResponse> reservations = List.of(
                    buildReservationResponse(RESERVATION_ID, ReservationStatus.ACTIVE)
            );

            when(reservationService.getMyReservations(USER_ID)).thenReturn(reservations);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1));
        }

        @Test
        @DisplayName("Should return empty array when user has no reservations")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void getMyReservations_NoReservations_ReturnsEmptyArray() throws Exception {
            when(reservationService.getMyReservations(USER_ID)).thenReturn(List.of());

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }

        @Test
        @DisplayName("Should return reservation fields in response")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void getMyReservations_ReturnsCorrectFields() throws Exception {
            ReservationResponse reservation = buildReservationResponse(RESERVATION_ID, ReservationStatus.ACTIVE);
            when(reservationService.getMyReservations(USER_ID)).thenReturn(List.of(reservation));

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value(RESERVATION_ID))
                    .andExpect(jsonPath("$[0].eventId").value(EVENT_ID))
                    .andExpect(jsonPath("$[0].userId").value(USER_ID))
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should return 403 when unauthenticated")
        void getMyReservations_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isForbidden());
        }
    }

    // ================================================================
    // POST /api/v1/reservations
    // ================================================================

    @Nested
    @DisplayName("POST /api/v1/reservations")
    class CreateReservationTests {

        @Test
        @DisplayName("Should create reservation and return 200 when called by CUSTOMER")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void createReservation_WithCustomerRole_Returns200() throws Exception {
            CreateReservationRequest request = buildCreateRequest();
            ReservationResponse response = buildReservationResponse(RESERVATION_ID, ReservationStatus.ACTIVE);

            when(reservationService.reserveTicket(eq(USER_ID), any(CreateReservationRequest.class)))
                    .thenReturn(response);

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(RESERVATION_ID))
                    .andExpect(jsonPath("$.eventId").value(EVENT_ID))
                    .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should return 403 when called by ORGANIZER")
        @WithMockUser(roles = "ORGANIZER")
        void createReservation_WithOrganizerRole_Returns403() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 403 when unauthenticated")
        void createReservation_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 400 when required fields are missing")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void createReservation_MissingRequiredFields_Returns400() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.fieldErrors").isArray());
        }

        @Test
        @DisplayName("Should return 400 when eventId is null")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void createReservation_NullEventId_Returns400() throws Exception {
            CreateReservationRequest request = CreateReservationRequest.builder()
                    .eventId(null)
                    .build();

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors[?(@.field=='eventId')]").exists());
        }

        @Test
        @DisplayName("Should return 404 when event does not exist")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void createReservation_EventNotFound_Returns404() throws Exception {
            when(reservationService.reserveTicket(anyString(), any(CreateReservationRequest.class)))
                    .thenThrow(new ResourceNotFoundException("Event", "id", EVENT_ID));

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }

        @Test
        @DisplayName("Should return 409 when event is sold out")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void createReservation_EventSoldOut_Returns409() throws Exception {
            when(reservationService.reserveTicket(anyString(), any(CreateReservationRequest.class)))
                    .thenThrow(new IllegalStateException("No remaining capacity for this event."));

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value(409))
                    .andExpect(jsonPath("$.message").value("No remaining capacity for this event."));
        }

        @Test
        @DisplayName("Should return 409 when event is cancelled")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void createReservation_EventCancelled_Returns409() throws Exception {
            when(reservationService.reserveTicket(anyString(), any(CreateReservationRequest.class)))
                    .thenThrow(new IllegalStateException("Cannot reserve tickets for a cancelled event."));

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value(409))
                    .andExpect(jsonPath("$.message").value("Cannot reserve tickets for a cancelled event."));
        }

        @Test
        @DisplayName("Should return 409 when user already has an active reservation for the event")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void createReservation_DuplicateReservation_Returns409() throws Exception {
            when(reservationService.reserveTicket(anyString(), any(CreateReservationRequest.class)))
                    .thenThrow(new IllegalStateException("You already have an active reservation for this event."));

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value(409))
                    .andExpect(jsonPath("$.message").value("You already have an active reservation for this event."));
        }
    }

    // ================================================================
    // PATCH /api/v1/reservations/{id}/cancel
    // ================================================================

    @Nested
    @DisplayName("PATCH /api/v1/reservations/{id}/cancel")
    class CancelReservationTests {

        @Test
        @DisplayName("Should cancel reservation and return 200 when called by CUSTOMER")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void cancelReservation_WithCustomerRole_Returns200() throws Exception {
            ReservationResponse response = buildReservationResponse(RESERVATION_ID, ReservationStatus.CANCELLED);

            when(reservationService.cancelReservation(USER_ID, RESERVATION_ID)).thenReturn(response);

            mockMvc.perform(patch(BASE_URL + "/" + RESERVATION_ID + "/cancel"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(RESERVATION_ID))
                    .andExpect(jsonPath("$.status").value("CANCELLED"));
        }

        @Test
        @DisplayName("Should cancel reservation and return 200 when called by ADMIN")
        @WithMockUser(username = USER_ID, roles = "ADMIN")
        void cancelReservation_WithAdminRole_Returns200() throws Exception {
            ReservationResponse response = buildReservationResponse(RESERVATION_ID, ReservationStatus.CANCELLED);

            when(reservationService.cancelReservation(USER_ID, RESERVATION_ID)).thenReturn(response);

            mockMvc.perform(patch(BASE_URL + "/" + RESERVATION_ID + "/cancel"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CANCELLED"));
        }

        @Test
        @DisplayName("Should return 403 when called by ORGANIZER")
        @WithMockUser(roles = "ORGANIZER")
        void cancelReservation_WithOrganizerRole_Returns403() throws Exception {
            mockMvc.perform(patch(BASE_URL + "/" + RESERVATION_ID + "/cancel"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 403 when unauthenticated")
        void cancelReservation_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(patch(BASE_URL + "/" + RESERVATION_ID + "/cancel"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 404 when reservation does not exist")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void cancelReservation_NotFound_Returns404() throws Exception {
            when(reservationService.cancelReservation(anyString(), eq("missing-id")))
                    .thenThrow(new ResourceNotFoundException("Reservation", "id", "missing-id"));

            mockMvc.perform(patch(BASE_URL + "/missing-id/cancel"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }

        @Test
        @DisplayName("Should return 409 when reservation is already cancelled")
        @WithMockUser(username = USER_ID, roles = "CUSTOMER")
        void cancelReservation_AlreadyCancelled_Returns409() throws Exception {
            when(reservationService.cancelReservation(USER_ID, RESERVATION_ID))
                    .thenThrow(new IllegalStateException("Reservation is already cancelled."));

            mockMvc.perform(patch(BASE_URL + "/" + RESERVATION_ID + "/cancel"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value(409))
                    .andExpect(jsonPath("$.message").value("Reservation is already cancelled."));
        }

        @Test
        @DisplayName("Should return 409 when user tries to cancel another user's reservation")
        @WithMockUser(username = "other-user", roles = "CUSTOMER")
        void cancelReservation_WrongUser_Returns409() throws Exception {
            when(reservationService.cancelReservation(eq("other-user"), eq(RESERVATION_ID)))
                    .thenThrow(new IllegalStateException("You can only cancel your own reservations."));

            mockMvc.perform(patch(BASE_URL + "/" + RESERVATION_ID + "/cancel"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value(409))
                    .andExpect(jsonPath("$.message").value("You can only cancel your own reservations."));
        }
    }

    // ================================================================
    // Helpers
    // ================================================================

    private CreateReservationRequest buildCreateRequest() {
        return CreateReservationRequest.builder()
                .eventId(EVENT_ID)
                .build();
    }

    private ReservationResponse buildReservationResponse(String id, ReservationStatus status) {
        return ReservationResponse.builder()
                .id(id)
                .eventId(EVENT_ID)
                .userId(USER_ID)
                .status(status)
                .reservedAt(Instant.now())
                .build();
    }
}