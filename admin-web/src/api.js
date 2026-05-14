import axios from 'axios';

const DEFAULT_API_PORT = import.meta.env.VITE_API_PORT || '4317';

function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const { protocol, hostname } = window.location;
  const webProtocol = protocol === 'https:' ? 'https:' : 'http:';
  const resolvedHost = hostname || '127.0.0.1';

  return `${webProtocol}//${resolvedHost}:${DEFAULT_API_PORT}`;
}

const API_BASE_URL = resolveApiBaseUrl();
const TOKEN_KEY = 'pet_assistant_admin_token';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getAdminToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

client.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAdminToken('');
    }
    return Promise.reject(error);
  },
);

function unwrapMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export const adminApi = {
  getBaseUrl: () => API_BASE_URL,
  login: async (payload) => {
    const response = await client.post('/api/admin/auth/login', payload);
    return response.data;
  },
  profile: async () => {
    const response = await client.get('/api/admin/auth/profile');
    return response.data;
  },
  getOverview: async () => {
    const response = await client.get('/api/admin/dashboard/overview');
    return response.data;
  },
  getDashboardTrends: async () => {
    const response = await client.get('/api/admin/dashboard/trends');
    return response.data;
  },
  getAdminUsers: async (params) => {
    const response = await client.get('/api/admin/admin-users', { params });
    return response.data;
  },
  createAdminUser: async (payload) => {
    const response = await client.post('/api/admin/admin-users', payload);
    return response.data;
  },
  updateAdminUserRole: async (id, role) => {
    const response = await client.put(`/api/admin/admin-users/${id}/role`, { role });
    return response.data;
  },
  updateAdminUserStatus: async (id, status) => {
    const response = await client.put(`/api/admin/admin-users/${id}/status`, { status });
    return response.data;
  },
  resetAdminUserPassword: async (id, password) => {
    const response = await client.put(`/api/admin/admin-users/${id}/reset-password`, { password });
    return response.data;
  },
  getUsers: async (params) => {
    const response = await client.get('/api/admin/users', { params });
    return response.data;
  },
  getUserDetail: async (id) => {
    const response = await client.get(`/api/admin/users/${id}`);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await client.delete(`/api/admin/users/${id}`);
    return response.data;
  },
  getPosts: async (params) => {
    const response = await client.get('/api/admin/content/posts', { params });
    return response.data;
  },
  getPostDetail: async (id) => {
    const response = await client.get(`/api/admin/content/posts/${id}`);
    return response.data;
  },
  deletePost: async (id) => {
    const response = await client.delete(`/api/admin/content/posts/${id}`);
    return response.data;
  },
  updatePostStatus: async (id, status) => {
    const response = await client.put(`/api/admin/content/posts/${id}/status`, { status });
    return response.data;
  },
  getComments: async (params) => {
    const response = await client.get('/api/admin/content/comments', { params });
    return response.data;
  },
  getCommentDetail: async (id) => {
    const response = await client.get(`/api/admin/content/comments/${id}`);
    return response.data;
  },
  deleteComment: async (id) => {
    const response = await client.delete(`/api/admin/content/comments/${id}`);
    return response.data;
  },
  updateCommentStatus: async (id, status) => {
    const response = await client.put(`/api/admin/content/comments/${id}/status`, { status });
    return response.data;
  },
  getCategories: async (params) => {
    const response = await client.get('/api/admin/content/categories', { params });
    return response.data;
  },
  getCategoryDetail: async (id) => {
    const response = await client.get(`/api/admin/content/categories/${id}`);
    return response.data;
  },
  createCategory: async (payload) => {
    const response = await client.post('/api/admin/content/categories', payload);
    return response.data;
  },
  updateCategory: async (id, payload) => {
    const response = await client.put(`/api/admin/content/categories/${id}`, payload);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await client.delete(`/api/admin/content/categories/${id}`);
    return response.data;
  },
  getArticles: async (params) => {
    const response = await client.get('/api/admin/content/articles', { params });
    return response.data;
  },
  getArticleDetail: async (id) => {
    const response = await client.get(`/api/admin/content/articles/${id}`);
    return response.data;
  },
  createArticle: async (payload) => {
    const response = await client.post('/api/admin/content/articles', payload);
    return response.data;
  },
  updateArticle: async (id, payload) => {
    const response = await client.put(`/api/admin/content/articles/${id}`, payload);
    return response.data;
  },
  deleteArticle: async (id) => {
    const response = await client.delete(`/api/admin/content/articles/${id}`);
    return response.data;
  },
  getOrders: async (params) => {
    const response = await client.get('/api/admin/orders', { params });
    return response.data;
  },
  getOrderDetail: async (id) => {
    const response = await client.get(`/api/admin/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id, status) => {
    const response = await client.put(`/api/admin/orders/${id}/status`, { status });
    return response.data;
  },
  getProducts: async (params) => {
    const response = await client.get('/api/admin/products', { params });
    return response.data;
  },
  getProductDetail: async (id) => {
    const response = await client.get(`/api/admin/products/${id}`);
    return response.data;
  },
  uploadProductCover: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await client.post('/api/admin/products/cover-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  createProduct: async (payload) => {
    const response = await client.post('/api/admin/products', payload);
    return response.data;
  },
  updateProduct: async (id, payload) => {
    const response = await client.put(`/api/admin/products/${id}`, payload);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await client.delete(`/api/admin/products/${id}`);
    return response.data;
  },
  getSystemSettings: async () => {
    const response = await client.get('/api/admin/system/settings');
    return response.data;
  },
  updateSystemSetting: async (key, payload) => {
    const response = await client.put(`/api/admin/system/settings/${key}`, payload);
    return response.data;
  },
  getAuditLogs: async (params) => {
    const response = await client.get('/api/admin/audit-logs', { params });
    return response.data;
  },
  getErrorMessage: unwrapMessage,
};
