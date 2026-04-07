package ticketReservation.soen345.service.impl;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ticketReservation.soen345.service.SmsSender;

@Component
public class TwilioSmsAdapter implements SmsSender {

    public TwilioSmsAdapter(
            @Value("${twilio.account-sid}") String accountSid,
            @Value("${twilio.auth-token}") String authToken
    ) {
        Twilio.init(accountSid, authToken);
    }

    @Override
    public String sendSms(String to, String from, String body) {
        Message message = Message.creator(
                new PhoneNumber(to),
                new PhoneNumber(from),
                body
        ).create();

        return message.getSid();
    }
}
