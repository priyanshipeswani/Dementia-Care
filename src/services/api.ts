// API service for backend communication
const API_BASE_URL = 'http://localhost:8000';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  user_type: 'caregiver' | 'elder';
  relationship_to_elder?: string;
  elder_name?: string;
  elder_age?: number;
  elder_conditions?: string[];
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  phone_number?: string;
  emergency_contact?: string;
  is_active: boolean;
  created_at: string;
}

export interface Photo {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size?: number;
  title?: string;
  description?: string;
  tags?: string;
  people_in_photo?: string;
  location?: string;
  date_taken?: string;
  memory_context?: string;
  recognition_level: string;
  created_at: string;
  updated_at?: string;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  event_type: 'reminder' | 'appointment' | 'medication' | 'activity';
  priority: 'low' | 'medium' | 'high';
  scheduled_date: string;
  duration_minutes?: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  location?: string;
  user_id: number;
  created_by: number;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  completed_at?: string;
  completion_notes?: string;
  related_family_members?: number[];
  related_photos?: number[];
  created_at: string;
  updated_at?: string;
}

export interface EventCreate {
  title: string;
  description?: string;
  event_type: 'reminder' | 'appointment' | 'medication' | 'activity';
  priority?: 'low' | 'medium' | 'high';
  scheduled_date: string;
  duration_minutes?: number;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  location?: string;
  user_id?: number; // Made optional - backend will determine automatically
  related_family_members?: number[];
  related_photos?: number[];
}

