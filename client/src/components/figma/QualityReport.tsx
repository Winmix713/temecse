import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info, Zap, Shield, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  element: string;
  fix: string;
}

interface GeneratedComponent {
  accessibility: {
    score: number;
    wcagCompliance: 'A' | 'AA' | 'AAA';
    issues: AccessibilityIssue[];
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

interface QualityReportProps {
  component: GeneratedComponent;
}

export function QualityReport({ component }: QualityReportProps) {
  const { accessibility, responsive, metadata } = component;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
    }
  };

  const getIssueColor = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <h4 className="text-xl font-semibold text-gray-900 mb-6">Quality Report</h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Visual Accuracy */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className={cn("p-3 rounded-lg", getScoreBg(metadata.estimatedAccuracy))}>
              <Zap className={cn("w-5 h-5", getScoreColor(metadata.estimatedAccuracy))} />
            </div>
            <div>
              <div className="text-sm text-green-700">Visual Accuracy</div>
              <div className={cn("text-2xl font-bold", "text-green-800")}>
                {metadata.estimatedAccuracy}%
              </div>
            </div>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div className="h-2 rounded-full bg-green-600" style={{ width: `${metadata.estimatedAccuracy}%` }} />
          </div>
        </div>

        {/* Accessibility Score */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className={cn("p-3 rounded-lg", getScoreBg(accessibility.score))}>
              <Shield className={cn("w-5 h-5", getScoreColor(accessibility.score))} />
            </div>
            <div>
              <div className="text-sm text-blue-700">Accessibility</div>
              <div className={cn("text-2xl font-bold", "text-blue-800")}>
                {accessibility.score}%
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="w-full bg-blue-200 rounded-full h-2 mr-3">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${accessibility.score}%` }} />
            </div>
            <Badge variant={accessibility.wcagCompliance === 'AA' ? 'default' : 'secondary'} className="text-xs">
              WCAG {accessibility.wcagCompliance}
            </Badge>
          </div>
        </div>

        {/* Responsive Design */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className={cn(
              "p-3 rounded-lg",
              responsive.hasResponsiveDesign ? "bg-purple-100" : "bg-gray-100"
            )}>
              <Smartphone className={cn(
                "w-5 h-5",
                responsive.hasResponsiveDesign ? "text-purple-600" : "text-gray-400"
              )} />
            </div>
            <div>
              <div className="text-sm text-purple-700">Responsive Design</div>
              <div className={cn(
                "text-2xl font-bold",
                responsive.hasResponsiveDesign ? "text-purple-800" : "text-gray-400"
              )}>
                {responsive.hasResponsiveDesign ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
          <div className="text-xs text-purple-600">
            {responsive.hasResponsiveDesign ? 'Automatic breakpoint support' : 'Fixed layout'}
          </div>
        </div>
      </div>

      {/* Accessibility Issues */}
      {accessibility.issues.length > 0 && (
        <div className="mb-6">
          <h5 className="text-lg font-semibold text-gray-900 mb-3">Accessibility Issues</h5>
          <div className="space-y-3">
            {accessibility.issues.map((issue, index) => {
              const IssueIcon = getIssueIcon(issue.type);
              return (
                <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <IssueIcon className={cn("w-5 h-5 mt-0.5", getIssueColor(issue.type))} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{issue.message}</div>
                    <div className="text-sm text-gray-600">Element: {issue.element}</div>
                    <div className="text-sm text-blue-600 mt-1">Fix: {issue.fix}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {accessibility.suggestions.length > 0 && (
        <div className="mb-6">
          <h5 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h5>
          <div className="space-y-3">
            {accessibility.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-blue-800">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Component Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Type</div>
          <div className="font-medium capitalize">{metadata.componentType}</div>
        </div>
        <div>
          <div className="text-gray-600">Complexity</div>
          <div className="font-medium capitalize">{metadata.complexity}</div>
        </div>
        <div>
          <div className="text-gray-600">Generation Time</div>
          <div className="font-medium">{metadata.generationTime}ms</div>
        </div>
        <div>
          <div className="text-gray-600">Dependencies</div>
          <div className="font-medium">{metadata.dependencies.length} items</div>
        </div>
      </div>
    </div>
  );
}
