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

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
