import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { authMiddleware, generateToken } from '../middleware/auth.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body

    if (!email || !password || !name || !role) {
      res.status(400).json({ success: false, error: 'email, password, name, and role are required' })
      return
    }

    if (!['candidate', 'hr'].includes(role)) {
      res.status(400).json({ success: false, error: 'role must be candidate or hr' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const id = uuidv4()

    db.prepare(
      'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)'
    ).run(id, email, hashedPassword, name, role)

    const token = generateToken({ id, email, role })

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id, email, name, role },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Registration failed' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'email and password are required' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' })
      return
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role })

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' })
  }
})

router.get('/me', authMiddleware, (req: Request, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' })
      return
    }
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get user info' })
  }
})

export default router
