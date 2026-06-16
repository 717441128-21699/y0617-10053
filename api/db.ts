import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.resolve(__dirname, '..', 'data.db')

interface PreparedResult {
  get: (...params: any[]) => Record<string, any> | undefined
  all: (...params: any[]) => Record<string, any>[]
  run: (...params: any[]) => { changes: number; lastInsertRowid: number }
}

class DbWrapper {
  private db!: SqlJsDatabase
  private initialized = false
  private inTransaction = false

  async init() {
    if (this.initialized) return

    const SQL = await initSqlJs()

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath)
      this.db = new SQL.Database(buffer)
    } else {
      this.db = new SQL.Database()
    }

    this.db.run('PRAGMA foreign_keys = ON')
    this.createTables()
    this.initialized = true
  }

  private createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK(role IN ('candidate', 'hr')) NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        file_path TEXT NOT NULL,
        basic_info TEXT NOT NULL DEFAULT '{}',
        education TEXT NOT NULL DEFAULT '[]',
        work_experience TEXT NOT NULL DEFAULT '[]',
        skills TEXT NOT NULL DEFAULT '[]',
        confirmed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        hr_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        requirements TEXT NOT NULL DEFAULT '[]',
        salary_range TEXT,
        status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS job_candidates (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL REFERENCES jobs(id),
        candidate_id TEXT NOT NULL REFERENCES users(id),
        resume_id TEXT NOT NULL REFERENCES resumes(id),
        match_score REAL NOT NULL DEFAULT 0,
        match_points TEXT NOT NULL DEFAULT '[]',
        gap_points TEXT NOT NULL DEFAULT '[]',
        status TEXT CHECK(status IN ('pending', 'screening', 'interview', 'offer', 'rejected')) DEFAULT 'pending',
        note TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(job_id, candidate_id)
      )
    `)

    this.db.run('CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_jobs_hr_id ON jobs(hr_id)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_job_candidates_job_id ON job_candidates(job_id)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_job_candidates_candidate_id ON job_candidates(candidate_id)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_job_candidates_status ON job_candidates(status)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_job_candidates_match_score ON job_candidates(match_score)')

    this.save()
  }

  save() {
    const data = this.db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }

  prepare(sql: string): PreparedResult {
    return {
      get: (...params: any[]): Record<string, any> | undefined => {
        const stmt = this.db.prepare(sql)
        if (params.length > 0) stmt.bind(params)
        let result: Record<string, any> | undefined
        if (stmt.step()) {
          result = stmt.getAsObject() as Record<string, any>
        }
        stmt.free()
        return result
      },
      all: (...params: any[]): Record<string, any>[] => {
        const stmt = this.db.prepare(sql)
        if (params.length > 0) stmt.bind(params)
        const results: Record<string, any>[] = []
        while (stmt.step()) {
          results.push(stmt.getAsObject() as Record<string, any>)
        }
        stmt.free()
        return results
      },
      run: (...params: any[]): { changes: number; lastInsertRowid: number } => {
        this.db.run(sql, params)
        const changes = this.db.getRowsModified()
        if (!this.inTransaction) {
          this.save()
        }
        return { changes, lastInsertRowid: 0 }
      },
    }
  }

  transaction<T>(fn: () => T): T {
    this.inTransaction = true
    this.db.run('BEGIN TRANSACTION')
    try {
      const result = fn()
      this.db.run('COMMIT')
      this.inTransaction = false
      this.save()
      return result
    } catch (error) {
      this.db.run('ROLLBACK')
      this.inTransaction = false
      this.save()
      throw error
    }
  }
}

const db = new DbWrapper()

export async function initDb() {
  await db.init()
}

export function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number } | undefined
  if (userCount && userCount.count > 0) return

  const hash = bcrypt.hashSync('password123', 10)

  const hrUsers = [
    { id: uuidv4(), email: 'hr1@company.com', password: hash, name: 'Alice Zhang', role: 'hr' },
    { id: uuidv4(), email: 'hr2@company.com', password: hash, name: 'Bob Li', role: 'hr' },
    { id: uuidv4(), email: 'hr3@company.com', password: hash, name: 'Carol Wang', role: 'hr' },
  ]

  const candidateUsers = [
    { id: uuidv4(), email: 'candidate1@example.com', password: hash, name: 'David Chen', role: 'candidate' },
    { id: uuidv4(), email: 'candidate2@example.com', password: hash, name: 'Eva Liu', role: 'candidate' },
    { id: uuidv4(), email: 'candidate3@example.com', password: hash, name: 'Frank Wu', role: 'candidate' },
    { id: uuidv4(), email: 'candidate4@example.com', password: hash, name: 'Grace Zhao', role: 'candidate' },
    { id: uuidv4(), email: 'candidate5@example.com', password: hash, name: 'Henry Sun', role: 'candidate' },
  ]

  const resumes: { id: string; userId: string }[] = []

  const candidateResumes = [
    {
      userId: candidateUsers[0].id,
      basicInfo: JSON.stringify({ name: 'David Chen', email: 'candidate1@example.com', phone: '138-0001-0001', summary: 'Experienced frontend developer with 5 years of React and TypeScript experience.' }),
      education: JSON.stringify([{ school: 'Tsinghua University', degree: 'Bachelor', major: 'Computer Science', year: '2016-2020' }]),
      workExperience: JSON.stringify([{ company: 'TechCorp', title: 'Senior Frontend Engineer', duration: '2020-2024', description: 'Built React applications with TypeScript, led a team of 4 engineers.' }]),
      skills: JSON.stringify(['React', 'TypeScript', 'JavaScript', 'Node.js', 'CSS', 'HTML', 'Git']),
    },
    {
      userId: candidateUsers[1].id,
      basicInfo: JSON.stringify({ name: 'Eva Liu', email: 'candidate2@example.com', phone: '138-0002-0002', summary: 'Full-stack developer specializing in Python and cloud technologies.' }),
      education: JSON.stringify([{ school: 'Peking University', degree: 'Master', major: 'Software Engineering', year: '2017-2020' }]),
      workExperience: JSON.stringify([{ company: 'CloudInc', title: 'Full Stack Developer', duration: '2020-2024', description: 'Developed Python backend services and React frontend dashboards.' }]),
      skills: JSON.stringify(['Python', 'Django', 'React', 'AWS', 'Docker', 'PostgreSQL', 'Redis']),
    },
    {
      userId: candidateUsers[2].id,
      basicInfo: JSON.stringify({ name: 'Frank Wu', email: 'candidate3@example.com', phone: '138-0003-0003', summary: 'Data engineer with strong ML and data pipeline expertise.' }),
      education: JSON.stringify([{ school: 'Zhejiang University', degree: 'Bachelor', major: 'Data Science', year: '2018-2022' }]),
      workExperience: JSON.stringify([{ company: 'DataFlow', title: 'Data Engineer', duration: '2022-2024', description: 'Built ETL pipelines and ML models for recommendation systems.' }]),
      skills: JSON.stringify(['Python', 'TensorFlow', 'SQL', 'Spark', 'Hadoop', 'Pandas', 'NumPy']),
    },
    {
      userId: candidateUsers[3].id,
      basicInfo: JSON.stringify({ name: 'Grace Zhao', email: 'candidate4@example.com', phone: '138-0004-0004', summary: 'DevOps engineer with expertise in Kubernetes and CI/CD pipelines.' }),
      education: JSON.stringify([{ school: 'Shanghai Jiao Tong University', degree: 'Bachelor', major: 'Information Technology', year: '2017-2021' }]),
      workExperience: JSON.stringify([{ company: 'InfraCloud', title: 'DevOps Engineer', duration: '2021-2024', description: 'Managed Kubernetes clusters and built CI/CD pipelines for microservices.' }]),
      skills: JSON.stringify(['Kubernetes', 'Docker', 'AWS', 'Jenkins', 'Terraform', 'Linux', 'Go']),
    },
    {
      userId: candidateUsers[4].id,
      basicInfo: JSON.stringify({ name: 'Henry Sun', email: 'candidate5@example.com', phone: '138-0005-0005', summary: 'Backend developer with Java and microservices experience.' }),
      education: JSON.stringify([{ school: 'Nanjing University', degree: 'Master', major: 'Computer Science', year: '2018-2021' }]),
      workExperience: JSON.stringify([{ company: 'ServiceHub', title: 'Backend Engineer', duration: '2021-2024', description: 'Designed and implemented microservices using Java Spring Boot.' }]),
      skills: JSON.stringify(['Java', 'Spring Boot', 'MySQL', 'Redis', 'Kafka', 'Microservices', 'Docker']),
    },
  ]

  const jobs: { id: string; hrId: string }[] = []

  db.transaction(() => {
    for (const u of hrUsers) {
      db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(u.id, u.email, u.password, u.name, u.role)
    }
    for (const u of candidateUsers) {
      db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(u.id, u.email, u.password, u.name, u.role)
    }

    for (const r of candidateResumes) {
      const resumeId = uuidv4()
      db.prepare('INSERT INTO resumes (id, user_id, file_path, basic_info, education, work_experience, skills) VALUES (?, ?, ?, ?, ?, ?, ?)').run(resumeId, r.userId, '', r.basicInfo, r.education, r.workExperience, r.skills)
      resumes.push({ id: resumeId, userId: r.userId })
    }

    const job1Id = uuidv4()
    jobs.push({ id: job1Id, hrId: hrUsers[0].id })
    db.prepare('INSERT INTO jobs (id, hr_id, title, description, requirements, salary_range, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      job1Id,
      hrUsers[0].id,
      'Senior Frontend Engineer',
      'We are looking for an experienced frontend engineer to join our team. You will be responsible for building modern web applications using React and TypeScript, collaborating with designers and backend engineers to deliver high-quality user experiences.',
      JSON.stringify(['React', 'TypeScript', 'JavaScript', 'Node.js', 'CSS', 'HTML', 'Git', 'REST API', 'Agile']),
      '25k-40k',
      'open'
    )

    const job2Id = uuidv4()
    jobs.push({ id: job2Id, hrId: hrUsers[0].id })
    db.prepare('INSERT INTO jobs (id, hr_id, title, description, requirements, salary_range, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      job2Id,
      hrUsers[0].id,
      'Data Engineer',
      'Join our data team to build and optimize data pipelines. You will work with large-scale data processing systems, develop ETL workflows, and collaborate with data scientists to support ML model deployment.',
      JSON.stringify(['Python', 'SQL', 'Spark', 'Hadoop', 'ETL', 'Data Modeling', 'AWS', 'Docker']),
      '30k-50k',
      'open'
    )

    db.prepare('INSERT INTO job_candidates (id, job_id, candidate_id, resume_id, match_score, match_points, gap_points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      uuidv4(),
      job1Id,
      candidateUsers[0].id,
      resumes[0].id,
      85.7,
      JSON.stringify(['Strong React and TypeScript experience', 'Node.js backend knowledge', 'Git version control proficiency']),
      JSON.stringify(['No REST API design experience mentioned', 'Missing Agile methodology experience']),
      'screening'
    )

    db.prepare('INSERT INTO job_candidates (id, job_id, candidate_id, resume_id, match_score, match_points, gap_points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      uuidv4(),
      job1Id,
      candidateUsers[1].id,
      resumes[1].id,
      55.5,
      JSON.stringify(['React frontend experience', 'General programming skills']),
      JSON.stringify(['No TypeScript experience', 'No CSS/HTML expertise', 'Missing Node.js skills']),
      'pending'
    )

    db.prepare('INSERT INTO job_candidates (id, job_id, candidate_id, resume_id, match_score, match_points, gap_points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      uuidv4(),
      job2Id,
      candidateUsers[2].id,
      resumes[2].id,
      87.5,
      JSON.stringify(['Strong Python and SQL skills', 'Spark and Hadoop experience', 'ETL pipeline development', 'AWS cloud knowledge']),
      JSON.stringify(['No data modeling experience mentioned']),
      'interview'
    )

    db.prepare('INSERT INTO job_candidates (id, job_id, candidate_id, resume_id, match_score, match_points, gap_points, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      uuidv4(),
      job2Id,
      candidateUsers[1].id,
      resumes[1].id,
      50.0,
      JSON.stringify(['Python programming', 'AWS cloud experience', 'Docker containerization']),
      JSON.stringify(['No SQL proficiency', 'Missing Spark/Hadoop skills', 'No ETL experience', 'No data modeling background']),
      'pending'
    )
  })
}

export default db
