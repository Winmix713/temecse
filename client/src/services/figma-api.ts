import { FigmaApiResponse, FigmaNode } from '../types/figma';

export class FigmaApiClient {
  private baseUrl = 'https://api.figma.com/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-Figma-Token': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Figma API Error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    return response.json();
  }

  async getFile(fileKey: string): Promise<FigmaApiResponse> {
    return this.makeRequest<FigmaApiResponse>(`/files/${fileKey}`);
  }

  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<{ nodes: Record<string, FigmaNode> }> {
    const ids = nodeIds.join(',');
    return this.makeRequest(`/files/${fileKey}/nodes?ids=${ids}`);
  }

  async exportImages(
    fileKey: string, 
    nodeIds: string[], 
    options: {
      format?: 'jpg' | 'png' | 'svg' | 'pdf';
      scale?: number;
      svg_include_id?: boolean;
      svg_simplify_stroke?: boolean;
    } = {}
  ): Promise<{ images: Record<string, string> }> {
    const params = new URLSearchParams({
      ids: nodeIds.join(','),
      format: options.format || 'png',
      scale: (options.scale || 1).toString(),
      ...(options.svg_include_id && { svg_include_id: 'true' }),
      ...(options.svg_simplify_stroke && { svg_simplify_stroke: 'true' }),
    });

    return this.makeRequest(`/images/${fileKey}?${params}`);
  }

  static extractFileKey(figmaUrl: string): string {
    // Support both /file/ and /design/ URLs
    const match = figmaUrl.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid Figma URL format');
    }
    return match[2];
  }

  static validateApiKey(apiKey: string): boolean {
    return /^figd_[a-zA-Z0-9_-]+$/.test(apiKey);
  }

  async validateConnection(): Promise<boolean> {
    try {
      // Test with a simple API call
      await this.makeRequest('/me');
      return true;
    } catch {
      return false;
    }
  }
}

// Rate limiting utility
export class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests = 100, timeWindowMs = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}