import { z } from 'zod';
import {
  FigmaNode,
  GeneratedComponent,
  ComponentMetadata,
  AccessibilityReport,
  ResponsiveBreakpoints
} from '../types/figma';

/** Zod schema a FigmaNode validálásához */
const ColorSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
  a: z.number().optional()
});
export const FigmaNodeSchema: z.ZodType<FigmaNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    children: z.array(FigmaNodeSchema).optional(),
    fills: z
      .array(z.object({ type: z.string() }))
      .optional(),
    absoluteBoundingBox: z
      .object({ width: z.number(), height: z.number() })
      .optional(),
    style: z
      .object({
        fontSize: z.number().optional(),
        fontWeight: z.number().optional(),
        textAlignHorizontal: z.string().optional()
      })
      .optional(),
    backgroundColor: ColorSchema.optional(),
    layoutMode: z.string().optional(),
    paddingLeft: z.number().optional(),
    paddingRight: z.number().optional(),
    paddingTop: z.number().optional(),
    paddingBottom: z.number().optional(),
    cornerRadius: z.number().optional(),
    itemSpacing: z.number().optional(),
    constraints: z.object({
      horizontal: z.string(),
      vertical: z.string()
    }).optional(),
    effects: z.array(z.any()).optional(),
    fills: z.array(z.any()).optional(),
    characters: z.string().optional()
    // … egyéb mezők, ha kell
  })
);

export class CodeGenerator {
  // Cache-ek a duplikációk elkerüléséért
  private componentCache = new Map<string, GeneratedComponent>();
  private fragmentCache = new Map<string, string>();

  /** Fő komponensgenerátor */
  public generateComponent(
    rawNode: any,
    config: {
      framework: 'react' | 'vue' | 'html';
      styling: 'tailwind' | 'css-modules' | 'styled-components' | 'plain-css';
      typescript: boolean;
    }
  ): GeneratedComponent {
    // 3. Bemeneti validáció
    const node = FigmaNodeSchema.parse(rawNode);

    // Cache check
    if (this.componentCache.has(node.id)) {
      return this.componentCache.get(node.id)!;
    }

    const startTime = Date.now();
    // DRY prop-interface
    const propsDef = this.getPropsInterface(node);
    // JSX-fragment előállítása
    const jsxBody = this.generateJSX(node, config, propsDef);
    // Automatikus import-collect
    const imports = this.collectImports(jsxBody, config.framework);
    const finalJsx = `${imports.join('\n')}\n\n${jsxBody}`;

    const css = this.generateCSS(node, config.styling);
    const accessibility = this.analyzeAccessibility(node);
    const responsive = this.analyzeResponsive(node);
    const metadata = this.generateMetadata(node, Date.now() - startTime);

    const component: GeneratedComponent = {
      id: node.id,
      name: this.sanitizeComponentName(node.name),
      jsx: finalJsx,
      css,
      ...(config.typescript && { typescript: propsDef.interfaceString }),
      accessibility,
      responsive,
      metadata
    };

    this.componentCache.set(node.id, component);
    return component;
  }

  /** Összegyűjti az importokat a JSX kimenet alapján */
  private collectImports(
    jsxBody: string,
    framework: 'react' | 'vue' | 'html'
  ): string[] {
    const imports: string[] = [];
    if (framework === 'react') {
      imports.push(`import React from 'react';`);
    }
    if (jsxBody.includes('src={') && jsxBody.includes('alt={')) {
      imports.push(`import Image from 'next/image';`);
    }
    return imports;
  }

  /** Egységes prop-interface generálás */
  private getPropsInterface(node: FigmaNode): {
    props: Array<{ name: string; type: string; optional: boolean }>;
    interfaceString: string;
  } {
    const props: Array<{ name: string; type: string; optional: boolean }> = [];

    if (node.type === 'TEXT' && node.characters) {
      props.push({ name: 'text', type: 'string', optional: false });
    }
    if (node.fills?.some(f => (f as any).type === 'IMAGE')) {
      props.push({ name: 'src', type: 'string', optional: false });
      props.push({ name: 'alt', type: 'string', optional: false });
    }
    props.push({ name: 'className', type: 'string', optional: true });

    const componentName = this.sanitizeComponentName(node.name);
    const fields = props
      .map(
        p => `  ${p.name}${p.optional ? '?' : ''}: ${p.type};`
      )
      .join('\n');
    const interfaceString = `interface ${componentName}Props {\n${fields}\n}\n`;

    return { props, interfaceString };
  }

