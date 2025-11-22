import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config';

export interface Document {
  id: string;
  title: string;
  content: string;
  logline?: string;
  authorId: string;
  createdAt: any;
  lastModified: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const config = getConfig();
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const { token } = getConfig();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async verifyToken(token: string): Promise<ApiResponse<{ userId: string }>> {
    const response = await this.client.post('/api/cli/auth/verify', { token });
    return response.data;
  }

  async listDocuments(): Promise<ApiResponse<Document[]>> {
    const response = await this.client.get('/api/cli/documents');
    return response.data;
  }

  async getDocument(documentId: string): Promise<ApiResponse<Document>> {
    const response = await this.client.get(`/api/cli/documents/${documentId}`);
    return response.data;
  }

  async createDocument(
    title: string,
    content?: string,
    logline?: string
  ): Promise<ApiResponse<Document>> {
    const response = await this.client.post('/api/cli/documents', {
      title,
      content,
      logline,
    });
    return response.data;
  }

  async updateDocument(
    documentId: string,
    updates: Partial<Document>
  ): Promise<ApiResponse<Document>> {
    const response = await this.client.patch(
      `/api/cli/documents/${documentId}`,
      updates
    );
    return response.data;
  }

  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/api/cli/documents/${documentId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
