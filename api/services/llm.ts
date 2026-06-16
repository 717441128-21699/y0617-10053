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

export function parseResume(text: string): ParsedResume {
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
