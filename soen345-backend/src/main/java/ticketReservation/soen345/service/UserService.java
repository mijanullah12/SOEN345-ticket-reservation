package ticketReservation.soen345.service;

import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.request.UpdateUserProfileRequest;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.dto.response.UserResponse;

public interface UserService {

    RegisterResponse registerUser(RegisterRequest request);

    RegisterResponse registerOrganizer(RegisterRequest request);

    RegisterResponse registerAdmin(RegisterRequest request);

    UserResponse getUserById(String id);

    UserResponse updateNotificationPreference(String userId, NotificationChannel preferredNotificationChannel);

    UserResponse updateUserProfile(String userId, UpdateUserProfileRequest request);
}
