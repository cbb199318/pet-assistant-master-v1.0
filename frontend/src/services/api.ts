import axios, { type AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExpoGoProjectConfig } from 'expo';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';

const DEFAULT_API_PORT = process.env.EXPO_PUBLIC_API_PORT || '4317';

function resolveWebApiBaseUrl() {
  if (typeof window === 'undefined') {
    return `http://127.0.0.1:${DEFAULT_API_PORT}`;
  }

  const { protocol, hostname } = window.location;
  const webProtocol = protocol === 'https:' ? 'https:' : 'http:';
  const resolvedHost = hostname || '127.0.0.1';

  return `${webProtocol}//${resolvedHost}:${DEFAULT_API_PORT}`;
}

function extractHost(value?: string | null) {
  if (!value) {
    return '';
  }

  const normalizedValue = value
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/^exp:\/\//i, '')
    .replace(/\/.*$/, '');

  return normalizedValue.split(':')[0] || '';
}

function resolveNativeLanHost() {
  const nativeModules = NativeModules as any;
  const expoGoProjectConfig = getExpoGoProjectConfig();
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.experienceUrl,
    Constants.linkingUri,
    Constants.platform?.hostUri,
    expoGoProjectConfig?.debuggerHost,
    nativeModules?.SourceCode?.scriptURL,
    nativeModules?.PlatformConstants?.ServerHost,
  ];

  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (
      host &&
      host !== 'localhost' &&
      host !== '127.0.0.1' &&
      host !== '0.0.0.0'
    ) {
      return host;
    }
  }

  return '';
}

