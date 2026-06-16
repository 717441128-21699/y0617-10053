import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { calculateMatch } from '../services/matching.js'

const router = Router()

router.post('/', authMiddleware, requireRole('hr'), (req: Request, res: Response): void => {
  try {
    const { title, description, requirements, salaryRange } = req.body

    if (!title || !description) {
      res.status(400).json({ success: false, error: 'title and description are required' })
      return
    }

    const id = uuidv4()
    const hrId = req.user!.id

    db.prepare(
      'INSERT INTO jobs (id, hr_id, title, description, requirements, salary_range) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, hrId, title, description, JSON.stringify(requirements || []), salaryRange || null)

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any

    res.status(201).json({
      success: true,
      data: {
        id: job.id,
        hrId: job.hr_id,
        title: job.title,
        description: job.description,
        requirements: JSON.parse(job.requirements),
        salaryRange: job.salary_range,
        status: job.status,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create job' })
  }
})

router.get('/', (req: Request, res: Response): void => {
  try {
    const { hrId, status } = req.query

    let sql = 'SELECT * FROM jobs WHERE 1=1'
    const params: any[] = []

    if (hrId) {
      sql += ' AND hr_id = ?'
      params.push(hrId)
    }
    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }

    sql += ' ORDER BY created_at DESC'

    const jobs = db.prepare(sql).all(...params) as any[]

    res.json({
      success: true,
      data: jobs.map(j => ({
        id: j.id,
        hrId: j.hr_id,
        title: j.title,
        description: j.description,
        requirements: JSON.parse(j.requirements),
        salaryRange: j.salary_range,
        status: j.status,
        createdAt: j.created_at,
        updatedAt: j.updated_at,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list jobs' })
  }
})

router.get('/:id', authMiddleware, requireRole('hr'), (req: Request, res: Response): void => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' })
      return
    }

    const candidates = db.prepare(`
      SELECT jc.*, u.name as candidate_name, u.email as candidate_email
      FROM job_candidates jc
      JOIN users u ON jc.candidate_id = u.id
      WHERE jc.job_id = ?
      ORDER BY jc.match_score DESC
    `).all(req.params.id) as any[]

    res.json({
      success: true,
      data: {
        id: job.id,
        hrId: job.hr_id,
        title: job.title,
        description: job.description,
        requirements: JSON.parse(job.requirements),
        salaryRange: job.salary_range,
        status: job.status,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        candidates: candidates.map(c => ({
          id: c.id,
          candidateId: c.candidate_id,
          candidateName: c.candidate_name,
          candidateEmail: c.candidate_email,
          resumeId: c.resume_id,
          matchScore: c.match_score,
          matchPoints: JSON.parse(c.match_points),
          gapPoints: JSON.parse(c.gap_points),
          scoreBreakdown: c.score_breakdown ? JSON.parse(c.score_breakdown) : undefined,
          status: c.status,
          note: c.note,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        })),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get job' })
  }
})

router.put('/:id', authMiddleware, requireRole('hr'), (req: Request, res: Response): void => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' })
      return
    }
    if (job.hr_id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'You can only update your own jobs' })
      return
    }

    const { title, description, requirements, salaryRange, status } = req.body
    const updates: string[] = []
    const values: any[] = []

    if (title !== undefined) {
      updates.push('title = ?')
      values.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (requirements !== undefined) {
      updates.push('requirements = ?')
      values.push(JSON.stringify(requirements))
    }
    if (salaryRange !== undefined) {
      updates.push('salary_range = ?')
      values.push(salaryRange)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      values.push(status)
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')")
      values.push(req.params.id)
      db.prepare(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    }

    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any

    res.json({
      success: true,
      data: {
        id: updated.id,
        hrId: updated.hr_id,
        title: updated.title,
        description: updated.description,
        requirements: JSON.parse(updated.requirements),
        salaryRange: updated.salary_range,
        status: updated.status,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update job' })
  }
})

router.delete('/:id', authMiddleware, requireRole('hr'), (req: Request, res: Response): void => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' })
      return
    }
    if (job.hr_id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'You can only delete your own jobs' })
      return
    }

    const deleteCandidates = db.prepare('DELETE FROM job_candidates WHERE job_id = ?')
    const deleteJob = db.prepare('DELETE FROM jobs WHERE id = ?')

    db.transaction(() => {
      deleteCandidates.run(req.params.id)
      deleteJob.run(req.params.id)
    })

    res.json({ success: true, data: { message: 'Job deleted' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete job' })
  }
})

router.post('/:id/calculate', authMiddleware, requireRole('hr'), (req: Request, res: Response): Promise<void> => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' })
      return
    }
    if (job.hr_id !== req.user!.id) {
      res.status(403).json({ success: false, error: 'You can only calculate matches for your own jobs' })
      return
    }

    const jobData = {
      title: job.title,
      description: job.description,
      requirements: JSON.parse(job.requirements),
    }

    const resumes = db.prepare(`
      SELECT r.*, u.name as candidate_name, u.email as candidate_email
      FROM (
        SELECT r1.*
        FROM resumes r1
        WHERE r1.confirmed = 1
        AND r1.created_at = (
          SELECT MAX(created_at)
          FROM resumes
          WHERE user_id = r1.user_id AND confirmed = 1
        )
      ) r
      JOIN users u ON r.user_id = u.id
      WHERE u.role = 'candidate'
    `).all() as any[]

    const upsertCandidate = db.prepare(`
      INSERT INTO job_candidates (id, job_id, candidate_id, resume_id, match_score, match_points, gap_points, score_breakdown, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      ON CONFLICT(job_id, candidate_id) DO UPDATE SET
        resume_id = excluded.resume_id,
        match_score = excluded.match_score,
        match_points = excluded.match_points,
        gap_points = excluded.gap_points,
        score_breakdown = excluded.score_breakdown,
        updated_at = datetime('now')
    `)

    const results: any[] = []

    db.transaction(() => {
      for (const resume of resumes) {
        const rawWorkExp = JSON.parse(resume.work_experience)
        const rawEdu = JSON.parse(resume.education)
        const resumeData = {
          skills: JSON.parse(resume.skills),
          workExperience: rawWorkExp.map((w: any) => ({
            company: w.company || '',
            title: w.title || w.position || '',
            duration: w.duration || `${w.startDate || ''}-${w.endDate || ''}`,
            description: w.description || '',
          })),
          education: rawEdu.map((e: any) => ({
            school: e.school || '',
            degree: e.degree || '',
            major: e.major || '',
            year: e.year || `${e.startDate || ''}-${e.endDate || ''}`,
          })),
        }

        const match = calculateMatch(jobData, resumeData)

        upsertCandidate.run(
          uuidv4(),
          req.params.id,
          resume.user_id,
          resume.id,
          match.score,
          JSON.stringify(match.matchPoints),
          JSON.stringify(match.gapPoints),
          JSON.stringify(match.scoreBreakdown),
        )

        results.push({
          candidateId: resume.user_id,
          candidateName: resume.candidate_name,
          candidateEmail: resume.candidate_email,
          resumeId: resume.id,
          matchScore: match.score,
          matchPoints: match.matchPoints,
          gapPoints: match.gapPoints,
          scoreBreakdown: match.scoreBreakdown,
        })
      }
    })

    res.json({
      success: true,
      data: {
        jobId: req.params.id,
        totalCandidates: results.length,
        results: results.sort((a, b) => b.matchScore - a.matchScore),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to calculate matches' })
  }
  return Promise.resolve()
})

export default router
