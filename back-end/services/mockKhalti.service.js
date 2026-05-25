const getFrontendBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const getMockCredentials = () => ({
  khaltiId: process.env.MOCK_KHALTI_ID || "9800000000",
  mpin: process.env.MOCK_KHALTI_MPIN || "1111",
  otp: process.env.MOCK_KHALTI_OTP || "987654",
});

const initiateMockKhaltiPayment = async (order) => {
  const pidx = `mock_pidx_${order.orderId}`;
  const amount = Number(order.totalPrice);
  const params = new URLSearchParams({
    pidx,
    orderId: order.orderId,
    amount: amount.toString(),
  });

  return {
    pidx,
    transaction_id: `mock_txn_${Date.now()}`,
    status: "Initiated",
    payment_url: `${getFrontendBaseUrl()}/mock-khalti-payment?${params.toString()}`,
    amount,
  };
};

const verifyMockKhaltiPayment = async (pidx, status = "Pending") => {
  const orderId = pidx?.startsWith("mock_pidx_")
    ? pidx.replace("mock_pidx_", "")
    : null;

  if (!pidx || !orderId) {
    throw new Error("Invalid mock pidx");
  }

  return {
    pidx,
    purchase_order_id: orderId,
    transaction_id: status === "Completed" ? `mock_txn_${Date.now()}` : null,
    status,
  };
};

module.exports = {
  getMockCredentials,
  initiateMockKhaltiPayment,
  verifyMockKhaltiPayment,
};
