const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  order?: any;
  items?: any[];
  summary?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errors?: Array<{ field: string; message: string }>;
  [key: string]: any;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('freshcart_admin_token') : null;

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
  // Authentication
  login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/auth/me'),

  // Dashboard
  adminGetDashboard: () => request('/admin/dashboard-summary'),

  // Orders
  trackOrder: (idOrNumber: string) => request(`/orders/track/${idOrNumber}`),
  adminGetOrders: (params: string = '') => request(`/orders/admin/list${params ? `?${params}` : ''}`),
  adminGetOrder: (idOrNumber: string) => request(`/orders/track/${idOrNumber}`),
  adminGetOrderCounters: () => request('/admin/orders/counters'),
  adminUpdateOrderStatus: (id: string, status: string, note?: string) =>
    request(`/orders/admin/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
  adminUpdateDelivery: (id: string, body: any) =>
    request(`/orders/admin/${id}/delivery`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminReviewCancellation: (id: string, action: 'APPROVE' | 'REJECT', note?: string) =>
    request(`/orders/admin/${id}/cancellation-review`, { method: 'POST', body: JSON.stringify({ action, note }) }),
  adminCancelOrder: (id: string, reason: string) =>
    request(`/orders/admin/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  adminSubstituteItem: (id: string, itemId: string, body: any) =>
    request(`/orders/admin/${id}/items/${itemId}/substitute`, { method: 'POST', body: JSON.stringify(body) }),
  adminMarkCodCollected: (id: string) => request(`/orders/admin/${id}/mark-cod-collected`, { method: 'POST' }),
  adminCreateWalkInOrder: (body: any) =>
    request('/orders/admin/walk-in', { method: 'POST', body: JSON.stringify(body) }),
  adminGetNotifications: () => request('/admin/notifications'),
  adminMarkNotificationsRead: () => request('/admin/notifications/mark-read', { method: 'PATCH' }),
  adminGetPackingSlipUrl: (id: string) => `${API_BASE_URL}/orders/admin/${id}/packing-slip`,
  adminGetDeliverySlipUrl: (id: string) => `${API_BASE_URL}/orders/admin/${id}/delivery-slip`,
  adminGetInvoiceUrl: (id: string) => `${API_BASE_URL}/orders/${id}/invoice`,
  getInvoiceUrl: (id: string) => `${API_BASE_URL}/orders/${id}/invoice`,

  // GST Tax Invoices & Credit Notes Management
  adminGetInvoices: (params: string = '') => request(`/invoices${params ? `?${params}` : ''}`),
  adminGetInvoiceStats: () => request('/invoices/stats'),
  adminGetInvoiceData: (id: string) => request(`/invoices/${id}`),
  adminGetInvoicePdfUrl: (id: string) => `${API_BASE_URL}/invoices/${id}/pdf`,
  adminGetInvoicePrintUrl: (id: string) => `${API_BASE_URL}/invoices/${id}/print`,
  adminGetCreditNotes: (params: string = '') => request(`/invoices/credit-notes${params ? `?${params}` : ''}`),
  adminIssueCreditNote: (id: string, body: any) =>
    request(`/invoices/${id}/credit-note`, { method: 'POST', body: JSON.stringify(body) }),
  adminGetCreditNotePdfUrl: (id: string) => `${API_BASE_URL}/invoices/credit-notes/${id}/pdf`,

  // Inventory & Products
  getProducts: (params: string = '') => request(`/products/admin/all${params ? `?${params}` : ''}`),
  adminGetProducts: (params: string = '') => request(`/products/admin/all${params ? `?${params}` : ''}`),
  adminCreateProduct: (body: any) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateProduct: (id: string, body: any) => request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminAdjustStock: (id: string, body: any) =>
    request(`/products/${id}/adjust-stock`, { method: 'POST', body: JSON.stringify(body) }),
  adminImportProductsCsv: (csvData: string) =>
    request('/products/import-csv', { method: 'POST', body: JSON.stringify({ csvData }) }),
  adminGetStockLedger: (params: string = '') => request(`/products/admin/stock-ledger${params ? `?${params}` : ''}`),

  // Categories
  getCategories: () => request('/categories/admin/all'),
  adminGetCategories: () => request('/categories/admin/all'),
  adminCreateCategory: (body: any) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateCategory: (id: string, body: any) => request(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Coupons
  adminGetCoupons: () => request('/coupons/admin/list'),
  adminCreateCoupon: (body: any) => request('/coupons/admin', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateCoupon: (id: string, body: any) => request(`/coupons/admin/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Delivery Areas
  getDeliveryAreas: () => request('/delivery/areas'),
  adminGetDeliveryAreas: () => request('/delivery/areas'),
  adminCreateDeliveryArea: (body: any) => request('/delivery/admin/areas', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateDeliveryArea: (id: string, body: any) =>
    request(`/delivery/admin/areas/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Delivery Personnel Management
  adminGetDeliveryPersons: () => request('/admin/delivery-persons'),
  adminCreateDeliveryPerson: (body: any) => request('/admin/delivery-persons', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateDeliveryPerson: (id: string, body: any) => request(`/admin/delivery-persons/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminGetDeliveryPersonHistory: (id: string, filter?: string) => request(`/admin/delivery-persons/${id}/orders${filter ? `?filter=${filter}` : ''}`),
  adminAssignOrderDelivery: (orderId: string, deliveryPersonId: string) =>
    request(`/admin/orders/${orderId}/assign-delivery`, { method: 'POST', body: JSON.stringify({ deliveryPersonId }) }),
  adminAutoAssignOrderDelivery: (orderId: string) =>
    request(`/admin/orders/${orderId}/auto-assign-delivery`, { method: 'POST' }),

  // Customers
  adminGetCustomers: (params: string = '') => request(`/admin/customers${params ? `?${params}` : ''}`),
  adminToggleBlockCustomer: (id: string, isBlocked: boolean, reason?: string) =>
    request(`/admin/customers/${id}/toggle-block`, { method: 'POST', body: JSON.stringify({ isBlocked, reason }) }),

  // Settings
  getStoreSettings: () => request('/settings'),
  adminGetStoreSettings: () => request('/settings'),
  adminUpdateSettings: (body: any) => request('/settings', { method: 'PUT', body: JSON.stringify(body) }),

  // Audit Logs
  adminGetAuditLogs: (params: string = '') => request(`/admin/audit-logs${params ? `?${params}` : ''}`),

  // Reports
  adminGetSalesReport: (params: string = '') => request(`/reports/sales${params ? `?${params}` : ''}`),
  adminGetSalesByProduct: (params: string = '') => request(`/reports/sales-by-product${params ? `?${params}` : ''}`),
  adminGetCodReport: (params: string = '') => request(`/reports/cod-collection${params ? `?${params}` : ''}`),
  adminGetCancelledReport: (params: string = '') => request(`/reports/cancelled-orders${params ? `?${params}` : ''}`),
  adminGetStockValuation: () => request('/reports/stock-valuation'),
  adminGetSalesCsvUrl: (params: string = '') => `${API_BASE_URL}/reports/export/sales-csv${params ? `?${params}` : ''}`,
  adminGetStockCsvUrl: () => `${API_BASE_URL}/reports/export/stock-csv`,
};
