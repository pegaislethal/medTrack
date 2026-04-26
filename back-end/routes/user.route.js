const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  verifyOTPUser,
  verifyLoginOTP,
  getAllUser,
  requestPasswordReset,
  resetPassword,
  changeFirstPassword,
} = require("../controller/user.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validation.middleware");
const { signupSchema } = require("../validations/ZodValidation.user");
const { currentUser } = require("../controller/decodeToken.controller");

// Register User
router.post("/register", validate(signupSchema), registerUser);

// Login User
router.post("/login", loginUser);

// OTP Verification
router.post("/verify-otp", verifyOTPUser);

// Verify Login OTP
router.post("/verify-login-otp", verifyLoginOTP);

// Get all users (Admin only)
router.get("/", authenticate, getAllUser);

// Current logged-in user
router.get("/me", authenticate, currentUser);

// Forgot password
router.post("/password-reset/request", requestPasswordReset);

// Reset password
router.post("/password-reset/reset", resetPassword);

// Change first login password
router.post("/change-first-password", authenticate, changeFirstPassword);

module.exports = router;
