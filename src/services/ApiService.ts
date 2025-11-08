import { API_CONFIG, getAuthHeaders } from '../config/ApiConfig';
import { UnifiedAuthService } from './UnifiedAuthService';

export class ApiService {
  private static baseUrl = API_CONFIG.BASE_URL;
  private static isRefreshing = false;

  // Get authenticated headers
  private static async getAuthenticatedHeaders(): Promise<Record<string, string>> {
    try {
      return await UnifiedAuthService.getAuthHeaders();
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      throw new Error('Authentication required. Please log in.');
    }
  }

  // Make authenticated request with retry on 401
  private static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
    retryOnAuth: boolean = true
  ): Promise<Response> {
    try {
      const headers = await this.getAuthenticatedHeaders();
      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers },
      });

      // Handle 401 errors
      if (response.status === 401 && retryOnAuth && !this.isRefreshing) {
        console.log('🔑 Got 401, attempting auth refresh...');
        this.isRefreshing = true;

        try {
          const refreshed = await UnifiedAuthService.handleAuthenticationExpiry();
          if (refreshed) {
            console.log('✅ Auth refreshed, retrying...');
            return this.makeAuthenticatedRequest(url, options, false);
          }
        } finally {
          this.isRefreshing = false;
        }

        throw new Error('Authentication expired. Please log in again.');
      }

      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Health check methods
  static async checkHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.HEALTH}`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  static async checkDatabaseHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.HEALTH_DATABASE}`);
      return await response.json();
    } catch (error) {
      console.error('Database health check failed:', error);
      throw error;
    }
  }

  // User authentication methods
  static async login(email: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.LOGIN}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return await response.json();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  static async register(userData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.REGISTER}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      });
      return await response.json();
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Emergency case methods
  static async createEmergencyCase(caseData: any, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.CREATE_CASE}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(caseData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create emergency case failed:', error);
      throw error;
    }
  }

  static async getEmergencyCases(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.GET_CASES}`, {
        headers: getAuthHeaders(token),
      });
      return await response.json();
    } catch (error) {
      console.error('Get emergency cases failed:', error);
      throw error;
    }
  }

  // Volunteer methods
  static async updateVolunteerAvailability(availability: any, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.AVAILABILITY}`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify(availability),
      });
      return await response.json();
    } catch (error) {
      console.error('Update volunteer availability failed:', error);
      throw error;
    }
  }

  static async getVolunteerAssignments(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ASSIGNMENTS}`, {
        headers: getAuthHeaders(token),
      });
      return await response.json();
    } catch (error) {
      console.error('Get volunteer assignments failed:', error);
      throw error;
    }
  }

  // Get all emergencies (with authentication)
  static async getAllEmergencies(): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}${API_CONFIG.GET_CASES}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get all emergencies failed:', error);
      throw error;
    }
  }

  // Create emergency with authentication
  static async createEmergencyAuthenticated(emergencyData: any): Promise<any> {
    try {
      console.log('📤 Creating emergency with data:', emergencyData);
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}${API_CONFIG.CREATE_CASE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emergencyData),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Emergency creation failed:', text);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log('✅ Emergency created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Create emergency failed:', error);
      throw error;
    }
  }

  // Update emergency status with authentication
  static async updateEmergencyStatus(emergencyId: string, status: string): Promise<any> {
    try {
      console.log(`📤 Updating emergency ${emergencyId} to status: ${status}`);
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}${API_CONFIG.UPDATE_CASE}/${emergencyId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ Emergency update failed:', text);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log('✅ Emergency updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Update emergency failed:', error);
      throw error;
    }
  }

  // Get all volunteers (with authentication)
  static async getAllVolunteers(): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}${API_CONFIG.VOLUNTEERS}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get all volunteers failed:', error);
      throw error;
    }
  }

  // Get all users (with authentication)
  static async getAllUsers(): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}${API_CONFIG.USERS}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get all users failed:', error);
      throw error;
    }
  }

  // Block user
  static async blockUser(userId: string): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}/users/${userId}/block`,
        { method: 'PUT' }
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Block user failed:', error);
      throw error;
    }
  }

  // Unblock user
  static async unblockUser(userId: string): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}/users/${userId}/unblock`,
        { method: 'PUT' }
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Unblock user failed:', error);
      throw error;
    }
  }

  // Get user location
  static async getUserLocation(userId: string): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}/users/${userId}/location`
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get user location failed:', error);
      throw error;
    }
  }
}
