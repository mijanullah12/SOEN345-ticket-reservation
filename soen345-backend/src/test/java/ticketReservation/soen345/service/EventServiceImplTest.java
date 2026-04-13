package ticketReservation.soen345.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.EventStatus;
import ticketReservation.soen345.dto.request.CreateEventRequest;
import ticketReservation.soen345.dto.request.UpdateEventRequest;
import ticketReservation.soen345.dto.response.EventResponse;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.repository.EventRepository;
import ticketReservation.soen345.repository.UserRepository;
import ticketReservation.soen345.service.impl.EventServiceImpl;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    private EventServiceImpl eventService;

    private static final Instant FUTURE_DATE = Instant.now().plus(7, ChronoUnit.DAYS);
    private static final String EVENT_ID = "event123";
    private static final String ORGANIZER_ID = "org456";

    @BeforeEach
    void setUp() {
        eventService = new EventServiceImpl(eventRepository, userRepository);
    }

    // ================================================================
    // createEvent
    // ================================================================

    @Nested
    @DisplayName("createEvent")
    class CreateEventTests {

        @Test
        @DisplayName("Should save event with all fields from request")
        void createEvent_ShouldSaveEventWithCorrectFields() {
            CreateEventRequest request = buildCreateRequest("Summer Concert", "Montreal", 200, BigDecimal.valueOf(49.99));

            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
                Event e = inv.getArgument(0);
                e.setId(EVENT_ID);
                e.setCreatedAt(Instant.now());
                return e;
            });

            EventResponse response = eventService.createEvent(request, ORGANIZER_ID);

            ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
            verify(eventRepository).save(captor.capture());
            Event saved = captor.getValue();

            assertThat(saved.getName()).isEqualTo("Summer Concert");
            assertThat(saved.getDescription()).isEqualTo("A great show");
            assertThat(saved.getDate()).isEqualTo(FUTURE_DATE);
            assertThat(saved.getLocation()).isEqualTo("Montreal");
            assertThat(saved.getCapacity()).isEqualTo(200);
            assertThat(saved.getTicketPrice()).isEqualByComparingTo(BigDecimal.valueOf(49.99));
            assertThat(saved.getOrganizerId()).isEqualTo(ORGANIZER_ID);
            assertThat(response.getId()).isEqualTo(EVENT_ID);
        }

        @Test
        @DisplayName("Should default status to ACTIVE on creation")
        void createEvent_ShouldDefaultStatusToActive() {
            CreateEventRequest request = buildCreateRequest("Concert", "Toronto", 100, BigDecimal.valueOf(20.00));

            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
                Event e = inv.getArgument(0);
                e.setId(EVENT_ID);
                return e;
            });

            eventService.createEvent(request, ORGANIZER_ID);

            ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
            verify(eventRepository).save(captor.capture());

            assertThat(captor.getValue().getStatus()).isEqualTo(EventStatus.ACTIVE);
        }

        @Test
        @DisplayName("Should trim whitespace from name and location")
        void createEvent_ShouldTrimNameAndLocation() {
            CreateEventRequest request = CreateEventRequest.builder()
                    .name("  Jazz Night  ")
                    .description("Evening of jazz")
                    .date(FUTURE_DATE)
                    .location("  Old Port  ")
                    .capacity(50)
                    .ticketPrice(BigDecimal.valueOf(15.00))
                    .category("concerts")
                    .build();

            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            eventService.createEvent(request, ORGANIZER_ID);

            ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
            verify(eventRepository).save(captor.capture());
            assertThat(captor.getValue().getName()).isEqualTo("Jazz Night");
            assertThat(captor.getValue().getLocation()).isEqualTo("Old Port");
        }

        @Test
        @DisplayName("Should set organizerId from caller")
        void createEvent_ShouldSetOrganizerId() {
            CreateEventRequest request = buildCreateRequest("Event", "Venue", 100, BigDecimal.TEN);
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            eventService.createEvent(request, "caller-id-789");

            ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
            verify(eventRepository).save(captor.capture());
            assertThat(captor.getValue().getOrganizerId()).isEqualTo("caller-id-789");
        }
    }

    // ================================================================
    // updateEvent
    // ================================================================

    @Nested
    @DisplayName("updateEvent")
    class UpdateEventTests {

        @Test
        @DisplayName("Should update all fields when request provides values")
        void updateEvent_ShouldUpdateAllProvidedFields() {
            Event existing = buildEvent(EVENT_ID, EventStatus.ACTIVE);
            Instant newDate = FUTURE_DATE.plus(14, ChronoUnit.DAYS);

            UpdateEventRequest request = UpdateEventRequest.builder()
                    .name("Updated Name")
                    .description("Updated description")
                    .date(newDate)
                    .location("Quebec City")
                    .capacity(300)
                    .ticketPrice(BigDecimal.valueOf(75.00))
                    .build();

            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(existing));
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            EventResponse response = eventService.updateEvent(EVENT_ID, request);

            assertThat(response.getName()).isEqualTo("Updated Name");
            assertThat(response.getDescription()).isEqualTo("Updated description");
            assertThat(response.getDate()).isEqualTo(newDate);
            assertThat(response.getLocation()).isEqualTo("Quebec City");
            assertThat(response.getCapacity()).isEqualTo(300);
            assertThat(response.getTicketPrice()).isEqualByComparingTo(BigDecimal.valueOf(75.00));
        }

        @Test
        @DisplayName("Should keep existing field values when request fields are null")
        void updateEvent_ShouldKeepExistingFieldsWhenRequestFieldsAreNull() {
            Event existing = buildEvent(EVENT_ID, EventStatus.ACTIVE);

            UpdateEventRequest request = UpdateEventRequest.builder().build(); // all null

            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(existing));
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            EventResponse response = eventService.updateEvent(EVENT_ID, request);

            assertThat(response.getName()).isEqualTo(existing.getName());
            assertThat(response.getDescription()).isEqualTo(existing.getDescription());
            assertThat(response.getDate()).isEqualTo(existing.getDate());
            assertThat(response.getLocation()).isEqualTo(existing.getLocation());
            assertThat(response.getCapacity()).isEqualTo(existing.getCapacity());
            assertThat(response.getTicketPrice()).isEqualByComparingTo(existing.getTicketPrice());
        }

        @Test
        @DisplayName("Should preserve organizerId and status on update")
        void updateEvent_ShouldPreserveOrganizerIdAndStatus() {
            Event existing = buildEvent(EVENT_ID, EventStatus.ACTIVE);

            UpdateEventRequest request = UpdateEventRequest.builder().name("New Name").build();

            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(existing));
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            EventResponse response = eventService.updateEvent(EVENT_ID, request);

            assertThat(response.getOrganizerId()).isEqualTo(ORGANIZER_ID);
            assertThat(response.getStatus()).isEqualTo(EventStatus.ACTIVE);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when event does not exist")
        void updateEvent_ShouldThrowWhenEventNotFound() {
            when(eventRepository.findById("missing-id")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> eventService.updateEvent("missing-id", new UpdateEventRequest()))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("missing-id");

            verify(eventRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalStateException when updating a cancelled event")
        void updateEvent_ShouldThrowWhenEventIsCancelled() {
            Event cancelled = buildEvent(EVENT_ID, EventStatus.CANCELLED);
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(cancelled));

            assertThatThrownBy(() -> eventService.updateEvent(EVENT_ID, new UpdateEventRequest()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("cancelled");

            verify(eventRepository, never()).save(any());
        }
    }

    // ================================================================
    // cancelEvent
    // ================================================================

    @Nested
    @DisplayName("cancelEvent")
    class CancelEventTests {

        @Test
        @DisplayName("Should set status to CANCELLED")
        void cancelEvent_ShouldSetStatusToCancelled() {
            Event existing = buildEvent(EVENT_ID, EventStatus.ACTIVE);
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(existing));
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            EventResponse response = eventService.cancelEvent(EVENT_ID);

            assertThat(response.getStatus()).isEqualTo(EventStatus.CANCELLED);
            assertThat(response.getId()).isEqualTo(EVENT_ID);
        }

        @Test
        @DisplayName("Should preserve all other fields when cancelling")
        void cancelEvent_ShouldPreserveOtherFields() {
            Event existing = buildEvent(EVENT_ID, EventStatus.ACTIVE);
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(existing));
            when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

            EventResponse response = eventService.cancelEvent(EVENT_ID);

            assertThat(response.getName()).isEqualTo(existing.getName());
            assertThat(response.getLocation()).isEqualTo(existing.getLocation());
            assertThat(response.getCapacity()).isEqualTo(existing.getCapacity());
            assertThat(response.getOrganizerId()).isEqualTo(ORGANIZER_ID);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when event does not exist")
        void cancelEvent_ShouldThrowWhenEventNotFound() {
            when(eventRepository.findById("missing-id")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> eventService.cancelEvent("missing-id"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("missing-id");

            verify(eventRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw IllegalStateException when event is already cancelled")
        void cancelEvent_ShouldThrowWhenAlreadyCancelled() {
            Event cancelled = buildEvent(EVENT_ID, EventStatus.CANCELLED);
            when(eventRepository.findById(EVENT_ID)).thenReturn(Optional.of(cancelled));

            assertThatThrownBy(() -> eventService.cancelEvent(EVENT_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("cancelled");

            verify(eventRepository, never()).save(any());
        }
    }

    // ================================================================
    // getAvailableEvents
    // ================================================================

    @Nested
    @DisplayName("getAvailableEvents")
    class GetAvailableEventsTests {

        @Test
        @DisplayName("Should return only ACTIVE events")
        void getAvailableEvents_ShouldReturnOnlyActiveEvents() {
            Event active1 = buildEvent("e1", EventStatus.ACTIVE);
            Event active2 = buildEvent("e2", EventStatus.ACTIVE);

            when(eventRepository.findByStatus(EventStatus.ACTIVE)).thenReturn(List.of(active1, active2));

            List<EventResponse> result = eventService.getAvailableEvents();

            assertThat(result).hasSize(2);
            assertThat(result).extracting(EventResponse::getId).containsExactlyInAnyOrder("e1", "e2");
            assertThat(result).allMatch(r -> r.getStatus() == EventStatus.ACTIVE);
            verify(eventRepository).findByStatus(EventStatus.ACTIVE);
        }

        @Test
        @DisplayName("Should return empty list when no active events exist")
        void getAvailableEvents_ShouldReturnEmptyListWhenNone() {
            when(eventRepository.findByStatus(EventStatus.ACTIVE)).thenReturn(List.of());

            List<EventResponse> result = eventService.getAvailableEvents();

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should map all fields to EventResponse")
        void getAvailableEvents_ShouldMapAllFieldsCorrectly() {
            Event event = buildEvent("e1", EventStatus.ACTIVE);
            when(eventRepository.findByStatus(EventStatus.ACTIVE)).thenReturn(List.of(event));

            List<EventResponse> result = eventService.getAvailableEvents();

            EventResponse response = result.getFirst();
            assertThat(response.getName()).isEqualTo(event.getName());
            assertThat(response.getDescription()).isEqualTo(event.getDescription());
            assertThat(response.getDate()).isEqualTo(event.getDate());
            assertThat(response.getLocation()).isEqualTo(event.getLocation());
            assertThat(response.getCapacity()).isEqualTo(event.getCapacity());
            assertThat(response.getTicketPrice()).isEqualByComparingTo(event.getTicketPrice());
            assertThat(response.getOrganizerId()).isEqualTo(ORGANIZER_ID);
        }
    }

    @Nested
    @DisplayName("getOrganizerEvents")
    class GetOrganizerEventsTests {

        @Test
        @DisplayName("Should return only events belonging to the organizer")
        void getOrganizerEvents_ShouldReturnOrganizerEvents() {
            Event event1 = buildEvent("e1", EventStatus.ACTIVE);
            Event event2 = buildEvent("e2", EventStatus.CANCELLED);

            when(eventRepository.findByOrganizerId(ORGANIZER_ID)).thenReturn(List.of(event1, event2));

            List<EventResponse> result = eventService.getOrganizerEvents(ORGANIZER_ID);

            assertThat(result).hasSize(2);
            assertThat(result).extracting(EventResponse::getId).containsExactly("e1", "e2");
            assertThat(result).allMatch(response -> ORGANIZER_ID.equals(response.getOrganizerId()));
            verify(eventRepository).findByOrganizerId(ORGANIZER_ID);
        }

        @Test
        @DisplayName("Should return empty list when organizer has no events")
        void getOrganizerEvents_ShouldReturnEmptyListWhenOrganizerHasNone() {
            when(eventRepository.findByOrganizerId(ORGANIZER_ID)).thenReturn(List.of());

            List<EventResponse> result = eventService.getOrganizerEvents(ORGANIZER_ID);

            assertThat(result).isEmpty();
        }
    }

    // ================================================================
    // Helpers
    // ================================================================

    private Event buildEvent(String id, EventStatus status) {
        return Event.builder()
                .id(id)
                .name("Test Concert")
                .description("A test event")
                .date(FUTURE_DATE)
                .location("Montreal")
                .capacity(100)
                .ticketPrice(BigDecimal.valueOf(25.00))
                .organizerId(ORGANIZER_ID)
                .status(status)
                .createdAt(Instant.now())
                .build();
    }

    private CreateEventRequest buildCreateRequest(String name, String location, int capacity, BigDecimal price) {
        return CreateEventRequest.builder()
                .name(name)
                .description("A great show")
                .date(FUTURE_DATE)
                .location(location)
                .capacity(capacity)
                .ticketPrice(price)
                .category("concerts")
                .build();
    }
}
