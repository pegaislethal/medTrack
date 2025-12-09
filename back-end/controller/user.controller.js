const userService = require("../services/user.service");

// Thin controller delegating to service layer

const registerUser = (req, res) => userService.registerUser(req, res);
const verifyOTPUser = (req, res) => userService.verifyOTPUser(req, res);
const loginUser = (req, res) => userService.loginUser(req, res);
const verifyLoginOTP = (req, res) => userService.verifyLoginOTP(req, res);
const getAllUser = (req, res) => userService.getAllUser(req, res);
const getUserById = (req, res) => userService.getUserById(req, res);
const requestPasswordReset = (req, res) =>
  userService.requestPasswordReset(req, res);
const resetPassword = (req, res) => userService.resetPassword(req, res);

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


