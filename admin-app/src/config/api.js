/**
 * Centralized API Base URL Configuration for Admin App
 * In development, defaults to local port 5050.
 * In production, uses the VITE_API_URL environment variable.
 */
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = isLocalhost 
  ? 'http://localhost:5050' 
  : (import.meta.env.VITE_API_URL || 'https://kaam-api-xic2.onrender.com').replace(/\/$/, '');
export default API_BASE_URL;
