const axios = require("axios");

const getKhaltiBaseUrl = () =>
  process.env.NODE_ENV === "production"
    ? "https://khalti.com/api/v2"
    : "https://dev.khalti.com/api/v2";

const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const getWebsiteUrl = () =>
  (process.env.FRONTEND_URL || process.env.BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");

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

  const payload = {
    return_url: `${getFrontendBaseUrl()}/payment-success`,
    website_url: getWebsiteUrl(),
    amount: toPaisa(amount),
    purchase_order_id: order.orderId,
    purchase_order_name: "MedTrack Medicine Order",
    customer_info: {
      name: user.name || "MedTrack Customer",
      email: user.email || "customer@medtrack.local",
      phone: user.phone || "9800000000",
    },
  };

  const response = await axios.post(
    `${getKhaltiBaseUrl()}/epayment/initiate/`,
    payload,
    { headers: getAuthHeaders() }
  );

  return response.data;
};

const verifyKhaltiPayment = async (pidx) => {
  if (!pidx) {
    throw new Error("pidx is required");
  }

  const response = await axios.post(
    `${getKhaltiBaseUrl()}/epayment/lookup/`,
    { pidx },
    {
      headers: getAuthHeaders(),
      validateStatus: () => true,
    }
  );

  if (response.status >= 400 && !response.data?.status) {
    const error = new Error(response.data?.detail || "Khalti lookup failed");
    error.response = response;
    throw error;
  }

  return response.data;
};

module.exports = {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  toPaisa,
};
