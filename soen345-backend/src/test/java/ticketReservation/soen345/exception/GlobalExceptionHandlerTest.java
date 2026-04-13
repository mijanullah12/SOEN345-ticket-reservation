package ticketReservation.soen345.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import ticketReservation.soen345.dto.request.LoginRequest;

import jakarta.validation.Valid;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @RestController
    static class ThrowingController {

        @GetMapping("/test/nf")
        void notFound() {
            throw new ResourceNotFoundException("User", "id", "x");
        }

        @GetMapping("/test/dup")
        void dup() {
            throw new DuplicateResourceException("User", "email", "e@e.com");
        }

        @GetMapping("/test/auth")
        void auth() {
            throw new InvalidCredentialsException();
        }

        @GetMapping("/test/denied")
        void denied() {
            throw new AccessDeniedException("no");
        }

        @GetMapping("/test/state")
        void state() {
            throw new IllegalStateException("bad state");
        }

        @GetMapping("/test/dk")
        void dk() {
            throw new DuplicateKeyException("dup");
        }

        @GetMapping("/test/boom")
        void boom() {
            throw new RuntimeException("hidden");
        }

        @PostMapping("/test/validate")
        void validate(@RequestBody @Valid LoginRequest request) {
        }
    }

    private MockMvc mvc() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        MappingJackson2HttpMessageConverter json = new MappingJackson2HttpMessageConverter();
        json.setObjectMapper(objectMapper);
        return MockMvcBuilders.standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .setMessageConverters(json)
                .setValidator(validator)
                .build();
    }

    @Test
    @DisplayName("ResourceNotFoundException -> 404")
    void notFound() throws Exception {
        mvc().perform(get("/test/nf"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("DuplicateResourceException -> 409")
    void duplicate() throws Exception {
        mvc().perform(get("/test/dup"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("InvalidCredentialsException -> 401")
    void invalidCreds() throws Exception {
        mvc().perform(get("/test/auth"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("AccessDeniedException -> 403")
    void accessDenied() throws Exception {
        mvc().perform(get("/test/denied"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("IllegalStateException -> 409")
    void illegalState() throws Exception {
        mvc().perform(get("/test/state"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("bad state"));
    }

    @Test
    @DisplayName("DuplicateKeyException -> 409 with fixed message")
    void duplicateKey() throws Exception {
        mvc().perform(get("/test/dk"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email or phone already exists."));
    }

    @Test
    @DisplayName("generic Exception -> 500")
    void generic() throws Exception {
        mvc().perform(get("/test/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500));
    }

    @Test
    @DisplayName("validation errors -> 400 with fieldErrors")
    void validation() throws Exception {
        LoginRequest empty = LoginRequest.builder().build();
        mvc().perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(empty)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }
}
