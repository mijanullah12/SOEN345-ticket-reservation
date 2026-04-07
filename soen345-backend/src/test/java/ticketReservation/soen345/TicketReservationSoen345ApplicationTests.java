package ticketReservation.soen345;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import ticketReservation.soen345.repository.EventRepository;
import ticketReservation.soen345.repository.UserRepository;

@SpringBootTest(properties = {
		"spring.autoconfigure.exclude=" +
				"org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration," +
				"org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration," +
				"org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration"
})
@TestPropertySource(properties = {
		"spring.data.mongodb.uri=mongodb://localhost:27017/soen345_test",
		"resend.api-key=resend_test_key",
		"twilio.account-sid=AC00000000000000000000000000000000",
		"twilio.auth-token=test_token",
		"twilio.from-number=+10000000000"
})
class TicketReservationSoen345ApplicationTests {

	@MockitoBean
	@SuppressWarnings("unused")
	private UserRepository userRepository;

	@MockitoBean
	@SuppressWarnings("unused")
	private EventRepository eventRepository;

	@Test
	void contextLoads() {
	}

}
