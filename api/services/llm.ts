export interface ParsedResume {
  basicInfo: {
    name: string
    email: string
    phone: string
    summary: string
  }
  education: Array<{
    school: string
    degree: string
    major: string
    year: string
  }>
  workExperience: Array<{
    company: string
    title: string
    duration: string
    description: string
  }>
  skills: string[]
}

export interface LLMConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
}

function getConfig(): LLMConfig {
  return {
    apiKey: process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_API_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
  }
}

export class ResumeParseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'ResumeParseError'
  }
}

const SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
  'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind', 'Bootstrap',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins',
  'REST API', 'GraphQL', 'Microservices', 'Agile', 'Scrum',
  'TensorFlow', 'PyTorch', 'Spark', 'Hadoop', 'Kafka',
  'Linux', 'Nginx', 'RabbitMQ', 'Elasticsearch',
  'Pandas', 'NumPy', 'Matplotlib', 'ETL',
  'Figma', 'Webpack', 'Vite', 'Jest', 'Cypress',
]

function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  return text.match(emailRegex) || []
}

function extractPhones(text: string): string[] {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g
  const matches = text.match(phoneRegex) || []
  return matches.filter(m => m.replace(/\D/g, '').length >= 7)
}

function extractName(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line)) {
      return line.split(/\s{2,}/)[0].trim()
    }
    if (/^[\u4e00-\u9fa5]{2,4}$/.test(line)) {
      return line
    }
  }
  return lines[0]?.substring(0, 30) || 'Unknown'
}

function extractSkills(text: string): string[] {
  const found: string[] = []
  const textLower = text.toLowerCase()
  for (const skill of SKILL_KEYWORDS) {
    if (textLower.includes(skill.toLowerCase())) {
      found.push(skill)
    }
  }
  return [...new Set(found)]
}

function extractEducation(text: string): ParsedResume['education'] {
  const results: ParsedResume['education'] = []
  const eduKeywords = ['university', 'college', 'institute', 'school', '大学', '学院']
  const degreeKeywords = ['bachelor', 'master', 'phd', 'doctor', '本科', '硕士', '博士', 'B.S.', 'M.S.', 'B.A.', 'M.A.']
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase()
    if (eduKeywords.some(k => lineLower.includes(k)) || degreeKeywords.some(k => lineLower.includes(k))) {
      results.push({
        school: lines[i].substring(0, 100),
        degree: degreeKeywords.find(k => lineLower.includes(k)) || 'Bachelor',
        major: 'Related Field',
        year: (lines[i].match(/20\d{2}\s*[-–]\s*20\d{2}/) || ['Unknown'])[0],
      })
      if (results.length >= 3) break
    }
  }

  if (results.length === 0) {
    results.push({
      school: 'Unknown Institution',
      degree: 'Bachelor',
      major: 'Computer Science',
      year: 'Unknown',
    })
  }

  return results
}

function extractWorkExperience(text: string): ParsedResume['workExperience'] {
  const results: ParsedResume['workExperience'] = []
  const jobTitles = [
    'engineer', 'developer', 'manager', 'analyst', 'designer', 'director',
    'architect', 'lead', 'intern', 'consultant', 'specialist',
    '工程师', '开发', '经理', '主管',
  ]
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase()
    if (jobTitles.some(t => lineLower.includes(t))) {
      const durationMatch = lines[i].match(/20\d{2}\s*[-–]\s*(20\d{2}|present|current|至今)/i)
      results.push({
        company: lines[i].split(/[-–|,]/)[0]?.trim().substring(0, 60) || 'Unknown Company',
        title: lines[i].substring(0, 80),
        duration: durationMatch ? durationMatch[0] : 'Unknown',
        description: i + 1 < lines.length ? lines[i + 1].substring(0, 200) : '',
      })
      if (results.length >= 4) break
    }
  }

  if (results.length === 0) {
    results.push({
      company: 'Unknown Company',
      title: 'Software Engineer',
      duration: 'Unknown',
      description: '',
    })
  }

  return results
}

