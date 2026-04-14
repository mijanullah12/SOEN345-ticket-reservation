package ticketReservation.soen345.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import ticketReservation.soen345.config.SecurityConfig;
import ticketReservation.soen345.domain.NotificationChannel;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.domain.UserStatus;
import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.request.UpdateNotificationPreferenceRequest;
import ticketReservation.soen345.dto.request.UpdateUserProfileRequest;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.dto.response.UserResponse;
import ticketReservation.soen345.security.JwtService;
import ticketReservation.soen345.security.PermissionAspect;
import ticketReservation.soen345.service.UserService;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, PermissionAspect.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;
    @MockitoBean
    private JwtService jwtService;

    @Test
    @DisplayName("GET /api/v1/users/{id} returns user")
    @WithMockUser
    void getById() throws Exception {
        UserResponse u = UserResponse.builder()
                .id("u1")
                .firstName("A")
                .lastName("B")
                .email("a@b.com")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userService.getUserById("u1")).thenReturn(u);

        mockMvc.perform(get("/api/v1/users/u1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("u1"));
    }

    @Test
    @DisplayName("GET /api/v1/users/me returns current user")
    @WithMockUser(username = "me-id")
    void me() throws Exception {
        UserResponse u = UserResponse.builder()
                .id("me-id")
                .firstName("Me")
                .lastName("User")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userService.getUserById("me-id")).thenReturn(u);

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("me-id"));
    }

    @Test
    @DisplayName("PATCH notification preference")
    @WithMockUser(username = "u1")
    void notifPref() throws Exception {
        UpdateNotificationPreferenceRequest body = UpdateNotificationPreferenceRequest.builder()
                .preferredNotificationChannel(NotificationChannel.SMS)
                .build();
        UserResponse u = UserResponse.builder()
                .id("u1")
                .preferredNotificationChannel(NotificationChannel.SMS)
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userService.updateNotificationPreference(eq("u1"), eq(NotificationChannel.SMS)))
                .thenReturn(u);

        mockMvc.perform(patch("/api/v1/users/me/notification-preference")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferredNotificationChannel").value("SMS"));
    }

    @Test
    @DisplayName("PATCH profile")
    @WithMockUser(username = "u1")
    void patchProfile() throws Exception {
        UpdateUserProfileRequest body = UpdateUserProfileRequest.builder()
                .firstName("New")
                .build();
        UserResponse u = UserResponse.builder()
                .id("u1")
                .firstName("New")
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userService.updateUserProfile(eq("u1"), any(UpdateUserProfileRequest.class))).thenReturn(u);

        mockMvc.perform(patch("/api/v1/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("New"));
    }

    @Test
    @DisplayName("POST /api/v1/users/admin requires CREATE_EVENT permission")
    @WithMockUser(roles = "ADMIN")
    void registerAdmin() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .email("admin@x.com")
                .password("Password123")
                .firstName("A")
                .lastName("D")
                .build();
        RegisterResponse res = RegisterResponse.builder()
                .id("id1")
                .email("admin@x.com")
                .firstName("A")
                .lastName("D")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .createdAt(Instant.now())
                .build();
        when(userService.registerAdmin(any(RegisterRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/v1/users/admin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }
}
