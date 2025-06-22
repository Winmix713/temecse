import { useState, useCallback, useReducer, useMemo } from 'react';
import type { FigmaApiResponse, ProcessingPhase } from '@/shared/types';

export interface GenerationRequest {
  figmaData: FigmaApiResponse;
  customJsx?: string;
  customCss?: string;
  fullCss?: string;
}

export interface GeneratedResult {
  jsx: string;
  css: string;
  typescript: string;
  componentName: string;
  figmaInfo: {
    name: string;
    lastModified: string;
    nodeCount: number;
    fileKey: string;
  };
  figmaData: FigmaApiResponse;
  accessibility: {
    score: number;
    wcagCompliance: 'A' | 'AA' | 'AAA';
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      element: string;
      fix: string;
    }>;
    suggestions: string[];
  };
  responsive: {
    hasResponsiveDesign: boolean;
  };
  metadata: {
    estimatedAccuracy: number;
    componentType: string;
    complexity: string;
    generationTime: number;
    dependencies: string[];
  };
}

interface PhaseAction {
  type: 'start' | 'progress' | 'complete' | 'error' | 'reset';
  phaseId: number;
  payload?: Partial<ProcessingPhase>;
}

function phasesReducer(state: ProcessingPhase[], action: PhaseAction): ProcessingPhase[] {
  switch (action.type) {
    case 'start':
      return state.map(p => p.id === action.phaseId ? { ...p, status: 'processing', progress: 0 } : p);
    case 'progress':
      return state.map(p => p.id === action.phaseId ? { ...p, progress: action.payload?.progress ?? p.progress } : p);
    case 'complete':
      return state.map(p => p.id === action.phaseId ? { ...p, status: 'completed', progress: 100 } : p);
    case 'error':
      return state.map(p => p.id === action.phaseId ? { ...p, status: 'error', error: action.payload?.error } : p);
    case 'reset':
      return state.map(p => ({ ...p, status: 'pending', progress: 0, error: undefined }));
    default:
      return state;
  }
}

const DEFAULT_PHASES: ProcessingPhase[] = [
  { id: 1, name: 'Figma Analysis', status: 'pending', progress: 0 },
  { id: 2, name: 'Code Generation', status: 'pending', progress: 0 },
  { id: 3, name: 'Quality Assessment', status: 'pending', progress: 0 }
];

export function useCodeGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [phases, dispatch] = useReducer(phasesReducer, DEFAULT_PHASES);

  const updatePhase = useCallback((phaseId: number, update: Partial<ProcessingPhase>) => {
    if (update.status === 'processing') {
      dispatch({ type: 'start', phaseId });
    } else if (update.status === 'completed') {
      dispatch({ type: 'complete', phaseId });
    } else if (update.status === 'error') {
      dispatch({ type: 'error', phaseId, payload: { error: update.error } });
    } else if (update.progress !== undefined) {
      dispatch({ type: 'progress', phaseId, payload: { progress: update.progress } });
    }
  }, []);

  const generateFromFigma = useCallback(async (request: GenerationRequest): Promise<GeneratedResult | null> => {
    try {
      setIsGenerating(true);
      setError(null);
      dispatch({ type: 'reset', phaseId: 0 });
      
      // Phase 1: Figma Analysis
      updatePhase(1, { status: 'processing' });
      const nodeAnalysis = await analyzeFigmaStructure(request.figmaData.document);
      await simulateProgress(1, updatePhase);
      updatePhase(1, { status: 'completed' });
      
      // Phase 2: Code Generation
      updatePhase(2, { status: 'processing' });
      const generatedCode = await generateAdvancedCode(request, nodeAnalysis);
      await simulateProgress(2, updatePhase);
      updatePhase(2, { status: 'completed' });
      
      // Phase 3: Quality Assessment
      updatePhase(3, { status: 'processing' });
      const qualityMetrics = await assessCodeQuality(generatedCode, nodeAnalysis);
      const finalResult = { ...generatedCode, ...qualityMetrics };
      await simulateProgress(3, updatePhase);
      updatePhase(3, { status: 'completed' });
      
      setResult(finalResult);
      return finalResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Code generation failed';
      setError(errorMessage);
      
      // Mark current phase as error
      const currentPhase = phases.find(p => p.status === 'processing')?.id || 2;
      updatePhase(currentPhase, { status: 'error', error: errorMessage });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [phases, updatePhase]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    dispatch({ type: 'reset', phaseId: 0 });
  }, []);

  return {
    isGenerating,
    result,
    phases,
    error,
    generateFromFigma,
    clearResult
  };
}

