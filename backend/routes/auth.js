const express = require("express");
const db = require("../db");
const router = express.Router();

/* =====================================
   LOGIN (Student must be allowed user)
===================================== */
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await db.query(
      "SELECT * FROM allowed_users WHERE LOWER(email) = LOWER($1)",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: "You are not allowed to take this exam",
      });
    }

    res.json({
      message: "Login successful",
      email,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      message: "Login failed",
    });
  }
});

module.exports = router;
