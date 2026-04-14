package ticketReservation.soen345.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.dto.request.LoginRequest;
import ticketReservation.soen345.dto.response.LoginResponse;
import ticketReservation.soen345.exception.InvalidCredentialsException;
import ticketReservation.soen345.repository.UserRepository;
import ticketReservation.soen345.security.JwtService;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(userRepository, passwordEncoder, jwtService);
    }

    @Test
    @DisplayName("login succeeds with email identifier")
    void loginEmail() {
        User user = User.builder()
                .id("u1")
                .email("a@b.com")
                .firstName("A")
                .lastName("B")
                .role(UserRole.CUSTOMER)
                .passwordHash("hash")
                .build();
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "hash")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        when(jwtService.getExpirationSeconds()).thenReturn(3600L);

        LoginResponse response = authService.login(LoginRequest.builder()
                .identifier("  A@B.COM  ")
                .password("secret")
                .build());

        assertThat(response.getAccessToken()).isEqualTo("jwt-token");
        assertThat(response.getUser().getEmail()).isEqualTo("a@b.com");
    }

    @Test
    @DisplayName("login succeeds with phone identifier")
    void loginPhone() {
        User user = User.builder()
                .id("u1")
                .phone("+15551234567")
                .passwordHash("hash")
                .role(UserRole.CUSTOMER)
                .build();
        when(userRepository.findByPhone("+15551234567")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "hash")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt");
        when(jwtService.getExpirationSeconds()).thenReturn(60L);

        LoginResponse response = authService.login(LoginRequest.builder()
                .identifier("+1 555 123-4567")
                .password("secret")
                .build());

        assertThat(response.getAccessToken()).isEqualTo("jwt");
    }

    @Test
    @DisplayName("login throws when user not found")
    void userMissing() {
        when(userRepository.findByEmail("x@y.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(LoginRequest.builder()
                .identifier("x@y.com")
                .password("p")
                .build())).isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    @DisplayName("login throws when password wrong")
    void badPassword() {
        User user = User.builder().passwordHash("hash").build();
        when(userRepository.findByEmail("a@b.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(LoginRequest.builder()
                .identifier("a@b.com")
                .password("wrong")
                .build())).isInstanceOf(InvalidCredentialsException.class);
    }
}
