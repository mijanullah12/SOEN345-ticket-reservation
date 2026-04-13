package ticketReservation.soen345.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.PaymentInfo;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.domain.UserStatus;
import ticketReservation.soen345.dto.request.PaymentInfoRequest;
import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.request.UpdateUserProfileRequest;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.dto.response.UserResponse;
import ticketReservation.soen345.exception.DuplicateResourceException;
import ticketReservation.soen345.exception.ResourceNotFoundException;
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

    @Test
    @DisplayName("registerOrganizer assigns ORGANIZER role")
    void registerOrganizer() {
        RegisterRequest request = RegisterRequest.builder()
                .email("o@example.com")
                .password("Password123")
                .firstName("O")
                .lastName("G")
                .build();
        when(userRepository.existsByEmail("o@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId("org-id");
            u.setCreatedAt(Instant.now());
            return u;
        });

        RegisterResponse response = userService.registerOrganizer(request);

        assertThat(response.getRole()).isEqualTo(UserRole.ORGANIZER);
    }

    @Test
    @DisplayName("registerAdmin assigns ADMIN role")
    void registerAdmin() {
        RegisterRequest request = RegisterRequest.builder()
                .email("a@example.com")
                .password("Password123")
                .firstName("A")
                .lastName("D")
                .build();
        when(userRepository.existsByEmail("a@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId("adm-id");
            u.setCreatedAt(Instant.now());
            return u;
        });

        assertThat(userService.registerAdmin(request).getRole()).isEqualTo(UserRole.ADMIN);
    }

    @Test
    @DisplayName("getUserById throws when missing")
    void getUserMissing() {
        when(userRepository.findById("x")).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> userService.getUserById("x"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("getUserById returns mapped response")
    void getUserOk() {
        User user = User.builder()
                .id("u1")
                .email("e@e.com")
                .firstName("F")
                .lastName("L")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userRepository.findById("u1")).thenReturn(java.util.Optional.of(user));

        UserResponse r = userService.getUserById("u1");
        assertThat(r.getEmail()).isEqualTo("e@e.com");
    }

    @Test
    @DisplayName("updateNotificationPreference persists channel")
    void updateNotif() {
        User user = User.builder()
                .id("u1")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userRepository.findById("u1")).thenReturn(java.util.Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse r = userService.updateNotificationPreference("u1", NotificationChannel.SMS);

        assertThat(r.getPreferredNotificationChannel()).isEqualTo(NotificationChannel.SMS);
    }

    @Test
    @DisplayName("updateUserProfile merges payout fake account when requested")
    void updateProfileFakePayout() {
        User user = User.builder()
                .id("u1")
                .email("old@e.com")
                .firstName("A")
                .lastName("B")
                .role(UserRole.ORGANIZER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userRepository.findById("u1")).thenReturn(java.util.Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserProfileRequest req = UpdateUserProfileRequest.builder()
                .paymentInfo(PaymentInfoRequest.builder()
                        .payoutEmail("pay@org.com")
                        .createFakePayoutAccount(true)
                        .build())
                .build();

        UserResponse r = userService.updateUserProfile("u1", req);

        assertThat(r.getPaymentInfo()).isNotNull();
        assertThat(r.getPaymentInfo().getPayoutAccountId()).startsWith("fake_payout_");
        assertThat(r.getPaymentInfo().getPayoutEmail()).isEqualTo("pay@org.com");
    }

    @Test
    @DisplayName("updateUserProfile throws on duplicate email")
    void duplicateEmailOnUpdate() {
        User user = User.builder()
                .id("u1")
                .email("a@a.com")
                .firstName("A")
                .lastName("B")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userRepository.findById("u1")).thenReturn(java.util.Optional.of(user));
        when(userRepository.existsByEmail("b@b.com")).thenReturn(true);

        UpdateUserProfileRequest req = UpdateUserProfileRequest.builder()
                .email("b@b.com")
                .build();

        assertThatThrownBy(() -> userService.updateUserProfile("u1", req))
                .isInstanceOf(DuplicateResourceException.class);
    }
}
