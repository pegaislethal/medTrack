const express = require("express");
const router = express.Router();

const { authenticate, authAdmin } = require("../middlewares/auth.middleware");

const {
  registerAdmin,
  verifyOTPAdmin,
  loginAdmin,
  verifyLoginOTPAdmin,
  adminGetAllUsers,
  deleteUserByAdmin,
} = require("../controller/admin.controller");

// Admin Registration
router.post("/register", registerAdmin);

// Verify OTP for Admin Registration
router.post("/verify-otp", verifyOTPAdmin);

// Admin Login
router.post("/login", loginAdmin);

// Verify Login OTP for Admin
router.post("/verify-login-otp", verifyLoginOTPAdmin);

// Admin Protected Routes
router.get("/page", authenticate, authAdmin('admin'), adminGetAllUsers);

// Delete any user
router.delete("/user/:id", authenticate, authAdmin('admin'), deleteUserByAdmin);

module.exports = router;
