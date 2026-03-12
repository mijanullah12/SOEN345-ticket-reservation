package ticketReservation.soen345.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.dto.request.LoginRequest;
import ticketReservation.soen345.dto.response.LoginResponse;
import ticketReservation.soen345.exception.InvalidCredentialsException;
import ticketReservation.soen345.repository.UserRepository;
import ticketReservation.soen345.security.JwtService;
import ticketReservation.soen345.service.AuthService;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public LoginResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();
        User user = resolveUser(identifier)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtService.generateToken(user);

        return LoginResponse.builder()
                .tokenType("Bearer")
                .accessToken(token)
                .expiresIn(jwtService.getExpirationSeconds())
                .user(mapToUserInfo(user))
                .build();
    }

    private Optional<User> resolveUser(String identifier) {
        if (identifier.contains("@")) {
            return userRepository.findByEmail(identifier.toLowerCase());
        }
        String normalizedPhone = identifier.replaceAll("[\\s\\-]", "");
        return userRepository.findByPhone(normalizedPhone);
    }

    private LoginResponse.UserInfo mapToUserInfo(User user) {
        return LoginResponse.UserInfo.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();
    }
}
