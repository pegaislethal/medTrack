const express = require("express");
const router = express.Router();
const paymentController = require("../controller/payment.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/config", paymentController.getPaymentConfig);
router.post("/initiate", authenticate, paymentController.initiatePayment);
router.post("/confirm", authenticate, paymentController.confirmPayment);
router.get("/success", paymentController.paymentSuccess);
router.get("/failure", paymentController.paymentFailure);

module.exports = router;