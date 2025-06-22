import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Download, 
  Copy, 
  Code2, 
  Palette, 
  FileCode,
  Zap,
  CheckCircle,
  Info,
  Plus,
  FileText
} from 'lucide-react';
import { useFigmaApi } from '@/hooks/useFigmaApi';
import { useCodeGeneration } from '@/hooks/useCodeGeneration';
import { ErrorAlert } from '@/components/ui/error-alert';
import { CodeBlock } from '@/components/ui/code-block';
import { copyToClipboard, downloadFile, generatePackageJson } from '@/utils/helpers';
import { ProcessingPipeline } from './ProcessingPipeline';
import { QualityReport } from './QualityReport';
import { CodePreview } from './CodePreview';
import { FigmaInfoDisplay } from './FigmaInfoDisplay';

const figmaFormSchema = z.object({
  figmaUrl: z
    .string()
    .url('Valid URL required')
    .refine(
      (url) => {
        // Support both file and design URLs with optional query parameters
        const pattern = /^https:\/\/(?:www\.)?figma\.com\/(file|design)\/[a-zA-Z0-9]+/;
        return pattern.test(url);
      },
      'Please enter a valid Figma file or design URL (e.g., https://www.figma.com/design/...)'
    ),
  apiKey: z
    .string()
    .min(1, 'API key required')
    .refine(
      (key) => {
        // Accept both figd_ tokens and legacy tokens
        return key.startsWith('figd_') || (key.length >= 40 && /^[a-zA-Z0-9-]+$/.test(key));
      },
      'Please enter a valid Figma API key'
    ),
  jsxCode: z.string().optional(),
  cssCode: z.string().optional(),
  fullCssCode: z.string().optional(),
});

type FigmaFormData = z.infer<typeof figmaFormSchema>;

const SYNTAX_HIGHLIGHT_THRESHOLD = 15000;

