package com.proyecto.inventario.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {
  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  private final JavaMailSender mailSender;
  private final TemplateEngine templateEngine;
  private final String from;

  public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine, @Value("${app.mail.from}") String from) {
    this.mailSender = mailSender;
    this.templateEngine = templateEngine;
    this.from = from;
  }

  public void sendTemplate(String to, String subject, String template, Map<String, Object> vars) {
    if (to == null || to.isBlank()) return;
    try {
      Context context = new Context();
      context.setVariables(vars);
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(from);
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(templateEngine.process(template, context), true);
      mailSender.send(message);
    } catch (MessagingException | RuntimeException ex) {
      log.warn("No se pudo enviar email a {}: {}", to, ex.getMessage());
    }
  }
}
