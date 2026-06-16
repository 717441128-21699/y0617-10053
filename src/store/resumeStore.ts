import { create } from 'zustand';
import { resumeApi, type Resume, type ParsedResume } from '@/lib/api';

interface ResumeState {
  resume: Resume | null;
  parsedData: ParsedResume | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

interface ResumeActions {
  uploadResume: (file: File) => Promise<void>;
  fetchResume: () => Promise<void>;
  updateResume: (id: string, data: Partial<Resume>) => Promise<void>;
  setParsedData: (data: ParsedResume | null) => void;
  clearError: () => void;
}

type ResumeStore = ResumeState & ResumeActions;

const useResumeStore = create<ResumeStore>((set) => ({
  resume: null,
  parsedData: null,
  loading: false,
  uploading: false,
  error: null,

  uploadResume: async (file: File) => {
    set({ uploading: true, error: null });
    try {
      const data = await resumeApi.upload(file);
      const parsed: ParsedResume = {
        basicInfo: data.basicInfo,
        education: data.education,
        workExperience: data.workExperience,
        skills: data.skills,
      };
      const resume: Resume = {
        ...data,
        confirmed: !!data.confirmed,
        userId: '',
        filePath: '',
        createdAt: '',
        updatedAt: '',
      };
      set({ parsedData: parsed, resume, uploading: false });
    } catch (err) {
      set({ uploading: false, error: (err as Error).message });
      throw err;
    }
  },

  fetchResume: async () => {
    set({ loading: true, error: null });
    try {
      const data = await resumeApi.getMine();
      set({ resume: data, loading: false });
    } catch (err: any) {
      if (err?.message?.includes('No resume found') || err?.message?.includes('404')) {
        set({ resume: null, loading: false });
      } else {
        set({ loading: false, error: (err as Error).message });
      }
    }
  },

  updateResume: async (id: string, data: Partial<Resume>) => {
    set({ loading: true, error: null });
    try {
      const updated = await resumeApi.update(id, data);
      set({ resume: updated, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  setParsedData: (data: ParsedResume | null) => set({ parsedData: data }),

  clearError: () => set({ error: null }),
}));

export default useResumeStore;