// Enhanced Figma structure analysis with proper typing
async function analyzeFigmaStructure(document: any): Promise<FigmaAnalysis> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const analysis: FigmaAnalysis = {
        componentType: 'basic',
        complexity: 'low',
        hasResponsiveElements: false,
        interactiveElements: [],
        layoutType: 'static',
        colorPalette: [],
        typography: [],
        spacing: { consistent: true, scale: 'medium' }
      };

      if (!document) {
        resolve(analysis);
        return;
      }

      const traverse = (node: any, depth = 0) => {
        if (!node) return;

        // Analyze node type and properties
        if (node.type === 'FRAME' || node.type === 'COMPONENT') {
          analysis.componentType = 'container';
          if (node.layoutMode) {
            analysis.layoutType = node.layoutMode === 'HORIZONTAL' ? 'flexbox-row' : 'flexbox-column';
          }
        }

        if (['BUTTON', 'INPUT', 'FORM'].includes(node.type)) {
          analysis.interactiveElements.push(node.type);
          analysis.componentType = 'interactive';
        }

        // Check for responsive constraints
        if (node.constraints && node.constraints.horizontal !== 'LEFT') {
          analysis.hasResponsiveElements = true;
        }

        // Analyze colors
        if (node.fills && node.fills.length > 0) {
          node.fills.forEach((fill: any) => {
            if (fill.type === 'SOLID' && fill.color) {
              analysis.colorPalette.push(fill.color);
            }
          });
        }

        // Analyze typography
        if (node.style && node.style.fontSize) {
          analysis.typography.push({
            fontSize: node.style.fontSize,
            fontWeight: node.style.fontWeight || 400,
            fontFamily: node.style.fontFamily || 'Inter'
          });
        }

        // Determine complexity
        if (depth > 3 || (node.children && node.children.length > 5)) {
          analysis.complexity = 'high';
        } else if (depth > 2 || (node.children && node.children.length > 3)) {
          analysis.complexity = 'medium';
        }

        // Recurse through children
        if (node.children) {
          node.children.forEach((child: any) => traverse(child, depth + 1));
        }
      };

      traverse(document);
      resolve(analysis);
    }, 300);
  });
}

// Generate advanced code with proper error handling
async function generateAdvancedCode(request: GenerationRequest, analysis: FigmaAnalysis): Promise<Partial<GeneratedResult>> {
  return new Promise((resolve, reject) => {
    try {
      const startTime = Date.now();
      const componentName = request.figmaData.name?.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedComponent';
      
      // Generate code based on analysis
      const jsx = generateJSX(request.figmaData, analysis, request.customJsx);
      const css = generateCSS(request.figmaData, analysis, request.customCss, request.fullCss);
      const typescript = generateTypeScript(componentName, analysis);
      
      const endTime = Date.now();
      
      setTimeout(() => {
        resolve({
          jsx,
          css,
          typescript,
          componentName,
          figmaInfo: {
            name: request.figmaData.name || 'Unknown',
            lastModified: request.figmaData.lastModified || new Date().toISOString(),
            nodeCount: countNodes(request.figmaData.document),
            fileKey: extractFileKey(request.figmaData)
          },
          figmaData: request.figmaData,
          metadata: {
            estimatedAccuracy: 85,
            componentType: analysis.componentType,
            complexity: analysis.complexity,
            generationTime: endTime - startTime,
            dependencies: calculateDependencies(jsx, analysis)
          }
        });
      }, 800);
    } catch (error) {
      reject(error);
    }
  });
}