  /** Teljes JSX generálás import nélkül */
  private generateJSX(
    node: FigmaNode,
    config: any,
    propsDef: {
      props: Array<{ name: string; type: string; optional: boolean }>;
      interfaceString: string;
    }
  ): string {
    const componentName = this.sanitizeComponentName(node.name);
    const propNames = propsDef.props.map(p => p.name).join(', ');

    // Csak React implementáció
    return `${config.typescript ? propsDef.interfaceString : ''}
export const ${componentName}${
      config.typescript ? `: React.FC<${componentName}Props>` : ''
    } = ({ ${propNames} }) => {
  return (
    ${this.generateJSXFragment(node, config, propsDef)}
  );
};`;
  }

  /** JSX-fragment generálása rekurzívan + cache */
  private generateJSXFragment(
    node: FigmaNode,
    config: any,
    propsDef: {
      props: Array<{ name: string; type: string; optional: boolean }>;
    }
  ): string {
    const cacheKey = `${node.id}|${config.styling}`;
    if (this.fragmentCache.has(cacheKey)) {
      return this.fragmentCache.get(cacheKey)!;
    }

    const tag = this.getHtmlTag(node);
    const className = this.generateClassName(node, config.styling);
    const aria = this.generateAriaAttributes(node);

    let fragment: string;
    if (tag === 'img') {
      fragment = `<img src={src} alt={alt} className="${className}"${aria} />`;
    } else {
      const children = node.children
        ?.map(child =>
          this.generateJSXFragment(child, config, propsDef)
        )
        .join('\n      ') ?? '';
      const inner = node.type === 'TEXT' ? `{text}` : children;
      fragment = `<${tag} className="${className}"${aria}>
      ${inner}
    </${tag}>`;
    }

    this.fragmentCache.set(cacheKey, fragment);
    return fragment;
  }

  /** HTML-tag mapping + bővíthető semantic elemek */
  private htmlTagMap: Record<string, string> = {
    TEXT: 'span',
    FRAME: 'section',
    RECTANGLE: 'div',
    BUTTON: 'button',
    LINK: 'a'
  };

  private getHtmlTag(node: FigmaNode): string {
    return this.htmlTagMap[node.type] || 'div';
  }

  /** ARIA-role generálás node name alapján */
  private generateAriaAttributes(node: FigmaNode): string {
    const name = node.name.toLowerCase();
    if (name.includes('header')) return ' role="banner"';
    if (name.includes('footer')) return ' role="contentinfo"';
    return '';
  }

  /** CSS generálása (Tailwind vagy sima CSS) */
  private generateCSS(node: FigmaNode, styling: string): string {
    const styles = this.extractStyles(node);
    if (styling === 'tailwind') {
      return this.convertToTailwind(styles, node);
    }
    return this.convertToCSS(styles, styling);
  }

  /** Kimeneti CSS stílusok kivonása */
  private extractStyles(node: FigmaNode): Record<string, any> {
    const styles: Record<string, any> = {};
    if (node.absoluteBoundingBox) {
      styles.width = `${node.absoluteBoundingBox.width}px`;
      styles.height = `${node.absoluteBoundingBox.height}px`;
    }
    if (node.backgroundColor) {
      const { r, g, b, a = 1 } = node.backgroundColor;
      styles.backgroundColor = `rgba(${Math.round(r * 255)}, ${Math.round(
        g * 255
      )}, ${Math.round(b * 255)}, ${a})`;
    }
    if (node.cornerRadius) {
      styles.borderRadius = `${node.cornerRadius}px`;
    }
    return styles;
  }