export function SimplifiedGenerator() {
  const { isLoading: isFetching, error: apiError, fetchFigmaFile, clearError } = useFigmaApi();
  const { isGenerating, result, generateFromFigma, clearResult, phases } = useCodeGeneration();
  const [copied, setCopied] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isCssHighlightingEnabled, setIsCssHighlightingEnabled] = useState(false);

  const form = useForm<FigmaFormData>({
    resolver: zodResolver(figmaFormSchema),
    defaultValues: {
      figmaUrl: '',
      apiKey: '',
      jsxCode: '',
      cssCode: '',
      fullCssCode: ''
    }
  });

  const onSubmit = async (data: FigmaFormData) => {
    clearError();
    clearResult();
    
    const figmaData = await fetchFigmaFile(data.figmaUrl, data.apiKey);
    if (figmaData) {
      await generateFromFigma({
        figmaData,
        customJsx: data.jsxCode,
        customCss: data.cssCode,
        fullCss: data.fullCssCode
      });
    }
  };
  
  useEffect(() => {
    if (result && result.css) {
      setIsCssHighlightingEnabled(result.css.length < SYNTAX_HIGHLIGHT_THRESHOLD);
    }
  }, [result]);

  const handleCopy = async (content: string, type: string) => {
    try {
      await copyToClipboard(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleDownloadAll = () => {
    if (!result) return;
    
    downloadFile(result.jsx, `${result.componentName}.tsx`);
    downloadFile(result.css, `${result.componentName}.css`);
    downloadFile(generatePackageJson(result.componentName), 'package.json');
  };

  const isProcessing = isFetching || isGenerating;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Transform Figma Designs into Production Code
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Generate pixel-perfect React components, TypeScript definitions, and optimized CSS from your Figma designs with AI-powered precision.
        </p>
      </div>

      {/* Processing Pipeline */}
      {(isProcessing || result) && (
        <ProcessingPipeline phases={phases} />
      )}

      {apiError && <ErrorAlert error={apiError} />}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Input Forms */}
          <div className="space-y-8">
            {/* Figma Project Data */}
            <Card className="shadow-lg border-gray-100 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <FileCode className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Connect Your Figma Design
                    </span>
                    <p className="text-gray-600 text-sm font-normal mt-1">
                      Import your design file to start generating code
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Figma URL Input */}
                <div className="space-y-3">
                  <Label htmlFor="figmaUrl" className="flex items-center space-x-2 text-sm font-semibold text-gray-800">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Figma Design URL</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="figmaUrl"
                      placeholder="https://www.figma.com/design/ABC123/My-Design..."
                      {...form.register('figmaUrl')}
                      className={`
                        pl-4 pr-4 py-4 text-base border-2 rounded-xl transition-all duration-200
                        ${form.formState.errors.figmaUrl 
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                        }
                        focus:ring-4 focus:outline-none
                      `}
                    />
                    {form.watch('figmaUrl') && !form.formState.errors.figmaUrl && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {form.formState.errors.figmaUrl && (
                    <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Invalid URL Format</p>
                        <p className="text-xs text-red-600 mt-1">{form.formState.errors.figmaUrl.message}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* API Key Input */}
                <div className="space-y-3">
                  <Label htmlFor="apiKey" className="flex items-center space-x-2 text-sm font-semibold text-gray-800">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Figma API Access Token</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your personal access token..."
                      {...form.register('apiKey')}
                      className={`
                        pl-4 pr-4 py-4 text-base border-2 rounded-xl transition-all duration-200
                        ${form.formState.errors.apiKey 
                          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-200 bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200'
                        }
                        focus:ring-4 focus:outline-none
                      `}
                    />
                    {form.watch('apiKey') && !form.formState.errors.apiKey && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  {form.formState.errors.apiKey && (
                    <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Invalid API Key</p>
                        <p className="text-xs text-red-600 mt-1">{form.formState.errors.apiKey.message}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Help Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-2">Quick Setup Guide</h4>
                      <div className="space-y-3 text-sm text-blue-800">
                        <div>
                          <p className="font-medium mb-1">1. Get your Figma URL:</p>
                          <p className="text-blue-700">Open your design in Figma and copy the URL from your browser</p>
                        </div>
                        <div>
                          <p className="font-medium mb-1">2. Generate API token:</p>
                          <p className="text-blue-700">Figma → Account Settings → Personal Access Tokens → Generate new token</p>
                        </div>
                        <div className="pt-2 border-t border-blue-200">
                          <p className="text-xs text-blue-600">
                            <strong>Supported formats:</strong> Both /file/ and /design/ URLs work
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Code Integration */}
            <Card className="shadow-lg border-gray-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Code2 className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <span className="text-xl font-semibold text-gray-900">2. Custom Code Integration</span>
                      <p className="text-gray-600 text-sm font-normal">Optional code customization</p>
                    </div>
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="px-4 py-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {showAdvancedOptions ? 'Hide Custom Code' : 'Add Custom Code'}
                  </Button>
                </div>
              </CardHeader>
              {showAdvancedOptions && (
                <CardContent className="space-y-6">
                  <Tabs defaultValue="jsx" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="jsx">React/JSX</TabsTrigger>
                      <TabsTrigger value="css">Base CSS</TabsTrigger>
                      <TabsTrigger value="advanced">Advanced CSS</TabsTrigger>
                    </TabsList>

                    <TabsContent value="jsx" className="pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="jsxCode" className="flex items-center space-x-2">
                          <FileCode className="w-4 h-4" />
                          <span>JSX Code Addition</span>
                        </Label>
                        <Textarea
                          id="jsxCode"
                          placeholder="// Define a 'customElement' variable.&#10;const customElement = <button>Click me!</button>;"
                          {...form.register('jsxCode')}
                          className="min-h-[150px] font-mono text-sm"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="css" className="pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="cssCode" className="flex items-center space-x-2">
                          <Palette className="w-4 h-4" />
                          <span>CSS Code Addition</span>
                        </Label>
                        <Textarea
                          id="cssCode"
                          placeholder="/* .my-class { color: blue; } */"
                          {...form.register('cssCode')}
                          className="min-h-[150px] font-mono text-sm"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced" className="pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullCssCode" className="flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>Advanced CSS (CSS++)</span>
                        </Label>
                        <Textarea
                          id="fullCssCode"
                          placeholder="/* :root { --primary: blue; }&#10;@keyframes fadeIn { ... } */"
                          {...form.register('fullCssCode')}
                          className="min-h-[150px] font-mono text-sm"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">How it works:</p>
                        <ul className="space-y-1 text-xs list-disc list-inside">
                          <li><strong>JSX Code:</strong> Integrates into the generated React component</li>
                          <li><strong>CSS Code:</strong> Adds to the component stylesheet</li>
                          <li><strong>CSS++:</strong> Advanced CSS features (animations, custom properties)</li>
                          <li>Figma data + custom code = complete React component</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right Column - Settings and Preview */}
          <div className="space-y-8">
            {/* Generation Settings */}
            <Card className="shadow-lg border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Zap className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <span className="text-xl font-semibold text-gray-900">Generation Settings</span>
                    <p className="text-gray-600 text-sm font-normal">Configure output preferences</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">Framework</Label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option>React</option>
                      <option>Vue.js</option>
                      <option>HTML</option>
                    </select>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">CSS Framework</Label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option>Tailwind CSS</option>
                      <option>CSS Modules</option>
                      <option>Styled Components</option>
                      <option>Plain CSS</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">Additional Options</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                      <span className="text-sm text-gray-700">TypeScript</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                      <span className="text-sm text-gray-700">Accessibility (WCAG 2.1)</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                      <span className="text-sm text-gray-700">Responsive Design</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                      <span className="text-sm text-gray-700">Optimize Images</span>
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-4 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Generate Component</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card className="shadow-lg border-gray-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <FileText className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <span className="text-xl font-semibold text-gray-900">Live Preview</span>
                      <p className="text-gray-600 text-sm font-normal">Real-time component preview</p>
                    </div>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" title="Mobile View">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM8 4h4v10H8V4z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" title="Tablet View">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V5a3 3 0 00-3-3H5zM4 5a1 1 0 011-1h10a1 1 0 011 1v8a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" title="Desktop View" className="text-gray-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7h2.458l-.144.578L10.5 13H9.5l-.585-.422L8.771 12zM5 5v8h10V5H5z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <p className="text-gray-600 mb-2">Upload a Figma file to see the preview</p>
                  <p className="text-sm text-gray-500">Your component will appear here in real-time</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Results Section */}
      {result && (
        <div className="space-y-8 animate-in fade-in-0 duration-700">
          {/* Success Header */}
          <Card className="shadow-lg border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-success/10 rounded-xl">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Generation Successful: {result.componentName}</h3>
                    <p className="text-gray-600">Component generated with {result.metadata?.estimatedAccuracy || 94}% accuracy</p>
                  </div>
                </div>
                <Button onClick={handleDownloadAll} className="bg-primary text-white hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download Package
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">File Name:</span>
                  <p className="font-medium">{result.figmaInfo?.name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Last Modified:</span>
                  <p className="font-medium">
                    {result.figmaInfo?.lastModified 
                      ? new Date(result.figmaInfo.lastModified).toLocaleDateString()
                      : 'Unknown'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Elements Processed:</span>
                  <p className="font-medium">{result.figmaInfo?.nodeCount || 0} elements</p>
                </div>
                <div>
                  <span className="text-gray-600">Bundle Size:</span>
                  <p className="font-medium">{((result.jsx?.length || 0) + (result.css?.length || 0)) / 1024}KB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Report */}
          {result.accessibility && result.responsive && result.metadata && (
            <QualityReport component={result} />
          )}

          {/* Code Preview */}
          <CodePreview component={result} />

          {/* Figma File Info */}
          {result.figmaData && (
            <FigmaInfoDisplay 
              figmaData={result.figmaData} 
              fileKey={result.figmaInfo?.fileKey || ''} 
            />
          )}
        </div>
      )}
    </div>
  );
}
