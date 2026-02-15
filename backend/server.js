const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const examRoutes = require("./routes/exam");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");

const app = express();

/* ✅ FIXED CORS */
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "https://cyber-security-exam.netlify.app",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);

const PORT = process.env.PORT || 5000;
const db = require("./db");

app.get("/setup-db", async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS allowed_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        status TEXT
      );

      CREATE TABLE IF NOT EXISTS exam_questions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
        type TEXT,
        question TEXT,
        options JSONB,
        correct_answer TEXT,
        max_marks INTEGER
      );

      CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES exams(id),
        email TEXT,
        mcq_score INTEGER DEFAULT 0,
        theory_score INTEGER,
        thesis_score INTEGER,
        total_score INTEGER,
        status TEXT DEFAULT 'STARTED',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exam_answers (
        id SERIAL PRIMARY KEY,
        exam_attempt_id INTEGER REFERENCES exam_attempts(id),
        question_id INTEGER REFERENCES exam_questions(id),
        answer TEXT,
        marks INTEGER,
        evaluated BOOLEAN
      );

      CREATE TABLE IF NOT EXISTS theses (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES exams(id),
        title TEXT,
        problem_statement TEXT,
        case_study TEXT
      );

      CREATE TABLE IF NOT EXISTS thesis_questions (
        id SERIAL PRIMARY KEY,
        thesis_id INTEGER REFERENCES theses(id),
        question TEXT,
        max_marks INTEGER
      );

      CREATE TABLE IF NOT EXISTS thesis_answers (
        id SERIAL PRIMARY KEY,
        exam_attempt_id INTEGER REFERENCES exam_attempts(id),
        thesis_question_id INTEGER REFERENCES thesis_questions(id),
        answer TEXT,
        marks INTEGER,
        evaluated BOOLEAN
      );
    `);

    await db.query(`
      INSERT INTO exams (title, description, status)
      VALUES ('Cyber Security Exam', 'Production Exam', 'LIVE')
      ON CONFLICT DO NOTHING;
    `);

    res.json({ message: "Database setup complete" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
