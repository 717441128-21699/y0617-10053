interface JobInput {
  title: string
  description: string
  requirements: string[]
}

interface ResumeInput {
  skills: string[]
  workExperience: Array<{ company: string; title: string; duration: string; description: string }>
  education: Array<{ school: string; degree: string; major: string; year: string }>
}

interface MatchResult {
  score: number
  matchPoints: string[]
  gapPoints: string[]
}

const SYNONYM_MAP: Record<string, string[]> = {
  js: ['javascript', 'js', 'ecmascript'],
  javascript: ['javascript', 'js', 'ecmascript', '前端开发'],
  ts: ['typescript', 'ts'],
  typescript: ['typescript', 'ts', '类型脚本'],
  node: ['node.js', 'nodejs', 'node'],
  'node.js': ['node.js', 'nodejs', 'node', 'nodejs开发'],
  nodejs: ['node.js', 'nodejs', 'node'],
  py: ['python', 'py'],
  python: ['python', 'py', 'python开发'],
  react: ['react', 'react.js', 'reactjs', 'react开发'],
  'react.js': ['react', 'react.js', 'reactjs'],
  vue: ['vue', 'vue.js', 'vuejs'],
  'vue.js': ['vue', 'vue.js', 'vuejs'],
  angular: ['angular', 'angular.js', 'ng'],
  java: ['java', 'java开发'],
  'c++': ['c++', 'cpp', 'cplusplus'],
  'c#': ['c#', 'csharp', 'c-sharp', '.net开发'],
  dotnet: ['.net', 'dotnet', 'asp.net'],
  '.net': ['.net', 'dotnet', 'asp.net', 'c#'],
  go: ['go', 'golang'],
  golang: ['go', 'golang'],
  rust: ['rust', 'rust语言'],
  db: ['数据库', 'database', 'db', '数据存储'],
  database: ['数据库', 'database', 'db'],
  sql: ['sql', '结构化查询语言', '数据库查询'],
  mysql: ['mysql', 'mysql数据库'],
  postgres: ['postgresql', 'postgres', 'pg'],
  postgresql: ['postgresql', 'postgres', 'pg'],
  mongodb: ['mongodb', 'mongo', 'nosql数据库'],
  mongo: ['mongodb', 'mongo'],
  redis: ['redis', '缓存', 'redis缓存'],
  cache: ['缓存', 'cache', 'redis', 'memory cache'],
  docker: ['docker', '容器', 'container', 'docker容器'],
  container: ['容器', 'container', 'docker'],
  k8s: ['kubernetes', 'k8s', '容器编排'],
  kubernetes: ['kubernetes', 'k8s', '容器编排'],
  aws: ['aws', 'amazon web services', '亚马逊云', '云服务'],
  cloud: ['云', 'cloud', 'aws', 'azure', 'gcp', '云计算'],
  devops: ['devops', '运维', '运维开发', 'ci/cd'],
  'ci/cd': ['ci/cd', 'cicd', '持续集成', '持续部署'],
  cicd: ['ci/cd', 'cicd', '持续集成', '持续部署'],
  git: ['git', '版本控制', 'github', 'gitlab'],
  api: ['api', '接口', 'rest', 'restful'],
  rest: ['rest', 'restful', 'rest api', 'restful api'],
  restful: ['rest', 'restful', 'rest api'],
  graphql: ['graphql', 'graph ql', 'gql'],
  microservice: ['微服务', 'microservice', 'microservices', '分布式'],
  '微服务': ['微服务', 'microservice', 'microservices'],
  ml: ['machine learning', 'ml', '机器学习', 'ai'],
  ai: ['ai', '人工智能', 'machine learning', 'ml', '深度学习'],
  '机器学习': ['机器学习', 'machine learning', 'ml', 'ai'],
  dl: ['deep learning', 'dl', '深度学习'],
  '深度学习': ['深度学习', 'deep learning', 'dl', '神经网络'],
  frontend: ['前端', 'frontend', 'front-end', 'client', '客户端'],
  '前端': ['前端', 'frontend', 'front-end', 'react', 'vue', 'javascript'],
  backend: ['后端', 'backend', 'back-end', 'server', '服务端'],
  '后端': ['后端', 'backend', 'back-end', '服务端', 'server'],
  fullstack: ['全栈', 'fullstack', 'full-stack', 'full stack'],
  '全栈': ['全栈', 'fullstack', 'full-stack'],
  web: ['web', '网页', '网站', 'web开发'],
  mobile: ['移动端', 'mobile', 'ios', 'android', '手机'],
  ios: ['ios', '苹果', 'swift', 'objective-c'],
  android: ['android', '安卓', 'kotlin', 'java移动端'],
  testing: ['测试', 'testing', 'test', 'qa'],
  qa: ['测试', 'qa', 'quality assurance'],
  agile: ['敏捷', 'agile', 'scrum'],
  scrum: ['敏捷', 'scrum', 'agile'],
  linux: ['linux', 'unix', 'linux系统', '服务器系统'],
  nginx: ['nginx', '反向代理', 'web server'],
  design: ['设计', 'design', 'ui', 'ux', 'figma'],
  ui: ['ui', '界面设计', 'user interface'],
  ux: ['ux', '用户体验', 'user experience'],
  figma: ['figma', '设计工具'],
  spring: ['spring', 'spring boot', 'springboot', 'java框架'],
  'spring boot': ['spring boot', 'springboot', 'spring'],
  springboot: ['spring boot', 'springboot', 'spring'],
  django: ['django', 'python框架'],
  flask: ['flask', 'python框架'],
  express: ['express', 'express.js', 'node框架', 'node.js框架'],
  tailwind: ['tailwind', 'tailwindcss', 'css框架'],
  bootstrap: ['bootstrap', 'css框架'],
  css: ['css', '样式', 'cascading style sheets', 'sass', 'less'],
  html: ['html', '超文本标记语言', '网页结构'],
  sass: ['sass', 'scss', 'css预处理器'],
  less: ['less', 'css预处理器'],
  webpack: ['webpack', '前端构建工具', '打包'],
  vite: ['vite', '前端构建工具', '构建'],
  jest: ['jest', '单元测试', '测试框架'],
  cypress: ['cypress', 'e2e测试', '端到端测试'],
  tensorflow: ['tensorflow', 'tf', '深度学习框架'],
  pytorch: ['pytorch', 'torch', '深度学习框架'],
  spark: ['spark', 'apache spark', '大数据'],
  hadoop: ['hadoop', '大数据'],
  kafka: ['kafka', '消息队列', '消息中间件'],
  rabbitmq: ['rabbitmq', 'mq', '消息队列'],
  elasticsearch: ['elasticsearch', 'es', '搜索'],
  etl: ['etl', '数据抽取', '数据处理'],
  pandas: ['pandas', '数据处理', '数据分析'],
  numpy: ['numpy', '数值计算'],
  architect: ['架构师', 'architect', '架构设计', '系统架构'],
  lead: ['技术负责人', 'lead', '技术lead', '团队负责人'],
  senior: ['高级', 'senior', '资深'],
  manager: ['经理', 'manager', '管理经验'],
  管理经验: ['管理经验', 'manager', '团队管理', 'lead'],
  本科: ['本科', 'bachelor', '学士'],
  硕士: ['硕士', 'master', '研究生'],
  博士: ['博士', 'phd', 'doctor'],
  bachelor: ['本科', 'bachelor', '学士'],
  master: ['硕士', 'master', '研究生'],
  phd: ['博士', 'phd', 'doctor'],
  计算机: ['计算机', 'computer science', 'cs', '软件工程'],
  cs: ['计算机', 'computer science', 'cs'],
  软件工程: ['软件工程', 'software engineering', 'cs', '计算机'],
}

