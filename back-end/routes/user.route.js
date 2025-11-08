

const express = require("express");
const {
  registerUser,
  loginUser,
  verifyOTPUser,
  verifyLoginOTP,
  getAllUser,
  requestPasswordReset,
  resetPassword,
} = require("../controller/user.controller");
const { validate } = require("../middlewares/validation.middleware");
const { signupSchema } = require("../validations/ZodValidation.user");
const authenticateUser = require("../middlewares/auth.middleware");
const { currentUser } = require("../controller/decodeToken.controller");

const router = express.Router();

router.post(
  "/register",
  validate(signupSchema),
  registerUser
);

router.post(
  "/login",
  loginUser
);

router.post(
  "/verify-otp",
  verifyOTPUser
);

router.post(
  "/verify-login-otp",
  verifyLoginOTP
);

router.get(
  "/",
  authenticateUser,
  getAllUser
);

// Get current user endpoint
router.get(
  "/me",
  authenticateUser,
  currentUser
);

router.post(
  "/password-reset/request",
  requestPasswordReset
);  

router.post(
  "/password-reset/reset",
  resetPassword
);  

module.exports = router;
