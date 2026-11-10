import nodemailer from 'nodemailer';

let transporter = null;

// Se crea al primer envío porque dotenv se carga después de los imports.
const getTransporter = () => {
  if (transporter) return transporter;

  const { SMTP_HOST: host, SMTP_PORT: port = '465', SMTP_USER: user, SMTP_PASS: pass } = process.env;
  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass }
  });
  return transporter;
};

export const sendMail = async (message) => {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[Correo] SMTP no configurado; no se envió:', message.subject);
    return;
  }

  const info = await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    ...message
  });
  if (info.rejected?.length) {
    console.warn('[Correo] Destinatarios rechazados:', info.rejected.join(', '));
  }
};
