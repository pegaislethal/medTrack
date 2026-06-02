const Medicine = require("../models/medicine.model");
const Purchase = require("../models/purchase.model");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { getSocketInstance } = require("../config/socket");

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getMedicineSnapshot = (medicine) => ({
  name: medicine.medicineName,
  price: medicine.price,
  image: medicine.image || {},
});

const notDeletedFilter = () => ({ isDeleted: { $ne: true } });

const normalizeBatchNumber = (batchNumber) =>
  batchNumber == null ? "" : String(batchNumber).trim().toUpperCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildBatchNumberFilter = (batchNumber) => ({
  batchNumber: new RegExp(`^${escapeRegExp(batchNumber)}$`, "i"),
});

const isDuplicateBatchNumberError = (error) =>
  error?.code === 11000 &&
  (error?.keyPattern?.batchNumber || error?.keyValue?.batchNumber);

const sendMedicineWriteError = (res, error, action) => {
  if (isDuplicateBatchNumberError(error)) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: "Medicine with this batch number already exists",
    });
  }

  if (error?.name === "ValidationError") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }

  console.error(`Error ${action} medicine:`, error);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Server error",
  });
};

const getUnavailableReason = (medicine) => {
  if (medicine.isDeleted) return "Medicine is no longer available";
  if (new Date(medicine.expiryDate) < getStartOfToday()) {
    return "Medicine has expired";
  }
  if (medicine.quantity <= 0) return "Medicine is out of stock";
  return null;
};

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

    const normalizedBatchNumber = normalizeBatchNumber(batchNumber);
    if (!normalizedBatchNumber) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Batch number is required",
      });
    }

    const existingMedicine = await Medicine.findOne(
      buildBatchNumberFilter(normalizedBatchNumber)
    );
    if (existingMedicine) {
      return res.status(StatusCodes.CONFLICT).json({
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
      batchNumber: normalizedBatchNumber,
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
    return sendMedicineWriteError(res, error, "creating");
  }
};

const getAllMedicines = async (req, res) => {
  try {
    const today = getStartOfToday();
    const status = String(req.query.status || "").toLowerCase();
    const includeInactive = req.query.includeInactive === "true";

    let query = {
      ...notDeletedFilter(),
      expiryDate: { $gte: today },
      quantity: { $gt: 0 },
    };

    if (includeInactive || status === "all" || status === "admin") {
      query = notDeletedFilter();
    }

    if (status === "expired") {
      query = {
        ...notDeletedFilter(),
        expiryDate: { $lt: today },
      };
    }

    const medicines = await Medicine.find(query).sort({ createdAt: -1 });
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
    const medicine = await Medicine.findOne({
      _id: req.params.id,
      ...notDeletedFilter(),
    });
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
    const updateData = { ...req.body };
    delete updateData.isDeleted;

    if (Object.prototype.hasOwnProperty.call(updateData, "batchNumber")) {
      const normalizedBatchNumber = normalizeBatchNumber(updateData.batchNumber);
      if (!normalizedBatchNumber) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Batch number is required",
        });
      }

      const existingMedicine = await Medicine.findOne({
        _id: { $ne: id },
        ...buildBatchNumberFilter(normalizedBatchNumber),
      });

      if (existingMedicine) {
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Medicine with this batch number already exists",
        });
      }

      updateData.batchNumber = normalizedBatchNumber;
    }

    const updatedMedicine = await Medicine.findOneAndUpdate(
      { _id: id, ...notDeletedFilter() },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

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
    return sendMedicineWriteError(res, error, "updating");
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findOne({ _id: id, ...notDeletedFilter() });

    if (!medicine) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Medicine not found",
      });
    }

    medicine.isDeleted = true;
    await medicine.save();

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
    const { customerName, customerAddress, customerPhone, prescription } = req.body;
    const buyerId = req.user?.userId || req.userId || req.user?.id;

    if (req.user?.role === "admin") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Admins cannot complete customer purchases from this flow",
      });
    }

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

    const unavailableReason = getUnavailableReason(medicine);
    if (unavailableReason) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: unavailableReason,
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
      ...getMedicineSnapshot(medicine),
      buyer: buyerId,
      quantity: requestedQty,
      unitPrice: medicine.price,
      totalPrice: medicine.price * requestedQty,
      paymentStatus: "PAID",
      customerName,
      customerAddress,
      customerPhone,
      prescription
    });

    const io = getSocketInstance();
    if (io) {
      io.emit("medicine:stockUpdated", {
        medicineId: medicine._id.toString(),
        quantity: medicine.quantity,
      });
      if (medicine.quantity <= 60) {
        io.emit("medicine:lowStock", {
          medicineId: medicine._id.toString(),
          medicineName: medicine.medicineName,
          quantity: medicine.quantity,
        });
        
        // Notify Admins
        try {
          const Admin = require("../models/admin.model");
          const { sendEmail } = require("../utils/sendEmail");
          
          const admins = await Admin.find({ role: "admin" }).select("email");
          const adminEmails = admins.map(a => a.email);
          
          if (adminEmails.length > 0) {
            const subject = `⚠️ Low Stock Alert: ${medicine.medicineName}`;
            const html = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>MedTrack Inventory Alert</h2>
                <p>The following item has fallen below the minimum stock threshold (≤ 60).</p>
                <div style="background-color: #FEF2F2; border: 1px solid #FCA5A5; padding: 15px; border-radius: 8px;">
                  <h3 style="color: #B91C1C; margin-top: 0;">${medicine.medicineName}</h3>
                  <p><strong>Batch:</strong> ${medicine.batchNumber}</p>
                  <p><strong>Remaining Stock:</strong> ${medicine.quantity} units</p>
                </div>
                <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">This is an automated system alert from MedTrack.</p>
              </div>
            `;
            await sendEmail(adminEmails.join(","), html, subject);
          }
        } catch (mailErr) {
          console.error("Failed to send low stock alert emails: ", mailErr);
        }
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
    const { fromDate, toDate } = req.query;

    if (!requesterId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Build the base query
    const query = isAdmin ? {} : { buyer: requesterId };

    // Add date filtering if provided
    if (fromDate || toDate) {
      query.createdAt = {};
      
      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0); // Start of the day
        query.createdAt.$gte = startDate;
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999); // End of the day
        query.createdAt.$lte = endDate;
      }
    }

    const purchases = await Purchase.find(query)
      .populate("medicine", "medicineName batchNumber price image isDeleted expiryDate")
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


