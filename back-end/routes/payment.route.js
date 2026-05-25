const express = require("express");
const router = express.Router();
const paymentController = require("../controller/payment.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/config", paymentController.getPaymentConfig);
router.post("/initiate", authenticate, paymentController.initiatePayment);
router.post("/confirm", authenticate, paymentController.confirmPayment);
router.post("/khalti/initiate", authenticate, paymentController.initiateKhaltiPayment);
router.post("/khalti/verify", authenticate, paymentController.verifyKhaltiPayment);
router.get("/success", paymentController.paymentSuccess);
router.get("/failure", paymentController.paymentFailure);

module.exports = router;
