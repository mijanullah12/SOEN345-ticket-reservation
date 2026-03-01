package ticketReservation.soen345.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ticketReservation.soen345.config.SecurityConfig;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.domain.UserStatus;
import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.exception.DuplicateResourceException;
import ticketReservation.soen345.service.UserService;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * WebMvcTest for AuthController.
 * <p>
 * Test Strategy Trade-offs:
 * <p>
 * WebMvcTest (chosen here):
 * - Pros: Fast, isolates controller layer, tests request/response mapping and validation
 * - Cons: Mocks service layer, doesn't test full integration
 * <p>
 * SpringBootTest with MockMvc:
 * - Pros: Tests full stack including service and repository layers
 * - Cons: Slower, requires running MongoDB (or Testcontainers/Embedded)
 * <p>
 * SpringBootTest with Testcontainers:
 * - Pros: True integration test with real MongoDB
 * - Cons: Slowest, requires Docker, but most realistic
 * <p>
 * Recommendation: Use WebMvcTest for fast CI feedback on controller logic,
 * supplement with SpringBootTest + Testcontainers for critical integration paths.
 */
@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    private static final String REGISTER_URL = "/api/v1/auth/register";

    // ============================================================
    // TEST CASE 1: Successful registration with email
    // ============================================================
    @Test
    @DisplayName("Should register user successfully with email")
    void registerWithEmail_Success() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("john.doe@example.com")
                .password("Password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        RegisterResponse response = RegisterResponse.builder()
                .id("507f1f77bcf86cd799439011")
                .email("john.doe@example.com")
                .firstName("John")
                .lastName("Doe")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value("507f1f77bcf86cd799439011"))
                .andExpect(jsonPath("$.email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    // ============================================================
    // TEST CASE 2: Successful registration with phone
    // ============================================================
    @Test
    @DisplayName("Should register user successfully with phone")
    void registerWithPhone_Success() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .phone("+14155552671")
                .password("Password123")
                .firstName("Jane")
                .lastName("Smith")
                .build();

        RegisterResponse response = RegisterResponse.builder()
                .id("507f1f77bcf86cd799439012")
                .phone("+14155552671")
                .firstName("Jane")
                .lastName("Smith")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();

        when(userService.registerUser(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phone").value("+14155552671"))
                .andExpect(jsonPath("$.email").doesNotExist());
    }

    // ============================================================
    // TEST CASE 3: Missing both email and phone -> 400 Bad Request
    // ============================================================
    @Test
    @DisplayName("Should return 400 when neither email nor phone provided")
    void register_MissingBothContactMethods_Returns400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .password("Password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    // ============================================================
    // TEST CASE 4: Duplicate email -> 409 Conflict
    // ============================================================
    @Test
    @DisplayName("Should return 409 when email already exists")
    void register_DuplicateEmail_Returns409() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("existing@example.com")
                .password("Password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        when(userService.registerUser(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("User", "email", "existing@example.com"));

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("User already exists with email: 'existing@example.com'"));
    }

    // ============================================================
    // TEST CASE 5: Duplicate phone -> 409 Conflict
    // ============================================================
    @Test
    @DisplayName("Should return 409 when phone already exists")
    void register_DuplicatePhone_Returns409() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .phone("+14155552671")
                .password("Password123")
                .firstName("Jane")
                .lastName("Smith")
                .build();

        when(userService.registerUser(any(RegisterRequest.class)))
                .thenThrow(new DuplicateResourceException("User", "phone", "+14155552671"));

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("User already exists with phone: '+14155552671'"));
    }

    // ============================================================
    // Additional validation tests (bonus)
    // ============================================================
    @Test
    @DisplayName("Should return 400 for invalid email format")
    void register_InvalidEmail_Returns400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("invalid-email")
                .password("Password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='email')]").exists());
    }

    @Test
    @DisplayName("Should return 400 for weak password")
    void register_WeakPassword_Returns400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("john@example.com")
                .password("weak")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='password')]").exists());
    }

    @Test
    @DisplayName("Should return 400 for invalid phone format")
    void register_InvalidPhoneFormat_Returns400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .phone("1234567890")
                .password("Password123")
                .firstName("John")
                .lastName("Doe")
                .build();

        mockMvc.perform(post(REGISTER_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='phone')]").exists());
    }
}
