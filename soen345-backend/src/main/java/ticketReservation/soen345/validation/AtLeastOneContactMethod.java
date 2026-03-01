package ticketReservation.soen345.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that at least one contact method (email or phone) is provided.
 * Applied at the class level to access multiple fields.
 */
@Documented
@Constraint(validatedBy = AtLeastOneContactMethodValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface AtLeastOneContactMethod {

    String message() default "At least one contact method (email or phone) is required";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
