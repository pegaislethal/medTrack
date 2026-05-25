const axios = require("axios");

const getKhaltiMode = () =>
  (process.env.KHALTI_MODE || "sandbox").trim().toLowerCase();

const getKhaltiBaseUrl = () =>
  getKhaltiMode() === "production"
    ? "https://khalti.com/api/v2"
    : "https://dev.khalti.com/api/v2";

const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const getWebsiteUrl = () =>
  (process.env.FRONTEND_URL || process.env.BACKEND_URL || "http://localhost:5173").replace(/\/$/, "");

const getAuthHeaders = () => {
  if (!process.env.KHALTI_SECRET) {
    throw new Error("KHALTI_SECRET is missing");
  }

  return {
    Authorization: `Key ${process.env.KHALTI_SECRET}`,
    "Content-Type": "application/json",
  };
};

const toPaisa = (amountInRupees) => Math.round(Number(amountInRupees) * 100);

const initiateKhaltiPayment = async (order, user = {}) => {
  const amount = Number(order.totalPrice);
  if (!Number.isFinite(amount) || amount < 10) {
    throw new Error("Khalti minimum payment amount is Rs. 10");
  }

  const amountInPaisa = toPaisa(amount);
  const returnUrl = `${getFrontendBaseUrl()}/payment/khalti/callback`;
  const websiteUrl = getWebsiteUrl();
  const payload = {
    return_url: returnUrl,
    website_url: websiteUrl,
    amount: amountInPaisa,
    purchase_order_id: order.orderId,
    purchase_order_name: "MedTrack Medicine Order",
    customer_info: {
      name: user.name || "MedTrack Customer",
      email: user.email || "customer@medtrack.local",
      phone: user.phone || "9800000000",
    },
  };

  const endpoint = `${getKhaltiBaseUrl()}/epayment/initiate/`;
  console.log("[Khalti initiate request]", {
    KHALTI_MODE: getKhaltiMode(),
    endpoint,
    orderId: order.orderId,
    amountInPaisa,
    return_url: returnUrl,
    website_url: websiteUrl,
  });

  try {
    const response = await axios.post(endpoint, payload, {
      headers: getAuthHeaders(),
    });

    return response.data;
  } catch (error) {
    console.error("[Khalti initiate error]", {
      endpoint,
      orderId: order.orderId,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

const verifyKhaltiPayment = async (pidx) => {
  if (!pidx) {
    throw new Error("pidx is required");
  }

  const endpoint = `${getKhaltiBaseUrl()}/epayment/lookup/`;
  console.log("[Khalti lookup request]", {
    KHALTI_MODE: getKhaltiMode(),
    endpoint,
    pidx,
  });

  const response = await axios.post(endpoint, { pidx }, {
    headers: getAuthHeaders(),
    validateStatus: () => true,
  });

  if (response.status >= 400 && !response.data?.status) {
    const error = new Error(response.data?.detail || "Khalti lookup failed");
    error.response = response;
    console.error("[Khalti lookup error]", {
      endpoint,
      status: response.status,
      data: response.data,
    });
    throw error;
  }

  return response.data;
};

module.exports = {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  toPaisa,
};
