/**
 * Openwork Web API - HTTP/WebSocket adapter
 * 
 * This module provides the same interface as the Electron accomplish API,
 * but communicates via HTTP and WebSocket for web environments.
 */

import type {
  Task,
  TaskConfig,
  TaskUpdateEvent,
  TaskStatus,
  PermissionRequest,
  PermissionResponse,
  TaskProgress,
  ApiKeyConfig,
  TaskMessage,
} from '@accomplish/shared';

type EventCallback<T> = (data: T) => void;

class OpenworkWebAPI {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private eventListeners: Map<string, Set<EventCallback<any>>> = new Map();

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.connectWebSocket();
  }

  private connectWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = this.baseUrl 
      ? `${wsProtocol}//${new URL(this.baseUrl).host}/api/ws`
      : `${wsProtocol}//${window.location.host}/api/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emitEvent(data.type, data.payload);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }

  private emitEvent(type: string, payload: any) {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(payload));
    }
  }

  private addEventListener<T>(type: string, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(type);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // App info
  async getVersion(): Promise<string> {
    const data = await this.fetch<{ version: string }>('/version');
    return data.version;
  }

  async getPlatform(): Promise<string> {
    return 'web';
  }

  // Shell
  async openExternal(url: string): Promise<void> {
    window.open(url, '_blank');
  }

  // Task operations
  async startTask(config: TaskConfig): Promise<Task> {
    return this.fetch<Task>('/tasks/start', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async cancelTask(taskId: string): Promise<void> {
    await this.fetch(`/tasks/${taskId}/cancel`, { method: 'POST' });
  }

  async interruptTask(taskId: string): Promise<void> {
    await this.fetch(`/tasks/${taskId}/interrupt`, { method: 'POST' });
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      return await this.fetch<Task>(`/tasks/${taskId}`);
    } catch {
      return null;
    }
  }

  async listTasks(): Promise<Task[]> {
    return this.fetch<Task[]>('/tasks');
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.fetch(`/tasks/${taskId}`, { method: 'DELETE' });
  }

  async clearTaskHistory(): Promise<void> {
    await this.fetch('/tasks', { method: 'DELETE' });
  }

  // Permission responses
  async respondToPermission(response: PermissionResponse): Promise<void> {
    await this.fetch('/permissions/respond', {
      method: 'POST',
      body: JSON.stringify(response),
    });
  }

  // Session management
  async resumeSession(sessionId: string, prompt: string, taskId?: string): Promise<Task> {
    return this.fetch<Task>('/sessions/resume', {
      method: 'POST',
      body: JSON.stringify({ sessionId, prompt, taskId }),
    });
  }

  // Settings
  async getApiKeys(): Promise<ApiKeyConfig[]> {
    return this.fetch<ApiKeyConfig[]>('/settings/api-keys');
  }

  async addApiKey(
    provider: 'anthropic' | 'openai' | 'google' | 'groq' | 'custom',
    key: string,
    label?: string
  ): Promise<ApiKeyConfig> {
    return this.fetch<ApiKeyConfig>('/settings/api-keys', {
      method: 'POST',
      body: JSON.stringify({ provider, key, label }),
    });
  }

  async removeApiKey(id: string): Promise<void> {
    await this.fetch(`/settings/api-keys/${id}`, { method: 'DELETE' });
  }

  async getDebugMode(): Promise<boolean> {
    const data = await this.fetch<{ debugMode: boolean }>('/settings/debug-mode');
    return data.debugMode;
  }

  async setDebugMode(enabled: boolean): Promise<void> {
    await this.fetch('/settings/debug-mode', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async getAppSettings(): Promise<{ debugMode: boolean; onboardingComplete: boolean }> {
    return this.fetch('/settings');
  }

  // API Key management
  async hasApiKey(): Promise<boolean> {
    const data = await this.fetch<{ hasKey: boolean }>('/settings/api-key/check');
    return data.hasKey;
  }

  async setApiKey(key: string): Promise<void> {
    await this.fetch('/settings/api-key', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  }

  async getApiKey(): Promise<string | null> {
    try {
      const data = await this.fetch<{ key: string | null }>('/settings/api-key');
      return data.key;
    } catch {
      return null;
    }
  }

  async validateApiKey(key: string): Promise<{ valid: boolean; error?: string }> {
    return this.fetch('/settings/api-key/validate', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  }

  async validateApiKeyForProvider(
    provider: string,
    key: string
  ): Promise<{ valid: boolean; error?: string }> {
    return this.fetch('/settings/api-key/validate-provider', {
      method: 'POST',
      body: JSON.stringify({ provider, key }),
    });
  }

  async clearApiKey(): Promise<void> {
    await this.fetch('/settings/api-key', { method: 'DELETE' });
  }

  // Multi-provider API keys
  async getAllApiKeys(): Promise<Record<string, { exists: boolean; prefix?: string }>> {
    return this.fetch('/settings/api-keys/all');
  }

  async hasAnyApiKey(): Promise<boolean> {
    const data = await this.fetch<{ hasAny: boolean }>('/settings/api-keys/check');
    return data.hasAny;
  }

  // Onboarding
  async getOnboardingComplete(): Promise<boolean> {
    const data = await this.fetch<{ complete: boolean }>('/settings/onboarding');
    return data.complete;
  }

  async setOnboardingComplete(complete: boolean): Promise<void> {
    await this.fetch('/settings/onboarding', {
      method: 'POST',
      body: JSON.stringify({ complete }),
    });
  }

  // Claude CLI - Not applicable for web
  async checkClaudeCli(): Promise<{
    installed: boolean;
    version: string | null;
    installCommand: string;
  }> {
    return { installed: false, version: null, installCommand: '' };
  }

  async getClaudeVersion(): Promise<string | null> {
    return null;
  }

  // Model selection
  async getSelectedModel(): Promise<{ provider: string; model: string } | null> {
    try {
      return await this.fetch('/settings/model');
    } catch {
      return null;
    }
  }

  async setSelectedModel(model: { provider: string; model: string }): Promise<void> {
    await this.fetch('/settings/model', {
      method: 'POST',
      body: JSON.stringify(model),
    });
  }

  // Event subscriptions
  onTaskUpdate(callback: (event: TaskUpdateEvent) => void): () => void {
    return this.addEventListener('task:update', callback);
  }

  onTaskUpdateBatch(callback: (event: { taskId: string; messages: TaskMessage[] }) => void): () => void {
    return this.addEventListener('task:update:batch', callback);
  }

  onPermissionRequest(callback: (request: PermissionRequest) => void): () => void {
    return this.addEventListener('permission:request', callback);
  }

  onTaskProgress(callback: (progress: TaskProgress) => void): () => void {
    return this.addEventListener('task:progress', callback);
  }

  onDebugLog(callback: (log: unknown) => void): () => void {
    return this.addEventListener('debug:log', callback);
  }

  onTaskStatusChange(callback: (data: { taskId: string; status: TaskStatus }) => void): () => void {
    return this.addEventListener('task:status', callback);
  }

  // Logging
  async logEvent(payload: {
    level?: string;
    message: string;
    context?: Record<string, unknown>;
  }): Promise<unknown> {
    return this.fetch('/log', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

// Create singleton instance
let apiInstance: OpenworkWebAPI | null = null;

export function getOpenworkAPI(baseUrl?: string): OpenworkWebAPI {
  if (!apiInstance) {
    apiInstance = new OpenworkWebAPI(baseUrl);
  }
  return apiInstance;
}

export function isRunningInElectron(): boolean {
  return false;
}

export function getShellVersion(): string | null {
  return null;
}

export function getShellPlatform(): string | null {
  return 'web';
}
