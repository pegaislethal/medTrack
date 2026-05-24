const nodemailer = require("nodemailer");

let transporter;
let verifyPromise;

const createMailerTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODE_MAILER_EMAIL,
        pass: process.env.NODE_MAILER_PASSWORD,
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 20,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return transporter;
};

const verifyMailerTransporter = async () => {
  if (!verifyPromise) {
    verifyPromise = createMailerTransporter().verify();
  }

  return verifyPromise;
};

module.exports = {
  createMailerTransporter,
  verifyMailerTransporter,
};