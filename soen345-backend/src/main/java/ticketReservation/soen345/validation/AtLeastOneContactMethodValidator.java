package ticketReservation.soen345.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import ticketReservation.soen345.dto.request.RegisterRequest;

/**
 * Validator that ensures at least one contact method (email or phone) is provided.
 * This approach allows users flexibility while ensuring we have a way to contact them.
 */
public class AtLeastOneContactMethodValidator
        implements ConstraintValidator<AtLeastOneContactMethod, RegisterRequest> {

    @Override
    public boolean isValid(RegisterRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true;
        }

        boolean hasEmail = request.getEmail() != null && !request.getEmail().isBlank();
        boolean hasPhone = request.getPhone() != null && !request.getPhone().isBlank();

        return hasEmail || hasPhone;
    }
}
