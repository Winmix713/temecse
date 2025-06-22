import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import JSZip from 'jszip'; // Szükséges a bulk letöltéshez
import { saveAs } from 'file-saver'; // Segítség a fájl mentéséhez

// UI & Ikonok
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Upload,
  Link,
  Play,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Code,
  Eye,
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
  Layers,
  Palette,
  Type,
  Box,
  Zap,
  FileText,
  Package,
  BookOpenCheck,
} from 'lucide-react';

// Szolgáltatások és Típusok
import { FigmaApiClient } from '@/services/figma-api';
import { FigmaApiResponse, GeneratedComponent } from '@/types/figma';
import { parseFigmaDocument } from '@/services/figma-parser';

// --- Skéma és Típusok ---
const figmaFormSchema = z.object({
  figmaUrl: z
    .string()
    .url('Érvényes Figma URL szükséges')
    .refine(
      (url) =>
        url.includes('figma.com/file/') || url.includes('figma.com/design/'),
      'A URL-nek Figma fájl vagy design linknek kell lennie'
    ),
  apiKey: z
    .string()
    .min(1, 'API kulcs szükséges')
    .refine(
      (key) => FigmaApiClient.validateApiKey(key),
      'Érvénytelen Figma API kulcs formátum'
    ),
});

type FigmaFormData = z.infer<typeof figmaFormSchema>;

interface GenerationResult {
  figmaData: FigmaApiResponse;
  components: GeneratedComponent[];
  fileKey: string;
  stats: {
    totalComponents: number;
    totalNodes: number;
    processingTime: number;
    accuracy: number;
  };
}

// --- Segédfüggvények ---

// Helyőrző a toast notifikációkhoz. Cseréld le egy valós implementációra (pl. react-hot-toast).
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // Egy egyszerűsített implementáció, valós projektben cseréld le!
  console.log(`TOAST (${type}): ${message}`);
  // Példa egy valódi toast libbel:
  // import { toast } from 'sonner';
  // if (type === 'success') toast.success(message);
  // else toast.error(message);
};

// --- Fő Komponens ---

