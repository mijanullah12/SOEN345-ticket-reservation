package ticketReservation.soen345.service;

import ticketReservation.soen345.dto.request.LoginRequest;
import ticketReservation.soen345.dto.response.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);
}
