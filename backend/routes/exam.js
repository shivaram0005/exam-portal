const express = require("express");
const db = require("../db");
const router = express.Router();

/**
 * GET QUESTIONS (BLOCK IF ALREADY SUBMITTED)
 */
router.get("/questions", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const user = await db.query(
    "SELECT has_submitted FROM allowed_users WHERE email = $1",
    [email],
  );

  if (user.rows.length === 0) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (user.rows[0].has_submitted) {
    return res.status(403).json({
      message: "You have already completed the exam",
    });
  }

  const q = await db.query("SELECT * FROM questions");
  res.json(q.rows);
});

/**
 * SUBMIT EXAM (STRICT: ONE ATTEMPT)
 */
router.post("/submit", async (req, res) => {
  const { email, answers } = req.body;

  if (!email || !answers) {
    return res.status(400).json({ message: "Invalid submission" });
  }

  // 🔒 CHECK SUBMISSION STATE (SINGLE SOURCE OF TRUTH)
  const user = await db.query(
    "SELECT has_submitted FROM allowed_users WHERE email = $1",
    [email],
  );

  if (user.rows.length === 0) {
    return res.status(403).json({ message: "Not allowed" });
  }

  if (user.rows[0].has_submitted) {
    return res.status(403).json({
      message: "You have already submitted the exam",
    });
  }

  let mcqScore = 0;

  for (let a of answers) {
    // store answer
    await db.query(
      "INSERT INTO answers (email, question_id, answer) VALUES ($1,$2,$3)",
      [email, a.question_id, a.answer],
    );

    // auto-evaluate MCQ
    const q = await db.query(
      "SELECT type, correct_answer FROM questions WHERE id = $1",
      [a.question_id],
    );

    if (q.rows[0].type === "MCQ" && a.answer === q.rows[0].correct_answer) {
      mcqScore++;
    }
  }

  // store result
  await db.query(
    `
    INSERT INTO results (email, mcq_score, total_score)
    VALUES ($1, $2, $2)
    ON CONFLICT (email)
    DO UPDATE SET mcq_score = $2, total_score = $2
    `,
    [email, mcqScore],
  );

  // 🔐 MARK EXAM AS COMPLETED (LAST STEP)
  await db.query(
    "UPDATE allowed_users SET has_submitted = true WHERE email = $1",
    [email],
  );

  res.json({
    message: "Exam submitted successfully",
    mcqScore,
  });
});

module.exports = router;
