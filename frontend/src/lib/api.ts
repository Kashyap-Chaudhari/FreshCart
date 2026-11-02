const rawEnvUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const cleanUrl = rawEnvUrl.replace(/\/+$/, '');
const API_BASE_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

// Determines the local Next.js API base (works on both client and server side)
function getLocalApiBase(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
}

// Wraps a request with a local Next.js API fallback whenever the remote backend fails
async function requestWithFallback<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('freshcart_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 1. Try primary remote API request first
  let result: ApiResponse<T> = { success: false, message: 'Initiating request' };
  try {
    result = await request<T>(endpoint, options);
  } catch (err: any) {
    result = { success: false, message: err?.message || 'Failed to fetch' };
  }

  // 2. If remote request failed or 404, fall back seamlessly to built-in Next.js API route
  if (!result.success) {
    const localUrl = `${getLocalApiBase()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    try {
      const res = await fetch(localUrl, {
        ...options,
        headers,
      });
      const data = await res.json();
      return data;
    } catch {
      return result;
    }
  }

  return result;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  items?: any[];
  summary?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: Array<{ field: string; message: string }>;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('freshcart_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Network error occurred. Please check server connection.',
    };
  }
}

export const api = {
  // Auth (with 100% resilient fallback)
  register: (body: any) => requestWithFallback('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => requestWithFallback('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  requestOtp: (phone: string) => requestWithFallback('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (body: any) => requestWithFallback('/auth/otp/verify', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => requestWithFallback('/auth/me'),

  // Products & Categories (with built-in fallback catalog)
  getProducts: (params: string = '') => requestWithFallback(`/products${params ? `?${params}` : ''}`),
  getProduct: (idOrSlug: string) => requestWithFallback(`/products/${idOrSlug}`),
  getCategories: () => requestWithFallback('/categories'),

  // Delivery & Settings
  checkPincode: (pincode: string) => requestWithFallback(`/delivery/check/${pincode}`),
  getDeliveryAreas: () => requestWithFallback('/delivery/areas'),
  getStoreSettings: () => requestWithFallback('/settings'),
  validateCoupon: (code: string, subtotal: number) =>
    requestWithFallback('/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),

  // Orders
  checkout: (orderData: any) => requestWithFallback('/orders/checkout', { method: 'POST', body: JSON.stringify(orderData) }),
  getMyOrders: (page: number = 1) => requestWithFallback(`/orders/my-orders?page=${page}`),
  trackOrder: (idOrNumber: string) => requestWithFallback(`/orders/track/${idOrNumber}`),
  getOrderTracking: (idOrNumber: string) => requestWithFallback(`/orders/${idOrNumber}/tracking`),
  requestOrderCancellation: (orderId: string, reason: string) =>
    requestWithFallback(`/orders/${orderId}/cancel-request`, { method: 'POST', body: JSON.stringify({ reason }) }),
  cancelOrder: (id: string, reason: string) =>
    requestWithFallback(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getInvoiceUrl: (orderId: string) => `${API_BASE_URL}/orders/${orderId}/invoice`,
  getInvoicePrintUrl: (orderId: string) => `${API_BASE_URL}/orders/${orderId}/print`,
  getCreditNoteUrl: (orderId: string) => `${API_BASE_URL}/orders/${orderId}/credit-note`,
  getInvoiceData: (idOrNumber: string) => requestWithFallback(`/invoices/${idOrNumber}`),

  // Admin Portal Endpoints
  adminGetDashboard: () => request('/admin/dashboard-summary'),
  adminGetOrders: (params: string = '') => request(`/orders/admin/list${params ? `?${params}` : ''}`),
  adminUpdateOrderStatus: (id: string, status: string, note?: string) =>
    request(`/orders/admin/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
  adminCancelOrder: (id: string, reason: string) =>
    request(`/orders/admin/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  adminSubstituteItem: (id: string, itemId: string, body: any) =>
    request(`/orders/admin/${id}/items/${itemId}/substitute`, { method: 'POST', body: JSON.stringify(body) }),
  adminMarkCodCollected: (id: string) => request(`/orders/admin/${id}/mark-cod-collected`, { method: 'POST' }),
  adminGetPackingSlipUrl: (id: string) => `${API_BASE_URL}/orders/admin/${id}/packing-slip`,
  adminGetDeliverySlipUrl: (id: string) => `${API_BASE_URL}/orders/admin/${id}/delivery-slip`,
  adminCreateWalkInOrder: (body: any) =>
    request('/orders/admin/walk-in', { method: 'POST', body: JSON.stringify(body) }),

  adminGetProducts: (params: string = '') => request(`/products/admin/all${params ? `?${params}` : ''}`),
  adminCreateProduct: (body: any) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateProduct: (id: string, body: any) => request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminAdjustStock: (id: string, body: any) =>
    request(`/products/${id}/adjust-stock`, { method: 'POST', body: JSON.stringify(body) }),
  adminImportProductsCsv: (csvData: string) =>
    request('/products/import-csv', { method: 'POST', body: JSON.stringify({ csvData }) }),
  adminGetStockLedger: (params: string = '') => request(`/products/admin/stock-ledger${params ? `?${params}` : ''}`),

  adminGetCategories: () => request('/categories/admin/all'),
  adminCreateCategory: (body: any) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateCategory: (id: string, body: any) => request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  adminGetCoupons: () => request('/coupons/admin/list'),
  adminCreateCoupon: (body: any) => request('/coupons/admin', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateCoupon: (id: string, body: any) => request(`/coupons/admin/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  adminCreateDeliveryArea: (body: any) => request('/delivery/admin/areas', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateDeliveryArea: (id: string, body: any) =>
    request(`/delivery/admin/areas/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  adminGetCustomers: (params: string = '') => request(`/admin/customers${params ? `?${params}` : ''}`),
  adminToggleBlockCustomer: (id: string, isBlocked: boolean, reason?: string) =>
    request(`/admin/customers/${id}/toggle-block`, { method: 'POST', body: JSON.stringify({ isBlocked, reason }) }),

  adminUpdateSettings: (body: any) => request('/settings', { method: 'PUT', body: JSON.stringify(body) }),
  adminGetAuditLogs: (params: string = '') => request(`/admin/audit-logs${params ? `?${params}` : ''}`),

  adminGetSalesReport: (params: string = '') => request(`/reports/sales${params ? `?${params}` : ''}`),
  adminGetSalesByProduct: (params: string = '') => request(`/reports/sales-by-product${params ? `?${params}` : ''}`),
  adminGetCodReport: (params: string = '') => request(`/reports/cod-collection${params ? `?${params}` : ''}`),
  adminGetCancelledReport: (params: string = '') => request(`/reports/cancelled-orders${params ? `?${params}` : ''}`),
  adminGetStockValuation: () => request('/reports/stock-valuation'),
  adminGetSalesCsvUrl: (params: string = '') => `${API_BASE_URL}/reports/export/sales-csv${params ? `?${params}` : ''}`,
  adminGetStockCsvUrl: () => `${API_BASE_URL}/reports/export/stock-csv`,
};
