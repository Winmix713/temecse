// Base Figma API types
export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface Paint {
  type: string;
  color?: Color;
  opacity?: number;
}

export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontSize: number;
  fontWeight?: number;
  lineHeightPx?: number;
  letterSpacing?: number;
  fills?: Paint[];
}

export interface Effect {
  type: string;
  visible?: boolean;
  radius?: number;
  color?: Color;
  offset?: {
    x: number;
    y: number;
  };
}

export interface Constraints {
  horizontal: string;
  vertical: string;
}

export interface AbsoluteBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type NodeType = 
  | 'DOCUMENT'
  | 'CANVAS' 
  | 'FRAME'
  | 'GROUP'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE';

export interface FigmaNode {
  id: string;
  name: string;
  type: NodeType;
  children?: FigmaNode[];
  
  // Layout properties
  absoluteBoundingBox?: AbsoluteBoundingBox;
  constraints?: Constraints;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  
  // Visual properties
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  cornerRadius?: number;
  backgroundColor?: Color;
  opacity?: number;
  effects?: Effect[];
  
  // Text properties
  characters?: string;
  style?: TypeStyle;
  
  // Component properties
  componentId?: string;
  componentSetId?: string;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description?: string;
  componentSetId?: string;
  documentationLinks?: Array<{
    uri: string;
  }>;
}

export interface FigmaStyle {
  key: string;
  name: string;
  description?: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

export interface FigmaApiResponse {
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
  name: string;
  lastModified: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: string;
}

// Generated component types
export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element: string;
  fix: string;
}

export interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
  suggestions: string[];
  wcagCompliance: 'AA' | 'A' | 'Non-compliant';
}

export interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  hasResponsiveDesign: boolean;
}

export interface ComponentMetadata {
  figmaNodeId: string;
  componentType: 'button' | 'card' | 'text' | 'input' | 'layout' | 'complex';
  complexity: 'simple' | 'medium' | 'complex';
  estimatedAccuracy: number;
  generationTime: number;
  dependencies: string[];
}

export interface GeneratedComponent {
  id: string;
  name: string;
  jsx: string;
  css: string;
  tailwind?: string;
  typescript?: string;
  accessibility: AccessibilityReport;
  responsive: ResponsiveBreakpoints;
  metadata: ComponentMetadata;
}

export interface ProcessingPhase {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}