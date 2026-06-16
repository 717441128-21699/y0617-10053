const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export interface APIError {
  message: string;
  llmFailed?: boolean;
  canUseMock?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    const apiError: APIError = {
      message: error.error || `HTTP ${response.status}`,
      llmFailed: error.llmFailed,
      canUseMock: error.canUseMock,
    };
    throw apiError;
  }

  if (response.headers.get('Content-Type')?.includes('spreadsheet') ||
      response.headers.get('Content-Type')?.includes('application/octet-stream')) {
    return response.blob() as unknown as T;
  }

  const json = await response.json();
  return json.data as T;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'hr';
}

export interface ParsedResume {
  basicInfo: {
    name: string;
    phone: string;
    email: string;
    location: string;
  };
  education: Array<{
    school: string;
    degree: string;
    major: string;
    startDate: string;
    endDate: string;
  }>;
  workExperience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: string[];
}

export interface Resume extends ParsedResume {
  id: string;
  userId: string;
  filePath: string;
  confirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  hrId: string;
  title: string;
  description: string;
  requirements: string[];
  salaryRange: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface ScoreBreakdown {
  requirementScore: number;
  requirementWeight: number;
  contentSimScore: number;
  contentSimWeight: number;
  experienceScore: number;
  experienceWeight: number;
  educationScore: number;
  educationWeight: number;
  skillsBonus: number;
  skillsBonusWeight: number;
}

export interface MatchedCandidate {
  candidateId: string;
  resumeId: string;
  candidateName: string;
  candidateEmail?: string;
  jobId?: string;
  jobTitle?: string;
  matchScore: number;
  matchPoints: string[];
  gapPoints: string[];
  scoreBreakdown?: ScoreBreakdown;
  status: 'pending' | 'screening' | 'interview' | 'offer' | 'rejected';
  note: string;
}

export interface JobWithCandidates extends Job {
  candidates: MatchedCandidate[];
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; role: 'candidate' | 'hr' }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () =>
    request<User>('/auth/me'),
};

export const resumeApi = {
  upload: (file: File, useMock = false) => {
    const formData = new FormData();
    formData.append('file', file);
    const query = useMock ? '?useMock=true' : '';
    return request<any>('/resume/upload' + query, {
      method: 'POST',
      body: formData,
    });
  },

  getMine: () =>
    request<Resume | null>('/resume/me'),

  update: (id: string, data: Partial<Resume>) =>
    request<Resume>(`/resume/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const jobsApi = {
  create: (data: { title: string; description: string; requirements: string[]; salaryRange?: string }) =>
    request<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: () =>
    request<Job[]>('/jobs'),

  get: (id: string) =>
    request<JobWithCandidates>(`/jobs/${id}`),

  update: (id: string, data: Partial<Job>) =>
    request<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (id: string) =>
    request<{ message: string }>(`/jobs/${id}`, {
      method: 'DELETE',
    }),

  calculate: (jobId: string) =>
    request<{ jobId: string; totalCandidates: number; results: MatchedCandidate[] }>(`/jobs/${jobId}/calculate`, {
      method: 'POST',
    }),
};

export const matchingApi = {
  updateStatus: (jobId: string, candidateId: string, status: string) =>
    request<{ jobId: string; candidateId: string; status: string }>(`/matching/${jobId}/${candidateId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateNote: (jobId: string, candidateId: string, note: string) =>
    request<{ jobId: string; candidateId: string; note: string }>(`/matching/${jobId}/${candidateId}/note`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    }),

  getCandidates: (params: { status?: string; minScore?: number; maxScore?: number; jobId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.minScore !== undefined) searchParams.set('minScore', String(params.minScore));
    if (params.maxScore !== undefined) searchParams.set('maxScore', String(params.maxScore));
    if (params.jobId) searchParams.set('jobId', params.jobId);
    const query = searchParams.toString();
    return request<MatchedCandidate[]>(`/matching/candidates${query ? `?${query}` : ''}`);
  },

  exportExcel: (params: { jobId?: string; status?: string; minScore?: number; maxScore?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.jobId) searchParams.set('jobId', params.jobId);
    if (params.status) searchParams.set('status', params.status);
    if (params.minScore !== undefined) searchParams.set('minScore', String(params.minScore));
    if (params.maxScore !== undefined) searchParams.set('maxScore', String(params.maxScore));
    const query = searchParams.toString();
    return request<Blob>(`/matching/export${query ? `?${query}` : ''}`);
  },
};
