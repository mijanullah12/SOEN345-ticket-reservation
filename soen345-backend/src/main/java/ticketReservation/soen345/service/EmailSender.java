package ticketReservation.soen345.service;

public interface EmailSender {

    String sendEmail(String from, String to, String subject, String htmlBody);
}
