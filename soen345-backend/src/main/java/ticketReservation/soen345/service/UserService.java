package ticketReservation.soen345.service;

import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.dto.response.UserResponse;

public interface UserService {

    RegisterResponse registerUser(RegisterRequest request);

    UserResponse getUserById(String id);
}
