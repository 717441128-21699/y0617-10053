import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { parseResume } from '../services/llm.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

router.use(authMiddleware, requireRole('candidate'))

router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' })
      return
    }

    const pdfParse = (await import('pdf-parse')).default
    const dataBuffer = fs.readFileSync(req.file.path)
    const pdfData = await pdfParse(dataBuffer)
    const text = pdfData.text

    const parsed = parseResume(text)

    const basicInfo = {
      name: parsed.basicInfo.name,
      phone: parsed.basicInfo.phone,
      email: parsed.basicInfo.email,
      location: parsed.basicInfo.summary || '',
    }
    const education = parsed.education.map((e: any) => ({
      school: e.school,
      degree: e.degree,
      major: e.major,
      startDate: e.year ? e.year.split('-')[0]?.trim() || e.year : '',
      endDate: e.year ? e.year.split('-')[1]?.trim() || e.year : '',
    }))
    const workExperience = parsed.workExperience.map((w: any) => ({
      company: w.company,
      position: w.title,
      startDate: w.duration ? w.duration.split('-')[0]?.trim() || w.duration : '',
      endDate: w.duration ? w.duration.split('-')[1]?.trim() || w.duration : '',
      description: w.description,
    }))

    const id = uuidv4()
    const userId = req.user!.id

    db.prepare(
      'INSERT INTO resumes (id, user_id, file_path, basic_info, education, work_experience, skills) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      userId,
      req.file.path,
      JSON.stringify(basicInfo),
      JSON.stringify(education),
      JSON.stringify(workExperience),
      JSON.stringify(parsed.skills),
    )

    res.status(201).json({
      success: true,
      data: {
        id,
        basicInfo,
        education,
        workExperience,
        skills: parsed.skills,
        confirmed: 0,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to parse resume' })
  }
})

router.get('/me', (req: Request, res: Response): void => {
  try {
    const resume = db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC').get(req.user!.id) as any
    if (!resume) {
      res.status(404).json({ success: false, error: 'No resume found' })
      return
    }

    res.json({
      success: true,
      data: {
        id: resume.id,
        basicInfo: JSON.parse(resume.basic_info),
        education: JSON.parse(resume.education),
        workExperience: JSON.parse(resume.work_experience),
        skills: JSON.parse(resume.skills),
        confirmed: resume.confirmed,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get resume' })
  }
})

router.put('/:id', (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { basicInfo, education, workExperience, skills } = req.body

    const resume = db.prepare('SELECT * FROM resumes WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any
    if (!resume) {
      res.status(404).json({ success: false, error: 'Resume not found' })
      return
    }

    const updates: string[] = []
    const values: any[] = []

    if (basicInfo !== undefined) {
      updates.push('basic_info = ?')
      values.push(JSON.stringify(basicInfo))
    }
    if (education !== undefined) {
      updates.push('education = ?')
      values.push(JSON.stringify(education))
    }
    if (workExperience !== undefined) {
      updates.push('work_experience = ?')
      values.push(JSON.stringify(workExperience))
    }
    if (skills !== undefined) {
      updates.push('skills = ?')
      values.push(JSON.stringify(skills))
    }

    updates.push('confirmed = 1')
    updates.push("updated_at = datetime('now')")
    values.push(id)

    if (updates.length > 2) {
      db.prepare(`UPDATE resumes SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }

    const updated = db.prepare('SELECT * FROM resumes WHERE id = ?').get(id) as any

    res.json({
      success: true,
      data: {
        id: updated.id,
        basicInfo: JSON.parse(updated.basic_info),
        education: JSON.parse(updated.education),
        workExperience: JSON.parse(updated.work_experience),
        skills: JSON.parse(updated.skills),
        confirmed: updated.confirmed,
        updatedAt: updated.updated_at,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update resume' })
  }
  return Promise.resolve()
})

export default router
