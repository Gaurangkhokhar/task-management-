const API_BASE_URL = '/api';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name?: string;
  };
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
    return null;
  }

  async request(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = { ...this.getAuthHeaders(), ...(options.headers as Record<string, string>) };
    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (response.status === 401) {
      // Try to refresh token
      const newToken = await this.refreshToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        return fetch(`${API_BASE_URL}${url}`, { ...options, headers });
      } else {
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
    }

    return response;
  }

  // Auth methods
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  }

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Task methods
  async getTasks(page = 1, limit = 10, status?: string, priority?: string, search?: string): Promise<{ tasks: Task[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (search) params.append('search', search);

    const response = await this.request(`/tasks?${params}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await this.request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  }

  async updateTask(id: number, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task> {
    const response = await this.request(`/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  }

  async deleteTask(id: number): Promise<void> {
    const response = await this.request(`/tasks/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete task');
  }

  async toggleTaskStatus(id: number): Promise<Task> {
    const response = await this.request(`/tasks/${id}/toggle`, { method: 'PATCH' });
    if (!response.ok) throw new Error('Failed to toggle task status');
    return response.json();
  }
}

export const api = new ApiService();
export type { Task };
