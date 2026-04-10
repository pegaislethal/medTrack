const Admin = require("../models/admin.model");
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

// REGISTER ADMIN
const registerAdmin = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Admin already exists",
        error: "ADMIN_EXISTS",
      });
    }

    const hashed = await hashPassword(password);
    const otp = generateOTP().otp;

    const newAdmin = await Admin.create({
      fullname,
      email,
      password: hashed,
      otp,
      isVerified: false,
      role: "admin",
    });

    // Send OTP via email
    await sendVerificationEmail(email, fullname, otp);

    res.status(StatusCodes.CREATED).json({
      status: "otp_required",
      message: "Please verify your email with OTP to complete registration",
      email: newAdmin.email,
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Server error",
      error: "SERVER_ERROR",
    });
  }
};

// VERIFY OTP FOR ADMIN REGISTRATION
const verifyOTPAdmin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Admin not found",
        error: "ADMIN_NOT_FOUND",
      });
    }

    if (admin.isVerified) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Account is already verified. Please log in.",
        error: "ALREADY_VERIFIED",
      });
    }

    if (!admin.otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "No OTP found. Please register again.",
        error: "OTP_NOT_FOUND",
      });
    }

    if (admin.otp !== otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid OTP",
        error: "INVALID_OTP",
      });
    }

    admin.isVerified = true;
    admin.otp = null;
    await admin.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Account verified successfully. Please log in.",
      email: admin.email,
    });
  } catch (error) {
    console.error("Error verifying admin OTP:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Server error",
      error: "SERVER_ERROR",
    });
  }
};

// ADMIN LOGIN
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid credentials",
        error: "INVALID_CREDENTIALS",
      });
    }

    if (!admin.isVerified) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please verify your account before logging in",
        error: "UNVERIFIED_ACCOUNT",
      });
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid credentials",
        error: "INVALID_CREDENTIALS",
      });
    }

    const otp = generateOTP().otp;
    admin.otp = otp;
    await admin.save();

    await sendLoginEmail(email, admin.fullname, otp);

    return res.status(StatusCodes.OK).json({
      status: "otp_required",
      message: "Please verify your login with OTP",
      email: admin.email,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Server error",
      error: "SERVER_ERROR",
    });
  }
};

// VERIFY LOGIN OTP FOR ADMIN
const verifyLoginOTPAdmin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Admin not found",
        error: "ADMIN_NOT_FOUND",
      });
    }

    if (admin.otp !== otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid OTP",
        error: "INVALID_OTP",
      });
    }

    admin.otp = null;
    await admin.save();

    const token = generateToken(admin, "admin");

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error verifying admin login OTP:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Server error",
      error: "SERVER_ERROR",
    });
  }
};

// GET ALL USERS (ADMIN ONLY)
const adminGetAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

// DELETE USER (ADMIN ONLY)
const deleteUserByAdmin = async (req, res) => {
  try {
    const userId = req.params.id;

    const exists = await User.findById(userId);
    if (!exists) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET RECENT ACTIVITY (ADMIN ONLY)
const getRecentActivity = async (req, res) => {
  try {
    const Purchase = require("../models/purchase.model");
    
    // Fetch last 10 purchases
    const recentPurchases = await Purchase.find()
      .populate("medicine", "medicineName")
      .populate("buyer", "fullname")
      .sort({ createdAt: -1 })
      .limit(10);
      
    // Fetch last 10 pharmacist creations
    const recentUsers = await User.find({ role: "pharmacist" })
      .sort({ createdAt: -1 })
      .limit(10);
      
    // Format activities
    const activities = [
      ...recentPurchases.map(p => ({
        _id: p._id,
        type: "SALE",
        message: `Pharmacist ${p.buyer?.fullname || "Unknown"} sold ${p.quantity}x ${p.medicine?.medicineName || "Unknown"} to ${p.customerName || "Walk-in Customer"}`,
        timestamp: p.createdAt,
      })),
      ...recentUsers.map(u => ({
        _id: u._id,
        type: "USER_CREATED",
        message: `Pharmacist ${u.fullname} was created`,
        timestamp: u.createdAt,
      }))
    ];
    
    // Sort combined array by timestamp descending and take top 10
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const finalActivities = activities.slice(0, 10);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Recent activity fetched successfully",
      data: finalActivities,
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  registerAdmin,
  verifyOTPAdmin,
  loginAdmin,
  verifyLoginOTPAdmin,
  adminGetAllUsers,
  deleteUserByAdmin,
  getRecentActivity,
};