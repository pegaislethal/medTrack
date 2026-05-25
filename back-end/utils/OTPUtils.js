const otpGenerator = require("otp-generator");
const sendOtpEmail = require("./sendOtpEmail");

const generateOTP = () => {
  const otp = otpGenerator
    .generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    })
    .toString();

  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 5);
  return { otp, expiration };
};

const sendVerificationEmail = async (email, fullName, otp) => {
  return sendOtpEmail(email, otp, "account verification");
};

const sendPasswordResetEmail = async (email, fullName, otp) => {
  return sendOtpEmail(email, otp, "password reset");
};

const sendLoginEmail = async (email, fullName, otp) => {
  return sendOtpEmail(email, otp, "login verification");
};

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLoginEmail,
};
