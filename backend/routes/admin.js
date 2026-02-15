const express = require("express");
const db = require("../db");

const router = express.Router();
const pool = require("../db");

/* =====================================================
   1️⃣ GET ALL STUDENT ATTEMPTS (SUMMARY)
===================================================== */
router.get("/results", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        email,
        mcq_score,
        theory_score,
        thesis_score,
        total_score,
        status,
        submitted_at
      FROM exam_attempts
      ORDER BY submitted_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("FETCH RESULTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
});

/* =====================================================
   2️⃣ GET DETAILED ANSWERS FOR ONE ATTEMPT
===================================================== */
router.get("/results/:attemptId", async (req, res) => {
  try {
    const { attemptId } = req.params;

    /* ===== MCQ + THEORY ===== */
    const answers = await db.query(
      `
      SELECT 
        q.id AS question_id,
        q.type,
        q.question,
        q.correct_answer,
        ea.answer,
        ea.marks
      FROM exam_answers ea
      JOIN exam_questions q ON ea.question_id = q.id
      WHERE ea.exam_attempt_id = $1
      ORDER BY q.id
    `,
      [attemptId],
    );

    /* ===== THESIS ===== */
    const thesisAnswers = await db.query(
      `
      SELECT
        tq.id AS thesis_question_id,
        tq.question,
        ta.answer,
        ta.marks
      FROM thesis_answers ta
      JOIN thesis_questions tq 
        ON ta.thesis_question_id = tq.id
      WHERE ta.exam_attempt_id = $1
      ORDER BY tq.id
    `,
      [attemptId],
    );

    res.json({
      mcqTheory: answers.rows,
      thesis: thesisAnswers.rows,
    });
  } catch (err) {
    console.error("FETCH DETAILED RESULT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch detailed result" });
  }
});

/* =====================================================
   3️⃣ ADD STUDENT EMAIL
===================================================== */
router.post("/add-student", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    await db.query("INSERT INTO allowed_users (email) VALUES ($1)", [email]);

    res.json({ message: "Student added successfully" });
  } catch (err) {
    res.status(400).json({ message: "Email already exists" });
  }
});

/* =====================================================
   4️⃣ ADD QUESTION TO EXAM
===================================================== */
router.post("/exams/:examId/questions", async (req, res) => {
  try {
    const { examId } = req.params;
    const { type, question, options, correct_answer, max_marks } = req.body;

    if (!type || !question) {
      return res.status(400).json({ message: "Type and question required" });
    }

    const result = await db.query(
      `
      INSERT INTO exam_questions
      (exam_id, type, question, options, correct_answer, max_marks)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,
      [
        examId,
        type,
        question,
        type === "MCQ" ? JSON.stringify(options) : null,
        type === "MCQ" ? correct_answer : null,
        max_marks || 1,
      ],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADD QUESTION ERROR:", err);
    res.status(500).json({ message: "Failed to add question" });
  }
});

/* =====================================================
   5️⃣ ADD THESIS
===================================================== */
router.post("/exams/:examId/theses", async (req, res) => {
  try {
    const { examId } = req.params;
    const { title, problem_statement, case_study } = req.body;

    const result = await db.query(
      `
      INSERT INTO theses
      (exam_id, title, problem_statement, case_study)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `,
      [examId, title, problem_statement, case_study],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADD THESIS ERROR:", err);
    res.status(500).json({ message: "Failed to add thesis" });
  }
});

/* =====================================================
   6️⃣ ADD THESIS QUESTION
===================================================== */
router.post("/theses/:thesisId/questions", async (req, res) => {
  try {
    const { thesisId } = req.params;
    const { question, max_marks } = req.body;

    const result = await db.query(
      `
      INSERT INTO thesis_questions
      (thesis_id, question, max_marks)
      VALUES ($1,$2,$3)
      RETURNING *
    `,
      [thesisId, question, max_marks],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ADD THESIS QUESTION ERROR:", err);
    res.status(500).json({ message: "Failed to add thesis question" });
  }
});

// TEMPORARY ROUTE – CREATE ALL TABLES
router.get("/setup-db", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS allowed_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exam_questions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        question TEXT NOT NULL,
        options JSONB,
        correct_answer TEXT,
        max_marks INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS theses (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
        title TEXT,
        problem_statement TEXT,
        case_study TEXT
      );

      CREATE TABLE IF NOT EXISTS thesis_questions (
        id SERIAL PRIMARY KEY,
        thesis_id INTEGER REFERENCES theses(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        max_marks INTEGER DEFAULT 10
      );

      CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        email TEXT,
        exam_id INTEGER REFERENCES exams(id),
        mcq_score INTEGER DEFAULT 0,
        theory_score INTEGER DEFAULT 0,
        thesis_score INTEGER DEFAULT 0,
        total_score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'STARTED',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER REFERENCES exam_attempts(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES exam_questions(id) ON DELETE CASCADE,
        answer TEXT,
        marks INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS thesis_answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER REFERENCES exam_attempts(id) ON DELETE CASCADE,
        thesis_question_id INTEGER REFERENCES thesis_questions(id) ON DELETE CASCADE,
        answer TEXT,
        marks INTEGER DEFAULT 0
      );
    `);

    res.json({ message: "Database setup completed successfully" });
  } catch (err) {
    console.error("SETUP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/seed", async (req, res) => {
  await pool.query(`
    INSERT INTO exams (title, description)
    VALUES ('Cyber Security Exam', 'Production Exam')
    ON CONFLICT DO NOTHING;
  `);

  res.json({ message: "Seed inserted" });
});
/* =====================================================
   RESET EVERYTHING (PRODUCTION RESET)
===================================================== */

// CREATE EXAM
// router.post("/create-exam", async (req, res) => {
//   try {
//     const { title, description } = req.body;

//     const result = await pool.query(
//       `INSERT INTO exams (title, description, status)
//        VALUES ($1, $2, 'LIVE')
//        RETURNING *`,
//       [title, description],
//     );

//     res.json({
//       message: "Exam created successfully",
//       exam: result.rows[0],
//     });
//   } catch (err) {
//     console.error("CREATE EXAM ERROR:", err);
//     res.status(500).json({ message: "Failed to create exam" });
//   }
// });

router.get("/force-reset", async (req, res) => {
  try {
    await db.query("TRUNCATE exam_answers RESTART IDENTITY CASCADE");
    await db.query("TRUNCATE thesis_answers RESTART IDENTITY CASCADE");
    await db.query("TRUNCATE exam_attempts RESTART IDENTITY CASCADE");
    await db.query("TRUNCATE exam_questions RESTART IDENTITY CASCADE");
    await db.query("TRUNCATE thesis_questions RESTART IDENTITY CASCADE");
    await db.query("TRUNCATE theses RESTART IDENTITY CASCADE");
    await db.query("TRUNCATE exams RESTART IDENTITY CASCADE");
    await db.query("TRUNCATE allowed_users RESTART IDENTITY CASCADE");

    res.json({ message: "🔥 DATABASE FULLY RESET SUCCESS" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
