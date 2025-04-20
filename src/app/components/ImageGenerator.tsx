'use client';

import { useState, useEffect } from 'react';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Simulate image generation
  const generateImages = () => {
    setIsGenerating(true);
    // Create placeholder URLs - in real implementation these would be actual image URLs
    const mockImages = Array(4).fill('https://picsum.photos/640/360');
    
    // Simulate API delay
    setTimeout(() => {
      setGeneratedImages(mockImages);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Background dots pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e0e0e0_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />

      {/* Main content */}
      <div className="relative">
        {/* Top navigation bar */}
        <nav className="border-b bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Home</h1>
              </div>
            </div>
          </div>
        </nav>

        {/* Main container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Input field */}
          <div className="max-w-3xl mx-auto mb-12">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full px-4 py-3 rounded-lg bg-purple-50 border border-purple-100 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all text-gray-800 placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && prompt.trim()) {
                  generateImages();
                }
              }}
            />
          </div>

          {/* Image grid */}
          {(isGenerating || generatedImages.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {Array(4).fill(null).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[16/9] rounded-lg overflow-hidden relative"
                >
                  {isGenerating ? (
                    <div className="w-full h-full bg-purple-50 animate-pulse flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      <svg
                        className="w-12 h-12 text-purple-200 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="group relative">
                      <img
                        src={generatedImages[index]}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-full object-cover transform transition-all duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 