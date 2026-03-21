const medicineService = require("../services/medicine.service");

// Thin controller delegating to service layer

const createMedicine = (req, res) => medicineService.createMedicine(req, res);
const getAllMedicines = (req, res) =>
  medicineService.getAllMedicines(req, res);
const getMedicineById = (req, res) =>
  medicineService.getMedicineById(req, res);
const updateMedicine = (req, res) => medicineService.updateMedicine(req, res);
const deleteMedicine = (req, res) => medicineService.deleteMedicine(req, res);
const purchaseMedicine = (req, res) => medicineService.purchaseMedicine(req, res);
const getPurchaseHistory = (req, res) =>
  medicineService.getPurchaseHistory(req, res);
const getPurchaseAnalytics = (req, res) =>
  medicineService.getPurchaseAnalytics(req, res);

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


