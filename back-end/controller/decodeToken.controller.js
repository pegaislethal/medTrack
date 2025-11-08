const { StatusCodes } = require("http-status-codes");
const User = require("../models/user.model");

const currentUser = async (req, res) => {
  try {
    const userId = req.userId; // This comes from the auth middleware
    const user = await User.findById(userId).select('-password -otp');

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        profilePicture: user.profilePicture || {}
      }
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  currentUser
};
