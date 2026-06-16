import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Pencil, Briefcase, Users } from 'lucide-react';
import useJobStore from '@/store/jobStore';
import JobFormModal from './JobFormModal';
import type { Job } from '@/lib/api';

export default function Jobs() {
  const { jobs, fetchJobs, deleteJob, loading } = useJobStore();
  const navigate = useNavigate();
  const [editJob, setEditJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('确定删除此岗位？')) {
      await deleteJob(id);
    }
  };

  const handleEdit = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setEditJob(job);
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">岗位管理</h1>
        <Link
          to="/hr/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E85A25] transition-colors"
        >
          <PlusCircle size={16} />
          新建岗位
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm">
          <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-2">暂无岗位</p>
          <p className="text-sm text-gray-400">点击"新建岗位"发布您的第一个岗位</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/hr/jobs/${job.id}`}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-800 group-hover:text-[#1E3A5F] transition-colors">
                  {job.title}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {job.status === 'open' ? '招聘中' : '已关闭'}
                </span>
              </div>

              {job.salaryRange && (
                <p className="text-sm text-[#FF6B35] font-medium mb-3">{job.salaryRange}</p>
              )}

              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.requirements.slice(0, 4).map((req) => (
                  <span
                    key={req}
                    className="px-2 py-0.5 bg-[#1E3A5F]/5 text-[#1E3A5F] rounded text-xs"
                  >
                    {req}
                  </span>
                ))}
                {job.requirements.length > 4 && (
                  <span className="px-2 py-0.5 text-gray-400 text-xs">
                    +{job.requirements.length - 4}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users size={14} />
                  候选人
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleEdit(e, job)}
                    className="p-1.5 text-gray-400 hover:text-[#1E3A5F] rounded-lg hover:bg-gray-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, job.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {editJob && (
        <JobFormModal
          job={editJob}
          onClose={() => setEditJob(null)}
          onSaved={() => {
            setEditJob(null);
            fetchJobs();
          }}
        />
      )}
    </div>
  );
}
