const path = require("path");
const { createMailerTransporter } = require("../config/mailer");

const sendEmail = async (email, html, subject, cc = [], bcc = []) => {
  try {
    const transporter = createMailerTransporter();
    const startedAt = Date.now();

    console.log("[mailer] sendEmail started", {
      to: email,
      subject,
      ccCount: Array.isArray(cc) ? cc.length : 0,
      bccCount: Array.isArray(bcc) ? bcc.length : 0,
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
    console.log("[mailer] sendEmail succeeded", {
      to: email,
      subject,
      messageId: response.messageId,
      accepted: response.accepted,
      rejected: response.rejected,
      durationMs: Date.now() - startedAt,
    });
    return { success: true, response };
  } catch (error) {
    console.error("[mailer] sendEmail failed", {
      to: email,
      subject,
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
    });
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
