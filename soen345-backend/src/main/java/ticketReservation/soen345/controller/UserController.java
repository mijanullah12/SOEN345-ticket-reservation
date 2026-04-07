package ticketReservation.soen345.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import ticketReservation.soen345.domain.Permission;
import ticketReservation.soen345.dto.request.UpdateNotificationPreferenceRequest;
import ticketReservation.soen345.dto.request.UpdateUserProfileRequest;
import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.dto.response.UserResponse;
import ticketReservation.soen345.security.RequiresPermission;
import ticketReservation.soen345.service.UserService;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/admin")
    @RequiresPermission(Permission.CREATE_EVENT)
    public ResponseEntity<RegisterResponse> registerAdmin(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = userService.registerAdmin(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        String userId = authentication.getName();
        UserResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/me/notification-preference")
    public ResponseEntity<UserResponse> updateMyNotificationPreference(
            Authentication authentication,
            @Valid @RequestBody UpdateNotificationPreferenceRequest request) {
        String userId = authentication.getName();
        UserResponse updatedUser = userService.updateNotificationPreference(
                userId,
                request.getPreferredNotificationChannel());
        return ResponseEntity.ok(updatedUser);
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        String userId = authentication.getName();
        UserResponse updatedUser = userService.updateUserProfile(userId, request);
        return ResponseEntity.ok(updatedUser);
    }
}