function mockParseResume(text: string): ParsedResume {
  const emails = extractEmails(text)
  const phones = extractPhones(text)
  const name = extractName(text)
  const skills = extractSkills(text)
  const education = extractEducation(text)
  const workExperience = extractWorkExperience(text)

  const summaryLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20 && l.length < 200)
  const summary = summaryLines.slice(0, 3).join(' ').substring(0, 300) || 'Experienced professional'

  return {
    basicInfo: {
      name,
      email: emails[0] || '',
      phone: phones[0] || '',
      summary,
    },
    education,
    workExperience,
    skills,
  }
}

const SYSTEM_PROMPT = `你是一个专业的简历解析助手。请从用户提供的简历文本中提取结构化信息，并严格按照指定的 JSON 格式返回结果。

要求：
1. 准确提取所有字段，无法确定时使用空字符串或合理默认值
2. 教育经历按时间倒序排列，最多提取 3 条
3. 工作经历按时间倒序排列，最多提取 5 条
4. 技能标签使用中文或英文原文，最多提取 20 个
5. 只返回 JSON 对象，不要包含任何解释文字、markdown 标记或代码块符号

返回 JSON 格式：
{
  "basicInfo": {
    "name": "姓名",
    "email": "邮箱",
    "phone": "电话",
    "summary": "所在地或个人简介"
  },
  "education": [
    {
      "school": "学校名称",
      "degree": "学历（本科/硕士/博士/Bachelor/Master/PhD）",
      "major": "专业",
      "year": "起止年份（如 2018-2022）"
    }
  ],
  "workExperience": [
    {
      "company": "公司名称",
      "title": "职位",
      "duration": "起止时间（如 2022-01 至今）",
      "description": "工作描述"
    }
  ],
  "skills": ["技能1", "技能2"]
}`

async function callLLMAPI(config: LLMConfig, text: string): Promise<ParsedResume> {
  if (!config.apiKey) {
    throw new ResumeParseError('未配置大模型 API Key，请联系管理员设置 LLM_API_KEY 环境变量')
  }

  const truncatedText = text.length > 12000 ? text.substring(0, 12000) + '...' : text

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `请解析以下简历内容：\n\n${truncatedText}` },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      if (response.status === 401) {
        throw new ResumeParseError('大模型 API Key 无效或已过期，请检查配置')
      }
      if (response.status === 429) {
        throw new ResumeParseError('大模型 API 调用频率超限，请稍后重试')
      }
      if (response.status >= 500) {
        throw new ResumeParseError(`大模型服务暂时不可用（HTTP ${response.status}），请稍后重试或使用备用模式`)
      }
      throw new ResumeParseError(`大模型解析失败（HTTP ${response.status}）：${errorText.substring(0, 200) || '未知错误'}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new ResumeParseError('大模型返回了空结果，请检查简历内容是否完整')
    }

    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch {
          throw new ResumeParseError('大模型返回的 JSON 格式无法解析，请稍后重试')
        }
      } else {
        throw new ResumeParseError('大模型返回的结果不是有效的 JSON 格式，请稍后重试')
      }
    }

    const requiredFields = ['basicInfo', 'education', 'workExperience', 'skills']
    for (const field of requiredFields) {
      if (parsed[field] === undefined) {
        throw new ResumeParseError(`解析结果缺少必需字段：${field}，请检查简历内容或稍后重试`)
      }
    }

    return parsed as ParsedResume
  } catch (error) {
    if (error instanceof ResumeParseError) {
      throw error
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ResumeParseError('无法连接到大模型服务，请检查网络连接后重试')
    }
    if (error instanceof SyntaxError) {
      throw new ResumeParseError('大模型返回结果格式异常，请稍后重试')
    }
    throw new ResumeParseError(
      `简历解析失败：${(error as Error).message || '未知错误'}`,
      error
    )
  }
}

export async function parseResume(text: string, forceMock: boolean = false): Promise<ParsedResume> {
  const config = getConfig()

  if (!text || text.trim().length < 10) {
    throw new ResumeParseError('简历内容为空或内容过少，无法解析。请确保 PDF 文件包含可读的文本内容')
  }

  if (forceMock) {
    return mockParseResume(text)
  }

  if (config.apiKey) {
    const result = await callLLMAPI(config, text)
    return result
  }

  return mockParseResume(text)
}

export { getConfig }
