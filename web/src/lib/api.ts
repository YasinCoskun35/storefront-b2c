import axios, { AxiosInstance } from "axios";

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
  price: number;
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

  createCategory: async (category: CreateCategoryDto): Promise<{ id: string }> => {
    const response = await api.post("/api/catalog/categories", category);
    return response.data;
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

