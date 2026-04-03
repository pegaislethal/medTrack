/**
 * Payment API — gateway config from backend + checkout initiation
 */

import { getApiUrl, API_ENDPOINTS } from "../config";
import { getToken, getAuthHeader } from "../../utils/token";
import type { ApiError } from "../types";

export interface PaymentConfig {
  provider: string;
  merchantCode: string;
  checkoutBaseUrl: string;
  displayName: string;
  frontendUrl: string;
}

export interface PaymentConfigResponse {
  success: boolean;
  data?: PaymentConfig;
}

export interface InitiatePaymentBody {
  medicine: string;
  quantity: number;
  unitPrice: number;
}

export interface InitiatePaymentData {
  orderId: string;
  amount: number;
  qrData: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  message?: string;
  data?: InitiatePaymentData;
}

export interface ConfirmPaymentBody {
  orderId: string;
  transactionId?: string;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    paymentStatus: "PAID" | "PENDING" | "FAILED";
    orderId: string;
  };
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = getApiUrl(endpoint);
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: data.status || "error",
      message: data.message || "An error occurred",
      error: data.error,
      statusCode: response.status,
    } as ApiError & { statusCode: number };
  }

  return data as T;
};

/** Public: gateway labels and URLs configured on the server */
export const getPaymentConfig = async (): Promise<PaymentConfigResponse> => {
  const url = getApiUrl(API_ENDPOINTS.PAYMENT.CONFIG);
  const response = await fetch(url, { method: "GET" });
  const data = (await response.json()) as PaymentConfigResponse;
  if (!response.ok) {
    throw {
      status: "error",
      message: "Could not load payment configuration",
      statusCode: response.status,
    } as ApiError & { statusCode: number };
  }
  return data;
};

/** Start checkout — creates a pending purchase and returns the payment QR URL */
export const initiatePayment = async (
  body: InitiatePaymentBody
): Promise<InitiatePaymentResponse> => {
  const token = getToken();
  if (!token) {
    throw {
      status: "error",
      message: "No authentication token found",
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<InitiatePaymentResponse>(API_ENDPOINTS.PAYMENT.INITIATE, {
    method: "POST",
    headers: getAuthHeader() as HeadersInit,
    body: JSON.stringify(body),
  });
};

// Mark a pending order as paid (used for fake-confirm/test flow)
export const confirmPayment = async (
  body: ConfirmPaymentBody
): Promise<ConfirmPaymentResponse> => {
  const token = getToken();
  if (!token) {
    throw {
      status: "error",
      message: "No authentication token found",
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<ConfirmPaymentResponse>(API_ENDPOINTS.PAYMENT.CONFIRM, {
    method: "POST",
    headers: getAuthHeader() as HeadersInit,
    body: JSON.stringify(body),
  });
};