function resolveApiBaseUrl() {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (Platform.OS === 'web') {
    return resolveWebApiBaseUrl();
  }

  const nativeLanHost = resolveNativeLanHost();
  if (nativeLanHost) {
    return `http://${nativeLanHost}:${DEFAULT_API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}`;
  }

  return `http://127.0.0.1:${DEFAULT_API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export function getApiDiagnostics() {
  const nativeModules = NativeModules as any;
  const expoGoProjectConfig = getExpoGoProjectConfig();

  return {
    platform: Platform.OS,
    apiBaseUrl: API_BASE_URL,
    expoConfigHostUri: Constants.expoConfig?.hostUri || '',
    experienceUrl: Constants.experienceUrl || '',
    linkingUri: Constants.linkingUri || '',
    platformHostUri: Constants.platform?.hostUri || '',
    expoDebuggerHost: expoGoProjectConfig?.debuggerHost || '',
    sourceCodeScriptURL: nativeModules?.SourceCode?.scriptURL || '',
    platformServerHost: nativeModules?.PlatformConstants?.ServerHost || '',
  };
}

export interface AiConversationMessage {
  role: 'user' | 'assistant';
  type: 'text' | 'image' | 'audio';
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  responseAudioUrl?: string;
}

export interface PetSummary {
  id: number;
  name: string;
  species: string;
  breed?: string | null;
  gender?: 'male' | 'female' | null;
  birthday?: string | null;
  sterilized: boolean;
  avatar?: string | null;
}

export interface AiConversationSummary {
  id: number;
  title: string;
  messageCount: number;
  lastMessagePreview: string;
  pet?: PetSummary | null;
  updated_at: string;
  created_at: string;
}

export interface AiConversationDetail {
  id: number;
  title: string;
  pet?: PetSummary | null;
  messages: AiConversationMessage[];
  created_at: string;
  updated_at: string;
}

export function resolveMediaUrl(path?: string) {
  if (!path) {
    return '';
  }

  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith('data:') ||
    path.startsWith('file:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器，添加token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('lastRoute');
    }
    return Promise.reject(error);
  },
);

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}

export function getApiErrorMessage(error: any, fallback: string): string {
  return error?.response?.data?.message || error?.message || fallback;
}

interface AuthUser {
  id: number;
  phone: string;
  nickname: string;
  avatar?: string;
  email?: string;
  created_at?: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface UserProfileResponse {
  user: AuthUser;
}

interface MessageResponse {
  message: string;
}

export const authApi = {
  login: (data: { phone: string; password: string }) =>
    request<AuthResponse>({
      url: '/api/users/login',
      method: 'POST',
      data,
    }),

  register: (data: { phone: string; password: string; nickname: string }) =>
    request<AuthResponse>({
      url: '/api/users/register',
      method: 'POST',
      data,
    }),
};

export const userApi = {
  getProfile: () =>
    request<UserProfileResponse>({
      url: '/api/users/profile',
      method: 'GET',
    }),

  updateUser: (data: { nickname: string; avatar: string }) =>
    request<UserProfileResponse>({
      url: '/api/users/update',
      method: 'PUT',
      data,
    }),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request<MessageResponse>({
      url: '/api/users/change-password',
      method: 'PUT',
      data,
    }),

  bindEmail: (data: { email: string }) =>
    request<MessageResponse>({
      url: '/api/users/bind-email',
      method: 'PUT',
      data,
    }),
};

export const petApi = {
  getPets: () =>
    request<PetSummary[]>({
      url: '/api/pets',
      method: 'GET',
    }),

  createPet: (data: any) =>
    request<any>({
      url: '/api/pets',
      method: 'POST',
      data,
    }),

  updatePet: (id: number, data: any) =>
    request<any>({
      url: `/api/pets/${id}`,
      method: 'PUT',
      data,
    }),

  deletePet: (id: number) =>
    request<any>({
      url: `/api/pets/${id}`,
      method: 'DELETE',
    }),
};

export const healthApi = {
  getVaccinations: (petId: number) =>
    request<any[]>({
      url: `/api/health/vaccinations/${petId}`,
      method: 'GET',
    }),

  createVaccination: (data: any) =>
    request<any>({
      url: '/api/health/vaccinations',
      method: 'POST',
      data,
    }),

  updateVaccination: (id: number, data: any) =>
    request<any>({
      url: `/api/health/vaccinations/${id}`,
      method: 'PUT',
      data,
    }),

  deleteVaccination: (id: number, pet_id: number) =>
    request<any>({
      url: `/api/health/vaccinations/${id}`,
      method: 'DELETE',
      data: { pet_id },
    }),

  getDewormings: (petId: number) =>
    request<any[]>({
      url: `/api/health/dewormings/${petId}`,
      method: 'GET',
    }),

  createDeworming: (data: any) =>
    request<any>({
      url: '/api/health/dewormings',
      method: 'POST',
      data,
    }),

  updateDeworming: (id: number, data: any) =>
    request<any>({
      url: `/api/health/dewormings/${id}`,
      method: 'PUT',
      data,
    }),

  deleteDeworming: (id: number, pet_id: number) =>
    request<any>({
      url: `/api/health/dewormings/${id}`,
      method: 'DELETE',
      data: { pet_id },
    }),

  getCheckups: (petId: number) =>
    request<any[]>({
      url: `/api/health/checkups/${petId}`,
      method: 'GET',
    }),

  createCheckup: (data: any) =>
    request<any>({
      url: '/api/health/checkups',
      method: 'POST',
      data,
    }),

  updateCheckup: (id: number, data: any) =>
    request<any>({
      url: `/api/health/checkups/${id}`,
      method: 'PUT',
      data,
    }),

  deleteCheckup: (id: number, pet_id: number) =>
    request<any>({
      url: `/api/health/checkups/${id}`,
      method: 'DELETE',
      data: { pet_id },
    }),
};

export const careApi = {
  getCares: (petId: number) =>
    request<any[]>({
      url: `/api/care/pet/${petId}`,
      method: 'GET',
    }),

  createCare: (data: any) =>
    request<any>({
      url: '/api/care',
      method: 'POST',
      data,
    }),

  updateCare: (id: number, data: any) =>
    request<any>({
      url: `/api/care/${id}`,
      method: 'PUT',
      data,
    }),

  deleteCare: (id: number) =>
    request<any>({
      url: `/api/care/${id}`,
      method: 'DELETE',
    }),
};

export const communityApi = {
  getPosts: (params?: { limit?: number; offset?: number }) =>
    request<any[]>({
      url: '/api/community/posts',
      method: 'GET',
      params,
    }),

  getMyPosts: () =>
    request<any[]>({
      url: '/api/community/my-posts',
      method: 'GET',
    }),

  createPost: (data: { title: string; content: string; image?: string }) =>
    request<any>({
      url: '/api/community/posts',
      method: 'POST',
      data,
    }),

  updatePost: (id: number, data: { title?: string; content?: string; image?: string }) =>
    request<any>({
      url: `/api/community/posts/${id}`,
      method: 'PUT',
      data,
    }),

  deletePost: (id: number) =>
    request<any>({
      url: `/api/community/posts/${id}`,
      method: 'DELETE',
    }),

  getPostDetail: (id: number) =>
    request<any>({
      url: `/api/community/posts/${id}`,
      method: 'GET',
    }),

  likePost: (id: number) =>
    request<any>({
      url: `/api/community/posts/${id}/like`,
      method: 'POST',
    }),

  getComments: (postId: number) =>
    request<any[]>({
      url: `/api/community/posts/${postId}/comments`,
      method: 'GET',
    }),

  getMyComments: () =>
    request<any[]>({
      url: '/api/community/my-comments',
      method: 'GET',
    }),

  createComment: (data: { postId: number; content: string }) =>
    request<any>({
      url: '/api/community/comments',
      method: 'POST',
      data,
    }),

  deleteComment: (id: number) =>
    request<any>({
      url: `/api/community/comments/${id}`,
      method: 'DELETE',
    }),
};

export const knowledgeApi = {
  getCategories: () =>
    request<any[]>({
      url: '/api/knowledge/categories',
      method: 'GET',
    }),

  getArticles: (params?: { limit?: number; offset?: number }) =>
    request<any[]>({
      url: '/api/knowledge/articles',
      method: 'GET',
      params,
    }),

  getRecommendedArticles: (params?: { limit?: number }) =>
    request<any[]>({
      url: '/api/knowledge/recommended',
      method: 'GET',
      params,
    }),

  searchArticles: (keyword: string, limit?: number) =>
    request<any[]>({
      url: '/api/knowledge/search',
      method: 'GET',
      params: { keyword, limit },
    }),

  getArticlesByCategory: (categoryId: number, params?: { limit?: number; offset?: number }) =>
    request<any[]>({
      url: `/api/knowledge/categories/${categoryId}/articles`,
      method: 'GET',
      params,
    }),

  getArticleDetail: (id: number) =>
    request<any>({
      url: `/api/knowledge/articles/${id}`,
      method: 'GET',
    }),

  likeArticle: (id: number) =>
    request<any>({
      url: `/api/knowledge/articles/${id}/like`,
      method: 'POST',
    }),

  favoriteArticle: (id: number) =>
    request<any>({
      url: `/api/knowledge/articles/${id}/favorite`,
      method: 'POST',
    }),
};

export const aiApi = {
  chat: (data: {
    messages: AiConversationMessage[];
    conversationId?: number;
    petId?: number;
  }) =>
    request<{ response: string; conversationId: number; responseAudioUrl?: string }>({
      url: '/api/ai/chat',
      method: 'POST',
      data,
    }),

  analyzeImage: (data: FormData) =>
    request<{ response: string; conversationId: number; imageUrl: string }>({
      url: '/api/ai/image/analyze',
      method: 'POST',
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  chatWithAudio: (data: FormData) =>
    request<{ response: string; transcript: string; conversationId: number; audioUrl: string; responseAudioUrl?: string }>({
      url: '/api/ai/audio/chat',
      method: 'POST',
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getConversations: () =>
    request<AiConversationSummary[]>({
      url: '/api/ai/conversations',
      method: 'GET',
    }),

  getConversationDetail: (id: number) =>
    request<AiConversationDetail>({
      url: `/api/ai/conversations/${id}`,
      method: 'GET',
    }),

  deleteConversation: (id: number) =>
    request<any>({
      url: `/api/ai/conversations/${id}`,
      method: 'DELETE',
    }),
};

export default api;
