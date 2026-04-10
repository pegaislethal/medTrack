const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { StatusCodes } = require("http-status-codes");

// Create Pharmacist (User)
const createPharmacist = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Fullname, email, and password are required.",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      isVerified: true, // Auto-verify since created by admin
    });

    await newUser.save();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Pharmacist created successfully.",
      data: {
        id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        role: "Pharmacist", // Logical role mapping for frontend
      },
    });
  } catch (error) {
    console.error("Error creating pharmacist:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get All Pharmacists (Users)
const getAllPharmacists = async (req, res) => {
  try {
    const users = await User.find({}, "-password -confirm_password").sort({ createdAt: -1 });
    
    // Map them to include explicit role field for frontend
    const mappedUsers = users.map(user => ({
      ...user._doc,
      role: "Pharmacist"
    }));

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Pharmacists fetched successfully.",
      data: mappedUsers,
    });
  } catch (error) {
    console.error("Error fetching pharmacists:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update Pharmacist
const updatePharmacist = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Pharmacist not found.",
      });
    }

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Pharmacist updated successfully.",
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error updating pharmacist:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete Pharmacist
const deletePharmacist = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Pharmacist not found.",
      });
    }

    await user.deleteOne();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Pharmacist deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting pharmacist:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createPharmacist,
  getAllPharmacists,
  updatePharmacist,
  deletePharmacist,
};
