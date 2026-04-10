const pharmacistService = require("../services/pharmacist.service");

// Thin controller delegating to service layer

const createPharmacist = (req, res) => pharmacistService.createPharmacist(req, res);
const getAllPharmacists = (req, res) => pharmacistService.getAllPharmacists(req, res);
const updatePharmacist = (req, res) => pharmacistService.updatePharmacist(req, res);
const deletePharmacist = (req, res) => pharmacistService.deletePharmacist(req, res);

module.exports = {
  createPharmacist,
  getAllPharmacists,
  updatePharmacist,
  deletePharmacist,
};
