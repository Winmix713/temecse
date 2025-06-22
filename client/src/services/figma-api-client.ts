export class FigmaApiClient {
  private apiKey: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFile(fileKey: string) {
    const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getFileNodes(fileKey: string, nodeIds: string[]) {
    const nodeQuery = nodeIds.join(',');
    const response = await fetch(`${this.baseUrl}/files/${fileKey}/nodes?ids=${nodeQuery}`, {
      headers: {
        'X-Figma-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getImages(fileKey: string, nodeIds: string[], format: 'jpg' | 'png' | 'svg' = 'png') {
    const nodeQuery = nodeIds.join(',');
    const response = await fetch(`${this.baseUrl}/images/${fileKey}?ids=${nodeQuery}&format=${format}`, {
      headers: {
        'X-Figma-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async getComments(fileKey: string) {
    const response = await fetch(`${this.baseUrl}/files/${fileKey}/comments`, {
      headers: {
        'X-Figma-Token': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}
