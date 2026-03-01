package ticketReservation.soen345.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.domain.UserStatus;
import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.exception.DuplicateResourceException;
import ticketReservation.soen345.repository.UserRepository;
import ticketReservation.soen345.service.impl.UserServiceImpl;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserServiceImpl.
 * Tests business logic in isolation using mocks.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(userRepository, passwordEncoder);
    }

    @Test
    @DisplayName("Should hash password and normalize email on registration")
    void registerUser_ShouldHashPasswordAndNormalizeEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .email("  JOHN.DOE@EXAMPLE.COM  ")
                .password("Password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("generatedId123");
            user.setCreatedAt(Instant.now());
            return user;
        });

        RegisterResponse response = userService.registerUser(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertThat(savedUser.getEmail()).isEqualTo("john.doe@example.com");
        assertThat(savedUser.getPasswordHash()).isEqualTo("$2a$10$hashedPassword");
        assertThat(response.getRole()).isEqualTo(UserRole.CUSTOMER);
        assertThat(response.getStatus()).isEqualTo(UserStatus.ACTIVE);

        verify(passwordEncoder).encode("Password123");
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException when email exists")
    void registerUser_DuplicateEmail_ShouldThrow() {
        RegisterRequest request = RegisterRequest.builder()
                .email("existing@example.com")
                .password("Password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.registerUser(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("email");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should allow null email when phone is provided")
    void registerUser_WithPhoneOnly_ShouldSucceed() {
        RegisterRequest request = RegisterRequest.builder()
                .phone("+14155552671")
                .password("Password123")
                .firstName("Jane")
                .lastName("Smith")
                .build();

        when(userRepository.existsByPhone(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("generatedId456");
            user.setCreatedAt(Instant.now());
            return user;
        });

        RegisterResponse response = userService.registerUser(request);

        assertThat(response.getEmail()).isNull();
        assertThat(response.getPhone()).isEqualTo("+14155552671");
    }
}
