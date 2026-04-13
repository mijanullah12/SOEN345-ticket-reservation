package ticketReservation.soen345.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
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
import ticketReservation.soen345.security.JwtService;
import ticketReservation.soen345.security.PermissionAspect;
import ticketReservation.soen345.service.ReservationService;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    @Test
    @DisplayName("GET /api/v1/reservations lists for current user")
    @WithMockUser(username = "u1")
    void list() throws Exception {
        ReservationResponse r = ReservationResponse.builder()
                .id("r1")
                .userId("u1")
                .eventId("e1")
                .eventName("Concert")
                .quantity(1)
                .status(ReservationStatus.ACTIVE)
                .eventDate(Instant.now())
                .eventLocation("MTL")
                .eventTicketPrice(BigDecimal.TEN)
                .build();
        when(reservationService.getMyReservations("u1")).thenReturn(List.of(r));

        mockMvc.perform(get("/api/v1/reservations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("r1"));
    }

    @Test
    @DisplayName("POST create reservation")
    @WithMockUser(username = "u1", roles = "CUSTOMER")
    void create() throws Exception {
        CreateReservationRequest req = CreateReservationRequest.builder()
                .eventId("e1")
                .quantity(2)
                .build();
        ReservationResponse r = ReservationResponse.builder()
                .id("r1")
                .status(ReservationStatus.ACTIVE)
                .quantity(2)
                .build();
        when(reservationService.reserveTicket(eq("u1"), any(CreateReservationRequest.class))).thenReturn(r);

        mockMvc.perform(post("/api/v1/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("r1"));
    }

    @Test
    @DisplayName("PATCH cancel reservation")
    @WithMockUser(username = "u1", roles = "CUSTOMER")
    void cancel() throws Exception {
        ReservationResponse r = ReservationResponse.builder()
                .id("r1")
                .status(ReservationStatus.CANCELLED)
                .build();
        when(reservationService.cancelReservation("u1", "r1")).thenReturn(r);

        mockMvc.perform(patch("/api/v1/reservations/r1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
