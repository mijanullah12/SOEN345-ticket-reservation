package ticketReservation.soen345.service.impl;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.SetupIntent;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SetupIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.config.StripeProperties;
import ticketReservation.soen345.domain.PaymentInfo;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.dto.response.PaymentSetupIntentResponse;
import ticketReservation.soen345.exception.PaymentProcessingException;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.repository.UserRepository;
import ticketReservation.soen345.service.PaymentProfileService;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PaymentProfileServiceImpl implements PaymentProfileService {

    private final StripeProperties stripeProperties;
    private final UserRepository userRepository;

    @Override
    public PaymentSetupIntentResponse createSetupIntent(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String customerId = ensureStripeCustomer(user);
        SetupIntent setupIntent = createStripeSetupIntent(customerId);

        return PaymentSetupIntentResponse.builder()
                .clientSecret(setupIntent.getClientSecret())
                .customerId(customerId)
                .build();
    }

    private String ensureStripeCustomer(User user) {
        String existingCustomerId = Optional.ofNullable(user.getPaymentInfo())
                .map(PaymentInfo::getCustomerId)
                .orElse(null);
        if (existingCustomerId != null && !existingCustomerId.isBlank()) {
            return existingCustomerId;
        }

        configureStripe();

        CustomerCreateParams.Builder params = CustomerCreateParams.builder();
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            params.setEmail(user.getEmail());
        }
        String name = buildName(user);
        if (name != null) {
            params.setName(name);
        }

        try {
            Customer customer = Customer.create(params.build());
            String customerId = customer.getId();
            PaymentInfo updated = PaymentInfo.builder()
                    .customerId(customerId)
                    .defaultPaymentMethodId(user.getPaymentInfo() != null
                            ? user.getPaymentInfo().getDefaultPaymentMethodId()
                            : null)
                    .payoutAccountId(user.getPaymentInfo() != null
                            ? user.getPaymentInfo().getPayoutAccountId()
                            : null)
                    .payoutEmail(user.getPaymentInfo() != null
                            ? user.getPaymentInfo().getPayoutEmail()
                            : null)
                    .payoutDisplayName(user.getPaymentInfo() != null
                            ? user.getPaymentInfo().getPayoutDisplayName()
                            : null)
                    .build();
            user.setPaymentInfo(updated);
            userRepository.save(user);
            return customerId;
        } catch (StripeException e) {
            throw new PaymentProcessingException("Failed to create Stripe customer.", e);
        }
    }

    private SetupIntent createStripeSetupIntent(String customerId) {
        configureStripe();
        SetupIntentCreateParams params = SetupIntentCreateParams.builder()
                .setCustomer(customerId)
                .setUsage(SetupIntentCreateParams.Usage.OFF_SESSION)
                .addPaymentMethodType("card")
                .build();
        try {
            return SetupIntent.create(params);
        } catch (StripeException e) {
            throw new PaymentProcessingException("Failed to create Stripe setup intent.", e);
        }
    }

    private void configureStripe() {
        String apiKey = stripeProperties.getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new PaymentProcessingException("Stripe API key is not configured.");
        }
        Stripe.apiKey = apiKey;
    }

    private String buildName(User user) {
        String first = user.getFirstName();
        String last = user.getLastName();
        if (first == null && last == null) {
            return null;
        }
        String full = String.format("%s %s",
                first == null ? "" : first.trim(),
                last == null ? "" : last.trim()).trim();
        return full.isBlank() ? null : full;
    }
}
