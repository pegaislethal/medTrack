const { Resend } = require("resend");

let resend;

const getResendClient = () => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
};

const sendOtpEmail = async (email, otp, purpose = "verification") => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing");
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      throw new Error("RESEND_FROM_EMAIL is missing");
    }

    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [email],
      subject: `MedTrack OTP for ${purpose}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>MedTrack OTP Verification</h2>
          <p>Your OTP for ${purpose} is:</p>
          <h1 style="letter-spacing: 4px;">${otp}</h1>
          <p>This OTP will expire soon. Please do not share it with anyone.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email error:", {
        name: error.name,
        message: error.message,
      });
      throw new Error(error.message || JSON.stringify(error));
    }

    return data;
  } catch (err) {
    console.error("sendOtpEmail failed:", {
      purpose,
      message: err.message,
    });
    throw err;
  }
};

module.exports = sendOtpEmail;
