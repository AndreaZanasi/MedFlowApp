/**
 * API Service for Django Backend Integration
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

class ApiService {
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session auth
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout/', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me/');
  }

  // Transcription endpoints
  async transcribeAudio(audioFile: File): Promise<{
    success: boolean;
    transcription: string;
    audio_file: string;
  }> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const url = `${API_BASE_URL}/transcribe/`;
    
    console.log('Transcribing audio to:', url);
    console.log('File:', audioFile.name, audioFile.type, audioFile.size);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Success response:', data);
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  // Process transcription through AI agents
  async processTranscription(transcription: string, audioFile?: string): Promise<{
    success: boolean;
    transcription: string;
    patient_data: any;
    soap_note: any;
    clinical_data: any;
    lab_requisition: any;
    pharmacy_requisition: any;
    metadata: any;
  }> {
    return this.request('/process/', {
      method: 'POST',
      body: JSON.stringify({
        transcription,
        audio_file: audioFile || '',
      }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health/');
  }

  // Patient management
  async getAllPatients() {
    return this.request('/patients/');
  }

  async getPatient(patientName: string) {
    return this.request(`/patients/${encodeURIComponent(patientName)}/`);
  }

  async getPatientVisits(patientName: string) {
    return this.request(`/patients/${encodeURIComponent(patientName)}/visits/`);
  }

  async updatePatientVisit(patientName: string, visitId: string, data: any) {
    return this.request(
      `/patients/${encodeURIComponent(patientName)}/visits/${encodeURIComponent(visitId)}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
  }
}

export const apiService = new ApiService();
export default apiService;
