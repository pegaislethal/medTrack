const { randomUUID } = require("crypto");

const Purchase = require("../models/purchase.model");
const Medicine = require("../models/medicine.model");
const User = require("../models/user.model");
const { getSocketOrNull } = require("../config/socket");
const {
  initiateKhaltiPayment: initiateRealKhaltiPayment,
  verifyKhaltiPayment: verifyRealKhaltiPayment,
  toPaisa,
} = require("../services/khalti.service");

const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const getPendingKhaltiOrderFilter = (buyerId, medicineId, qty, unitPrice) => ({
  buyer: buyerId,
  medicine: medicineId,
  quantity: qty,
  unitPrice,
  paymentMethod: "Khalti",
  paymentStatus: "PENDING",
});

const buildPaymentQrUrl = (amount, orderId) => {
  const merchantCode = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
  const base =
    process.env.ESEWA_CHECKOUT_URL || "https://esewa.com.np/#/home";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}amt=${amount}&pid=${orderId}&scd=${merchantCode}`;
};

const mapKhaltiStatusToPaymentStatus = (status) => {
  if (status === "Completed") return "PAID";
  if (status === "Pending" || status === "Initiated") return "PENDING";
  return "FAILED";
};

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

const getUnavailableReason = (medicine) => {
  if (medicine.isDeleted) return "Medicine is no longer available";
  if (new Date(medicine.expiryDate) < getStartOfToday()) {
    return "Medicine has expired";
  }
  if (medicine.quantity <= 0) return "Medicine is out of stock";
  return null;
};

const confirmPaymentByOrderId = async (
  orderId,
  transactionId,
  paymentMeta = {}
) => {
  const io = getSocketOrNull();

  const purchase = await Purchase.findOne({ orderId });
  if (!purchase) {
    return { ok: false, code: "order_not_found" };
  }

  const settlementTime = purchase.paidAt || new Date();
  const settlementTotal =
    paymentMeta.totalAmount ?? purchase.totalAmount ?? purchase.totalPrice;

  if (purchase.paymentStatus === "PAID" || purchase.stockReduced) {
    await Purchase.findByIdAndUpdate(purchase._id, {
      paymentStatus: "PAID",
      transactionId: transactionId || purchase.transactionId,
      totalAmount: settlementTotal,
      paidAt: settlementTime,
      stockReduced: true,
    });

    return { ok: true, already: true };
  }

  const medicine = await Medicine.findById(purchase.medicine);
  if (!medicine) {
    await Purchase.findOneAndUpdate({ orderId }, { paymentStatus: "FAILED" });
    if (io) io.to(orderId).emit("paymentUpdate", { status: "FAILED", orderId });
    return { ok: false, code: "medicine_missing" };
  }

  const unavailableReason = getUnavailableReason(medicine);
  if (unavailableReason) {
    await Purchase.findOneAndUpdate({ orderId }, { paymentStatus: "FAILED" });
    if (io) io.to(orderId).emit("paymentUpdate", { status: "FAILED", orderId });
    return { ok: false, code: "medicine_unavailable" };
  }

  const snapshotUpdate =
    !purchase.name || purchase.price == null ? getMedicineSnapshot(medicine) : {};

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
      ...snapshotUpdate,
      paymentStatus: "PAID",
      transactionId: transactionId || "N/A",
      totalAmount: settlementTotal,
      paidAt: settlementTime,
      stockReduced: true,
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

    const unavailableReason = getUnavailableReason(medicine);
    if (unavailableReason) {
      return res.status(400).json({
        success: false,
        message: unavailableReason,
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
      ...getMedicineSnapshot(medicine),
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

exports.initiateKhaltiPayment = async (req, res) => {
  try {
    const {
      orderId: existingOrderId,
      medicine: medicineId,
      quantity,
      unitPrice,
      customerInfo = {},
    } = req.body;
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

    let purchase;
    let medicineForSnapshot = null;

    if (existingOrderId) {
      purchase = await Purchase.findOne({ orderId: existingOrderId });
      if (!purchase) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      if (!purchase.buyer || purchase.buyer.toString() !== buyerId.toString()) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }

      if (purchase.paymentStatus === "PAID") {
        return res.status(400).json({
          success: false,
          message: "Order is already paid",
        });
      }

      medicineForSnapshot = await Medicine.findById(purchase.medicine);
      if (!medicineForSnapshot) {
        return res.status(404).json({
          success: false,
          message: "Medicine not found",
        });
      }

      const unavailableReason = getUnavailableReason(medicineForSnapshot);
      if (unavailableReason) {
        return res.status(400).json({
          success: false,
          message: unavailableReason,
        });
      }
    } else {
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

      const unavailableReason = getUnavailableReason(medicine);
      if (unavailableReason) {
        return res.status(400).json({
          success: false,
          message: unavailableReason,
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
          message: "Price mismatch - refresh and try again",
        });
      }

      const totalPrice = qty * medicine.price;
      if (totalPrice <= 10) {
        return res.status(400).json({
          success: false,
          message: "Khalti minimum payment amount is greater than Rs. 10",
        });
      }

      medicineForSnapshot = medicine;
      purchase =
        (await Purchase.findOne(
          getPendingKhaltiOrderFilter(buyerId, medicine._id, qty, medicine.price)
        )) ||
        (await Purchase.create({
          medicine: medicine._id,
          ...getMedicineSnapshot(medicine),
          buyer: buyerId,
          quantity: qty,
          unitPrice: medicine.price,
          totalPrice,
          totalAmount: totalPrice,
          orderId: randomUUID(),
          paymentStatus: "PENDING",
          paymentMethod: "Khalti",
          stockReduced: false,
          customerName: customerInfo.customerName,
          customerAddress: customerInfo.customerAddress,
          customerPhone: customerInfo.customerPhone,
          prescription: customerInfo.prescription,
        }));
    }

    if (medicineForSnapshot && (!purchase.name || purchase.price == null)) {
      purchase.set(getMedicineSnapshot(medicineForSnapshot));
      await purchase.save();
    }

    if (purchase.totalPrice <= 10) {
      return res.status(400).json({
        success: false,
        message: "Khalti minimum payment amount is greater than Rs. 10",
      });
    }

    try {
      const user = await User.findById(buyerId).select("fullname email phone");
      const orderPayload = {
        orderId: purchase.orderId,
        totalPrice: purchase.totalPrice,
      };
      const customerPayload = {
        name: user?.fullname || purchase.customerName,
        email: user?.email,
        ...(customerInfo.customerPhone || purchase.customerPhone || user?.phone
          ? {
              phone:
                customerInfo.customerPhone || purchase.customerPhone || user?.phone,
            }
          : {}),
      };
      console.log("[Khalti initiate]", {
        FRONTEND_URL: getFrontendBaseUrl(),
        orderId: purchase.orderId,
      });

      const khaltiResponse = await initiateRealKhaltiPayment(
        orderPayload,
        customerPayload
      );

      console.log("[Khalti initiate]", {
        FRONTEND_URL: getFrontendBaseUrl(),
        payment_url: khaltiResponse.payment_url,
        orderId: purchase.orderId,
      });

      purchase.pidx = khaltiResponse.pidx;
      purchase.khaltiStatus = khaltiResponse.status || "Initiated";
      purchase.paymentMethod = "Khalti";
      purchase.paymentStatus = "PENDING";
      purchase.totalAmount = purchase.totalAmount ?? purchase.totalPrice;
      await purchase.save();

      return res.json({
        success: true,
        pidx: khaltiResponse.pidx,
        payment_url: khaltiResponse.payment_url,
        message: "Khalti payment initiated successfully",
        data: {
          orderId: purchase.orderId,
          pidx: khaltiResponse.pidx,
          amount: purchase.totalPrice,
          payment_url: khaltiResponse.payment_url,
          expires_at: khaltiResponse.expires_at,
          expires_in: khaltiResponse.expires_in,
        },
      });
    } catch (khaltiError) {
      await Purchase.findByIdAndUpdate(purchase._id, {
        paymentStatus: "FAILED",
        khaltiStatus: "Initiate failed",
      });

      console.error("Khalti initiate failed:", {
        message: khaltiError.message,
        status: khaltiError.response?.status,
        data: khaltiError.response?.data,
      });

      const failureDetail =
        khaltiError.response?.data?.detail ||
        khaltiError.response?.data?.message ||
        khaltiError.message;

      return res.status(502).json({
        success: false,
        message: failureDetail
          ? `Khalti payment initiation failed: ${failureDetail}`
          : "Khalti payment initiation failed",
      });
    }
  } catch (err) {
    console.error("initiateKhaltiPayment:", err);
    return res.status(500).json({
      success: false,
      message: err.message ? `Payment init failed: ${err.message}` : "Payment init failed",
    });
  }
};

exports.verifyKhaltiPayment = async (req, res) => {
  const { pidx, orderId } = req.body || {};
  const buyerId = req.user?.userId || req.user?.id || req.userId;

  if (!buyerId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!pidx) {
    return res.status(400).json({ success: false, message: "Missing pidx" });
  }

  try {
    const purchase = await Purchase.findOne(
      orderId ? { $or: [{ pidx }, { orderId }] } : { pidx }
    );
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!purchase.buyer || purchase.buyer.toString() !== buyerId.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const lookup = await verifyRealKhaltiPayment(pidx);
    const paymentStatus = mapKhaltiStatusToPaymentStatus(lookup.status);

    if (lookup.total_amount && lookup.total_amount !== toPaisa(purchase.totalPrice)) {
      await Purchase.findByIdAndUpdate(purchase._id, {
        paymentStatus: "FAILED",
        khaltiStatus: "Amount mismatch",
        totalAmount: lookup.total_amount,
      });

      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch",
        data: { status: "FAILED", orderId: purchase.orderId },
      });
    }

    if (lookup.status === "Completed") {
      const result = await confirmPaymentByOrderId(
        purchase.orderId,
        lookup.transaction_id,
        { totalAmount: lookup.total_amount }
      );

      if (!result.ok) {
        return res.status(400).json({
          success: false,
          message:
            result.code === "stock"
              ? "Insufficient stock"
              : result.code === "medicine_unavailable"
                ? "Medicine is no longer available"
              : "Payment confirm failed",
          code: result.code,
          data: { status: "FAILED", orderId: purchase.orderId },
        });
      }

      await Purchase.findByIdAndUpdate(purchase._id, {
        pidx,
        khaltiStatus: lookup.status,
        transactionId: lookup.transaction_id,
        paymentMethod: "Khalti",
        paymentStatus: "PAID",
        totalAmount: lookup.total_amount ?? purchase.totalAmount ?? purchase.totalPrice,
        paidAt: new Date(),
      });

      return res.json({
        success: true,
        status: lookup.status,
        message: "Payment verified successfully",
        data: {
          status: "PAID",
          khaltiStatus: lookup.status,
          orderId: purchase.orderId,
          transactionId: lookup.transaction_id,
        },
      });
    }

    await Purchase.findByIdAndUpdate(purchase._id, {
      paymentStatus,
      khaltiStatus: lookup.status,
      transactionId: lookup.transaction_id,
      pidx,
      paymentMethod: "Khalti",
      totalAmount: lookup.total_amount ?? purchase.totalAmount ?? purchase.totalPrice,
    });

    const io = getSocketOrNull();
    if (io) {
      io.to(purchase.orderId).emit("paymentUpdate", {
        status: paymentStatus,
        orderId: purchase.orderId,
      });
    }

    return res.json({
      success: false,
      status: lookup.status,
      message:
        paymentStatus === "PENDING"
          ? "Khalti payment is still pending"
          : "Khalti payment was not completed",
      data: {
        status: paymentStatus,
        khaltiStatus: lookup.status,
        orderId: purchase.orderId,
        transactionId: lookup.transaction_id,
      },
    });
  } catch (err) {
    console.error("verifyKhaltiPayment:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    return res.status(502).json({
      success: false,
      message: "Khalti payment verification failed",
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
            : result.code === "medicine_unavailable"
              ? "Medicine is no longer available"
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
