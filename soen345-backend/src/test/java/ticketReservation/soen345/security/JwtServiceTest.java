package ticketReservation.soen345.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.domain.UserRole;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(
                "c2VjcmV0LWtleS1mb3ItdGVzdGluZy1wdXJwb3Nlcy1vbmx5",
                3_600_000L);
    }

    @Test
    @DisplayName("generateToken and parseToken round-trip")
    void roundTrip() {
        User user = User.builder()
                .id("user-1")
                .email("e@x.com")
                .role(UserRole.CUSTOMER)
                .build();

        String token = jwtService.generateToken(user);
        Claims claims = jwtService.parseToken(token);

        assertThat(claims.getSubject()).isEqualTo("user-1");
        assertThat(claims.get("role", String.class)).isEqualTo("CUSTOMER");
        assertThat(claims.get("email", String.class)).isEqualTo("e@x.com");
    }

    @Test
    @DisplayName("getExpirationSeconds converts ms to seconds")
    void expirationSeconds() {
        assertThat(jwtService.getExpirationSeconds()).isEqualTo(3600L);
    }

    @Test
    @DisplayName("isTokenValid returns false for garbage")
    void invalidToken() {
        assertThat(jwtService.isTokenValid("not-a-jwt")).isFalse();
    }

    @Test
    @DisplayName("extractUserId and extractRole work on valid token")
    void extractors() {
        User user = User.builder().id("u2").email("a@b.c").role(UserRole.ADMIN).build();
        String token = jwtService.generateToken(user);
        assertThat(jwtService.extractUserId(token)).isEqualTo("u2");
        assertThat(jwtService.extractRole(token)).isEqualTo("ADMIN");
    }
}
