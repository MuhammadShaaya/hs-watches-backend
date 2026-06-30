const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_HOST) {
    console.warn("[mailer] SMTP not configured — skipping email send:", subject);
    return null;
  }
  return transporter.sendMail({
    from: `"H&S Watches" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { transporter, sendMail };