function getSynonyms(term: string): Set<string> {
  const key = term.toLowerCase().trim()
  const result = new Set<string>()
  result.add(key)
  result.add(key.replace(/[-\s.]/g, ''))
  if (SYNONYM_MAP[key]) {
    for (const s of SYNONYM_MAP[key]) {
      result.add(s.toLowerCase())
      result.add(s.toLowerCase().replace(/[-\s.]/g, ''))
    }
  }
  return result
}

function getTermTokens(text: string): Set<string> {
  const tokens = new Set<string>()
  const words = text.toLowerCase().split(/[\s,，、;；/|()（）\[\]【】]+/).filter((t) => t.length > 0)
  for (const w of words) {
    tokens.add(w)
    tokens.add(w.replace(/[-\s.]/g, ''))
    const syns = getSynonyms(w)
    for (const s of syns) {
      tokens.add(s)
      tokens.add(s.replace(/[-\s.]/g, ''))
    }
  }
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`
    tokens.add(bigram)
    tokens.add(bigram.replace(/\s/g, ''))
  }
  return tokens
}

function charNgrams(text: string, n: number = 2): Set<string> {
  const clean = text.toLowerCase().replace(/\s+/g, '')
  const grams = new Set<string>()
  for (let i = 0; i <= clean.length - n; i++) {
    grams.add(clean.substring(i, i + n))
  }
  return grams
}

const FALSE_POSITIVE_PAIRS: Array<[string, string]> = [
  ['java', 'javascript'],
  ['java', 'typescript'],
  ['java', 'javafx'],
  ['ml', 'html'],
  ['ml', 'xml'],
  ['ml', 'uml'],
  ['ml', 'html5'],
  ['c', 'c++'],
  ['c', 'c#'],
  ['ruby', 'rubygems'],
  ['ios', 'axios'],
  ['sql', 'nosql'],
]

function isFalsePositive(a: string, b: string): boolean {
  const na = a.toLowerCase().trim()
  const nb = b.toLowerCase().trim()
  for (const [x, y] of FALSE_POSITIVE_PAIRS) {
    if ((na === x && nb === y) || (na === y && nb === x)) return true
    if ((na.includes(x) && nb === y) || (nb.includes(x) && na === y)) return true
    if ((na.includes(y) && nb === x) || (nb.includes(y) && na === x)) return true
  }
  return false
}

function semanticSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const aNorm = a.toLowerCase().trim()
  const bNorm = b.toLowerCase().trim()
  if (aNorm === bNorm) return 1
  if (!isFalsePositive(aNorm, bNorm) && (aNorm.includes(bNorm) || bNorm.includes(aNorm))) return 0.9

  const aSyns = getSynonyms(aNorm)
  const bSyns = getSynonyms(bNorm)
  for (const as of aSyns) {
    for (const bs of bSyns) {
      if (as === bs) return 0.95
      if (!isFalsePositive(as, bs) && (as.includes(bs) || bs.includes(as))) return 0.9
    }
  }

  const aTokens = getTermTokens(aNorm)
  const bTokens = getTermTokens(bNorm)
  let overlap = 0
  for (const t of aTokens) {
    if (bTokens.has(t)) overlap++
  }
  const tokenSim = overlap > 0 ? overlap / Math.min(aTokens.size, bTokens.size) : 0
  if (tokenSim >= 0.5) return 0.7 + tokenSim * 0.25

  const aGrams = charNgrams(aNorm, 2)
  const bGrams = charNgrams(bNorm, 2)
  let gramOverlap = 0
  for (const g of aGrams) {
    if (bGrams.has(g)) gramOverlap++
  }
  const diceCoef = aGrams.size + bGrams.size > 0 ? (2 * gramOverlap) / (aGrams.size + bGrams.size) : 0
  if (diceCoef >= 0.55) return 0.5 + diceCoef * 0.35

  return Math.max(tokenSim * 0.6, diceCoef * 0.5)
}

function bestSemanticMatch(requirement: string, candidateTerms: string[]): { matched: boolean; bestTerm: string; similarity: number } {
  let bestSimilarity = 0
  let bestTerm = ''
  for (const term of candidateTerms) {
    const sim = semanticSimilarity(requirement, term)
    if (sim > bestSimilarity) {
      bestSimilarity = sim
      bestTerm = term
    }
  }
  return {
    matched: bestSimilarity >= 0.55,
    bestTerm,
    similarity: bestSimilarity,
  }
}

function collectAllResumeTerms(resume: ResumeInput): string[] {
  const terms: string[] = []
  terms.push(...resume.skills)
  for (const w of resume.workExperience) {
    terms.push(w.title)
    terms.push(w.description)
    terms.push(w.company)
    const descWords = w.description.split(/[\s,，、;；。.]+/).filter((t) => t.length > 1)
    terms.push(...descWords)
  }
  for (const e of resume.education) {
    terms.push(e.degree)
    terms.push(e.major)
    terms.push(e.school)
  }
  return terms.filter((t) => t && t.length > 0)
}

function collectResumeText(resume: ResumeInput): string {
  const parts: string[] = []
  parts.push(...resume.skills)
  for (const w of resume.workExperience) {
    parts.push(w.title, w.description, w.company)
  }
  for (const e of resume.education) {
    parts.push(e.degree, e.major, e.school)
  }
  return parts.join(' ').toLowerCase()
}

function collectJobText(job: JobInput): string {
  return `${job.title} ${job.description} ${job.requirements.join(' ')}`.toLowerCase()
}

export function calculateMatch(job: JobInput, resume: ResumeInput): MatchResult {
  const matchPoints: string[] = []
  const gapPoints: string[] = []
  let requirementScore = 0
  let reqCount = Math.max(job.requirements.length, 1)

  const allResumeTerms = collectAllResumeTerms(resume)
  const resumeText = collectResumeText(resume)
  const jobText = collectJobText(job)

  for (const req of job.requirements) {
    const trimmedReq = req.trim()
    if (!trimmedReq) continue

    const match = bestSemanticMatch(trimmedReq, allResumeTerms)

    if (match.matched) {
      requirementScore += match.similarity
      if (match.similarity >= 0.9) {
        matchPoints.push(`满足岗位要求「${trimmedReq}」：简历中明确包含${match.bestTerm ? '「' + match.bestTerm + '」' : '相关内容'}`)
      } else {
        matchPoints.push(`部分满足岗位要求「${trimmedReq}」：简历中有语义相近的「${match.bestTerm || '相关技能/经验'}」（相似度约${Math.round(match.similarity * 100)}%）`)
      }
    } else {
      const reqLower = trimmedReq.toLowerCase()
      const resumeLower = resumeText
      const charOverlap = charNgrams(reqLower, 2)
      const resumeGrams = charNgrams(resumeLower, 2)
      let partialHit = 0
      for (const g of charOverlap) {
        if (resumeGrams.has(g)) partialHit++
      }
      const partialRatio = charOverlap.size > 0 ? partialHit / charOverlap.size : 0

      if (partialRatio >= 0.35) {
        requirementScore += 0.3
        matchPoints.push(`与岗位要求「${trimmedReq}」存在一定关联（字符重合度约${Math.round(partialRatio * 100)}%）`)
      } else {
        gapPoints.push(`未覆盖岗位要求「${trimmedReq}」：简历中未发现明显相关的技能或经验`)
      }
    }
  }

  const baseReqScore = job.requirements.length > 0 ? (requirementScore / reqCount) * 65 : 30

  const jobTokens = getTermTokens(jobText)
  const resumeTokens = getTermTokens(resumeText)
  let shared = 0
  for (const t of jobTokens) {
    if (resumeTokens.has(t)) shared++
  }
  const jaccard = jobTokens.size + resumeTokens.size > 0 ? shared / (jobTokens.size + resumeTokens.size - shared) : 0
  const contentSimScore = Math.min(jaccard * 180, 18)

  let experienceScore = 0
  const relevantExp: string[] = []
  for (const exp of resume.workExperience) {
    const expText = `${exp.title} ${exp.description}`.toLowerCase()
    const jobWords = job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    const reqWords = job.requirements.join(' ').toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    const allJobWords = [...jobWords, ...reqWords]
    let hitCount = 0
    for (const w of allJobWords) {
      const syns = getSynonyms(w)
      for (const s of syns) {
        if (expText.includes(s)) {
          hitCount++
          break
        }
      }
    }
    if (hitCount >= 1) {
      relevantExp.push(`${exp.title} at ${exp.company}`)
      experienceScore += Math.min(hitCount * 1.5, 6)
    }
  }
  experienceScore = Math.min(experienceScore, 10)

  for (const exp of relevantExp.slice(0, 2)) {
    if (!matchPoints.some((mp) => mp.includes(exp))) {
      matchPoints.push(`相关工作经验：${exp}`)
    }
  }

  let educationScore = 0
  for (const edu of resume.education) {
    const eduText = `${edu.degree} ${edu.major}`.toLowerCase()
    const descLower = job.description.toLowerCase()
    const titleLower = job.title.toLowerCase()
    const majorSyns = getSynonyms(edu.major.toLowerCase())
    for (const s of majorSyns) {
      if (descLower.includes(s) || titleLower.includes(s)) {
        educationScore = 4
        if (!matchPoints.some((mp) => mp.includes(edu.major))) {
          matchPoints.push(`专业匹配：${edu.degree} - ${edu.major}与岗位方向一致`)
        }
        break
      }
    }
    if (educationScore > 0) break
  }

  let skillsBonus = 0
  const reqText = job.requirements.join(' ').toLowerCase()
  const extraSkills = resume.skills.filter((s) => {
    const skillLower = s.toLowerCase()
    if (reqText.includes(skillLower)) return false
    const syns = getSynonyms(skillLower)
    for (const syn of syns) {
      if (reqText.includes(syn)) return false
    }
    return true
  })

  const jobLowerFull = `${jobText} ${reqText}`
  for (const skill of extraSkills) {
    const skillLower = skill.toLowerCase()
    if (jobLowerFull.includes(skillLower)) {
      if (!matchPoints.some((mp) => mp.includes(skill))) {
        matchPoints.push(`额外加分技能：${skill}`)
      }
      skillsBonus += 0.5
    } else {
      const syns = getSynonyms(skillLower)
      let matched = false
      for (const s of syns) {
        if (jobLowerFull.includes(s)) {
          matched = true
          break
        }
      }
      if (matched) {
        if (!matchPoints.some((mp) => mp.includes(skill))) {
          matchPoints.push(`额外加分技能：${skill}（与岗位需求语义相关）`)
        }
        skillsBonus += 0.3
      }
    }
  }
  skillsBonus = Math.min(skillsBonus, 3)

  let finalScore = baseReqScore + contentSimScore + experienceScore + educationScore + skillsBonus
  finalScore = Math.min(Math.max(Math.round(finalScore), 0), 100)

  if (job.requirements.length > 0 && gapPoints.length === 0 && finalScore < 98) {
    finalScore = Math.min(finalScore + 2, 100)
  }
  if (matchPoints.length >= 6 && finalScore < 98) {
    finalScore = Math.min(finalScore + 1, 100)
  }
  if (resume.workExperience.length >= 3 && finalScore < 98) {
    finalScore = Math.min(finalScore + 1, 100)
  }

  const seenMatches = new Set<string>()
  const uniqueMatchPoints = matchPoints.filter((mp) => {
    if (seenMatches.has(mp)) return false
    seenMatches.add(mp)
    return true
  })

  const seenGaps = new Set<string>()
  const uniqueGapPoints = gapPoints.filter((gp) => {
    if (seenGaps.has(gp)) return false
    seenGaps.add(gp)
    return true
  })

  return {
    score: finalScore,
    matchPoints: uniqueMatchPoints.slice(0, 8),
    gapPoints: uniqueGapPoints.slice(0, 5),
  }
}
