import { create } from 'zustand';
import { jobsApi, type Job, type MatchedCandidate, type JobWithCandidates } from '@/lib/api';

interface JobState {
  jobs: Job[];
  currentJob: JobWithCandidates | null;
  loading: boolean;
  error: string | null;
}

interface JobActions {
  fetchJobs: () => Promise<void>;
  createJob: (data: { title: string; description: string; requirements: string[]; salaryRange?: string }) => Promise<Job>;
  fetchJobDetail: (id: string) => Promise<void>;
  updateJob: (id: string, data: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  calculateMatches: (jobId: string) => Promise<void>;
  clearError: () => void;
}

type JobStore = JobState & JobActions;

const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  currentJob: null,
  loading: false,
  error: null,

  fetchJobs: async () => {
    set({ loading: true, error: null });
    try {
      const jobs = await jobsApi.list();
      set({ jobs, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  createJob: async (data) => {
    set({ loading: true, error: null });
    try {
      const job = await jobsApi.create(data);
      set((state) => ({ jobs: [...state.jobs, job], loading: false }));
      return job;
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  fetchJobDetail: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await jobsApi.get(id);
      set({ currentJob: data, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  updateJob: async (id: string, data: Partial<Job>) => {
    set({ loading: true, error: null });
    try {
      const job = await jobsApi.update(id, data);
      set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? job : j)),
        currentJob: state.currentJob ? { ...state.currentJob, ...job, candidates: state.currentJob.candidates } : null,
        loading: false,
      }));
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  deleteJob: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await jobsApi.remove(id);
      set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== id),
        currentJob: state.currentJob?.id === id ? null : state.currentJob,
        loading: false,
      }));
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  calculateMatches: async (jobId: string) => {
    set({ loading: true, error: null });
    try {
      const result = await jobsApi.calculate(jobId);
      set((state) => ({
        currentJob: state.currentJob
          ? { ...state.currentJob, candidates: result.results }
          : null,
        loading: false,
      }));
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useJobStore;
