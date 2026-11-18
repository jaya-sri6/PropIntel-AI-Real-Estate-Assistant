import { ChatMessage, SourceCitation, AdminStats, Property, Project } from '../types';

const API_BASE = '/api';

export const api = {
  async uploadFile(file: File): Promise<{
    name: string;
    url: string;
    size: number;
    content_type: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload failed (${res.status}): ${err}`);
    }
    return res.json();
  },

  async sendMessage(
    message: string,
    conversationId?: string,
    sourceFilter: string = 'all',
    attachment?: { name: string; url: string }
  ): Promise<{
    answer: string;
    sources: SourceCitation[];
    conversation_id: string;
  }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        source_filter: sourceFilter,
        attachment_name: attachment?.name,
        attachment_url: attachment?.url
      })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Chat error (${res.status}): ${err}`);
    }
    return res.json();
  },

  async fetchStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async triggerScrape(adminKey: string, source: string = 'all'): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey
      },
      body: JSON.stringify({ source })
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Scrape error (${res.status}): ${err}`);
    }
    return res.json();
  },

  async fetchProperties(params: Record<string, string> = {}): Promise<{ total: number; items: Property[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/properties?${query}`);
    if (!res.ok) throw new Error('Failed to fetch properties');
    return res.json();
  },

  async fetchProjects(params: Record<string, string> = {}): Promise<{ total: number; items: Project[] }> {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/projects?${query}`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async fetchConversations(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversation history');
    return res.json();
  },

  async deleteConversation(conversationId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  async checkHealth(): Promise<{ status: string; version: string; model: string }> {
    const res = await fetch('/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  }
};
