/**
 * Centralized API Base URL Configuration for Worker / Partner App
 * In development, defaults to local port 5050.
 * In production, uses the VITE_API_URL environment variable.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5050').replace(/\/$/, '');
export default API_BASE_URL;
