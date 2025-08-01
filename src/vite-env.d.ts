/// <reference types="vite/client" />

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
