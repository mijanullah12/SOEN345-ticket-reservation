package ticketReservation.soen345.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ticketReservation.soen345.dto.request.RegisterRequest;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class AtLeastOneContactMethodValidatorTest {

    @Mock
    private ConstraintValidatorContext context;

    private AtLeastOneContactMethodValidator validator;

    @BeforeEach
    void setUp() {
        validator = new AtLeastOneContactMethodValidator();
    }

    @Test
    @DisplayName("null request is treated as valid")
    void nullRequest() {
        assertThat(validator.isValid(null, context)).isTrue();
    }

    @Test
    @DisplayName("valid when email only")
    void emailOnly() {
        RegisterRequest r = RegisterRequest.builder()
                .email("a@b.com")
                .password("x")
                .firstName("A")
                .lastName("B")
                .build();
        assertThat(validator.isValid(r, context)).isTrue();
    }

    @Test
    @DisplayName("valid when phone only")
    void phoneOnly() {
        RegisterRequest r = RegisterRequest.builder()
                .phone("+15550001111")
                .password("x")
                .firstName("A")
                .lastName("B")
                .build();
        assertThat(validator.isValid(r, context)).isTrue();
    }

    @Test
    @DisplayName("valid when both email and phone present")
    void bothPresent() {
        RegisterRequest r = RegisterRequest.builder()
                .email("a@b.com")
                .phone("+15550001111")
                .password("x")
                .firstName("A")
                .lastName("B")
                .build();
        assertThat(validator.isValid(r, context)).isTrue();
    }

    @Test
    @DisplayName("invalid when both contact fields missing or blank")
    void bothMissing() {
        RegisterRequest r = RegisterRequest.builder()
                .email("  ")
                .phone(null)
                .password("x")
                .firstName("A")
                .lastName("B")
                .build();
        assertThat(validator.isValid(r, context)).isFalse();
    }
}
