package ticketReservation.soen345.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.domain.UserRole;
import ticketReservation.soen345.domain.UserStatus;
import ticketReservation.soen345.dto.request.RegisterRequest;
import ticketReservation.soen345.dto.response.RegisterResponse;
import ticketReservation.soen345.dto.response.UserResponse;
import ticketReservation.soen345.exception.DuplicateResourceException;
import ticketReservation.soen345.exception.ResourceNotFoundException;
import ticketReservation.soen345.repository.UserRepository;
import ticketReservation.soen345.service.UserService;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public RegisterResponse registerUser(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        checkForDuplicates(normalizedEmail, normalizedPhone);

        User user = buildUserFromRequest(request, normalizedEmail, normalizedPhone);
        User savedUser = userRepository.save(user);

        return mapToResponse(savedUser);
    }

    @Override
    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToUserResponse(user);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return phone.trim();
    }

    private void checkForDuplicates(String email, String phone) {
        if (email != null && userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User", "email", email);
        }
        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new DuplicateResourceException("User", "phone", phone);
        }
    }

    private User buildUserFromRequest(RegisterRequest request, String email, String phone) {
        return User.builder()
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();
    }

    private RegisterResponse mapToResponse(User user) {
        return RegisterResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