// Assess code quality with accessibility analysis
async function assessCodeQuality(code: Partial<GeneratedResult>, analysis: FigmaAnalysis): Promise<Partial<GeneratedResult>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const accessibility = {
        score: analysis.componentType === 'interactive' ? 85 : 90,
        wcagCompliance: 'AA' as const,
        issues: [] as Array<{
          type: 'error' | 'warning' | 'info';
          message: string;
          element: string;
          fix: string;
        }>,
        suggestions: [] as string[]
      };

      // Dynamic accessibility analysis based on Figma data
      if (analysis.interactiveElements.length > 0) {
        accessibility.issues.push({
          type: 'warning',
          message: 'Interactive elements should have proper ARIA labels',
          element: 'interactive elements',
          fix: 'Add aria-label or aria-labelledby attributes'
        });
        accessibility.suggestions.push('Add keyboard navigation support');
      }

      if (analysis.colorPalette.length > 0) {
        accessibility.suggestions.push('Verify color contrast ratios meet WCAG standards');
      }

      resolve({
        accessibility,
        responsive: {
          hasResponsiveDesign: analysis.hasResponsiveElements
        }
      });
    }, 400);
  });
}

// Enhanced code generation functions
function generateJSX(figmaData: FigmaApiResponse, analysis: FigmaAnalysis, customJsx?: string): string {
  const componentName = figmaData.name?.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedComponent';
  
  const imports = `import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
${analysis.interactiveElements.includes('BUTTON') ? "import { Button } from '@/components/ui/button';" : ''}
${analysis.interactiveElements.includes('INPUT') ? "import { Input } from '@/components/ui/input';" : ''}`;

  const stateManagement = analysis.componentType === 'interactive' ? `
  const [state, setState] = useState({
    isHovered: false,
    isPressed: false,
    isFocused: false
  });

  const handleInteraction = useCallback((type: keyof typeof state, value: boolean) => {
    setState(prev => ({ ...prev, [type]: value }));
  }, []);` : '';

  const componentJSX = generateJSXStructure(analysis);

  return `${imports}

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

export function ${componentName}({
  className,
  children,
  variant = 'default',
  size = 'md',
  disabled = false,
  onClick,
  ...props
}: ${componentName}Props) {${stateManagement}

  ${customJsx ? `// Custom JSX Code\n  ${customJsx}\n` : ''}

  return (
    ${componentJSX}
  );
}

