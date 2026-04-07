package ticketReservation.soen345.service.impl;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationContext;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.service.NotificationChannelStrategy;

@Service
@Slf4j
public class SmsCommunicationStrategy implements NotificationChannelStrategy {

    private final String fromNumber;

    public SmsCommunicationStrategy(
            @Value("${twilio.account-sid}") String accountSid,
            @Value("${twilio.auth-token}") String authToken,
            @Value("${twilio.from-number}") String fromNumber
    ) {
        Twilio.init(accountSid, authToken);
        this.fromNumber = fromNumber;
    }

    @Override
    public void sendTo(User to, Notification notification, NotificationContext context) {
        Message message = Message.creator(
                new PhoneNumber(to.getPhone()),
                new PhoneNumber(fromNumber),
                notification.body(context)
        ).create();

        log.info("Twilio SMS sent to {} with sid {}", to.getPhone(), message.getSid());
    }
}
