import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Figma API proxy endpoints (if needed for CORS)
  app.post("/api/figma/file/:fileKey", async (req, res) => {
    try {
      const { fileKey } = req.params;
      const { apiKey } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      // Proxy request to Figma API
      const figmaResponse = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': apiKey,
        },
      });

      if (!figmaResponse.ok) {
        return res.status(figmaResponse.status).json({ 
          error: `Figma API error: ${figmaResponse.statusText}` 
        });
      }

      const data = await figmaResponse.json();
      res.json(data);
    } catch (error) {
      console.error("Figma API proxy error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Code generation endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { figmaData, customJsx, customCss, fullCss } = req.body;

      if (!figmaData) {
        return res.status(400).json({ error: "Figma data is required" });
      }

      // Here you would implement the actual code generation logic
      // For now, we'll return a mock response
      const generatedResult = {
        jsx: generateMockJSX(figmaData),
        css: generateMockCSS(figmaData, customCss, fullCss),
        typescript: generateMockTypeScript(figmaData.name),
        componentName: figmaData.name?.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedComponent',
        figmaInfo: {
          name: figmaData.name,
          lastModified: figmaData.lastModified,
          nodeCount: countNodes(figmaData.document),
          fileKey: 'extracted-from-request'
        },
        accessibility: {
          score: 88,
          wcagCompliance: 'AA',
          issues: [],
          suggestions: ['Add focus states for better keyboard navigation']
        },
        responsive: {
          hasResponsiveDesign: true
        },
        metadata: {
          estimatedAccuracy: 94,
          componentType: 'form',
          complexity: 'medium',
          generationTime: Date.now(),
          dependencies: ['react', '@types/react', 'tailwindcss']
        }
      };

      res.json(generatedResult);
    } catch (error) {
      console.error("Code generation error:", error);
      res.status(500).json({ error: "Code generation failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateMockJSX(figmaData: any): string {
  const componentName = figmaData.name?.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedComponent';
  
  return `import React, { useState } from 'react';

interface ${componentName}Props {
  className?: string;
}

export function ${componentName}({ className }: ${componentName}Props) {
  return (
    <div className={\`generated-component \${className}\`}>
      <h1>Generated from Figma: ${figmaData.name}</h1>
      <p>This is a generated component based on your Figma design.</p>
    </div>
  );
}`;
}

function generateMockCSS(figmaData: any, customCss?: string, fullCss?: string): string {
  let css = `/* Generated CSS for ${figmaData.name} */
.generated-component {
  padding: 1rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.generated-component h1 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: hsl(20, 14.3%, 4.1%);
}

.generated-component p {
  color: hsl(25, 5.3%, 44.7%);
}`;

  if (customCss) {
    css += `\n\n/* Custom CSS */\n${customCss}`;
  }

  if (fullCss) {
    css += `\n\n/* Advanced CSS */\n${fullCss}`;
  }

  return css;
}

function generateMockTypeScript(componentName: string): string {
  return `export interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}`;
}

function countNodes(node: any): number {
  if (!node) return 0;
  
  let count = 1;
  if (node.children) {
    count += node.children.reduce((sum: number, child: any) => sum + countNodes(child), 0);
  }
  
  return count;
}
