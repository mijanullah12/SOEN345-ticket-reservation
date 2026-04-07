package ticketReservation.soen345.service;

public interface SmsSender {

    String sendSms(String to, String from, String body);
}
