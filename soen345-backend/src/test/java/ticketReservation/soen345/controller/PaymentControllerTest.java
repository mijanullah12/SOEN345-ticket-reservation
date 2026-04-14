package ticketReservation.soen345.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import ticketReservation.soen345.config.SecurityConfig;
import ticketReservation.soen345.dto.response.PaymentSetupIntentResponse;
import ticketReservation.soen345.security.JwtService;
import ticketReservation.soen345.security.PermissionAspect;
import ticketReservation.soen345.service.PaymentProfileService;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
@Import({SecurityConfig.class, PermissionAspect.class})
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PaymentProfileService paymentProfileService;
    @MockitoBean
    private JwtService jwtService;

    @Test
    @DisplayName("POST /api/v1/payments/setup-intent")
    @WithMockUser(username = "pay-user")
    void setupIntent() throws Exception {
        when(paymentProfileService.createSetupIntent("pay-user"))
                .thenReturn(PaymentSetupIntentResponse.builder()
                        .clientSecret("sec")
                        .customerId("cus_1")
                        .build());

        mockMvc.perform(post("/api/v1/payments/setup-intent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientSecret").value("sec"))
                .andExpect(jsonPath("$.customerId").value("cus_1"));
    }
}
