const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  constructor() {
    this.token = null;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erreur serveur' }));
      throw new Error(error.detail || 'Erreur serveur');
    }

    return response.json();
  }

  // Auth
  async register(data) {
    const result = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(result.token);
    return result;
  }

  async login(data) {
    const result = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    this.setToken(result.token);
    return result;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  logout() {
    this.clearToken();
  }

  // Questionnaire
  async saveQuestionnaire(data) {
    return this.request('/api/users/questionnaire', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Trades
  async getTrades(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/trades${query ? `?${query}` : ''}`);
  }

  async createTrade(data) {
    return this.request('/api/trades', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getTradeStats() {
    return this.request('/api/trades/stats');
  }

  async getHeatmapData() {
    return this.request('/api/trades/heatmap');
  }

  // AI
  async analyzeSetup(data) {
    return this.request('/api/ai/analyze-setup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCoaching(message, context = 'coaching') {
    return this.request('/api/ai/coaching', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    });
  }

  async getDailyBriefing() {
    return this.request('/api/ai/daily-briefing');
  }

  // Payments
  async getPlans() {
    return this.request('/api/payments/plans');
  }

  async createCheckout(plan) {
    return this.request('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan, origin_url: window.location.origin })
    });
  }

  async getPaymentStatus(sessionId) {
    return this.request(`/api/payments/status/${sessionId}`);
  }
}

export const api = new ApiClient();