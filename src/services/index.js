/**
 * Services Index
 * Central export point for all services
 */

// API Service (MySQL Backend)
export * from './api';
export { default as api } from './api';

// QuickBooks Web Connector Service
export * from './quickbooksConnector';
export { default as qbwcApi } from './quickbooksConnector';

// Re-export Firebase services for backward compatibility
export * from '../firebase';
