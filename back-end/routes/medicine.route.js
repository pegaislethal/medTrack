const express = require("express");
const router = express.Router();

const { authenticate, authAdmin } = require("../middlewares/auth.middleware");

const uploadMiddleware = require("../middlewares/fileUpload.middleware");

const {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  purchaseMedicine,
  getPurchaseHistory,
  getPurchaseAnalytics,
} = require("../controller/medicine.controller");

// Add Medicine (Admin only)
router.post("/", authenticate, authAdmin('admin'), uploadMiddleware, createMedicine);

// Get all medicines (User + Admin) - Read access for all authenticated users
router.get("/", authenticate, getAllMedicines);

// Purchase analytics (Admin only)
router.get(
  "/analytics/purchases",
  authenticate,
  authAdmin("admin"),
  getPurchaseAnalytics
);

// Purchase history (Admin sees all, users see own)
router.get("/purchases/history", authenticate, getPurchaseHistory);

// Purchase medicine (Authenticated users)
router.post("/:id/purchase", authenticate, purchaseMedicine);

// Get single medicine - Read access for all authenticated users
router.get("/:id", authenticate, getMedicineById);

// Update Medicine (Admin only)
router.put("/:id", authenticate, authAdmin('admin'), updateMedicine);

// Delete Medicine (Admin only)
router.delete("/:id", authenticate, authAdmin('admin'), deleteMedicine);

module.exports = router;
