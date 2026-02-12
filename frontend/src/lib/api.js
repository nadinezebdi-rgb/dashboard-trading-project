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

  // Calendar & Analytics
  async getCalendarData(year, month) {
    return this.request(`/api/trades/calendar/${year}/${month}`);
  }

  async getDurationStats() {
    return this.request('/api/trades/duration-stats');
  }

  // Economic Journal
  async getEconomicEvents() {
    return this.request('/api/economic/events');
  }

  async analyzeEconomicEvent(eventId) {
    return this.request('/api/economic/analyze', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId })
    });
  }

  async getMarketSentiment() {
    return this.request('/api/economic/market-sentiment');
  }

  // Tickets
  async getTickets() {
    return this.request('/api/tickets');
  }

  async getTicket(ticketId) {
    return this.request(`/api/tickets/${ticketId}`);
  }

  async createTicket(data) {
    return this.request('/api/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async replyToTicket(ticketId, message) {
    return this.request(`/api/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async closeTicket(ticketId) {
    return this.request(`/api/tickets/${ticketId}/close`, {
      method: 'PUT'
    });
  }

  // Community
  async getCommunityPosts(category = 'all', limit = 20, skip = 0) {
    const params = new URLSearchParams({ limit, skip });
    if (category && category !== 'all') {
      params.append('category', category);
    }
    return this.request(`/api/community/posts?${params}`);
  }

  async getPostDetail(postId) {
    return this.request(`/api/community/posts/${postId}`);
  }

  async createPost(data) {
    return this.request('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addComment(postId, content) {
    return this.request(`/api/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  async togglePostLike(postId) {
    return this.request(`/api/community/posts/${postId}/like`, {
      method: 'POST'
    });
  }

  async toggleCommentLike(commentId) {
    return this.request(`/api/community/comments/${commentId}/like`, {
      method: 'POST'
    });
  }

  async deletePost(postId) {
    return this.request(`/api/community/posts/${postId}`, {
      method: 'DELETE'
    });
  }

  async getUserProfile(userId) {
    return this.request(`/api/community/user/${userId}`);
  }
}

export const api = new ApiClient();