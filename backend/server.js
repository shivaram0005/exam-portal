const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const examRoutes = require("./routes/exam");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");

const app = express();

// Middlewares
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://your-frontend-domain.com",
    ],
  }),
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);

// Render PORT Fix
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.json({ message: "Backend is alive 🚀" });
});