  /** Tailwind-konvertálás bővített tipográfiával */
  private convertToTailwind(
    styles: Record<string, any>,
    node: FigmaNode
  ): string {
    const classes: string[] = [];

    // Layout
    if (node.layoutMode === 'HORIZONTAL') classes.push('flex', 'flex-row');
    if (node.layoutMode === 'VERTICAL') classes.push('flex', 'flex-col');
    if (node.itemSpacing) classes.push(`gap-${Math.round(node.itemSpacing / 4)}`);
    if (node.paddingLeft) classes.push(`pl-${Math.round(node.paddingLeft / 4)}`);
    if (node.paddingRight) classes.push(`pr-${Math.round(node.paddingRight / 4)}`);
    if (node.paddingTop) classes.push(`pt-${Math.round(node.paddingTop / 4)}`);
    if (node.paddingBottom) classes.push(`pb-${Math.round(node.paddingBottom / 4)}`);

    // Border radius
    if (node.cornerRadius) classes.push('rounded');

    // Színek (simplified)
    if (styles.backgroundColor) classes.push('bg-gray-500');

    // Tipográfia
    if (node.style?.fontSize)
      classes.push(`text-${Math.round(node.style.fontSize / 4)}`);
    if (node.style?.fontWeight)
      classes.push(`font-${node.style.fontWeight}`);
    if (node.style?.textAlignHorizontal)
      classes.push(`text-${node.style.textAlignHorizontal.toLowerCase()}`);

    return classes.join(' ');
  }

  /** Sima CSS generálás */
  private convertToCSS(styles: Record<string, any>, _: string): string {
    const rules = Object.entries(styles)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    return `.component {\n${rules}\n}`;
  }

  /** Akadálymentességi elemzés (eredeti implementáció) */
  private analyzeAccessibility(node: FigmaNode): AccessibilityReport {
    // … (hagyjuk változatlanul vagy finomítjuk szükség szerint)
    let score = 100;
    const issues: any[] = [];
    const suggestions: string[] = [];

    if (node.type === 'RECTANGLE' && node.fills?.some(f => (f as any).type === 'IMAGE')) {
      issues.push({
        type: 'error',
        message: 'Image missing alt text',
        element: node.name,
        fix: 'Add alt attribute with descriptive text'
      });
      score -= 20;
    }
    if (node.type === 'TEXT') {
      suggestions.push('Verify text contrast meets WCAG AA standards');
    }
    if (this.isInteractiveElement(node)) {
      suggestions.push('Ensure keyboard navigation support');
      suggestions.push('Add ARIA labels for screen readers');
    }

    return {
      score,
      issues,
      suggestions,
      wcagCompliance: score >= 80 ? 'AA' : score >= 60 ? 'A' : 'Non-compliant'
    };
  }

  /** Reszponzív elemzés (eredeti implementáció) */
  private analyzeResponsive(node: FigmaNode): ResponsiveBreakpoints {
    const hasFlex = node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL';
    const hasConstraints =
      node.constraints?.horizontal !== 'LEFT' ||
      node.constraints?.vertical !== 'TOP';

    return {
      mobile: this.generateResponsiveCSS(node, 'mobile'),
      tablet: this.generateResponsiveCSS(node, 'tablet'),
      desktop: this.generateResponsiveCSS(node, 'desktop'),
      hasResponsiveDesign: hasFlex || hasConstraints
    };
  }

  /** Metadaták előállítása (eredeti implementáció) */
  private generateMetadata(
    node: FigmaNode,
    generationTime: number
  ): ComponentMetadata {
    return {
      figmaNodeId: node.id,
      componentType: this.detectComponentType(node),
      complexity: this.calculateComplexity(node),
      estimatedAccuracy: this.estimateAccuracy(node),
      generationTime,
      dependencies: this.extractDependencies(node)
    };
  }

  // … A segédfüggvények (sanitizeComponentName, detectComponentType,
  // calculateComplexity, estimateAccuracy, extractDependencies,
  // isInteractiveElement, generateResponsiveCSS) változatlanul áthozva
}
