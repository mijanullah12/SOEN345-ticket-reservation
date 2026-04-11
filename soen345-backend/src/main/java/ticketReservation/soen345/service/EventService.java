package ticketReservation.soen345.service;

import ticketReservation.soen345.dto.request.CreateEventRequest;
import ticketReservation.soen345.dto.request.UpdateEventRequest;
import ticketReservation.soen345.dto.response.EventResponse;

import java.util.List;

public interface EventService {
    EventResponse createEvent(CreateEventRequest request, String organizerId);
    EventResponse updateEvent(String eventId, UpdateEventRequest request);
    EventResponse cancelEvent(String eventId);
    List<EventResponse> getAvailableEvents();
    List<EventResponse> getOrganizerEvents(String organizerId);
}
