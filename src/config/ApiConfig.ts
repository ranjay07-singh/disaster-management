// API Configuration for Disaster Management System
export const API_CONFIG = {
  // Using API Gateway instead of direct EC2 access (HTTPS enabled)
  BASE_URL: 'https://mnjvucz4b4.execute-api.us-east-1.amazonaws.com/prod/api',
  
  // Health endpoints (public access)
  HEALTH: '/health',
  HEALTH_DATABASE: '/health/database',
  
  // User endpoints (authenticated)
  USERS: '/users',
  LOGIN: '/users/login',
  REGISTER: '/users/register',
  
  // Emergency endpoints (authenticated)
  EMERGENCY: '/emergency',
  CREATE_CASE: '/emergency/cases',
  GET_CASES: '/emergency/cases',
  UPDATE_CASE: '/emergency/cases',
  
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