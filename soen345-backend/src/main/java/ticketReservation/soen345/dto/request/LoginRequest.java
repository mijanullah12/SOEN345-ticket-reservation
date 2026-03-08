package ticketReservation.soen345.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Identifier (email or phone) is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}
