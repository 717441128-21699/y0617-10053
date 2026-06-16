import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, ChevronDown, ChevronUp, Save, MessageSquare, BarChart3 } from 'lucide-react';
import useJobStore from '@/store/jobStore';
import useMatchingStore from '@/store/matchingStore';
import type { ScoreBreakdown } from '@/lib/api';

function ScoreCircle({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22C55E' : score >= 50 ? '#EAB308' : '#EF4444';

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} stroke="#E5E7EB" strokeWidth="4" fill="none" />
        <circle
          cx="32"
          cy="32"
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

function ScoreBreakdownView({ breakdown, matchScore }: { breakdown: ScoreBreakdown; matchScore: number }) {
  const items = [
    { label: '岗位要求命中', score: breakdown.requirementScore, weight: breakdown.requirementWeight, color: '#3B82F6' },
    { label: 'JD 语义相似', score: breakdown.contentSimScore, weight: breakdown.contentSimWeight, color: '#8B5CF6' },
    { label: '工作经历相关', score: breakdown.experienceScore, weight: breakdown.experienceWeight, color: '#F59E0B' },
    { label: '教育背景匹配', score: breakdown.educationScore, weight: breakdown.educationWeight, color: '#10B981' },
    { label: '额外加分技能', score: breakdown.skillsBonus, weight: breakdown.skillsBonusWeight, color: '#EC4899' },
  ];

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">分数构成详情</p>
        <p className="text-xs text-gray-400">总分：<span className="font-bold text-[#1E3A5F]">{matchScore}</span></p>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => {
          const pct = item.weight > 0 ? (item.score / item.weight) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className="text-xs font-medium text-gray-800">{item.score.toFixed(1)} / {item.weight}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待定', color: 'bg-gray-100 text-gray-600' },
  screening: { label: '初筛', color: 'bg-blue-100 text-blue-700' },
  interview: { label: '面试', color: 'bg-yellow-100 text-yellow-700' },
  offer: { label: '发Offer', color: 'bg-green-100 text-green-700' },
  rejected: { label: '淘汰', color: 'bg-red-100 text-red-700' },
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentJob, fetchJobDetail, calculateMatches, loading } = useJobStore();
  const { updateStatus, updateNote } = useMatchingStore();
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [expandedScore, setExpandedScore] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) fetchJobDetail(id);
  }, [id, fetchJobDetail]);

  const handleCalculate = async () => {
    if (!id) return;
    try {
      await calculateMatches(id);
    } catch {}
  };

  const handleStatusChange = async (candidateId: string, status: string) => {
    if (!id) return;
    try {
      await updateStatus(id, candidateId, status);
      fetchJobDetail(id);
    } catch {}
  };

  const handleSaveNote = async (candidateId: string) => {
    if (!id) return;
    try {
      await updateNote(id, candidateId, noteText[candidateId] || '');
      setExpandedNote(null);
      fetchJobDetail(id);
    } catch {}
  };

  if (loading && !currentJob) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">岗位不存在</p>
      </div>
    );
  }

  const candidates = currentJob.candidates || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/hr/jobs')}
          className="p-2 text-gray-500 hover:text-[#1E3A5F] rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">{currentJob.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {currentJob.status === 'open' ? '招聘中' : '已关闭'}
            {currentJob.salaryRange && ` · ${currentJob.salaryRange}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{currentJob.description}</p>
        <div className="flex flex-wrap gap-2">
          {currentJob.requirements.map((req) => (
            <span key={req} className="px-3 py-1 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full text-sm">
              {req}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1E3A5F]">
          候选人列表 ({candidates.length})
        </h2>
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#16304F] disabled:opacity-50 transition-colors"
        >
          <Zap size={16} />
          {loading ? '计算中...' : '计算匹配'}
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">暂无匹配候选人，点击"计算匹配"开始</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates
            .sort((a, b) => b.matchScore - a.matchScore)
            .map((candidate) => {
              const status = statusMap[candidate.status] || statusMap.pending;
              return (
                <div key={candidate.candidateId} className="bg-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <ScoreCircle score={candidate.matchScore} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-800">{candidate.candidateName}</h3>
                        <select
                          value={candidate.status}
                          onChange={(e) => handleStatusChange(candidate.candidateId, e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                        >
                          <option value="pending">待定</option>
                          <option value="screening">初筛</option>
                          <option value="interview">面试</option>
                          <option value="offer">发Offer</option>
                          <option value="rejected">淘汰</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">匹配点</p>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.matchPoints.map((point) => (
                            <span key={point} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                              {point}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-1">差距项</p>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.gapPoints.map((point) => (
                            <span key={point} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs">
                              {point}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              if (expandedNote === candidate.candidateId) {
                                setExpandedNote(null);
                              } else {
                                setExpandedNote(candidate.candidateId);
                                setNoteText({ ...noteText, [candidate.candidateId]: candidate.note });
                              }
                            }}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1E3A5F] transition-colors"
                          >
                            <MessageSquare size={14} />
                            备注
                            {expandedNote === candidate.candidateId ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                          {candidate.scoreBreakdown && (
                            <button
                              onClick={() => {
                                setExpandedScore(
                                  expandedScore === candidate.candidateId ? null : candidate.candidateId
                                );
                              }}
                              className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1E3A5F] transition-colors"
                            >
                              <BarChart3 size={14} />
                              分数构成
                              {expandedScore === candidate.candidateId ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          )}
                        </div>

                        {expandedScore === candidate.candidateId && candidate.scoreBreakdown && (
                          <ScoreBreakdownView
                            breakdown={candidate.scoreBreakdown}
                            matchScore={candidate.matchScore}
                          />
                        )}

                        {expandedNote === candidate.candidateId && (
                          <div className="mt-2">
                            <textarea
                              value={noteText[candidate.candidateId] || ''}
                              onChange={(e) =>
                                setNoteText({ ...noteText, [candidate.candidateId]: e.target.value })
                              }
                              placeholder="添加内部备注..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 resize-y"
                            />
                            <div className="flex justify-end mt-1">
                              <button
                                onClick={() => handleSaveNote(candidate.candidateId)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#1E3A5F] text-white rounded text-xs hover:bg-[#16304F] transition-colors"
                              >
                                <Save size={12} />
                                保存
                              </button>
                            </div>
                          </div>
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
