package ticketReservation.soen345.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import ticketReservation.soen345.config.SecurityConfig;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.domain.UserStatus;
import ticketReservation.soen345.dto.request.LoginRequest;
import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.response.LoginResponse;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.exception.DuplicateResourceException;
import ticketReservation.soen345.exception.InvalidCredentialsException;
import ticketReservation.soen345.security.JwtService;
import ticketReservation.soen345.service.AuthService;
import ticketReservation.soen345.service.UserService;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    // ================================================================
    // Registration Tests
    // ================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/register")
    class RegisterTests {

        private static final String REGISTER_URL = "/api/v1/auth/register";

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

    // ================================================================
    // Login Tests
    // ================================================================

    @Nested
    @DisplayName("POST /api/v1/auth/login")
    class LoginTests {

        private static final String LOGIN_URL = "/api/v1/auth/login";

        @Test
        @DisplayName("TC1: Should login successfully with email and return JWT")
        void loginWithEmail_Success() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .identifier("john.doe@example.com")
                    .password("Password123")
                    .build();

            LoginResponse response = LoginResponse.builder()
                    .tokenType("Bearer")
                    .accessToken("eyJhbGciOiJIUzI1NiJ9.test.signature")
                    .expiresIn(3600)
                    .user(LoginResponse.UserInfo.builder()
                            .id("507f1f77bcf86cd799439011")
                            .firstName("John")
                            .lastName("Doe")
                            .email("john.doe@example.com")
                            .role(UserRole.CUSTOMER)
                            .build())
                    .build();

            when(authService.login(any(LoginRequest.class))).thenReturn(response);

            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.expiresIn").value(3600))
                    .andExpect(jsonPath("$.user.id").value("507f1f77bcf86cd799439011"))
                    .andExpect(jsonPath("$.user.firstName").value("John"))
                    .andExpect(jsonPath("$.user.lastName").value("Doe"))
                    .andExpect(jsonPath("$.user.email").value("john.doe@example.com"))
                    .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                    .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
        }

        @Test
        @DisplayName("TC2: Should login successfully with phone and return JWT")
        void loginWithPhone_Success() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .identifier("+14155552671")
                    .password("Password123")
                    .build();

            LoginResponse response = LoginResponse.builder()
                    .tokenType("Bearer")
                    .accessToken("eyJhbGciOiJIUzI1NiJ9.test.signature")
                    .expiresIn(3600)
                    .user(LoginResponse.UserInfo.builder()
                            .id("507f1f77bcf86cd799439012")
                            .firstName("Jane")
                            .lastName("Smith")
                            .phone("+14155552671")
                            .role(UserRole.CUSTOMER)
                            .build())
                    .build();

            when(authService.login(any(LoginRequest.class))).thenReturn(response);

            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.user.phone").value("+14155552671"))
                    .andExpect(jsonPath("$.user.role").value("CUSTOMER"));
        }

        @Test
        @DisplayName("TC3: Should return 401 for wrong password")
        void login_WrongPassword_Returns401() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .identifier("john.doe@example.com")
                    .password("WrongPassword123")
                    .build();

            when(authService.login(any(LoginRequest.class)))
                    .thenThrow(new InvalidCredentialsException());

            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.error").value("Unauthorized"))
                    .andExpect(jsonPath("$.message").value("Invalid credentials"));
        }

        @Test
        @DisplayName("TC4: Should return 401 for unknown identifier")
        void login_UnknownIdentifier_Returns401() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .identifier("nonexistent@example.com")
                    .password("Password123")
                    .build();

            when(authService.login(any(LoginRequest.class)))
                    .thenThrow(new InvalidCredentialsException());

            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.message").value("Invalid credentials"));
        }

        @Test
        @DisplayName("TC5: Should return 400 when identifier and password are missing")
        void login_MissingFields_Returns400() throws Exception {
            LoginRequest request = LoginRequest.builder().build();

            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.fieldErrors").isArray())
                    .andExpect(jsonPath("$.fieldErrors.length()").value(2));
        }
    }
}
