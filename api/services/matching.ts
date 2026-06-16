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

function normalize(str: string): string {
  return str.toLowerCase().replace(/[-_.\s]/g, '')
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

export function calculateMatch(job: JobInput, resume: ResumeInput): MatchResult {
  const matchPoints: string[] = []
  const gapPoints: string[] = []
  const matchedReqs: string[] = []
  const unmatchedReqs: string[] = []

  const allResumeText = [
    ...resume.skills,
    ...resume.workExperience.map(w => `${w.title} ${w.description} ${w.company}`),
    ...resume.education.map(e => `${e.degree} ${e.major} ${e.school}`),
  ].join(' ').toLowerCase()

  const resumeSkillsLower = resume.skills.map(s => normalize(s))

  for (const req of job.requirements) {
    const reqLower = normalize(req)
    let isMatched = false

    for (const skill of resume.skills) {
      if (fuzzyMatch(req, skill)) {
        isMatched = true
        break
      }
    }

    if (!isMatched) {
      const reqWords = reqLower.split(/\s+/)
      const wordMatchCount = reqWords.filter(w => w.length > 2 && allResumeText.includes(w)).length
      if (reqWords.length > 0 && wordMatchCount / reqWords.length >= 0.5) {
        isMatched = true
      }
    }

    if (isMatched) {
      matchedReqs.push(req)
      matchPoints.push(`Meets requirement: ${req}`)
    } else {
      unmatchedReqs.push(req)
      gapPoints.push(`Missing requirement: ${req}`)
    }
  }

  for (const skill of resumeSkillsLower) {
    if (job.title.toLowerCase().includes(skill) || job.description.toLowerCase().includes(skill)) {
      const originalSkill = resume.skills.find(s => normalize(s) === skill)
      if (originalSkill && !matchPoints.some(mp => mp.includes(originalSkill))) {
        matchPoints.push(`Relevant skill from resume: ${originalSkill}`)
      }
    }
  }

  for (const exp of resume.workExperience) {
    const expLower = `${exp.title} ${exp.description}`.toLowerCase()
    const titleLower = job.title.toLowerCase()
    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3)
    if (titleWords.some(w => expLower.includes(w))) {
      matchPoints.push(`Relevant experience: ${exp.title} at ${exp.company}`)
    }
  }

  for (const edu of resume.education) {
    const eduLower = `${edu.degree} ${edu.major}`.toLowerCase()
    const descLower = job.description.toLowerCase()
    if (edu.major.toLowerCase() !== 'related field' && descLower.includes(edu.major.toLowerCase())) {
      matchPoints.push(`Relevant education: ${edu.degree} in ${edu.major} from ${edu.school}`)
    }
  }

  const totalReqs = job.requirements.length
  let score: number

  if (totalReqs > 0) {
    const baseScore = (matchedReqs.length / totalReqs) * 70
    const bonusScore = Math.min((matchPoints.length - matchedReqs.length) * 3, 20)
    const experienceBonus = resume.workExperience.length > 0 ? Math.min(resume.workExperience.length * 3, 10) : 0
    score = Math.min(Math.round((baseScore + bonusScore + experienceBonus) * 10) / 10, 100)
  } else {
    const skillOverlap = resume.skills.length > 0 ? 50 : 20
    const experienceBonus = resume.workExperience.length > 0 ? 30 : 0
    const educationBonus = resume.education.length > 0 ? 20 : 0
    score = Math.min(skillOverlap + experienceBonus + educationBonus, 100)
  }

  if (unmatchedReqs.length === 0 && totalReqs > 0) {
    score = Math.min(score + 5, 100)
  }

  score = Math.max(score, 0)

  return {
    score,
    matchPoints,
    gapPoints,
  }
}
