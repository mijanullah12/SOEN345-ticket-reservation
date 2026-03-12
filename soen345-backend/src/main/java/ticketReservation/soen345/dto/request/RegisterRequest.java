package ticketReservation.soen345.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ticketReservation.soen345.validation.AtLeastOneContactMethod;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@AtLeastOneContactMethod
public class RegisterRequest {

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(
            regexp = "^\\+[1-9]\\d{9,14}$",
            message = "Phone must be in E.164 format (e.g., +14155552671)"
    )
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Password must contain at least one letter and one number"
    )
    private String password;

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;
}
