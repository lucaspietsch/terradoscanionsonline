import nodemailer from 'nodemailer';

export function createMailer(config, log) {
  const transport = config.smtpUrl ? nodemailer.createTransport(config.smtpUrl) : null;
  return {
    enabled: Boolean(transport),
    async send({ to, subject, text }) {
      if (!transport) {
        // Sem SMTP configurado: não registramos o destinatário (dado pessoal) nos logs.
        log.info({ subject }, 'mailer: SMTP_URL ausente, e-mail não enviado');
        return false;
      }
      try {
        await transport.sendMail({ from: config.mailFrom, to, subject, text });
        return true;
      } catch (err) {
        log.error({ err: err.message }, 'mailer: falha no envio');
        return false;
      }
    },
  };
}
