const nodemailer = require("nodemailer");

let transporter;
let verifyPromise;

const createMailerTransporter = () => {
  if (!transporter) {
    console.log("[mailer] creating singleton transporter", {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    });

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

  return verifyPromise.then((result) => {
    console.log("[mailer] transporter verified successfully");
    return result;
  });
};

module.exports = {
  createMailerTransporter,
  verifyMailerTransporter,
};