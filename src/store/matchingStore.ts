import { create } from 'zustand';
import { matchingApi, type MatchedCandidate } from '@/lib/api';

interface MatchingFilters {
  status: string;
  minScore: number;
  maxScore: number;
  jobId: string;
}

interface MatchingState {
  candidates: MatchedCandidate[];
  filters: MatchingFilters;
  loading: boolean;
  error: string | null;
}

interface MatchingActions {
  fetchCandidates: () => Promise<void>;
  updateStatus: (jobId: string, candidateId: string, status: string) => Promise<void>;
  updateNote: (jobId: string, candidateId: string, note: string) => Promise<void>;
  setFilters: (filters: Partial<MatchingFilters>) => void;
  exportExcel: () => Promise<void>;
  clearError: () => void;
}

type MatchingStore = MatchingState & MatchingActions;

const useMatchingStore = create<MatchingStore>((set, get) => ({
  candidates: [],
  filters: {
    status: '',
    minScore: 0,
    maxScore: 100,
    jobId: '',
  },
  loading: false,
  error: null,

  fetchCandidates: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const params: { status?: string; minScore?: number; maxScore?: number; jobId?: string } = {};
      if (filters.status) params.status = filters.status;
      if (filters.minScore > 0) params.minScore = filters.minScore;
      if (filters.maxScore < 100) params.maxScore = filters.maxScore;
      if (filters.jobId) params.jobId = filters.jobId;
      const candidates = await matchingApi.getCandidates(params);
      set({ candidates, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  updateStatus: async (jobId: string, candidateId: string, status: string) => {
    set({ loading: true, error: null });
    try {
      await matchingApi.updateStatus(jobId, candidateId, status);
      set((state) => ({
        candidates: state.candidates.map((c) =>
          c.candidateId === candidateId ? { ...c, status: status as MatchedCandidate['status'] } : c
        ),
        loading: false,
      }));
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
      throw err;
    }
  },

  updateNote: async (jobId: string, candidateId: string, note: string) => {
    set({ error: null });
    try {
      await matchingApi.updateNote(jobId, candidateId, note);
      set((state) => ({
        candidates: state.candidates.map((c) =>
          c.candidateId === candidateId ? { ...c, note } : c
        ),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  setFilters: (filters: Partial<MatchingFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  exportExcel: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const params: { jobId?: string; status?: string; minScore?: number; maxScore?: number } = {};
      if (filters.jobId) params.jobId = filters.jobId;
      if (filters.status) params.status = filters.status;
      if (filters.minScore > 0) params.minScore = filters.minScore;
      if (filters.maxScore < 100) params.maxScore = filters.maxScore;
      const blob = await matchingApi.exportExcel(params);
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'candidates.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      set({ loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useMatchingStore;
