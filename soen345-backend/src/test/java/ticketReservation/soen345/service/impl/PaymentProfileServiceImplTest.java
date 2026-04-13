package ticketReservation.soen345.service.impl;

import com.stripe.model.Customer;
import com.stripe.model.SetupIntent;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SetupIntentCreateParams;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.config.StripeProperties;
import ticketReservation.soen345.domain.PaymentInfo;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.dto.response.PaymentSetupIntentResponse;
import ticketReservation.soen345.exception.PaymentProcessingException;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.repository.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentProfileServiceImplTest {

    @Test
    @DisplayName("createSetupIntent reuses existing Stripe customer")
    void existingCustomer() {
        StripeProperties sp = mock(StripeProperties.class);
        when(sp.getApiKey()).thenReturn("sk_test");
        UserRepository ur = mock(UserRepository.class);
        User user = User.builder()
                .id("u1")
                .paymentInfo(PaymentInfo.builder().customerId("cus_old").build())
                .build();
        when(ur.findById("u1")).thenReturn(Optional.of(user));

        SetupIntent si = mock(SetupIntent.class);
        when(si.getClientSecret()).thenReturn("sec");

        try (MockedStatic<SetupIntent> ss = mockStatic(SetupIntent.class)) {
            ss.when(() -> SetupIntent.create(any(SetupIntentCreateParams.class))).thenReturn(si);
            PaymentProfileServiceImpl svc = new PaymentProfileServiceImpl(sp, ur);
            PaymentSetupIntentResponse r = svc.createSetupIntent("u1");
            assertThat(r.getCustomerId()).isEqualTo("cus_old");
            assertThat(r.getClientSecret()).isEqualTo("sec");
        }
    }

    @Test
    @DisplayName("createSetupIntent creates customer when missing")
    void newCustomer() {
        StripeProperties sp = mock(StripeProperties.class);
        when(sp.getApiKey()).thenReturn("sk_test");
        UserRepository ur = mock(UserRepository.class);
        User user = User.builder()
                .id("u1")
                .email("e@e.com")
                .firstName("A")
                .lastName("B")
                .build();
        when(ur.findById("u1")).thenReturn(Optional.of(user));
        when(ur.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        Customer customer = mock(Customer.class);
        when(customer.getId()).thenReturn("cus_new");

        SetupIntent si = mock(SetupIntent.class);
        when(si.getClientSecret()).thenReturn("cs");

        try (MockedStatic<Customer> cs = mockStatic(Customer.class);
             MockedStatic<SetupIntent> ss = mockStatic(SetupIntent.class)) {
            cs.when(() -> Customer.create(any(CustomerCreateParams.class))).thenReturn(customer);
            ss.when(() -> SetupIntent.create(any(SetupIntentCreateParams.class))).thenReturn(si);

            PaymentProfileServiceImpl svc = new PaymentProfileServiceImpl(sp, ur);
            PaymentSetupIntentResponse r = svc.createSetupIntent("u1");
            assertThat(r.getCustomerId()).isEqualTo("cus_new");
            verify(ur).save(any(User.class));
        }
    }

    @Test
    @DisplayName("throws when user not found")
    void userMissing() {
        StripeProperties sp = mock(StripeProperties.class);
        UserRepository ur = mock(UserRepository.class);
        when(ur.findById("x")).thenReturn(Optional.empty());
        PaymentProfileServiceImpl svc = new PaymentProfileServiceImpl(sp, ur);
        assertThatThrownBy(() -> svc.createSetupIntent("x"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("throws when Stripe key missing")
    void noKey() {
        StripeProperties sp = mock(StripeProperties.class);
        when(sp.getApiKey()).thenReturn("");
        UserRepository ur = mock(UserRepository.class);
        User user = User.builder()
                .id("u1")
                .paymentInfo(PaymentInfo.builder().customerId("cus").build())
                .build();
        when(ur.findById("u1")).thenReturn(Optional.of(user));

        PaymentProfileServiceImpl svc = new PaymentProfileServiceImpl(sp, ur);
        assertThatThrownBy(() -> svc.createSetupIntent("u1"))
                .isInstanceOf(PaymentProcessingException.class)
                .hasMessageContaining("API key");
    }
}
