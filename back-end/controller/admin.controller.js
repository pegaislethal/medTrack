const adminService = require("../services/admin.service");

// Controllers are now thin wrappers delegating to the service layer.
// This keeps HTTP concerns here and business logic in `services`.

const registerAdmin = (req, res) => adminService.registerAdmin(req, res);
const verifyOTPAdmin = (req, res) => adminService.verifyOTPAdmin(req, res);
const loginAdmin = (req, res) => adminService.loginAdmin(req, res);
const verifyLoginOTPAdmin = (req, res) =>
  adminService.verifyLoginOTPAdmin(req, res);
const adminGetAllUsers = (req, res) => adminService.adminGetAllUsers(req, res);
const deleteUserByAdmin = (req, res) =>
  adminService.deleteUserByAdmin(req, res);
const getRecentActivity = (req, res) => adminService.getRecentActivity(req, res);

module.exports = {
  registerAdmin,
  verifyOTPAdmin,
  loginAdmin,
  verifyLoginOTPAdmin,
  adminGetAllUsers,
  deleteUserByAdmin,
  getRecentActivity,
};
