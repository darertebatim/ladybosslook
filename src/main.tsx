import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/**
 * Main entry point - SIMPLIFIED (Capacitor removed)
 * 
 * All Capacitor initialization removed to establish a clean baseline.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

console.log('[Main] 🌐 Web platform (Capacitor removed for debugging)');

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
