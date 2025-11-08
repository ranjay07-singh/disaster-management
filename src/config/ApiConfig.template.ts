// ============================================================================
// API CONFIGURATION TEMPLATE
// ============================================================================
// INSTRUCTIONS:
// 1. Copy this file and rename it to 'ApiConfig.ts'
// 2. Replace YOUR_EC2_IP or YOUR_DOMAIN with your actual backend URL
// 3. NEVER commit the actual ApiConfig.ts file to git!
// ============================================================================

// API Configuration for Disaster Management System
export const API_CONFIG = {
  // BACKEND BASE URL
  // Development: Use localhost or your EC2 IP
  // Production: Use your domain name with HTTPS
  BASE_URL: 'http://YOUR_EC2_IP_OR_DOMAIN:8080/api',
  // Example: 'http://3.89.66.238:8080/api' or 'https://api.yourdomain.com/api'

  // Health endpoints (public access)
  HEALTH: '/health',
  HEALTH_DATABASE: '/health/database',
  
  // User endpoints (authenticated)
  USERS: '/users',
  LOGIN: '/users/login',
  REGISTER: '/users/register',
  
  // Emergency endpoints (authenticated)
  EMERGENCY: '/emergency',
  CREATE_CASE: '/emergency',
  GET_CASES: '/emergency',
  UPDATE_CASE: '/emergency',
  
  // Volunteer endpoints (authenticated)
  VOLUNTEERS: '/volunteers',
  AVAILABILITY: '/volunteers/availability',
  ASSIGNMENTS: '/volunteers/assignments',
  
  // File upload endpoints
  UPLOAD: '/files/upload',
  DOWNLOAD: '/files/download',
};

// Request headers
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Authentication headers (add token when available)
export const getAuthHeaders = (token?: string) => ({
  ...API_HEADERS,
  ...(token && { 'Authorization': `Bearer ${token}` }),
});

// Basic Authentication headers for Spring Boot backend
export const getBasicAuthHeaders = (username: string, password: string) => {
  const credentials = btoa(`${username}:${password}`);
  return {
    ...API_HEADERS,
    'Authorization': `Basic ${credentials}`,
  };
};
