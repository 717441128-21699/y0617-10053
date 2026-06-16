import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware, requireRole('hr'))

router.put('/:jobId/:candidateId/status', (req: Request, res: Response): void => {
  try {
    const { jobId, candidateId } = req.params
    const { status } = req.body

    const validStatuses = ['pending', 'screening', 'interview', 'offer', 'rejected']
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: `status must be one of: ${validStatuses.join(', ')}` })
      return
    }

    const candidate = db.prepare(
      'SELECT * FROM job_candidates WHERE job_id = ? AND candidate_id = ?'
    ).get(jobId, candidateId) as any

    if (!candidate) {
      res.status(404).json({ success: false, error: 'Candidate not found for this job' })
      return
    }

    db.prepare(
      "UPDATE job_candidates SET status = ?, updated_at = datetime('now') WHERE job_id = ? AND candidate_id = ?"
    ).run(status, jobId, candidateId)

    res.json({ success: true, data: { jobId, candidateId, status } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update status' })
  }
})

router.put('/:jobId/:candidateId/note', (req: Request, res: Response): void => {
  try {
    const { jobId, candidateId } = req.params
    const { note } = req.body

    if (note === undefined) {
      res.status(400).json({ success: false, error: 'note is required' })
      return
    }

    const candidate = db.prepare(
      'SELECT * FROM job_candidates WHERE job_id = ? AND candidate_id = ?'
    ).get(jobId, candidateId) as any

    if (!candidate) {
      res.status(404).json({ success: false, error: 'Candidate not found for this job' })
      return
    }

    db.prepare(
      "UPDATE job_candidates SET note = ?, updated_at = datetime('now') WHERE job_id = ? AND candidate_id = ?"
    ).run(note, jobId, candidateId)

    res.json({ success: true, data: { jobId, candidateId, note } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update note' })
  }
})

router.get('/candidates', (req: Request, res: Response): void => {
  try {
    const { jobId, status, minScore, maxScore } = req.query

    let sql = `
      SELECT jc.*, u.name as candidate_name, u.email as candidate_email,
             j.title as job_title, r.basic_info as resume_basic_info
      FROM job_candidates jc
      JOIN users u ON jc.candidate_id = u.id
      JOIN jobs j ON jc.job_id = j.id
      LEFT JOIN resumes r ON jc.resume_id = r.id
      WHERE 1=1
    `
    const params: any[] = []

    if (jobId) {
      sql += ' AND jc.job_id = ?'
      params.push(jobId)
    }
    if (status) {
      const statusList = String(status).split(',').filter(s => s.trim())
      if (statusList.length > 0) {
        sql += ` AND jc.status IN (${statusList.map(() => '?').join(',')})`
        params.push(...statusList)
      }
    }
    if (minScore) {
      sql += ' AND jc.match_score >= ?'
      params.push(Number(minScore))
    }
    if (maxScore) {
      sql += ' AND jc.match_score <= ?'
      params.push(Number(maxScore))
    }

    sql += ' ORDER BY jc.match_score DESC'

    const candidates = db.prepare(sql).all(...params) as any[]

    res.json({
      success: true,
      data: candidates.map(c => ({
        id: c.id,
        jobId: c.job_id,
        jobTitle: c.job_title,
        candidateId: c.candidate_id,
        candidateName: c.candidate_name,
        candidateEmail: c.candidate_email,
        resumeId: c.resume_id,
        basicInfo: JSON.parse(c.resume_basic_info || '{}'),
        matchScore: c.match_score,
        matchPoints: JSON.parse(c.match_points),
        gapPoints: JSON.parse(c.gap_points),
        scoreBreakdown: c.score_breakdown ? JSON.parse(c.score_breakdown) : undefined,
        status: c.status,
        note: c.note,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to list candidates' })
  }
})

router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, status, minScore, maxScore } = req.query

    let sql = `
      SELECT jc.match_score, jc.status, jc.note,
             u.name as candidate_name, u.email as candidate_email,
             j.title as job_title,
             jc.match_points, jc.gap_points
      FROM job_candidates jc
      JOIN users u ON jc.candidate_id = u.id
      JOIN jobs j ON jc.job_id = j.id
      WHERE 1=1
    `
    const params: any[] = []

    if (jobId) {
      sql += ' AND jc.job_id = ?'
      params.push(jobId)
    }
    if (status) {
      const statusList = String(status).split(',').filter(s => s.trim())
      if (statusList.length > 0) {
        sql += ` AND jc.status IN (${statusList.map(() => '?').join(',')})`
        params.push(...statusList)
      }
    }
    if (minScore) {
      sql += ' AND jc.match_score >= ?'
      params.push(Number(minScore))
    }
    if (maxScore) {
      sql += ' AND jc.match_score <= ?'
      params.push(Number(maxScore))
    }

    sql += ' ORDER BY jc.match_score DESC'

    const candidates = db.prepare(sql).all(...params) as any[]

    const XLSX = await import('xlsx')
    const rows = candidates.map(c => ({
      'Job Title': c.job_title,
      'Candidate Name': c.candidate_name,
      'Candidate Email': c.candidate_email,
      'Match Score': c.match_score,
      'Status': c.status,
      'Match Points': (JSON.parse(c.match_points) as string[]).join('; '),
      'Gap Points': (JSON.parse(c.gap_points) as string[]).join('; '),
      'Note': c.note,
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=candidates.xlsx')
    res.send(buffer)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export candidates' })
  }
})

export default router
