/**
 * Generates a JSX structure outline from Figma page top-level elements
 */
export function generateJsxStructure(figmaPage: any, componentName: string): string {
  if (!figmaPage || !figmaPage.children) {
    return `<p>A komponens tartalma itt jelenik meg.</p>`;
  }
  
  const topLevelFrames = figmaPage.children;

  return `
    <div className="${componentName.toLowerCase()}__structure-overview">
      <h2 className="structure-title">Figma Struktúra Vázlat</h2>
      <ul className="structure-list">
        ${topLevelFrames.map((frame: any) => `
          <li className="structure-item">
            <span className="structure-item__icon">🖼️</span>
            <span className="structure-item__name">${frame.name || 'Névtelen Frame'}</span>
            <span className="structure-item__type">(${frame.type})</span>
          </li>
        `).join('')}
      </ul>
      <p className="structure-note">
        Ez egy automatikusan generált vázlat. Cseréld le a valós komponens struktúrára!
      </p>
    </div>
  `;
}

/**
 * Creates complete JSX template with TypeScript support
 */
export function createJsxTemplate(
  componentName: string,
  customJsx: string,
  structureJsx: string
): string {
  const customElementInjection = customJsx.trim() ? `
  const CustomElements = () => {
    ${customJsx}
    // @ts-ignore
    return customElement ? <>{customElement}</> : null;
  };` : '';

  return `import React from 'react';
import './${componentName}.css';

interface ${componentName}Props {
  className?: string;
}

export const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {${customElementInjection}
  return (
    <div className={\`${componentName.toLowerCase()}-container \${className || ''}\`}>
      {/* === FIGMÁBÓL KINYERT STRUKTÚRA VÁZLAT === */}
      ${structureJsx.trim()}
      
      {/* === EGYÉNI JSX KÓD HELYE === */}
      ${customJsx.trim() ? `<CustomElements />` : ''}
    </div>
  );
};

export default ${componentName};`;
}