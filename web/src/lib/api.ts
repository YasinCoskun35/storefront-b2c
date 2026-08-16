import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";

// Determine if we're running on the server or client
const isServer = typeof window === "undefined";

// API base URL. On the server use the internal/container URL (API_URL); in the
// browser use the public API origin (NEXT_PUBLIC_API_URL). Both fall back to
// localhost for local development.
const API_BASE_URL = isServer
  ? process.env.API_URL || "http://localhost:8080"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Important for HttpOnly cookies
});

// Attach the JWT access token (stored at login) to authenticated requests.
// The backend uses Bearer authentication, so admin endpoints 401 without this.
api.interceptors.request.use((config) => {
  if (!isServer) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// --- Automatic access-token refresh on 401 -------------------------------
// A single in-flight refresh is shared by all requests that 401 at once, so we
// only hit the refresh endpoint once and then replay the queued requests.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      return data.accessToken as string;
    }
    return null;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/refresh") || url.includes("/auth/login");

    // Only try to recover browser requests that failed with 401 exactly once.
    if (
      isServer ||
      !original ||
      original._retry ||
      isAuthCall ||
      error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    // Share one refresh across all concurrent 401s.
    refreshPromise = refreshPromise ?? refreshAccessToken();
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (!newToken) {
      // Refresh failed — clear session and send the user to login.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  }
);

// API Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  stockStatus: string;
  quantity: number;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  isActive: boolean;
  isFeatured: boolean;
  primaryImageUrl?: string;
  createdAt: string;
}

export interface ProductDetail extends Product {
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  weightUnit?: string;
  images: ProductImage[];
}

export interface ProductImage {
  id: string;
  url: string;
  type: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  featuredImage?: string;
  author?: string;
  publishedAt?: string;
  viewCount: number;
  category?: string;
}

export interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  body: string;
  featuredImage?: string;
  author?: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  tags?: string;
  category?: string;
  createdAt: string;
}

export interface StaticPage {
  id: string;
  title: string;
  slug: string;
  body: string;
  isPublished: boolean;
}

// Product Create/Update Types
export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  compareAtPrice?: number;
  stockStatus: string;
  quantity: number;
  categoryId: string;
  brandId?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

// Category Create/Update Types
export interface CreateCategoryDto {
  name: string;
  description?: string;
  slug?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

// API Client Methods
export const catalogApi = {
  searchProducts: async (params: {
    searchTerm?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PagedResult<Product>> => {
    const response = await api.get("/api/catalog/products", { params });
    return response.data;
  },

  getProductById: async (id: string): Promise<ProductDetail> => {
    const response = await api.get(`/api/catalog/products/${id}`);
    return response.data;
  },

  createProduct: async (product: CreateProductDto): Promise<{ id: string }> => {
    const response = await api.post("/api/catalog/products", product);
    return response.data;
  },

  updateProduct: async (
    id: string,
    product: CreateProductDto
  ): Promise<{ id: string }> => {
    const response = await api.put(`/api/catalog/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/api/catalog/products/${id}`);
  },

  uploadProductImage: async (
    productId: string,
    file: File,
    isPrimary: boolean = false
  ): Promise<{ message: string; fileName: string }> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/api/catalog/products/${productId}/images?isPrimary=${isPrimary}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  getCategories: async (parentId?: string): Promise<Category[]> => {
    const response = await api.get("/api/catalog/categories", {
      params: { parentId },
    });
    return response.data;
  },

  // Returns categories at every level (roots + subcategories). Used by the
  // mega menu and admin. `includeInactive` also returns hidden categories.
  getAllCategories: async (opts?: {
    includeInactive?: boolean;
  }): Promise<Category[]> => {
    const response = await api.get("/api/catalog/categories", {
      params: { all: true, includeInactive: opts?.includeInactive ?? false },
    });
    return response.data;
  },

  createCategory: async (category: CreateCategoryDto): Promise<{ id: string }> => {
    const response = await api.post("/api/catalog/categories", category);
    return response.data;
  },

  updateCategory: async (
    id: string,
    category: CreateCategoryDto
  ): Promise<{ id: string }> => {
    const response = await api.put(`/api/catalog/categories/${id}`, category);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/api/catalog/categories/${id}`);
  },
};

// Admin user management
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export const usersApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get("/api/identity/users");
    return response.data;
  },
  createUser: async (user: CreateUserDto): Promise<AdminUser> => {
    const response = await api.post("/api/identity/users", user);
    return response.data;
  },
  setStatus: async (id: string, isActive: boolean): Promise<void> => {
    await api.put(`/api/identity/users/${id}/status`, { isActive });
  },
};

export const contentApi = {
  getBlogPosts: async (params: {
    category?: string;
    tag?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PagedResult<BlogPostSummary>> => {
    const response = await api.get("/api/content/blog", { params });
    return response.data;
  },

  getPageBySlug: async (slug: string): Promise<StaticPage> => {
    const response = await api.get(`/api/content/pages/${slug}`);
    return response.data;
  },
};

// Store settings + homepage slider
export interface SliderSlide {
  imageUrl: string;
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

export interface StoreSettings {
  storeName: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  whatsAppNumber?: string;
  whatsAppMessage?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  logoUrl?: string;
  slides: SliderSlide[];
}

export const settingsApi = {
  get: async (): Promise<StoreSettings> => {
    const response = await api.get("/api/content/settings");
    return response.data;
  },

  update: async (settings: StoreSettings): Promise<StoreSettings> => {
    const response = await api.put("/api/content/settings", settings);
    return response.data;
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/api/content/settings/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/api/identity/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post("/api/identity/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },
};

