const express = require("express");
const router = express.Router();

const { authenticate, authAdmin } = require("../middlewares/auth.middleware");

const {
  createPharmacist,
  getAllPharmacists,
  updatePharmacist,
  deletePharmacist,
} = require("../controller/pharmacist.controller");

// Pharmacist CRUD (All controlled by Admin)
router.post("/", authenticate, authAdmin('admin'), createPharmacist);
router.get("/", authenticate, authAdmin('admin'), getAllPharmacists);
router.put("/:id", authenticate, authAdmin('admin'), updatePharmacist);
router.delete("/:id", authenticate, authAdmin('admin'), deletePharmacist);

module.exports = router;
