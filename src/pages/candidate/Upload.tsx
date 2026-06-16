import { useState, useRef, useEffect, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, CheckCircle, Loader2, AlertCircle, Plus, Trash2, RefreshCw } from 'lucide-react';
import useResumeStore from '@/store/resumeStore';
import type { ParsedResume } from '@/lib/api';

type EditableResume = ParsedResume;

export default function Upload() {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadResume,
    parsedData,
    resume,
    uploading,
    error,
    llmFailed,
    canUseMock,
    updateResume,
    retryWithMock,
    setParsedData,
    clearError,
  } = useResumeStore();
  const navigate = useNavigate();

  const [editData, setEditData] = useState<EditableResume | null>(null);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    if (parsedData && !editData) {
      setEditData(JSON.parse(JSON.stringify(parsedData)));
    }
    if (!parsedData && editData) {
      setEditData(null);
    }
  }, [parsedData, editData]);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      return;
    }
    setFileName(file.name);
    setUploadProgress(0);
    setEditData(null);
    clearError();
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await uploadResume(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch {
      clearInterval(progressInterval);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRetry = async () => {
    if (!fileName) return;
    setRetrying(true);
    try {
      await retryWithMock();
    } finally {
      setRetrying(false);
    }
  };

  const handleReupload = () => {
    setFileName('');
    setUploadProgress(0);
    setEditData(null);
    clearError();
    fileInputRef.current?.click();
  };

  const updateBasicInfo = (key: string, value: string) => {
    if (!editData) return;
    setEditData({
      ...editData,
      basicInfo: { ...editData.basicInfo, [key]: value },
    });
    setParsedData(editData);
  };

  const updateEducation = (idx: number, key: string, value: string) => {
    if (!editData) return;
    const newEdu = [...editData.education];
    newEdu[idx] = { ...newEdu[idx], [key]: value };
    const updated = { ...editData, education: newEdu };
    setEditData(updated);
    setParsedData(updated);
  };

  const addEducation = () => {
    if (!editData) return;
    const emptyEdu = { school: '', degree: '', major: '', startDate: '', endDate: '' };
    const updated = { ...editData, education: [...editData.education, emptyEdu] };
    setEditData(updated);
    setParsedData(updated);
  };

  const removeEducation = (idx: number) => {
    if (!editData) return;
    const newEdu = editData.education.filter((_, i) => i !== idx);
    const updated = { ...editData, education: newEdu };
    setEditData(updated);
    setParsedData(updated);
  };

  const updateWork = (idx: number, key: string, value: string) => {
    if (!editData) return;
    const newWork = [...editData.workExperience];
    newWork[idx] = { ...newWork[idx], [key]: value };
    const updated = { ...editData, workExperience: newWork };
    setEditData(updated);
    setParsedData(updated);
  };

  const addWork = () => {
    if (!editData) return;
    const emptyWork = { company: '', position: '', startDate: '', endDate: '', description: '' };
    const updated = { ...editData, workExperience: [...editData.workExperience, emptyWork] };
    setEditData(updated);
    setParsedData(updated);
  };

  const removeWork = (idx: number) => {
    if (!editData) return;
    const newWork = editData.workExperience.filter((_, i) => i !== idx);
    const updated = { ...editData, workExperience: newWork };
    setEditData(updated);
    setParsedData(updated);
  };

  const addSkill = () => {
    if (!editData || !newSkill.trim()) return;
    if (editData.skills.includes(newSkill.trim())) {
      setNewSkill('');
      return;
    }
    const updated = { ...editData, skills: [...editData.skills, newSkill.trim()] };
    setEditData(updated);
    setParsedData(updated);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    if (!editData) return;
    const updated = { ...editData, skills: editData.skills.filter(s => s !== skill) };
    setEditData(updated);
    setParsedData(updated);
  };

  const handleConfirm = async () => {
    if (!resume?.id || !editData) return;
    setSaving(true);
    try {
      await updateResume(resume.id, {
        basicInfo: editData.basicInfo,
        education: editData.education,
        workExperience: editData.workExperience,
        skills: editData.skills,
      });
      navigate('/candidate/resume');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#1E3A5F] mb-6">上传简历</h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          dragOver
            ? 'border-[#1E3A5F] bg-[#1E3A5F]/5'
            : 'border-gray-300 hover:border-[#1E3A5F] hover:bg-gray-50'
        } bg-white`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            dragOver ? 'bg-[#1E3A5F]/10' : 'bg-gray-100'
          }`}>
            <UploadIcon size={32} className={dragOver ? 'text-[#1E3A5F]' : 'text-gray-400'} />
          </div>
          <p className="text-gray-700 font-medium mb-1">
            {dragOver ? '松开以上传文件' : '拖拽PDF文件到此处，或点击选择文件'}
          </p>
          <p className="text-sm text-gray-400">仅支持PDF格式</p>
        </div>

        {uploading && (
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 size={16} className="text-[#1E3A5F] animate-spin" />
              <span className="text-sm text-gray-600">
                {llmFailed || error ? '解析处理中...' : '正在解析简历...'}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1E3A5F] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-600">{error}</p>
              {llmFailed && canUseMock && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRetry(); }}
                    disabled={retrying}
                    className="px-4 py-1.5 bg-amber-500 text-white rounded-md text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {retrying && <Loader2 size={14} className="animate-spin" />}
                    使用规则解析模式继续
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReupload(); }}
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} />
                    重新上传
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {fileName && !uploading && !error && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          <CheckCircle size={16} />
          {fileName} 上传成功
        </div>
      )}

      {editData && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1E3A5F] flex items-center gap-2">
              <FileText size={22} />
              确认与编辑简历信息
            </h2>
            <button
              onClick={handleReupload}
              className="text-sm text-gray-500 hover:text-[#FF6B35] transition-colors flex items-center gap-1"
            >
              <RefreshCw size={14} />
              重新上传
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">基本信息</h3>
              <span className="text-xs text-gray-400">点击字段直接编辑</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(editData.basicInfo).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 mb-1 block">
                    {{ name: '姓名', phone: '电话', email: '邮箱', location: '所在地' }[key] || key}
                  </label>
                  <input
                    type="text"
                    value={value as string || ''}
                    onChange={(e) => updateBasicInfo(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] transition-colors"
                    placeholder={`请输入${{ name: '姓名', phone: '电话', email: '邮箱', location: '所在地' }[key] || key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">教育经历</h3>
              <button
                onClick={addEducation}
                className="text-sm text-[#1E3A5F] hover:text-[#FF6B35] transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                添加一条
              </button>
            </div>
            <div className="space-y-4">
              {editData.education.map((edu, i) => (
                <div key={i} className="border-l-2 border-[#1E3A5F] pl-4 relative">
                  <button
                    onClick={() => removeEducation(i)}
                    className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">学校</label>
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => updateEducation(i, 'school', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                        placeholder="学校名称"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">学位</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                        placeholder="本科/硕士/博士等"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">专业</label>
                      <input
                        type="text"
                        value={edu.major}
                        onChange={(e) => updateEducation(i, 'major', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                        placeholder="专业名称"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">开始</label>
                        <input
                          type="text"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(i, 'startDate', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                          placeholder="2018"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">结束</label>
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => updateEducation(i, 'endDate', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
                          placeholder="2022"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {editData.education.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">暂无教育经历，点击右上方"添加一条"</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">工作经历</h3>
              <button
                onClick={addWork}
                className="text-sm text-[#1E3A5F] hover:text-[#FF6B35] transition-colors flex items-center gap-1"
              >
                <Plus size={14} />
                添加一条
              </button>
            </div>
            <div className="space-y-4">
              {editData.workExperience.map((work, i) => (
                <div key={i} className="border-l-2 border-[#FF6B35] pl-4 relative">
                  <button
                    onClick={() => removeWork(i)}
                    className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">公司</label>
                      <input
                        type="text"
                        value={work.company}
                        onChange={(e) => updateWork(i, 'company', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]"
                        placeholder="公司名称"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">职位</label>
                      <input
                        type="text"
                        value={work.position}
                        onChange={(e) => updateWork(i, 'position', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]"
                        placeholder="职位名称"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">开始</label>
                        <input
                          type="text"
                          value={work.startDate}
                          onChange={(e) => updateWork(i, 'startDate', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]"
                          placeholder="2022.01"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">结束</label>
                        <input
                          type="text"
                          value={work.endDate}
                          onChange={(e) => updateWork(i, 'endDate', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]"
                          placeholder="至今"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400 mb-1 block">工作描述</label>
                      <textarea
                        value={work.description}
                        onChange={(e) => updateWork(i, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] resize-none"
                        placeholder="描述工作职责和成就..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              {editData.workExperience.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">暂无工作经历，点击右上方"添加一条"</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">技能标签</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {editData.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full text-sm flex items-center gap-1.5"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:text-red-500 transition-colors"
                    title="删除"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="输入技能名称，按回车添加"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
              />
              <button
                onClick={addSkill}
                disabled={!newSkill.trim()}
                className="px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#162C4A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                添加
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-8 py-2.5 bg-[#FF6B35] text-white rounded-lg font-medium text-sm hover:bg-[#E85A25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? '保存中...' : '确认保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
