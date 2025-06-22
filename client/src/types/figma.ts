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
  color?: Color;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: Paint[];
  style?: TypeStyle;
  characters?: string;
}

export interface FigmaApiResponse {
  document: FigmaNode;
  name: string;
  lastModified: string;
  version: string;
}