export function FigmaGenerator() {
  const [activeTab, setActiveTab] = useState('url');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingPhase, setProcessingPhase] = useState<string>('');

  const form = useForm<FigmaFormData>({
    resolver: zodResolver(figmaFormSchema),
    defaultValues: { figmaUrl: '', apiKey: '' },
  });

  const onSubmit = async (data: FigmaFormData) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    const startTime = performance.now();
    try {
      setProcessingPhase('Figma API kapcsolat ellenőrzése...');
      const extractedFileKey = FigmaApiClient.extractFileKey(data.figmaUrl);
      const apiClient = new FigmaApiClient(data.apiKey);
      const isValidConnection = await apiClient.validateConnection();
      if (!isValidConnection)
        throw new Error(
          'Érvénytelen API kulcs vagy nincs hozzáférés a Figma API-hoz'
        );

      setProcessingPhase('Figma fájl letöltése...');
      const figmaFileData = await apiClient.getFile(extractedFileKey);

      setProcessingPhase('Komponensek generálása...');
      const generatedComponents = parseFigmaDocument(figmaFileData);

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);
      const totalNodes = countTotalNodes(figmaFileData.document);
      const averageAccuracy =
        generatedComponents.reduce(
          (sum, comp) => sum + comp.metadata.estimatedAccuracy,
          0
        ) / (generatedComponents.length || 1);

      setResult({
        figmaData: figmaFileData,
        components: generatedComponents,
        fileKey: extractedFileKey,
        stats: {
          totalComponents: generatedComponents.length,
          totalNodes,
          processingTime,
          accuracy: averageAccuracy || 0,
        },
      });
      showToast('Komponensek sikeresen generálva!', 'success');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ismeretlen hiba történt';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingPhase('');
    }
  };

  const handleBackToForm = () => {
    setResult(null);
    setError(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Kód a vágólapra másolva!', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Sikertelen másolás.', 'error');
    }
  };

  const downloadComponentFile = (
    filename: string,
    content: string,
    type: string = 'text/html'
  ) => {
    const blob = new Blob([content], { type });
    saveAs(blob, filename);
  };

  const generateComponentContent = (component: GeneratedComponent) => {
    return `<!-- Generated from Figma: ${component.name} -->
<!-- Component ID: ${component.id} -->
<!-- Accuracy: ${Math.round(component.metadata.estimatedAccuracy * 100)}% -->
${component.jsx}
<!-- Tailwind Classes Used: -->
<!-- ${component.tailwind} -->
<!-- TypeScript Interface: -->
<!-- ${component.typescript} -->`;
  };

  const generateStorybookFileContent = (component: GeneratedComponent) => {
    return `import React from 'react';
// Ez a fájl a generált HTML kódot jeleníti meg, nem egy valódi React komponenst importál.
// A Storybookban való használathoz a HTML-t kell renderelni.

export default {
  title: 'Generated/${component.name}',
  component: (props) => <div dangerouslySetInnerHTML={{ __html: props.html }} />,
  argTypes: {
    html: {
        control: { type: 'text' }
    }
  }
};

const Template = (args) => <div dangerouslySetInnerHTML={{ __html: args.html }} />;

export const Default = Template.bind({});
Default.args = {
  html: \`${component.jsx.replace(/`/g, '\\`')}\` // Escape backticks
};
`;
  };

  const handleDownloadAll = async () => {
    if (!result) return;
    const zip = new JSZip();
    const componentsFolder = zip.folder('components');
    if (componentsFolder) {
      result.components.forEach((component) => {
        const content = generateComponentContent(component);
        componentsFolder.file(`${component.name}.html`, content);
      });
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${result.figmaData.name}-components.zip`);
    showToast('Minden komponens letöltése folyamatban...', 'success');
  };

  const handleExportAllToStorybook = async () => {
    if (!result) return;
    const zip = new JSZip();
    const storiesFolder = zip.folder('stories');
    if (storiesFolder) {
      result.components.forEach((component) => {
        const storyContent = generateStorybookFileContent(component);
        storiesFolder.file(`${component.name}.stories.jsx`, storyContent);
      });
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${result.figmaData.name}-stories.zip`);
    showToast('Storybook export folyamatban...', 'success');
  };

  const countTotalNodes = (node: any): number => {
    let count = 1;
    if (node.children) {
      for (const child of node.children) {
        count += countTotalNodes(child);
      }
    }
    return count;
  };

  // Stílusok a komponens előnézethez
  const previewStyles = `
    .component-preview {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      line-height: 1.5;
    }
    .component-preview * {
      box-sizing: border-box;
    }
    .component-preview p, .component-preview h1, .component-preview h2, .component-preview h3, .component-preview button {
      margin: 0;
      padding: 0;
    }
  `;

  if (result) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        <style dangerouslySetInnerHTML={{ __html: previewStyles }} />
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Generált Komponensek
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 mt-2">
              {result.stats.totalComponents} komponens •{' '}
              {result.stats.processingTime}ms
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDownloadAll}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />{' '}
              <span>Összes letöltése (ZIP)</span>
            </Button>
            <Button
              onClick={handleExportAllToStorybook}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <BookOpenCheck className="w-4 h-4" />{' '}
              <span>Storybook Export</span>
            </Button>
            <Button
              onClick={handleBackToForm}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" /> <span>Vissza</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            {' '}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {' '}
              <CardTitle className="text-sm font-medium">
                Komponensek
              </CardTitle>{' '}
              <Layers className="h-4 w-4 text-muted-foreground" />{' '}
            </CardHeader>{' '}
            <CardContent>
              {' '}
              <div className="text-2xl font-bold">
                {result.stats.totalComponents}
              </div>{' '}
              <p className="text-xs text-muted-foreground">
                generált komponens
              </p>{' '}
            </CardContent>{' '}
          </Card>
          <Card>
            {' '}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {' '}
              <CardTitle className="text-sm font-medium">
                Pontosság
              </CardTitle>{' '}
              <CheckCircle className="h-4 w-4 text-muted-foreground" />{' '}
            </CardHeader>{' '}
            <CardContent>
              {' '}
              <div className="text-2xl font-bold">
                {Math.round(result.stats.accuracy * 100)}%
              </div>{' '}
              <p className="text-xs text-muted-foreground">átlagos pontosság</p>{' '}
            </CardContent>{' '}
          </Card>
          <Card>
            {' '}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {' '}
              <CardTitle className="text-sm font-medium">
                Node-ok
              </CardTitle>{' '}
              <Box className="h-4 w-4 text-muted-foreground" />{' '}
            </CardHeader>{' '}
            <CardContent>
              {' '}
              <div className="text-2xl font-bold">
                {result.stats.totalNodes}
              </div>{' '}
              <p className="text-xs text-muted-foreground">
                Figma elem feldolgozva
              </p>{' '}
            </CardContent>{' '}
          </Card>
          <Card>
            {' '}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {' '}
              <CardTitle className="text-sm font-medium">
                Sebesség
              </CardTitle>{' '}
              <Zap className="h-4 w-4 text-muted-foreground" />{' '}
            </CardHeader>{' '}
            <CardContent>
              {' '}
              <div className="text-2xl font-bold">
                {result.stats.processingTime}ms
              </div>{' '}
              <p className="text-xs text-muted-foreground">feldolgozási idő</p>{' '}
            </CardContent>{' '}
          </Card>
        </div>

        {/* File Info */}
        <Card>
          <CardHeader>
            {' '}
            <CardTitle className="flex items-center space-x-2">
              {' '}
              <FileText className="w-5 h-5" />{' '}
              <span>Figma Fájl Információk</span>{' '}
            </CardTitle>{' '}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Fájl név</p>{' '}
                <p className="font-medium">{result.figmaData.name}</p>{' '}
              </div>
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">
                  Utolsó módosítás
                </p>{' '}
                <p className="font-medium">
                  {new Date(result.figmaData.lastModified).toLocaleDateString(
                    'hu-HU'
                  )}
                </p>{' '}
              </div>
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Verzió</p>{' '}
                <p className="font-medium">{result.figmaData.version}</p>{' '}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Components List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Generált Komponensek</h2>
          {result.components.length === 0 ? (
            <Card>
              {' '}
              <CardContent className="p-8 text-center">
                {' '}
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />{' '}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nincsenek generálható komponensek
                </h3>{' '}
                <p className="text-gray-500">
                  A Figma fájl nem tartalmaz olyan elemeket, amelyekből
                  komponenseket lehetne generálni.
                </p>{' '}
              </CardContent>{' '}
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {result.components.map((component) => (
                <ComponentCard
                  key={component.id}
                  component={component}
                  onCopy={copyToClipboard}
                  onDownloadFile={downloadComponentFile}
                  onGenerateComponentContent={generateComponentContent}
                  onGenerateStorybookFileContent={generateStorybookFileContent}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {' '}
          Figma-to-Code Generátor{' '}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {' '}
          Figma designokat HTML + Tailwind CSS kóddá alakít automatikusan{' '}
        </p>
      </div>
      {/* Input Form */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url" className="flex items-center space-x-2">
                {' '}
                <Link className="w-4 h-4" /> <span>Figma URL</span>{' '}
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                disabled
                className="flex items-center space-x-2 cursor-not-allowed"
              >
                {' '}
                <Upload className="w-4 h-4" />{' '}
                <span>Fájl Feltöltés (Hamarosan)</span>{' '}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="figmaUrl">Figma Fájl URL</Label>
                <Input
                  id="figmaUrl"
                  placeholder="https://www.figma.com/file/... vagy https://www.figma.com/design/..."
                  {...form.register('figmaUrl')}
                />
                {form.formState.errors.figmaUrl && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    {' '}
                    <AlertCircle className="w-4 h-4" />{' '}
                    <span>{form.formState.errors.figmaUrl.message}</span>{' '}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Támogatott formátumok: Figma fájl linkek (/file/) és design
                  linkek (/design/).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">Figma API Kulcs</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="figd_..."
                  {...form.register('apiKey')}
                />
                {form.formState.errors.apiKey && (
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    {' '}
                    <AlertCircle className="w-4 h-4" />{' '}
                    <span>{form.formState.errors.apiKey.message}</span>{' '}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Szerezd be a tokent: Figma → Account Settings → Personal
                  Access Tokens.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="upload">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                {' '}
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />{' '}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ez a funkció jelenleg nem elérhető
                </h3>{' '}
                <p className="text-gray-500">
                  A jövőben itt lehetőség lesz .fig fájlok feltöltésére.
                </p>{' '}
              </div>
            </TabsContent>
          </Tabs>
          <div className="pt-6 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg font-semibold"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  {' '}
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>{' '}
                  <span>{processingPhase || 'Komponensek generálása...'}</span>{' '}
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  {' '}
                  <Play className="w-5 h-5" />{' '}
                  <span>Komponensek Generálása</span>{' '}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-800">
            {' '}
            <AlertCircle className="w-5 h-5" />{' '}
            <span className="font-medium">Hiba történt:</span>{' '}
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}

// --- Komponens Kártya Komponens ---

interface ComponentCardProps {
  component: GeneratedComponent;
  onCopy: (text: string) => void;
  onDownloadFile: (filename: string, content: string, type?: string) => void;
  onGenerateComponentContent: (component: GeneratedComponent) => string;
  onGenerateStorybookFileContent: (component: GeneratedComponent) => string;
}

function ComponentCard({
  component,
  onCopy,
  onDownloadFile,
  onGenerateComponentContent,
  onGenerateStorybookFileContent,
}: ComponentCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'code' | 'info'>(
    'preview'
  );

  const handleDownload = () => {
    const content = onGenerateComponentContent(component);
    onDownloadFile(`${component.name}.html`, content, 'text/html');
  };

  const handleDownloadStory = () => {
    const content = onGenerateStorybookFileContent(component);
    onDownloadFile(`${component.name}.stories.jsx`, content, 'text/javascript');
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <div className="p-2 bg-blue-100 rounded-md">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{component.name}</CardTitle>
                  <CardDescription>
                    {' '}
                    Típus: {component.metadata.componentType}{' '}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {' '}
                  {Math.round(component.metadata.estimatedAccuracy * 100)}%{' '}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-4 space-y-4 bg-white">
            <Tabs
              value={activeView}
              onValueChange={(v) => setActiveView(v as any)}
            >
              <TabsList>
                <TabsTrigger value="preview">
                  <Eye className="w-4 h-4 mr-2" />
                  Előnézet
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code className="w-4 h-4 mr-2" />
                  Kód
                </TabsTrigger>
                <TabsTrigger value="info">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Információ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[150px] flex items-center justify-center">
                  <div
                    dangerouslySetInnerHTML={{ __html: component.jsx }}
                    className="component-preview w-full"
                  />
                </div>
              </TabsContent>

              <TabsContent value="code" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">HTML (JSX)</h4>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCopy(component.jsx)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Másolás
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Letöltés
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadStory}
                      >
                        <BookOpenCheck className="w-4 h-4 mr-1" />
                        Story
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{component.jsx}</code>
                  </pre>
                </div>
                {component.tailwind && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Tailwind Osztályok</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <code className="text-blue-800 text-sm">
                        {component.tailwind}
                      </code>
                    </div>
                  </div>
                )}
                {component.typescript && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">TypeScript Interface</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{component.typescript}</code>
                    </pre>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Metaadatok</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        {' '}
                        <span className="text-gray-600">
                          Figma Node ID:
                        </span>{' '}
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {component.metadata.figmaNodeId}
                        </code>{' '}
                      </div>
                      <div className="flex justify-between">
                        {' '}
                        <span className="text-gray-600">Komplexitás:</span>{' '}
                        <Badge
                          className={getComplexityColor(
                            component.metadata.complexity
                          )}
                        >
                          {component.metadata.complexity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">
                      Hozzáférhetőség (Accessibility)
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        {' '}
                        <span className="text-gray-600">Pontszám:</span>{' '}
                        <span>{component.accessibility.score}/100</span>{' '}
                      </div>
                      <div className="flex justify-between">
                        {' '}
                        <span className="text-gray-600">
                          WCAG Megfelelés:
                        </span>{' '}
                        <Badge
                          variant={
                            component.accessibility.wcagCompliance === 'AA'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {component.accessibility.wcagCompliance}
                        </Badge>{' '}
                      </div>
                      {component.accessibility.issues.length > 0 && (
                        <div>
                          <span className="text-gray-600">Problémák:</span>{' '}
                          <ul className="mt-1 space-y-1">
                            {component.accessibility.issues.map((issue, i) => (
                              <li key={i} className="text-xs text-orange-600">
                                {' '}
                                • {issue.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
