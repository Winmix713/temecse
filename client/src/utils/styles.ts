export interface ExtractedStyles {
  colors: Set<string>;
  typography: Map<string, any>;
}

/**
 * Recursively extracts colors and typography styles from Figma nodes
 */
export function extractStyles(node: any, styles: ExtractedStyles = { colors: new Set(), typography: new Map() }): ExtractedStyles {
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.type === 'SOLID' && fill.color) {
        const { r, g, b, a } = fill.color;
        if (a > 0) {
          const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
          styles.colors.add(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
        }
      }
    }
  }

  if (node.type === 'TEXT' && node.style) {
    const { fontFamily, fontWeight, fontSize, lineHeightPx } = node.style;
    const key = `${fontFamily}-${fontWeight}-${fontSize}-${lineHeightPx || 'auto'}`;
    if (!styles.typography.has(key)) {
      styles.typography.set(key, {
        fontFamily,
        fontWeight,
        fontSize,
        lineHeight: lineHeightPx ? `${lineHeightPx}px` : 'normal'
      });
    }
  }

  if (node.children) {
    for (const child of node.children) {
      extractStyles(child, styles);
    }
  }

  return styles;
}

/**
 * Generates CSS with design tokens from extracted styles
 */
export function generateStyleTokensCss(styles: ExtractedStyles): string {
  let css = '/* === FIGMÁBÓL KINYERT DESIGN TOKENS === */\n\n';
  
  // Colors
  if (styles.colors.size > 0) {
    css += ':root {\n';
    let i = 1;
    for (const color of styles.colors) {
      css += `  --color-brand-${i++}: ${color};\n`;
    }
    css += '}\n\n';
  }

  // Typography
  if (styles.typography.size > 0) {
    css += '/* Tipográfiai segédosztályok */\n';
    let i = 1;
    for (const [key, style] of styles.typography.entries()) {
      css += `.typography-style-${i++} { /* ${key} */\n`;
      css += `  font-family: "${style.fontFamily}", sans-serif;\n`;
      css += `  font-size: ${style.fontSize}px;\n`;
      css += `  font-weight: ${style.fontWeight};\n`;
      css += `  line-height: ${style.lineHeight};\n}\n\n`;
    }
  }

  return css;
}

/**
 * Creates complete CSS template with base styles and custom code
 */
export function createCssTemplate(
  componentName: string,
  styleTokens: string,
  customCss: string,
  fullCss: string
): string {
  const baseCss = `/* Alap stílusok a ${componentName} komponenshez */
.${componentName.toLowerCase()}-container {
  /* Használd a kinyert színeket! pl.: background-color: var(--color-brand-1); */
  padding: 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background-color: #ffffff;
  font-family: sans-serif;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* A vázlat stílusai */
.structure-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.structure-list {
  list-style: none;
  padding: 0;
}

.structure-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.structure-item:nth-child(odd) {
  background-color: #f8fafc;
}

.structure-item__name {
  font-weight: 500;
}

.structure-item__type {
  font-size: 0.875rem;
  color: #64748b;
}

.structure-note {
  margin-top: 1.5rem;
  font-style: italic;
  color: #475569;
  font-size: 0.875rem;
  text-align: center;
}`;

  const customCssSection = customCss.trim() ? `\n\n/* === EGYÉNI CSS STÍLUSOK === */\n${customCss}` : '';
  const fullCssSection = fullCss.trim() ? `\n\n/* === FEJLETT CSS FUNKCIÓK === */\n${fullCss}` : '';
  
  return `${styleTokens}\n${baseCss}${customCssSection}${fullCssSection}`;
}