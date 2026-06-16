import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Filter } from 'lucide-react';
import useMatchingStore from '@/store/matchingStore';
import useJobStore from '@/store/jobStore';

const statusOptions = [
  { value: 'pending', label: '待定', color: 'bg-gray-100 text-gray-600' },
  { value: 'screening', label: '初筛', color: 'bg-blue-100 text-blue-700' },
  { value: 'interview', label: '面试', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'offer', label: '发Offer', color: 'bg-green-100 text-green-700' },
  { value: 'rejected', label: '淘汰', color: 'bg-red-100 text-red-700' },
];

export default function Candidates() {
  const { candidates, filters, loading, fetchCandidates, setFilters, exportExcel } = useMatchingStore();
  const { jobs, fetchJobs } = useJobStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleExport = async () => {
    try {
      await exportExcel();
    } catch {}
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find((o) => o.value === status);
    return option || statusOptions[0];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">候选人筛选</h1>
        <button
          onClick={handleExport}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E85A25] disabled:opacity-50 transition-colors"
        >
          <Download size={16} />
          导出Excel
        </button>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-700">筛选条件</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">岗位</label>
            <select
              value={filters.jobId}
              onChange={(e) => setFilters({ jobId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
            >
              <option value="">全部岗位</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">状态</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(option.value)}
                    onChange={(e) => {
                      const current = filters.status ? filters.status.split(',') : [];
                      const updated = e.target.checked
                        ? [...current, option.value]
                        : current.filter((s) => s !== option.value);
                      setFilters({ status: updated.join(',') });
                    }}
                    className="rounded border-gray-300 text-[#1E3A5F] focus:ring-[#1E3A5F] w-3.5 h-3.5"
                  />
                  <span className={`px-1.5 py-0.5 rounded text-xs ${option.color}`}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              最低匹配分: {filters.minScore}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={filters.minScore}
              onChange={(e) => setFilters({ minScore: Number(e.target.value) })}
              className="w-full accent-[#1E3A5F]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              最高匹配分: {filters.maxScore}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={filters.maxScore}
              onChange={(e) => setFilters({ maxScore: Number(e.target.value) })}
              className="w-full accent-[#1E3A5F]"
            />
          </div>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm">
          <p className="text-gray-500">暂无符合条件的候选人</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">岗位</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">匹配分</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {candidates.map((candidate) => {
                const badge = getStatusBadge(candidate.status);
                return (
                  <tr key={`${candidate.candidateId}-${candidate.resumeId}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-800">{candidate.candidateName}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-600">
                        {candidate.jobTitle || jobs.find((j) => j.id === candidate.jobId)?.title || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-sm font-bold ${
                          candidate.matchScore >= 80
                            ? 'text-green-600'
                            : candidate.matchScore >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.round(candidate.matchScore)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => navigate(`/hr/jobs/${candidate.jobId || filters.jobId}`)}
                        className="text-xs text-[#1E3A5F] hover:underline font-medium"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
