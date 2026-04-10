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

// Add Medicine (Pharmacist/Admin)
router.post("/", authenticate, uploadMiddleware, createMedicine);

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

// Update Medicine (Pharmacist/Admin)
router.put("/:id", authenticate, updateMedicine);

// Delete Medicine (Pharmacist/Admin)
router.delete("/:id", authenticate, deleteMedicine);

module.exports = router;
