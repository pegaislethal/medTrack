const mongoose = require("mongoose");
const User = require("../models/user.model");
const { StatusCodes } = require("http-status-codes");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../utils/authutils");
const {
  generateOTP,
  sendVerificationEmail,
  sendLoginEmail,
} = require("../utils/OTPUtils");

const registerUser = async (req, res) => {
  const { fullname, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "User already exists",
        error: "USER_EXISTS",
      });
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP().otp;

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      otp,
      isVerified: false,
    });

    const savedUser = await newUser.save();

    // Send OTP via email
    await sendVerificationEmail(email, fullname, otp);

    res.status(StatusCodes.CREATED).json({
      status: "otp_required",
      message: "Please verify your email with OTP to complete registration",
      email: savedUser.email,
    });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Server error",
      error: "SERVER_ERROR",
    });
  }
};

const verifyOTPUser = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
    }

    if (user.isVerified) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Account is already verified. Please log in.",
        error: "ALREADY_VERIFIED",
      });
    }

    if (!user.otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "No OTP found. Please register again.",
        error: "OTP_NOT_FOUND",
      });
    }

    if (user.otp !== otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid OTP",
        error: "INVALID_OTP",
      });
    }

    user.isVerified = true;
    user.otp = null;
    await user.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Account verified successfully. Please log in.",
      email: user.email,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Server error",
      error: "SERVER_ERROR",
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid credentials",
        error: "INVALID_CREDENTIALS",
      });
    }

    if (!user.isVerified) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please verify your account before logging in",
        error: "UNVERIFIED_ACCOUNT",
      });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid credentials",
        error: "INVALID_CREDENTIALS",
      });
    }

    const otp = generateOTP().otp;
    user.otp = otp;
    // Ensure profilePicture is an object
    if (!user.profilePicture || typeof user.profilePicture !== "object") {
      user.profilePicture = {};
    }
    await user.save();

    await sendLoginEmail(email, user.fullname, otp);

    return res.status(StatusCodes.OK).json({
      status: "otp_required",
      message: "Please verify your login with OTP",
      email: user.email,
    });
  } catch (error) {
    console.error("Error in login process:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Server error",
      error: "SERVER_ERROR",
    });
  }
};

const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "User not found",
        error: "USER_NOT_FOUND",
      });
    }

    if (user.otp !== otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid OTP",
        error: "INVALID_OTP",
      });
    }

    user.otp = null;
    await user.save();

    const token = generateToken(user);

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        profilePicture: user.profilePicture || {},
      },
    });
  } catch (error) {
    console.error("Error verifying login OTP:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Server error",
      error: "SERVER_ERROR",
    });
  }
};

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = generateOTP().otp;
    user.otp = otp;
    await user.save();

    await sendPasswordResetEmail(email, user.fullname, otp);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "OTP sent to your email for password reset",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * Step 2: Verify OTP & Reset Password
 */
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Data fetched Successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const getUserById = async (req, res, next) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: `User with Id ${userId} was not found`,
    });
  }
  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Data Fetched successfully",
    data: user,
  });
};

module.exports = {
  registerUser,
  verifyOTPUser,
  loginUser,
  verifyLoginOTP,
  getAllUser,
  getUserById,
  requestPasswordReset,
  resetPassword,
};