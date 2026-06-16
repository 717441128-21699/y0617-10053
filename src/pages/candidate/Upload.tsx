import { useState, useRef, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import useResumeStore from '@/store/resumeStore';

export default function Upload() {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadResume, parsedData, resume, uploading, error, updateResume } = useResumeStore();
  const navigate = useNavigate();

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      return;
    }
    setFileName(file.name);
    setUploadProgress(0);
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

  const handleConfirm = async () => {
    if (!resume?.id || !parsedData) return;
    setSaving(true);
    try {
      await updateResume(resume.id, {
        basicInfo: parsedData.basicInfo,
        education: parsedData.education,
        workExperience: parsedData.workExperience,
        skills: parsedData.skills,
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
              <span className="text-sm text-gray-600">正在解析简历...</span>
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
        <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {fileName && !uploading && !error && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          <CheckCircle size={16} />
          {fileName} 上传成功
        </div>
      )}

      {parsedData && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold text-[#1E3A5F] flex items-center gap-2">
            <FileText size={22} />
            解析结果
          </h2>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(parsedData.basicInfo).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-gray-400 mb-1">
                    {{ name: '姓名', phone: '电话', email: '邮箱', location: '所在地' }[key] || key}
                  </p>
                  <p className="text-sm text-gray-800">{value || '-'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">教育经历</h3>
            <div className="space-y-4">
              {parsedData.education.map((edu, i) => (
                <div key={i} className="border-l-2 border-[#1E3A5F] pl-4">
                  <p className="font-medium text-gray-800">{edu.school}</p>
                  <p className="text-sm text-gray-600">{edu.degree} · {edu.major}</p>
                  <p className="text-xs text-gray-400">{edu.startDate} - {edu.endDate}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">工作经历</h3>
            <div className="space-y-4">
              {parsedData.workExperience.map((work, i) => (
                <div key={i} className="border-l-2 border-[#FF6B35] pl-4">
                  <p className="font-medium text-gray-800">{work.company}</p>
                  <p className="text-sm text-gray-600">{work.position}</p>
                  <p className="text-xs text-gray-400 mb-1">{work.startDate} - {work.endDate}</p>
                  <p className="text-sm text-gray-600">{work.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">技能标签</h3>
            <div className="flex flex-wrap gap-2">
              {parsedData.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
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
