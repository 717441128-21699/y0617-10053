import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Filter, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import useMatchingStore from '@/store/matchingStore';
import useJobStore from '@/store/jobStore';
import type { ScoreBreakdown } from '@/lib/api';

function ScoreCircle({ score }: { score: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22C55E' : score >= 50 ? '#EAB308' : '#EF4444';

  return (
    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} stroke="#E5E7EB" strokeWidth="4" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>
        {Math.round(score)}
      </span>
    </div>
  );
}

function ScoreBreakdownMini({ breakdown }: { breakdown: ScoreBreakdown }) {
  const items = [
    { label: '岗位要求', score: breakdown.requirementScore, weight: breakdown.requirementWeight, color: '#3B82F6' },
    { label: 'JD语义', score: breakdown.contentSimScore, weight: breakdown.contentSimWeight, color: '#8B5CF6' },
    { label: '工作经验', score: breakdown.experienceScore, weight: breakdown.experienceWeight, color: '#F59E0B' },
    { label: '教育背景', score: breakdown.educationScore, weight: breakdown.educationWeight, color: '#10B981' },
    { label: '技能加分', score: breakdown.skillsBonus, weight: breakdown.skillsBonusWeight, color: '#EC4899' },
  ];

  return (
    <div className="flex items-stretch gap-1.5 h-12 mt-3">
      {items.map((item) => {
        const pct = item.weight > 0 ? (item.score / item.weight) * 100 : 0;
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center justify-end">
            <div className="w-full relative group">
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{ height: `${Math.max(pct * 0.12, 2)}px`, backgroundColor: item.color, opacity: 0.85 }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                {item.label}: {item.score.toFixed(1)}/{item.weight}
              </div>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <div className="space-y-4">
          {candidates.map((candidate) => {
            const badge = getStatusBadge(candidate.status);
            const rowKey = `${candidate.jobId || 'all'}-${candidate.candidateId}`;
            const isExpanded = expandedId === rowKey;
            return (
              <div
                key={rowKey}
                className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <ScoreCircle score={candidate.matchScore} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800">{candidate.candidateName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        岗位：{candidate.jobTitle || jobs.find((j) => j.id === candidate.jobId)?.title || '-'}
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {candidate.matchPoints.slice(0, 3).map((point) => (
                          <span key={point} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs line-clamp-1">
                            {point}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => navigate(`/hr/jobs/${candidate.jobId || filters.jobId}`)}
                          className="text-xs text-[#1E3A5F] hover:underline font-medium"
                        >
                          查看详情 →
                        </button>
                        {candidate.scoreBreakdown && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : rowKey)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1E3A5F] transition-colors"
                          >
                            <BarChart3 size={14} />
                            分数构成
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>

                      {isExpanded && candidate.scoreBreakdown && (
                        <ScoreBreakdownMini breakdown={candidate.scoreBreakdown} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
