import React from 'react';
import { Figma, Github, Settings } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
              <Figma className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Figma-to-Code</h1>
              <p className="text-sm text-gray-500">AI-Powered Component Generator</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#process" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Process
            </a>
            <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Features
            </a>
            <a href="#docs" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Documentation
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all">
              <Github className="w-5 h-5" />
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}