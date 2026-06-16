import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import db, { initDb, seed } from './db.js'
import authRoutes from './routes/auth.js'
import resumeRoutes from './routes/resume.js'
import jobsRoutes from './routes/jobs.js'
import matchingRoutes from './routes/matching.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

let dbReady = false
const dbInitPromise = initDb().then(() => {
  seed()
  dbReady = true
})

const uploadsDir = path.resolve(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const app: express.Application = express()

app.use(async (_req, _res, next) => {
  if (!dbReady) {
    await dbInitPromise
  }
  next()
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/jobs', jobsRoutes)
app.use('/api/matching', matchingRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, error: 'File size exceeds 10MB limit' })
      return
    }
    res.status(400).json({ success: false, error: error.message })
    return
  }
  if (error.message === 'Only PDF files are allowed') {
    res.status(400).json({ success: false, error: error.message })
    return
  }
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
