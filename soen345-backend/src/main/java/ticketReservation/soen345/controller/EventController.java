package ticketReservation.soen345.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import ticketReservation.soen345.domain.Permission;
import ticketReservation.soen345.dto.request.CreateEventRequest;
import ticketReservation.soen345.dto.request.UpdateEventRequest;
import ticketReservation.soen345.dto.response.EventResponse;
import ticketReservation.soen345.security.RequiresPermission;
import ticketReservation.soen345.service.EventService;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    @RequiresPermission(Permission.CREATE_EVENT)
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication authentication) {

        String organizerId = authentication.getName();
        EventResponse response = eventService.createEvent(request, organizerId);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @RequiresPermission(Permission.EDIT_EVENT)
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody UpdateEventRequest request) {

        EventResponse response = eventService.updateEvent(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/cancel")
    @RequiresPermission(Permission.CANCEL_EVENT)
    public ResponseEntity<EventResponse> cancelEvent(@PathVariable String id) {
        EventResponse response = eventService.cancelEvent(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> getAvailableEvents() {
        return ResponseEntity.ok(eventService.getAvailableEvents());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<EventResponse>> getOrganizerEvents(Authentication authentication) {
        return ResponseEntity.ok(eventService.getOrganizerEvents(authentication.getName()));
    }
}
