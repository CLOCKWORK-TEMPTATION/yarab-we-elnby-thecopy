"use client";

import dynamic from 'next/dynamic';
import './cinefit.css';
import { WebGLErrorBoundary } from '@the-copy/cinefit';

const CineFitApp = dynamic(() => import('./cinefit-app'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-pulse text-zinc-400">Loading CineFit Studio...</div>
    </div>
  ),
});

export default function NewPage() {
  return (
    <WebGLErrorBoundary
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="text-center text-zinc-400">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-semibold mb-2">CineFit Pro</h2>
            <p className="text-sm opacity-70">3D features require WebGL support</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      }
    >
      <CineFitApp />
    </WebGLErrorBoundary>
  );
}
