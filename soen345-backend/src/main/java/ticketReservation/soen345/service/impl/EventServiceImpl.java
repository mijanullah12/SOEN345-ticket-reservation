package ticketReservation.soen345.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Event;
import ticketReservation.soen345.domain.EventStatus;
import ticketReservation.soen345.dto.request.CreateEventRequest;
import ticketReservation.soen345.dto.request.UpdateEventRequest;
import ticketReservation.soen345.dto.response.EventResponse;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.repository.EventRepository;
import ticketReservation.soen345.service.EventService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;

    @Override
    public EventResponse createEvent(CreateEventRequest request, String organizerId) {
        Event event = Event.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .date(request.getDate())
                .location(request.getLocation().trim())
                .capacity(request.getCapacity())
                .ticketPrice(request.getTicketPrice())
                .organizerId(organizerId)
                .status(EventStatus.ACTIVE)
                .build();

        Event saved = eventRepository.save(event);
        return mapToResponse(saved);
    }

    @Override
    public EventResponse updateEvent(String eventId, UpdateEventRequest request) {
        Event existing = findActiveEventById(eventId);

        Event updated = Event.builder()
                .id(existing.getId())
                .name(request.getName() != null ? request.getName().trim() : existing.getName())
                .description(request.getDescription() != null ? request.getDescription() : existing.getDescription())
                .date(request.getDate() != null ? request.getDate() : existing.getDate())
                .location(request.getLocation() != null ? request.getLocation().trim() : existing.getLocation())
                .capacity(request.getCapacity() != null ? request.getCapacity() : existing.getCapacity())
                .ticketPrice(request.getTicketPrice() != null ? request.getTicketPrice() : existing.getTicketPrice())
                .organizerId(existing.getOrganizerId())
                .status(existing.getStatus())
                .createdAt(existing.getCreatedAt())
                .build();

        Event saved = eventRepository.save(updated);
        return mapToResponse(saved);
    }

    @Override
    public EventResponse cancelEvent(String eventId) {
        Event existing = findActiveEventById(eventId);

        Event cancelled = Event.builder()
                .id(existing.getId())
                .name(existing.getName())
                .description(existing.getDescription())
                .date(existing.getDate())
                .location(existing.getLocation())
                .capacity(existing.getCapacity())
                .ticketPrice(existing.getTicketPrice())
                .organizerId(existing.getOrganizerId())
                .status(EventStatus.CANCELLED)
                .createdAt(existing.getCreatedAt())
                .build();

        Event saved = eventRepository.save(cancelled);
        return mapToResponse(saved);
    }

    @Override
    public List<EventResponse> getAvailableEvents() {
        return eventRepository.findByStatus(EventStatus.ACTIVE)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Event findActiveEventById(String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new IllegalStateException("Event is already cancelled");
        }

        return event;
    }

    private EventResponse mapToResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .date(event.getDate())
                .location(event.getLocation())
                .capacity(event.getCapacity())
                .ticketPrice(event.getTicketPrice())
                .organizerId(event.getOrganizerId())
                .status(event.getStatus())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
