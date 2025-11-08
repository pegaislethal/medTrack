const nodemailer = require("nodemailer");
const path = require("path");

const sendEmail = async (email, html, subject, cc = [], bcc = []) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODE_MAILER_EMAIL,
        pass: process.env.NODE_MAILER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.NODE_MAILER_EMAIL,
      to: email,
      subject: subject,
      html: html,
      cc: cc,
      bcc: bcc,
      attachments: [
        {
          filename: "logo_medtrack.png",
          path: path.join(__dirname, "logo_medtrack.png"), // Put the logo in /utils
          cid: "logo_medtrack", // Refer this in the HTML img tag
        },
      ],
    };

    const response = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully.");
    return { success: true, response };
  } catch (error) {
    console.error("❌ Email failed to send: " + error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
