import nodemailer from 'nodemailer';

const SUBJECTS = [
  'Energie- en watertransitie engineering',
  'AI-gedreven ontwerpversnelling',
  'Vacature / samenwerking',
  'Anders',
];

const OK = 'Bedankt voor je bericht. We nemen zo snel mogelijk contact met je op.';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Methode niet toegestaan.' });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const clean = (v) => String(v ?? '').trim();

  // honeypot: bots vullen dit veld in
  if (clean(body.website)) {
    return res.status(200).json({ success: true, message: OK });
  }

  const name = clean(body.name);
  const email = clean(body.email);
  const subject = clean(body.subject);
  const message = clean(body.message);

  const errors = [];
  if (!name || name.length > 120) errors.push('Vul een geldige naam in.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) errors.push('Vul een geldig e-mailadres in.');
  if (!SUBJECTS.includes(subject)) errors.push('Kies een geldig onderwerp.');
  if (!message || message.length > 5000) errors.push('Vul een bericht in.');

  if (errors.length) {
    return res.status(422).json({ success: false, message: errors.join(' ') });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_TO } = process.env;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST || 'smtp.strato.de',
      port: Number(SMTP_PORT || 465),
      secure: Number(SMTP_PORT || 465) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });

    await transporter.sendMail({
      from: { name: 'VECTOR Engineering website', address: SMTP_USER },
      to: MAIL_TO || SMTP_USER,
      replyTo: { name, address: email },
      subject: `Contactformulier VECTOR Engineering: ${subject}`,
      text: `Naam: ${name}\nE-mail: ${email}\nOnderwerp: ${subject}\n\nBericht:\n${message}\n`,
    });

    return res.status(200).json({ success: true, message: OK });
  } catch (error) {
    console.error('Mail verzenden mislukt:', error);
    return res.status(500).json({
      success: false,
      message: 'Het verzenden is mislukt. Probeer het later opnieuw of mail ons direct.',
    });
  }
}
