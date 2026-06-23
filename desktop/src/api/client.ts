const BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    // Try to parse body as JSON, fallback to empty object
    let json: any = {};
    try {
      const text = await res.text();
      if (text) json = JSON.parse(text);
    } catch {}

    if (!res.ok) {
      throw new Error(json.message || `请求失败(${res.status})`);
    }

    // Wrap API response: {code, data, message} -> return data or whole object
    return json.data !== undefined && json.code !== undefined ? json.data : json;
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body?: any) { return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }); }
  put<T>(path: string, body?: any) { return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) }); }
  delete<T>(path: string) { return this.request<T>(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();
