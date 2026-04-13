package ticketReservation.soen345.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ResendEmailAdapterTest {

    @Test
    @DisplayName("dev mode returns mock id without calling API")
    void devMode() {
        ResendEmailAdapter adapter = new ResendEmailAdapter("resend_test_key");
        assertThat(adapter.sendEmail("from@x.com", "to@x.com", "S", "<p>h</p>"))
                .isEqualTo("dev-email-mock");
    }

    @Test
    @DisplayName("blank api key uses dev mode")
    void blankKey() {
        ResendEmailAdapter adapter = new ResendEmailAdapter("   ");
        assertThat(adapter.sendEmail("f", "t", "s", "h")).isEqualTo("dev-email-mock");
    }
}
