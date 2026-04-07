package ticketReservation.soen345.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ticketReservation.soen345.domain.Notification;
import ticketReservation.soen345.domain.NotificationContext;
import ticketReservation.soen345.domain.User;
import ticketReservation.soen345.service.NotificationChannelStrategy;
import ticketReservation.soen345.service.SmsSender;

@Service
@Slf4j
public class SmsCommunicationStrategy implements NotificationChannelStrategy {

    private final String fromNumber;
    private final SmsSender smsSender;

    public SmsCommunicationStrategy(
            @Value("${twilio.from-number}") String fromNumber,
            SmsSender smsSender
    ) {
        this.fromNumber = fromNumber;
        this.smsSender = smsSender;
    }

    @Override
    public void sendTo(User to, Notification notification, NotificationContext context) {
        String sid = smsSender.sendSms(
                to.getPhone(),
                fromNumber,
                notification.body(context)
        );
        log.info("Twilio SMS sent to {} with sid {}", to.getPhone(), sid);
    }
}
