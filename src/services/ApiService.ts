import { API_CONFIG, getAuthHeaders } from '../config/ApiConfig';

export class ApiService {
  private static baseUrl = API_CONFIG.BASE_URL;

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
}