export default ${componentName};`;
}

function generateJSXStructure(analysis: FigmaAnalysis): string {
  const layoutClass = analysis.layoutType === 'flexbox-row' ? 'flex flex-row' : 
                     analysis.layoutType === 'flexbox-column' ? 'flex flex-col' : 'block';

  if (analysis.componentType === 'interactive') {
    return `<div
      className={cn(
        'relative ${layoutClass} items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 px-4 py-2': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled
        },
        className
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </div>`;
  }

  return `<div
      className={cn(
        'relative ${layoutClass} rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>`;
}

function generateCSS(figmaData: FigmaApiResponse, analysis: FigmaAnalysis, customCss?: string, fullCss?: string): string {
  const componentName = figmaData.name?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'component';
  
  let css = `/* Generated CSS for ${figmaData.name} */
:root {
  --${componentName}-primary: hsl(221.2 83.2% 53.3%);
  --${componentName}-primary-foreground: hsl(210 40% 98%);
  --${componentName}-secondary: hsl(210 40% 96%);
  --${componentName}-border: hsl(214.3 31.8% 91.4%);
  --${componentName}-radius: 0.5rem;
}

.${componentName}-container {
  position: relative;
  width: 100%;
  max-width: 32rem;
  margin: 0 auto;
  padding: 1.5rem;
  background: var(--${componentName}-secondary);
  border: 1px solid var(--${componentName}-border);
  border-radius: var(--${componentName}-radius);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.${componentName}-element {
  display: ${analysis.layoutType.includes('flexbox') ? 'flex' : 'block'};
  align-items: center;
  justify-content: center;
  border-radius: calc(var(--${componentName}-radius) - 2px);
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

${analysis.componentType === 'interactive' ? `
.${componentName}-element:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.${componentName}-element:focus-visible {
  outline: 2px solid var(--${componentName}-primary);
  outline-offset: 2px;
}` : ''}

@keyframes ${componentName}-fade-in {
  from { opacity: 0; transform: translateY(-0.5rem); }
  to { opacity: 1; transform: translateY(0); }
}

.${componentName}-animate-in {
  animation: ${componentName}-fade-in 0.3s ease-out;
}`;

  if (customCss) {
    css += `\n\n/* Custom CSS */\n${customCss}`;
  }

  if (fullCss) {
    css = fullCss;
  }

  return css;
}

function generateTypeScript(componentName: string, analysis: FigmaAnalysis): string {
  const interactiveTypes = analysis.componentType === 'interactive' ? `
export interface ${componentName}State {
  isHovered: boolean;
  isPressed: boolean;
  isFocused: boolean;
}

export interface ${componentName}Handlers {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  onHover?: (isHovered: boolean) => void;
}` : '';

  return `// TypeScript definitions for ${componentName}
import { ReactNode, HTMLAttributes } from 'react';

export interface ${componentName}Props extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

${interactiveTypes}

export type ${componentName}Variant = NonNullable<${componentName}Props['variant']>;
export type ${componentName}Size = NonNullable<${componentName}Props['size']>;

// Accessibility types
export interface ${componentName}A11yProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
  tabIndex?: number;
}

export interface Enhanced${componentName}Props 
  extends ${componentName}Props, 
          ${componentName}A11yProps {
  tooltip?: string;
  analytics?: {
    event: string;
    properties?: Record<string, unknown>;
  };
}`;
}

// Helper functions
async function simulateProgress(phaseId: number, updatePhase: (id: number, update: Partial<ProcessingPhase>) => void): Promise<void> {
  const steps = [25, 50, 75, 100];
  for (const progress of steps) {
    await new Promise(resolve => setTimeout(resolve, 150));
    updatePhase(phaseId, { progress });
  }
}

function countNodes(node: any): number {
  if (!node) return 0;
  let count = 1;
  if (node.children) {
    count += node.children.reduce((sum: number, child: any) => sum + countNodes(child), 0);
  }
  return count;
}

function extractFileKey(figmaData: any): string {
  return figmaData.fileKey || figmaData.key || figmaData.id || 'generated-component';
}

function calculateDependencies(jsx: string, analysis: FigmaAnalysis): string[] {
  const deps = ['react', '@/lib/utils'];
  
  if (analysis.interactiveElements.includes('BUTTON')) {
    deps.push('@/components/ui/button');
  }
  if (analysis.interactiveElements.includes('INPUT')) {
    deps.push('@/components/ui/input');
  }
  if (jsx.includes('lucide-react')) {
    deps.push('lucide-react');
  }
  
  return deps;
}

// Types
interface FigmaAnalysis {
  componentType: 'basic' | 'interactive' | 'container';
  complexity: 'low' | 'medium' | 'high';
  hasResponsiveElements: boolean;
  interactiveElements: string[];
  layoutType: 'static' | 'flexbox-row' | 'flexbox-column';
  colorPalette: any[];
  typography: Array<{
    fontSize: number;
    fontWeight: number;
    fontFamily: string;
  }>;
  spacing: {
    consistent: boolean;
    scale: string;
  };
}