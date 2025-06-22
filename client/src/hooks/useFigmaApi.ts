import { useState, useCallback } from 'react';
import { FigmaApiClient } from '@/services/figma-api-client';

interface FigmaApiResponse {
  name: string;
  lastModified: string;
  document: any;
  components: Record<string, any>;
  styles: Record<string, any>;
}

export function useFigmaApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FigmaApiResponse | null>(null);

  const fetchFigmaFile = useCallback(async (figmaUrl: string, apiKey: string): Promise<FigmaApiResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const client = new FigmaApiClient(apiKey);
      const fileKey = extractFileKey(figmaUrl);
      
      if (!fileKey) {
        throw new Error('Invalid Figma URL');
      }

      const response = await client.getFile(fileKey);
      setData(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Figma file';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearData = useCallback(() => {
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    fetchFigmaFile,
    clearError,
    clearData
  };
}

function extractFileKey(figmaUrl: string): string | null {
  // Support both /file/ and /design/ URL formats
  const match = figmaUrl.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[2] : null;
}
