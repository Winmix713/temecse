import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { copyToClipboard, downloadFile } from '@/utils/helpers';

interface GeneratedComponent {
  jsx: string;
  css: string;
  typescript?: string;
  componentName: string;
}

interface CodePreviewProps {
  component: GeneratedComponent;
}

export function CodePreview({ component }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState('jsx');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (content: string, type: string) => {
    try {
      await copyToClipboard(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    downloadFile(content, filename);
  };

  const getFileExtension = (type: string) => {
    switch (type) {
      case 'jsx': return component.typescript ? '.tsx' : '.jsx';
      case 'css': return '.css';
      case 'typescript': return '.d.ts';
      default: return '.txt';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
          <TabsList>
            <TabsTrigger value="jsx">
              {component.typescript ? 'TSX' : 'JSX'}
            </TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
            {component.typescript && (
              <TabsTrigger value="typescript">Types</TabsTrigger>
            )}
          </TabsList>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(
                activeTab === 'jsx' ? component.jsx :
                activeTab === 'css' ? component.css :
                component.typescript || '',
                activeTab
              )}
            >
              <Copy className="w-4 h-4 mr-1" />
              {copied === activeTab ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(
                activeTab === 'jsx' ? component.jsx :
                activeTab === 'css' ? component.css :
                component.typescript || '',
                `${component.componentName}${getFileExtension(activeTab)}`
              )}
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
          </div>
        </div>

        <TabsContent value="jsx" className="p-0">
          <div className="max-h-96 overflow-auto">
            <SyntaxHighlighter
              language={component.typescript ? "tsx" : "jsx"}
              style={tomorrow}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                background: '#1a1a1a',
              }}
              showLineNumbers
            >
              {component.jsx}
            </SyntaxHighlighter>
          </div>
        </TabsContent>

        <TabsContent value="css" className="p-0">
          <div className="max-h-96 overflow-auto">
            <SyntaxHighlighter
              language="css"
              style={tomorrow}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                background: '#1a1a1a',
              }}
              showLineNumbers
            >
              {component.css}
            </SyntaxHighlighter>
          </div>
        </TabsContent>

        {component.typescript && (
          <TabsContent value="typescript" className="p-0">
            <div className="max-h-96 overflow-auto">
              <SyntaxHighlighter
                language="typescript"
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  background: '#1a1a1a',
                }}
                showLineNumbers
              >
                {component.typescript}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
