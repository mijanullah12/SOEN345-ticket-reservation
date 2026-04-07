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
import ticketReservation.soen345.domain.EventStatus;
import ticketReservation.soen345.dto.request.CreateEventRequest;
import ticketReservation.soen345.dto.request.UpdateEventRequest;
import ticketReservation.soen345.dto.response.EventResponse;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.security.JwtService;
import ticketReservation.soen345.security.PermissionAspect;
import ticketReservation.soen345.service.EventService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EventController.class)
@Import({SecurityConfig.class, PermissionAspect.class})
class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EventService eventService;

    @MockitoBean
    private JwtService jwtService;

    private static final String BASE_URL = "/api/v1/events";
    private static final String EVENT_ID = "event123";
    private static final Instant FUTURE_DATE = Instant.now().plus(7, ChronoUnit.DAYS);

    // ================================================================
    // POST /api/v1/events
    // ================================================================

    @Nested
    @DisplayName("POST /api/v1/events")
    class CreateEventTests {

        @Test
        @DisplayName("Should create event and return 201 when called by ADMIN")
        @WithMockUser(roles = "ADMIN")
        void createEvent_WithAdminRole_Returns201() throws Exception {
            CreateEventRequest request = buildCreateRequest();
            EventResponse response = buildEventResponse(EVENT_ID, EventStatus.ACTIVE);

            when(eventService.createEvent(any(CreateEventRequest.class), anyString())).thenReturn(response);

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(header().exists("Location"))
                    .andExpect(jsonPath("$.id").value(EVENT_ID))
                    .andExpect(jsonPath("$.name").value("Summer Concert"))
                    .andExpect(jsonPath("$.location").value("Montreal"))
                    .andExpect(jsonPath("$.capacity").value(200))
                    .andExpect(jsonPath("$.status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should create event and return 201 when called by ORGANIZER")
        @WithMockUser(roles = "ORGANIZER")
        void createEvent_WithOrganizerRole_Returns201() throws Exception {
            CreateEventRequest request = buildCreateRequest();
            EventResponse response = buildEventResponse(EVENT_ID, EventStatus.ACTIVE);

            when(eventService.createEvent(any(CreateEventRequest.class), anyString())).thenReturn(response);

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(EVENT_ID));
        }

        @Test
        @DisplayName("Should return 403 when called by CUSTOMER")
        @WithMockUser(roles = "CUSTOMER")
        void createEvent_WithCustomerRole_Returns403() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 403 when unauthenticated")
        void createEvent_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(buildCreateRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 400 when name is blank")
        @WithMockUser(roles = "ADMIN")
        void createEvent_BlankName_Returns400() throws Exception {
            CreateEventRequest request = CreateEventRequest.builder()
                    .name("")
                    .description("desc")
                    .date(FUTURE_DATE)
                    .location("Montreal")
                    .capacity(100)
                    .ticketPrice(BigDecimal.valueOf(20.00))
                    .build();

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors[?(@.field=='name')]").exists());
        }

        @Test
        @DisplayName("Should return 400 when capacity is less than 1")
        @WithMockUser(roles = "ADMIN")
        void createEvent_InvalidCapacity_Returns400() throws Exception {
            CreateEventRequest request = buildCreateRequest();
            request.setCapacity(0);

            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors[?(@.field=='capacity')]").exists());
        }

        @Test
        @DisplayName("Should return 400 when required fields are missing")
        @WithMockUser(roles = "ADMIN")
        void createEvent_MissingRequiredFields_Returns400() throws Exception {
            mockMvc.perform(post(BASE_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.fieldErrors").isArray());
        }
    }

    // ================================================================
    // PUT /api/v1/events/{id}
    // ================================================================

    @Nested
    @DisplayName("PUT /api/v1/events/{id}")
    class UpdateEventTests {

        @Test
        @DisplayName("Should update event and return 200 when called by ADMIN")
        @WithMockUser(roles = "ADMIN")
        void updateEvent_WithAdminRole_Returns200() throws Exception {
            UpdateEventRequest request = UpdateEventRequest.builder()
                    .name("Updated Concert")
                    .capacity(300)
                    .build();

            EventResponse response = buildEventResponse(EVENT_ID, EventStatus.ACTIVE);
            response.setName("Updated Concert");

            when(eventService.updateEvent(eq(EVENT_ID), any(UpdateEventRequest.class))).thenReturn(response);

            mockMvc.perform(put(BASE_URL + "/" + EVENT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(EVENT_ID))
                    .andExpect(jsonPath("$.name").value("Updated Concert"));
        }

        @Test
        @DisplayName("Should update event and return 200 when called by ORGANIZER")
        @WithMockUser(roles = "ORGANIZER")
        void updateEvent_WithOrganizerRole_Returns200() throws Exception {
            UpdateEventRequest request = UpdateEventRequest.builder().name("New Name").build();
            when(eventService.updateEvent(eq(EVENT_ID), any(UpdateEventRequest.class)))
                    .thenReturn(buildEventResponse(EVENT_ID, EventStatus.ACTIVE));

            mockMvc.perform(put(BASE_URL + "/" + EVENT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        @Test
        @DisplayName("Should return 403 when called by CUSTOMER")
        @WithMockUser(roles = "CUSTOMER")
        void updateEvent_WithCustomerRole_Returns403() throws Exception {
            mockMvc.perform(put(BASE_URL + "/" + EVENT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new UpdateEventRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 403 when unauthenticated")
        void updateEvent_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(put(BASE_URL + "/" + EVENT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new UpdateEventRequest())))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 404 when event does not exist")
        @WithMockUser(roles = "ADMIN")
        void updateEvent_EventNotFound_Returns404() throws Exception {
            when(eventService.updateEvent(eq("missing-id"), any(UpdateEventRequest.class)))
                    .thenThrow(new ResourceNotFoundException("Event", "id", "missing-id"));

            mockMvc.perform(put(BASE_URL + "/missing-id")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new UpdateEventRequest())))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }

        @Test
        @DisplayName("Should return 409 when updating a cancelled event")
        @WithMockUser(roles = "ADMIN")
        void updateEvent_CancelledEvent_Returns409() throws Exception {
            when(eventService.updateEvent(eq(EVENT_ID), any(UpdateEventRequest.class)))
                    .thenThrow(new IllegalStateException("Event is already cancelled"));

            mockMvc.perform(put(BASE_URL + "/" + EVENT_ID)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new UpdateEventRequest())))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value(409))
                    .andExpect(jsonPath("$.message").value("Event is already cancelled"));
        }
    }

    // ================================================================
    // PATCH /api/v1/events/{id}/cancel
    // ================================================================

    @Nested
    @DisplayName("PATCH /api/v1/events/{id}/cancel")
    class CancelEventTests {

        @Test
        @DisplayName("Should cancel event and return 200 when called by ADMIN")
        @WithMockUser(roles = "ADMIN")
        void cancelEvent_WithAdminRole_Returns200() throws Exception {
            EventResponse response = buildEventResponse(EVENT_ID, EventStatus.CANCELLED);
            when(eventService.cancelEvent(EVENT_ID)).thenReturn(response);

            mockMvc.perform(patch(BASE_URL + "/" + EVENT_ID + "/cancel"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(EVENT_ID))
                    .andExpect(jsonPath("$.status").value("CANCELLED"));
        }

        @Test
        @DisplayName("Should cancel event and return 200 when called by ORGANIZER")
        @WithMockUser(roles = "ORGANIZER")
        void cancelEvent_WithOrganizerRole_Returns200() throws Exception {
            EventResponse response = buildEventResponse(EVENT_ID, EventStatus.CANCELLED);
            when(eventService.cancelEvent(EVENT_ID)).thenReturn(response);

            mockMvc.perform(patch(BASE_URL + "/" + EVENT_ID + "/cancel"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("CANCELLED"));
        }

        @Test
        @DisplayName("Should return 403 when called by CUSTOMER")
        @WithMockUser(roles = "CUSTOMER")
        void cancelEvent_WithCustomerRole_Returns403() throws Exception {
            mockMvc.perform(patch(BASE_URL + "/" + EVENT_ID + "/cancel"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 403 when unauthenticated")
        void cancelEvent_Unauthenticated_Returns403() throws Exception {
            mockMvc.perform(patch(BASE_URL + "/" + EVENT_ID + "/cancel"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("Should return 404 when event does not exist")
        @WithMockUser(roles = "ADMIN")
        void cancelEvent_EventNotFound_Returns404() throws Exception {
            when(eventService.cancelEvent("missing-id"))
                    .thenThrow(new ResourceNotFoundException("Event", "id", "missing-id"));

            mockMvc.perform(patch(BASE_URL + "/missing-id/cancel"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }

        @Test
        @DisplayName("Should return 409 when event is already cancelled")
        @WithMockUser(roles = "ADMIN")
        void cancelEvent_AlreadyCancelled_Returns409() throws Exception {
            when(eventService.cancelEvent(EVENT_ID))
                    .thenThrow(new IllegalStateException("Event is already cancelled"));

            mockMvc.perform(patch(BASE_URL + "/" + EVENT_ID + "/cancel"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.status").value(409))
                    .andExpect(jsonPath("$.message").value("Event is already cancelled"));
        }
    }

    // ================================================================
    // GET /api/v1/events
    // ================================================================

    @Nested
    @DisplayName("GET /api/v1/events")
    class GetAvailableEventsTests {

        @Test
        @DisplayName("Should return list of active events for any authenticated user")
        @WithMockUser(roles = "CUSTOMER")
        void getAvailableEvents_WithCustomerRole_Returns200() throws Exception {
            List<EventResponse> events = List.of(
                    buildEventResponse("e1", EventStatus.ACTIVE),
                    buildEventResponse("e2", EventStatus.ACTIVE)
            );

            when(eventService.getAvailableEvents()).thenReturn(events);

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                    .andExpect(jsonPath("$[1].status").value("ACTIVE"));
        }

        @Test
        @DisplayName("Should return empty array when no events are available")
        @WithMockUser(roles = "CUSTOMER")
        void getAvailableEvents_NoEvents_ReturnsEmptyArray() throws Exception {
            when(eventService.getAvailableEvents()).thenReturn(List.of());

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }

        @Test
        @DisplayName("Should return event fields in response")
        @WithMockUser(roles = "ADMIN")
        void getAvailableEvents_ReturnsCorrectFields() throws Exception {
            EventResponse event = buildEventResponse("e1", EventStatus.ACTIVE);
            when(eventService.getAvailableEvents()).thenReturn(List.of(event));

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value("e1"))
                    .andExpect(jsonPath("$[0].name").value("Summer Concert"))
                    .andExpect(jsonPath("$[0].location").value("Montreal"))
                    .andExpect(jsonPath("$[0].capacity").value(200))
                    .andExpect(jsonPath("$[0].organizerId").value("org456"));
        }

        @Test
        @DisplayName("Should return events when unauthenticated")
        void getAvailableEvents_Unauthenticated_Returns200() throws Exception {
            when(eventService.getAvailableEvents()).thenReturn(List.of());

            mockMvc.perform(get(BASE_URL))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        }
    }

    // ================================================================
    // Helpers
    // ================================================================

    private CreateEventRequest buildCreateRequest() {
        return CreateEventRequest.builder()
                .name("Summer Concert")
                .description("An outdoor concert")
                .date(FUTURE_DATE)
                .location("Montreal")
                .capacity(200)
                .ticketPrice(BigDecimal.valueOf(49.99))
                .build();
    }

    private EventResponse buildEventResponse(String id, EventStatus status) {
        return EventResponse.builder()
                .id(id)
                .name("Summer Concert")
                .description("An outdoor concert")
                .date(FUTURE_DATE)
                .location("Montreal")
                .capacity(200)
                .ticketPrice(BigDecimal.valueOf(49.99))
                .organizerId("org456")
                .status(status)
                .createdAt(Instant.now())
                .build();
    }
}
