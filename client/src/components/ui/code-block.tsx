import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { copyToClipboard } from '@/utils/helpers';

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
}

export function CodeBlock({ 
  code, 
  language, 
  filename,
  showLineNumbers = true,
  maxHeight = '400px'
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="relative border rounded-lg overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
          <span className="text-sm font-medium text-gray-700">{filename}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
      <div style={{ maxHeight }} className="overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={tomorrow}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            background: '#1a1a1a',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
      {!filename && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2 h-8 px-2"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
