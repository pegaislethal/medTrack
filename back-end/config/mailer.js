let transporter;
let verifyPromise;
let nodemailerModule;

const normalizeBoolean = (value) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  return null;
};

const isMailerEnabled = () => {
  const envOverride = normalizeBoolean(process.env.MAILER_ENABLED);
  if (envOverride !== null) return envOverride;
  return Boolean(process.env.NODE_MAILER_EMAIL && process.env.NODE_MAILER_PASSWORD);
};

const getNodemailer = () => {
  if (nodemailerModule) return nodemailerModule;

  try {
    nodemailerModule = require("nodemailer");
  } catch (error) {
    console.warn("[mailer] nodemailer package not available, mailer disabled", {
      message: error.message,
      code: error.code,
    });
    nodemailerModule = null;
  }

  return nodemailerModule;
};

const createMailerTransporter = () => {
  if (!isMailerEnabled()) {
    return null;
  }

  if (!transporter) {
    const nodemailer = getNodemailer();
    if (!nodemailer) {
      return null;
    }

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
  const mailerTransporter = createMailerTransporter();
  if (!mailerTransporter) {
    return false;
  }

  if (!verifyPromise) {
    verifyPromise = mailerTransporter.verify();
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