const Medicine = require("../models/medicine.model");
const Purchase = require("../models/purchase.model");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { getSocketInstance } = require("../config/socket");

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

const purchaseMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const requestedQty = Number(req.body.quantity);
    const buyerId = req.user?.userId || req.userId || req.user?.id;

    if (!Number.isInteger(requestedQty) || requestedQty <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    if (!buyerId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Medicine not found",
      });
    }

    if (medicine.quantity < requestedQty) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    medicine.quantity -= requestedQty;
    await medicine.save();

    const purchase = await Purchase.create({
      medicine: medicine._id,
      buyer: buyerId,
      quantity: requestedQty,
      unitPrice: medicine.price,
      totalPrice: medicine.price * requestedQty,
      paymentStatus: "PAID",
    });

    const io = getSocketInstance();
    if (io) {
      io.emit("medicine:stockUpdated", {
        medicineId: medicine._id.toString(),
        quantity: medicine.quantity,
      });
      if (medicine.quantity <= 10) {
        io.emit("medicine:lowStock", {
          medicineId: medicine._id.toString(),
          medicineName: medicine.medicineName,
          quantity: medicine.quantity,
        });
      }
      io.emit("analytics:purchaseCreated", {
        medicineId: medicine._id.toString(),
        quantity: requestedQty,
        totalPrice: purchase.totalPrice,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Purchase completed successfully",
      data: {
        medicine,
        purchase,
      },
    });
  } catch (error) {
    console.error("Error purchasing medicine:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const getPurchaseHistory = async (req, res) => {
  try {
    const requesterId = req.user?.userId || req.user?.id || req.userId;
    const isAdmin = req.user?.role === "admin";

    if (!requesterId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const query = isAdmin ? {} : { buyer: requesterId };
    const purchases = await Purchase.find(query)
      .populate("medicine", "medicineName batchNumber price")
      .populate("buyer", "fullname email")
      .sort({ createdAt: -1 });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Purchase history fetched successfully",
      data: purchases,
    });
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

const getPurchaseAnalytics = async (req, res) => {
  try {
    const [summary] = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalItemsSold: { $sum: "$quantity" },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const topMedicines = await Purchase.aggregate([
      {
        $group: {
          _id: "$medicine",
          totalSold: { $sum: "$quantity" },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "medicines",
          localField: "_id",
          foreignField: "_id",
          as: "medicine",
        },
      },
      { $unwind: "$medicine" },
      {
        $project: {
          _id: 0,
          medicineId: "$medicine._id",
          medicineName: "$medicine.medicineName",
          totalSold: 1,
          revenue: 1,
        },
      },
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Purchase analytics fetched successfully",
      data: {
        totalOrders: summary?.totalOrders || 0,
        totalItemsSold: summary?.totalItemsSold || 0,
        totalRevenue: summary?.totalRevenue || 0,
        topMedicines,
      },
    });
  } catch (error) {
    console.error("Error fetching purchase analytics:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
  purchaseMedicine,
  getPurchaseHistory,
  getPurchaseAnalytics,
};


