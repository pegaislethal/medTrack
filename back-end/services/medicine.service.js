const Medicine = require("../models/medicine.model");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

const createMedicine = async (req, res) => {
  try {
    const {
      medicineName,
      batchNumber,
      category,
      manufacturer,
      quantity,
      price,
      expiryDate,
      description,
    } = req.body;

    const existingMedicine = await Medicine.findOne({ batchNumber });
    if (existingMedicine) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Medicine with this batch number already exists",
      });
    }

    let imageData = {};
    if (req.files && req.files.length > 0) {
      try {
        // Use the first image
        const file = req.files[0];
        const uploadResult = await cloudinary.uploader.upload(file.path, {
          folder: "uploads",
        });
        imageData = {
          public_id: uploadResult.public_id,
          url: uploadResult.secure_url,
        };
        // Delete local files after uploading to Cloudinary
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      } catch (uploadError) {
        // Delete local files if Cloudinary upload fails
        if (req.files) {
          req.files.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          });
        }
        throw uploadError;
      }
    }

    const newMedicine = new Medicine({
      medicineName,
      batchNumber,
      category,
      manufacturer,
      quantity,
      price,
      expiryDate,
      description,
      image: imageData,
      createdBy: req.user?.userId || req.userId || null,
    });

    await newMedicine.save();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Medicine added successfully",
      data: newMedicine,
    });
  } catch (error) {
    console.error("Error creating medicine:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Medicines fetched successfully",
      data: medicines,
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Medicine not found",
      });
    }
    res.status(StatusCodes.OK).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    console.error("Error fetching medicine:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMedicine = await Medicine.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedMedicine) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Medicine updated successfully",
      data: updatedMedicine,
    });
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id);

    if (!medicine) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Medicine not found",
      });
    }

    // Delete image from cloudinary if exists
    if (medicine.image?.public_id) {
      await cloudinary.uploader.destroy(medicine.image.public_id);
    }

    await medicine.deleteOne();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
};


