import React, { useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Layers, Palette, Component, Type, Square, Circle, Code2, Search, AlertTriangle, Info } from 'lucide-react';

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

interface FigmaComponent {
  name: string;
  description?: string;
}

interface FigmaStyle {
  name: string;
  type: string;
}

interface FigmaApiResponse {
  name: string;
  lastModified: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
}

interface FigmaInfoDisplayProps {
  figmaData: FigmaApiResponse | null;
  fileKey: string;
  isLoading?: boolean;
}

interface ProcessedDocument {
  allNodes: (FigmaNode & { depth: number })[];
  nodeCounts: Record<string, number>;
}

// Helper functions
const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

const ICON_MAP: Record<string, React.ElementType> = {
  RECTANGLE: Square,
  ELLIPSE: Circle,
  TEXT: Type,
  FRAME: Layers,
  GROUP: Layers,
  COMPONENT: Component,
  INSTANCE: Component,
  DEFAULT: FileText
};

const getNodeTypeIcon = (type: string): React.ElementType => ICON_MAP[type] || ICON_MAP.DEFAULT;

const processFigmaDocument = (documentNode: FigmaNode): ProcessedDocument => {
  const allNodes: (FigmaNode & { depth: number })[] = [];
  const nodeCounts: Record<string, number> = {};

  const traverse = (node: FigmaNode, depth: number = 0) => {
    allNodes.push({ ...node, depth });
    nodeCounts[node.type] = (nodeCounts[node.type] || 0) + 1;
    
    if (node.children) {
      node.children.forEach(child => traverse(child, depth + 1));
    }
  };

  traverse(documentNode);
  return { allNodes, nodeCounts };
};

// Component cards
const FileInfoCard: React.FC<{ figmaData: FigmaApiResponse; fileKey: string }> = ({ figmaData, fileKey }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <FileText className="w-5 h-5" />
        <span>File Information</span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-gray-600">File Name:</span>
          <p className="font-medium">{figmaData.name}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">File Key:</span>
          <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{fileKey}</p>
        </div>
        <div>
          <span className="text-sm text-gray-600">Last Modified:</span>
          <p className="font-medium">{formatDate(figmaData.lastModified)}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const StatsCard: React.FC<{ stats: { totalNodes: number; componentCount: number; styleCount: number; nodeTypesCount: number } }> = ({ stats }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center space-x-2">
        <Layers className="w-5 h-5" />
        <span>Content Statistics</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-primary">{stats.totalNodes}</div>
          <div className="text-sm text-gray-600">Total Elements</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-secondary">{stats.componentCount}</div>
          <div className="text-sm text-gray-600">Components</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-success">{stats.styleCount}</div>
          <div className="text-sm text-gray-600">Styles</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-warning">{stats.nodeTypesCount}</div>
          <div className="text-sm text-gray-600">Node Types</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const NodeTypeDistributionCard: React.FC<{ nodeCounts: Record<string, number> }> = ({ nodeCounts }) => {
  const totalNodes = Object.values(nodeCounts).reduce((sum, count) => sum + count, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Element Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(nodeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([type, count]) => {
              const percentage = Math.round((count / totalNodes) * 100);
              const IconComponent = getNodeTypeIcon(type);
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{type}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{percentage}%</span>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

// Component list with search
const ComponentListCard: React.FC<{ components: Record<string, FigmaComponent> }> = ({ components }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredComponents = useMemo(() => {
    const componentArray = Object.entries(components || {});
    if (!debouncedSearchTerm) return componentArray;

    return componentArray.filter(([, component]) =>
      component.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      component.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [components, debouncedSearchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Component className="w-5 h-5" />
          <span>Components ({Object.keys(components).length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search components..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredComponents.length > 0 ? (
            filteredComponents.map(([key, component]) => (
              <div key={key} className="p-3 border rounded-lg">
                <div className="font-medium text-gray-900">{component.name}</div>
                {component.description && (
                  <div className="text-sm text-gray-600 mt-1">{component.description}</div>
                )}
                <Badge variant="secondary" className="mt-2 text-xs">
                  Component
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No components found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Style list with search
const StyleListCard: React.FC<{ styles: Record<string, FigmaStyle> }> = ({ styles }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredStyles = useMemo(() => {
    const styleArray = Object.entries(styles || {});
    if (!debouncedSearchTerm) return styleArray;

    return styleArray.filter(([, style]) => 
      style.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [styles, debouncedSearchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="w-5 h-5" />
          <span>Styles ({Object.keys(styles).length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search styles..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredStyles.length > 0 ? (
            filteredStyles.map(([key, style]) => (
              <div key={key} className="p-3 border rounded-lg">
                <div className="font-medium text-gray-900">{style.name}</div>
                <Badge variant="outline" className="mt-2 text-xs">
                  {style.type}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No styles found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Virtualized document structure
const DocumentStructureCard: React.FC<{ nodes: (FigmaNode & { depth: number })[] }> = ({ nodes }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const node = nodes[index];
    const IconComponent = getNodeTypeIcon(node.type);
    return (
      <div style={{ ...style, paddingLeft: `${node.depth * 16}px` }} className="flex items-center space-x-2 py-1" title={`${node.name} (${node.type})`}>
        <IconComponent className="w-3 h-3 text-gray-500 flex-shrink-0" aria-hidden="true" />
        <span className="truncate font-mono text-xs">{node.name || 'Unnamed'}</span>
        <span className="text-gray-400 font-mono text-xs">({node.type})</span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Structure ({nodes.length} elements)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full border rounded-md bg-gray-50 p-1">
          <List height={376} itemCount={nodes.length} itemSize={28} width="100%">
            {Row}
          </List>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
export function FigmaInfoDisplay({ figmaData, fileKey, isLoading }: FigmaInfoDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Info className="mr-2 h-4 w-4" />
        <span>Loading data...</span>
      </div>
    );
  }
  
  if (!figmaData || !figmaData.document) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertTriangle className="mr-2 h-4 w-4" />
        <span>Error occurred while fetching data.</span>
      </div>
    );
  }

  const { allNodes, nodeCounts } = useMemo(() => {
    return processFigmaDocument(figmaData.document);
  }, [figmaData.document]);

  const componentCount = Object.keys(figmaData.components || {}).length;
  const styleCount = Object.keys(figmaData.styles || {}).length;
  
  const stats = {
    totalNodes: allNodes.length,
    componentCount,
    styleCount,
    nodeTypesCount: Object.keys(nodeCounts).length
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>File Information</span>
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center space-x-2">
            <Code2 className="w-4 h-4" />
            <span>Structure Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6 mt-4">
          <FileInfoCard figmaData={figmaData} fileKey={fileKey} />
          <StatsCard stats={stats} />
          <NodeTypeDistributionCard nodeCounts={nodeCounts} />
          
          {componentCount > 0 && <ComponentListCard components={figmaData.components} />}
          {styleCount > 0 && <StyleListCard styles={figmaData.styles} />}
        </TabsContent>

        <TabsContent value="structure" className="mt-4">
          <DocumentStructureCard nodes={allNodes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
