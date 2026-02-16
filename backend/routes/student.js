const express = require("express");
const db = require("../db");
const router = express.Router();

/* =====================================================
   GET FULL EXAM CONTENT (MCQ + THEORY + THESIS)
===================================================== */
router.get("/exams/:examId/content", async (req, res) => {
  try {
    const { examId } = req.params;

    // Check exam is LIVE
    const exam = await db.query(
      "SELECT id, title, description FROM exams WHERE id = $1 AND is_live = true",
      [examId],
    );

    if (exam.rows.length === 0) {
      return res.status(404).json({ message: "Exam not found or not LIVE" });
    }

    // Get MCQ + THEORY questions
    const questions = await db.query(
      `
      SELECT id, type, question, options, correct_answer, max_marks
      FROM exam_questions
      WHERE exam_id = $1
      ORDER BY id
      `,
      [examId],
    );

    // Get Theses
    const theses = await db.query(
      `
      SELECT id, title, problem_statement, case_study
      FROM theses
      WHERE exam_id = $1
      ORDER BY id
      `,
      [examId],
    );

    // Get Thesis Questions
    const thesisQuestions = await db.query(
      `
      SELECT tq.id, tq.thesis_id, tq.question, tq.max_marks
      FROM thesis_questions tq
      JOIN theses t ON tq.thesis_id = t.id
      WHERE t.exam_id = $1
      ORDER BY tq.id
      `,
      [examId],
    );

    res.json({
      exam: exam.rows[0],
      questions: questions.rows,
      theses: theses.rows.map((thesis) => ({
        ...thesis,
        questions: thesisQuestions.rows.filter(
          (q) => q.thesis_id === thesis.id,
        ),
      })),
    });
  } catch (err) {
    console.error("FETCH EXAM CONTENT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch exam content" });
  }
});

/* =====================================================
   START EXAM (ONE ATTEMPT ONLY)
===================================================== */
router.post("/exams/:examId/start", async (req, res) => {
  try {
    const { examId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check exam is LIVE
    const exam = await db.query(
      "SELECT id FROM exams WHERE id = $1 AND is_live = true",
      [examId],
    );

    if (exam.rows.length === 0) {
      return res.status(403).json({ message: "Exam not available" });
    }

    // Create attempt
    const attempt = await db.query(
      `
      INSERT INTO exam_attempts (exam_id, email)
      VALUES ($1, $2)
      RETURNING *
      `,
      [examId, email],
    );

    res.json({
      message: "Exam started successfully",
      attempt: attempt.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(403).json({
        message: "You have already attempted this exam",
      });
    }

    console.error("START EXAM ERROR:", err);
    res.status(500).json({ message: "Failed to start exam" });
  }
});

/* =====================================================
   SUBMIT EXAM (MCQ + THEORY + THESIS)
===================================================== */
router.post("/exams/:examId/submit", async (req, res) => {
  try {
    const { examId } = req.params;
    const { email, answers = [], thesisAnswers = [] } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check attempt exists
    const attemptRes = await db.query(
      `
      SELECT id FROM exam_attempts
      WHERE exam_id = $1 AND email = $2
      `,
      [examId, email],
    );

    if (attemptRes.rows.length === 0) {
      return res.status(403).json({ message: "Exam not started" });
    }

    const attemptId = attemptRes.rows[0].id;
    let mcqScore = 0;

    /* =============================
       SAVE MCQ + THEORY ANSWERS
    ============================== */
    for (const a of answers) {
      const qRes = await db.query(
        `
        SELECT type, correct_answer, max_marks
        FROM exam_questions
        WHERE id = $1
        `,
        [a.question_id],
      );

      if (qRes.rows.length === 0) continue;

      const question = qRes.rows[0];
      let marks = null;
      let evaluated = false;

      if (question.type === "MCQ") {
        evaluated = true;

        if (a.answer === question.correct_answer) {
          marks = question.max_marks;
          mcqScore += marks;
        } else {
          marks = 0;
        }
      }

      await db.query(
        `
        INSERT INTO exam_answers
          (exam_attempt_id, question_id, answer, marks, evaluated)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [attemptId, a.question_id, a.answer, marks, evaluated],
      );
    }

    /* =============================
       SAVE THESIS ANSWERS
    ============================== */
    for (const t of thesisAnswers) {
      await db.query(
        `
        INSERT INTO thesis_answers
          (exam_attempt_id, thesis_question_id, answer, evaluated)
        VALUES ($1, $2, $3, false)
        `,
        [attemptId, t.thesis_question_id, t.answer],
      );
    }

    // Update MCQ score
    await db.query(
      `
      UPDATE exam_attempts
      SET mcq_score = $1
      WHERE id = $2
      `,
      [mcqScore, attemptId],
    );

    res.json({
      message: "Exam submitted successfully",
      mcqScore,
    });
  } catch (err) {
    console.error("SUBMIT EXAM ERROR:", err);
    res.status(500).json({ message: "Failed to submit exam" });
  }
});

module.exports = router;