export interface EventUpdate {
  title?: string;
  description?: string;
  event_type?: 'reminder' | 'appointment' | 'medication' | 'activity';
  priority?: 'low' | 'medium' | 'high';
  scheduled_date?: string;
  duration_minutes?: number;
  status?: 'scheduled' | 'completed' | 'missed' | 'cancelled';
  completion_notes?: string;
  location?: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  relationship_type: string;
  phone_number?: string;
  email?: string;
  address?: string;
  is_emergency_contact: boolean;
  photo_url?: string;
  notes?: string;
  last_contact_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface PhotoUploadData {
  file: File;
  title?: string;
  description?: string;
  tags?: string;
  people_in_photo?: string;
  location?: string;
  memory_context?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = localStorage.getItem('access_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('🔍 DEBUG: Making HTTP request to:', url);
    console.log('🔍 DEBUG: Request method:', options.method || 'GET');
    console.log('🔍 DEBUG: Request body:', options.body);
    console.log('🔍 DEBUG: Auth token present:', !!this.token);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    console.log('🔍 DEBUG: Request headers:', headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('🔍 DEBUG: Response status:', response.status);
      console.log('🔍 DEBUG: Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🔍 DEBUG: Response data:', data);

      if (!response.ok) {
        console.log('🔍 DEBUG: Request failed with error:', data.detail || 'An error occurred');
        return {
          success: false,
          error: data.detail || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.log('🔍 DEBUG: Network error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication methods
  async login(credentials: LoginCredentials, userType?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const url = userType ? `/api/auth/login?interface=${userType}` : '/api/auth/login';
      const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || 'Login failed',
        };
      }

      // Store token
      this.token = data.access_token;
      localStorage.setItem('access_token', data.access_token);
      
      // Construct user object from login response
      const user = {
        id: data.user_id,
        email: credentials.email,
        user_type: data.user_type,
        full_name: '', // We'll need to fetch this separately or update backend
        phone_number: '',
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(user));

      return {
        success: true,
        data: {
          access_token: data.access_token,
          token_type: data.token_type,
          user: user
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const endpoint = userData.user_type === 'caregiver' 
      ? '/api/auth/register/caregiver' 
      : '/api/auth/register/elder';
    
    return this.request<AuthResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/me');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health');
  }

  // Get stored user
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!localStorage.getItem('user');
  }

  // Photo methods
  async uploadPhoto(photoData: PhotoUploadData): Promise<ApiResponse<Photo>> {
    const formData = new FormData();
    formData.append('file', photoData.file);
    
    if (photoData.title) formData.append('title', photoData.title);
    if (photoData.description) formData.append('description', photoData.description);
    if (photoData.tags) formData.append('tags', photoData.tags);
    if (photoData.people_in_photo) formData.append('people_in_photo', photoData.people_in_photo);
    if (photoData.location) formData.append('location', photoData.location);
    if (photoData.memory_context) formData.append('memory_context', photoData.memory_context);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/photos/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || 'Photo upload failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getPhotos(): Promise<ApiResponse<Photo[]>> {
    return this.request<Photo[]>('/api/photos/');
  }

  async getPhoto(photoId: number): Promise<ApiResponse<Photo>> {
    return this.request<Photo>(`/api/photos/${photoId}`);
  }

  async updatePhoto(photoId: number, updates: Partial<Photo>): Promise<ApiResponse<Photo>> {
    return this.request<Photo>(`/api/photos/${photoId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePhoto(photoId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/photos/${photoId}`, {
      method: 'DELETE',
    });
  }

  getPhotoUrl(photoId: number): string {
    return `${this.baseUrl}/api/photos/serve/${photoId}`;
  }

  // Event methods
  async createEvent(eventData: EventCreate): Promise<ApiResponse<Event>> {
    return this.request<Event>('/api/events/', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getEvents(userId?: number, eventType?: string, status?: string): Promise<ApiResponse<Event[]>> {
    console.log('🔍 DEBUG: getEvents called with userId:', userId, 'eventType:', eventType, 'status:', status);
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId.toString());
    if (eventType) params.append('event_type', eventType);
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/events/?${queryString}` : '/api/events/';
    console.log('🔍 DEBUG: getEvents endpoint:', endpoint);
    
    const result = await this.request<Event[]>(endpoint);
    console.log('🔍 DEBUG: getEvents result:', result);
    return result;
  }

  async getEvent(eventId: number): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/api/events/${eventId}`);
  }

  async updateEvent(eventId: number, updates: EventUpdate): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteEvent(eventId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async getUpcomingEvents(userId: number, limit?: number): Promise<ApiResponse<Event[]>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? 
      `/api/events/user/${userId}/upcoming?${queryString}` : 
      `/api/events/user/${userId}/upcoming`;
    
    return this.request<Event[]>(endpoint);
  }

  async completeEvent(eventId: number, completionNotes?: string): Promise<ApiResponse<Event>> {
    return this.request<Event>(`/api/events/${eventId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ completion_notes: completionNotes }),
    });
  }

  // Family Member methods
  async getFamilyMembers(userId?: number): Promise<ApiResponse<FamilyMember[]>> {
    console.log('🔍 DEBUG: getFamilyMembers called with userId:', userId);
    const params = userId ? `?user_id=${userId}` : '';
    const url = `/api/family-members/${params}`;
    console.log('🔍 DEBUG: getFamilyMembers URL:', url);
    const result = await this.request<FamilyMember[]>(url);
    console.log('🔍 DEBUG: getFamilyMembers result:', result);
    return result;
  }

  async createFamilyMember(familyMemberData: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>, userId: number): Promise<ApiResponse<FamilyMember>> {
    console.log('🔍 DEBUG: Creating family member with data:', JSON.stringify(familyMemberData, null, 2));
    console.log('🔍 DEBUG: User ID:', userId);
    console.log('🔍 DEBUG: Request URL:', `/api/family-members/?user_id=${userId}`);
    
    const requestBody = JSON.stringify(familyMemberData);
    console.log('🔍 DEBUG: Request body:', requestBody);
    
    return this.request<FamilyMember>(`/api/family-members/?user_id=${userId}`, {
      method: 'POST',
      body: requestBody,
    });
  }

  async updateFamilyMember(familyMemberId: number, updates: Partial<FamilyMember>): Promise<ApiResponse<FamilyMember>> {
    return this.request<FamilyMember>(`/api/family-members/${familyMemberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteFamilyMember(familyMemberId: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/api/family-members/${familyMemberId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
