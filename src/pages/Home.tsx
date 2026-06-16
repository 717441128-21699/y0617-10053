import { Link } from 'react-router-dom';
import { FileText, Briefcase, Users, TrendingUp, Zap } from 'lucide-react';

const stats = [
  { label: '注册候选人', value: '12,580+' },
  { label: '在线岗位', value: '3,420+' },
  { label: '成功匹配', value: '8,960+' },
  { label: '企业客户', value: '560+' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B35] rounded-full blur-[120px]" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-400 rounded-full blur-[150px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6">
              <Zap size={14} className="text-[#FF6B35]" />
              <span>AI驱动的智能招聘平台</span>
            </div>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              智能简历解析与匹配系统
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed">
              基于大模型与语义向量技术，自动解析PDF简历提取结构化数据，
              实现岗位与候选人的智能匹配，大幅提升招聘筛选效率
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Link
                to="/login"
                className="group bg-white rounded-2xl p-8 text-left shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-[#1E3A5F]/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#1E3A5F]/20 transition-colors">
                  <FileText size={28} className="text-[#1E3A5F]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">候选人入口</h3>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                  上传简历，AI自动解析提取信息，轻松管理个人简历
                </p>
                <span className="inline-flex items-center gap-1 text-[#FF6B35] font-semibold text-sm">
                  进入
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

              <Link
                to="/login"
                className="group bg-white rounded-2xl p-8 text-left shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#FF6B35]/20 transition-colors">
                  <Briefcase size={28} className="text-[#FF6B35]" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">HR入口</h3>
                <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                  发布岗位，智能匹配候选人，高效筛选管理招聘流程
                </p>
                <span className="inline-flex items-center gap-1 text-[#FF6B35] font-semibold text-sm">
                  进入
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp size={20} className="text-[#1E3A5F]" />
              </div>
              <p className="text-2xl font-bold text-[#1E3A5F] mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1E3A5F] text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: '智能简历解析', desc: '大模型自动提取简历中的关键信息，结构化展示基本信息、教育经历、工作经历和技能' },
              { icon: Users, title: '语义智能匹配', desc: '基于语义向量相似度计算，精准匹配岗位需求与候选人能力，生成匹配评分' },
              { icon: Zap, title: '高效筛选管理', desc: '多维度筛选候选人，状态标签管理，内部备注，一键导出Excel，提升招聘效率' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={24} className="text-[#FF6B35]" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#F7F8FA] border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">© 2026 智聘通 - 智能简历解析与匹配系统</p>
        </div>
      </footer>
    </div>
  );
}
