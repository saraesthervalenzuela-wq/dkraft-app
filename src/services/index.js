/**
 * Services Index
 * Central export point for all services
 */

// API Service (MySQL Backend)
export * from './api';
export { default as api } from './api';

// Re-export Firebase services for backward compatibility
export * from '../firebase';
