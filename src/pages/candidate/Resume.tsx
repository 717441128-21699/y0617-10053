import { useState, useEffect } from 'react';
import { Pencil, Save, X, Plus } from 'lucide-react';
import useResumeStore from '@/store/resumeStore';
import type { Resume } from '@/lib/api';

export default function ResumePage() {
  const { resume, fetchResume, updateResume, loading } = useResumeStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Resume>>({});
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  const startEdit = (section: string) => {
    setEditing(section);
    setEditData(resume ? { ...resume } : {});
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!resume) return;
    try {
      await updateResume(resume.id, editData);
      setEditing(null);
      setEditData({});
    } catch {}
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const skills = [...(editData.skills || resume?.skills || []), newSkill.trim()];
    setEditData({ ...editData, skills });
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    const skills = (editData.skills || resume?.skills || []).filter((s) => s !== skill);
    setEditData({ ...editData, skills });
  };

  if (loading && !resume) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500 mb-4">暂无简历信息</p>
        <a href="/candidate/upload" className="text-[#FF6B35] font-medium hover:underline">
          去上传简历
        </a>
      </div>
    );
  }

  const basicInfo = editing === 'basic' ? editData.basicInfo || resume.basicInfo : resume.basicInfo;
  const education = editing === 'education' ? editData.education || resume.education : resume.education;
  const workExperience = editing === 'work' ? editData.workExperience || resume.workExperience : resume.workExperience;
  const skills = editing === 'skills' ? editData.skills || resume.skills : resume.skills;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">我的简历</h1>
        {resume.confirmed && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">已确认</span>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">基本信息</h3>
            {editing !== 'basic' ? (
              <button onClick={() => startEdit('basic')} className="p-1.5 text-gray-400 hover:text-[#1E3A5F] rounded-lg hover:bg-gray-100">
                <Pencil size={16} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                  <Save size={16} />
                </button>
                <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(['name', 'phone', 'email', 'location'] as const).map((key) => (
              <div key={key}>
                <p className="text-xs text-gray-400 mb-1">
                  {{ name: '姓名', phone: '电话', email: '邮箱', location: '所在地' }[key]}
                </p>
                {editing === 'basic' ? (
                  <input
                    type="text"
                    value={(editData.basicInfo as Record<string, string>)?.[key] ?? resume.basicInfo[key]}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        basicInfo: { ...(editData.basicInfo || resume.basicInfo), [key]: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                  />
                ) : (
                  <p className="text-sm text-gray-800">{basicInfo[key] || '-'}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">教育经历</h3>
            {editing !== 'education' ? (
              <button onClick={() => startEdit('education')} className="p-1.5 text-gray-400 hover:text-[#1E3A5F] rounded-lg hover:bg-gray-100">
                <Pencil size={16} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                  <Save size={16} />
                </button>
                <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {education.map((edu, i) => (
              <div key={i} className="border-l-2 border-[#1E3A5F] pl-4">
                {editing === 'education' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[i] = { ...updated[i], school: e.target.value };
                        setEditData({ ...editData, education: updated });
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                      placeholder="学校"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[i] = { ...updated[i], degree: e.target.value };
                          setEditData({ ...editData, education: updated });
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                        placeholder="学位"
                      />
                      <input
                        type="text"
                        value={edu.major}
                        onChange={(e) => {
                          const updated = [...education];
                          updated[i] = { ...updated[i], major: e.target.value };
                          setEditData({ ...editData, education: updated });
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                        placeholder="专业"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-gray-800">{edu.school}</p>
                    <p className="text-sm text-gray-600">{edu.degree} · {edu.major}</p>
                    <p className="text-xs text-gray-400">{edu.startDate} - {edu.endDate}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">工作经历</h3>
            {editing !== 'work' ? (
              <button onClick={() => startEdit('work')} className="p-1.5 text-gray-400 hover:text-[#1E3A5F] rounded-lg hover:bg-gray-100">
                <Pencil size={16} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                  <Save size={16} />
                </button>
                <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {workExperience.map((work, i) => (
              <div key={i} className="border-l-2 border-[#FF6B35] pl-4">
                {editing === 'work' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={work.company}
                      onChange={(e) => {
                        const updated = [...workExperience];
                        updated[i] = { ...updated[i], company: e.target.value };
                        setEditData({ ...editData, workExperience: updated });
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                      placeholder="公司"
                    />
                    <input
                      type="text"
                      value={work.position}
                      onChange={(e) => {
                        const updated = [...workExperience];
                        updated[i] = { ...updated[i], position: e.target.value };
                        setEditData({ ...editData, workExperience: updated });
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                      placeholder="职位"
                    />
                    <textarea
                      value={work.description}
                      onChange={(e) => {
                        const updated = [...workExperience];
                        updated[i] = { ...updated[i], description: e.target.value };
                        setEditData({ ...editData, workExperience: updated });
                      }}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                      rows={2}
                      placeholder="工作描述"
                    />
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-gray-800">{work.company}</p>
                    <p className="text-sm text-gray-600">{work.position}</p>
                    <p className="text-xs text-gray-400 mb-1">{work.startDate} - {work.endDate}</p>
                    <p className="text-sm text-gray-600">{work.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">技能标签</h3>
            {editing !== 'skills' ? (
              <button onClick={() => startEdit('skills')} className="p-1.5 text-gray-400 hover:text-[#1E3A5F] rounded-lg hover:bg-gray-100">
                <Pencil size={16} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveEdit} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                  <Save size={16} />
                </button>
                <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full text-sm"
              >
                {skill}
                {editing === 'skills' && (
                  <button onClick={() => removeSkill(skill)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
            {editing === 'skills' && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="添加技能"
                  className="px-3 py-1 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 w-28"
                />
                <button onClick={addSkill} className="p-1 text-[#1E3A5F] hover:bg-[#1E3A5F]/10 rounded-full">
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
