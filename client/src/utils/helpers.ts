export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      throw new Error('Failed to copy to clipboard');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generatePackageJson(componentName: string): string {
  return JSON.stringify({
    name: componentName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    version: "1.0.0",
    description: `Generated React component: ${componentName}`,
    main: `${componentName}.tsx`,
    dependencies: {
      "react": "^18.2.0",
      "@types/react": "^18.2.0",
      "tailwindcss": "^3.3.0"
    },
    devDependencies: {
      "typescript": "^5.0.0",
      "@types/node": "^20.0.0"
    },
    scripts: {
      "build": "tsc",
      "dev": "tsc --watch"
    },
    keywords: ["react", "component", "figma", "generated"],
    author: "Figma-to-Code Generator",
    license: "MIT"
  }, null, 2);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function extractFileKeyFromUrl(figmaUrl: string): string | null {
  // Support both /file/ and /design/ URL formats
  const match = figmaUrl.match(/\/(file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[2] : null;
}

export function validateFigmaUrl(url: string): boolean {
  const pattern = /^https:\/\/(?:www\.)?figma\.com\/(file|design)\/[a-zA-Z0-9]+/;
  return pattern.test(url);
}

export function validateFigmaApiKey(apiKey: string): boolean {
  // Accept both figd_ tokens and legacy tokens
  return apiKey.startsWith('figd_') || (apiKey.length >= 40 && /^[a-zA-Z0-9-]+$/.test(apiKey));
}
