/**
 * Medicine API Service
 * Handles all medicine-related API calls
 */

import { getApiUrl, API_ENDPOINTS } from '../config';
import { getToken, getAuthHeader } from '../../utils/token';
import type { ApiError } from '../types';

// Types
export interface Medicine {
  _id: string;
  medicineName: string;
  batchNumber: string;
  category: string;
  manufacturer: string;
  quantity: number;
  price: number;
  expiryDate: string;
  description?: string;
  image?: {
    public_id?: string;
    url?: string;
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMedicineRequest {
  medicineName: string;
  batchNumber: string;
  category: string;
  manufacturer: string;
  quantity: number;
  price: number;
  expiryDate: string;
  description?: string;
  image?: File;
}

export interface MedicineResponse {
  success: boolean;
  message: string;
  data?: Medicine | Medicine[];
}

/**
 * Make API request with error handling
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = getApiUrl(endpoint);
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
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
      status: data.status || 'error',
      message: data.message || 'An error occurred',
      error: data.error,
      statusCode: response.status,
    } as ApiError & { statusCode: number };
  }

  return data as T;
};

/**
 * Get all medicines
 */
export const getAllMedicines = async (): Promise<MedicineResponse> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<MedicineResponse>(API_ENDPOINTS.MEDICINES.GET_ALL, {
    method: 'GET',
    headers: getAuthHeader() as HeadersInit,
  });
};

/**
 * Get medicine by ID
 */
export const getMedicineById = async (medicineId: string): Promise<MedicineResponse> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<MedicineResponse>(
    `${API_ENDPOINTS.MEDICINES.GET_BY_ID}/${medicineId}`,
    {
      method: 'GET',
      headers: getAuthHeader() as HeadersInit,
    }
  );
};

/**
 * Create medicine (Admin only)
 */
export const createMedicine = async (
  data: CreateMedicineRequest
): Promise<MedicineResponse> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  const formData = new FormData();
  formData.append('medicineName', data.medicineName);
  formData.append('batchNumber', data.batchNumber);
  formData.append('category', data.category);
  formData.append('manufacturer', data.manufacturer);
  formData.append('quantity', data.quantity.toString());
  formData.append('price', data.price.toString());
  formData.append('expiryDate', data.expiryDate);
  if (data.description) {
    formData.append('description', data.description);
  }
  if (data.image) {
    formData.append('image', data.image);
  }

  const url = getApiUrl(API_ENDPOINTS.MEDICINES.CREATE);
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeader() as HeadersInit,
    body: formData,
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw {
      status: responseData.status || 'error',
      message: responseData.message || 'An error occurred',
      error: responseData.error,
      statusCode: response.status,
    } as ApiError & { statusCode: number };
  }

  return responseData as MedicineResponse;
};

/**
 * Update medicine (Admin only)
 */
export const updateMedicine = async (
  medicineId: string,
  data: Partial<CreateMedicineRequest>
): Promise<MedicineResponse> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<MedicineResponse>(
    `${API_ENDPOINTS.MEDICINES.UPDATE}/${medicineId}`,
    {
      method: 'PUT',
      headers: getAuthHeader() as HeadersInit,
      body: JSON.stringify(data),
    }
  );
};

/**
 * Delete medicine (Admin only)
 */
export const deleteMedicine = async (medicineId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  const token = getToken();

  if (!token) {
    throw {
      status: 'error',
      message: 'No authentication token found',
      statusCode: 401,
    } as ApiError & { statusCode: number };
  }

  return apiRequest<{ success: boolean; message: string }>(
    `${API_ENDPOINTS.MEDICINES.DELETE}/${medicineId}`,
    {
      method: 'DELETE',
      headers: getAuthHeader() as HeadersInit,
    }
  );
};

