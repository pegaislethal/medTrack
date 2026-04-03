const { randomUUID } = require("crypto");

const Purchase = require("../models/purchase.model");
const Medicine = require("../models/medicine.model");
const { getSocketOrNull } = require("../config/socket");

const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const buildPaymentQrUrl = (amount, orderId) => {
  const merchantCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
  const base =
    process.env.ESEWA_CHECKOUT_URL || "https://esewa.com.np/#/home";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}amt=${amount}&pid=${orderId}&scd=${merchantCode}`;
};

const confirmPaymentByOrderId = async (orderId, transactionId) => {
  const io = getSocketOrNull();

  const purchase = await Purchase.findOne({ orderId });
  if (!purchase) {
    return { ok: false, code: "order_not_found" };
  }

  if (purchase.paymentStatus === "PAID") {
    return { ok: true, already: true };
  }

  const medicine = await Medicine.findById(purchase.medicine);
  if (!medicine) {
    await Purchase.findOneAndUpdate({ orderId }, { paymentStatus: "FAILED" });
    if (io) io.to(orderId).emit("paymentUpdate", { status: "FAILED", orderId });
    return { ok: false, code: "medicine_missing" };
  }

  if (medicine.quantity < purchase.quantity) {
    await Purchase.findOneAndUpdate({ orderId }, { paymentStatus: "FAILED" });
    if (io) io.to(orderId).emit("paymentUpdate", { status: "FAILED", orderId });
    return { ok: false, code: "stock" };
  }

  // Deduct stock only when payment is confirmed (transition PENDING -> PAID)
  medicine.quantity -= purchase.quantity;
  await medicine.save();

  await Purchase.findOneAndUpdate(
    { orderId },
    {
      paymentStatus: "PAID",
      transactionId: transactionId || "N/A",
    },
    { new: true }
  );

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
      quantity: purchase.quantity,
      totalPrice: purchase.totalPrice,
    });

    io.to(orderId).emit("paymentUpdate", {
      status: "PAID",
      orderId,
    });
  }

  return { ok: true };
};

exports.getPaymentConfig = (req, res) => {
  const provider = process.env.PAYMENT_GATEWAY || "ESEWA";
  const merchantCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
  const checkoutBaseUrl =
    process.env.ESEWA_CHECKOUT_URL || "https://esewa.com.np/#/home";

  res.json({
    success: true,
    data: {
      provider,
      merchantCode,
      checkoutBaseUrl,
      displayName: provider === "ESEWA" ? "eSewa" : provider,
      frontendUrl: getFrontendBaseUrl(),
    },
  });
};

exports.initiatePayment = async (req, res) => {
  try {
    const { medicine: medicineId, quantity, unitPrice } = req.body;
    const buyerId = req.user?.userId || req.user?.id || req.userId;

    if (req.user?.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admins cannot initiate customer payments from this flow",
      });
    }

    if (!buyerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const qty = Number(quantity);
    const clientUnit = Number(unitPrice);

    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer",
      });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    if (medicine.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available",
      });
    }

    if (Math.abs(Number(medicine.price) - clientUnit) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Price mismatch — refresh and try again",
      });
    }

    const totalPrice = qty * medicine.price;
    const orderId = randomUUID();

    await Purchase.create({
      medicine: medicine._id,
      buyer: buyerId,
      quantity: qty,
      unitPrice: medicine.price,
      totalPrice,
      orderId,
      paymentStatus: "PENDING",
      paymentMethod: process.env.PAYMENT_GATEWAY || "ESEWA",
    });

    const qrData = buildPaymentQrUrl(totalPrice, orderId);

    return res.json({
      success: true,
      data: {
        orderId,
        amount: totalPrice,
        qrData,
      },
    });
  } catch (err) {
    console.error("initiatePayment:", err);
    return res.status(500).json({
      success: false,
      message: "Payment init failed",
    });
  }
};

exports.paymentSuccess = async (req, res) => {
  const frontendUrl = getFrontendBaseUrl();
  const { oid, refId } = req.query;

  if (!oid) {
    return res.redirect(`${frontendUrl}/payment-failed?reason=missing_order`);
  }

  try {
    const result = await confirmPaymentByOrderId(oid, refId);
    if (!result.ok) {
      const reason = result.code || "server";
      return res.redirect(`${frontendUrl}/payment-failed?reason=${reason}`);
    }

    return res.redirect(`${frontendUrl}/payment-success`);
  } catch (err) {
    console.error("paymentSuccess:", err);
    return res.redirect(`${frontendUrl}/payment-failed?reason=server`);
  }
};

exports.paymentFailure = async (req, res) => {
  const io = getSocketOrNull();
  const frontendUrl = getFrontendBaseUrl();
  const { oid } = req.query;

  if (oid) {
    await Purchase.findOneAndUpdate(
      { orderId: oid },
      { paymentStatus: "FAILED" }
    );

    if (io) {
      io.to(oid).emit("paymentUpdate", {
        status: "FAILED",
        orderId: oid,
      });
    }
  }

  return res.redirect(`${frontendUrl}/payment-failed`);
};

// POST /api/payment/confirm
// Used by front-end "fake confirm" to mark an order as PAID.
exports.confirmPayment = async (req, res) => {
  const { orderId, transactionId } = req.body || {};

  const buyerId = req.user?.userId || req.user?.id || req.userId;
  if (!buyerId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Security: block admin role from confirming payments in this flow.
  if (req.user?.role === "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (!orderId) {
    return res.status(400).json({ success: false, message: "Missing orderId" });
  }

  try {
    const purchase = await Purchase.findOne({ orderId });
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Security: ensure the authenticated user owns this purchase order.
    if (!purchase.buyer || purchase.buyer.toString() !== buyerId.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const result = await confirmPaymentByOrderId(orderId, transactionId || "FAKE");
    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message:
          result.code === "stock"
            ? "Insufficient stock"
            : "Payment confirm failed",
        code: result.code,
      });
    }

    return res.json({ success: true, data: { paymentStatus: "PAID", orderId } });
  } catch (err) {
    console.error("confirmPayment:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
