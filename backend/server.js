const express = require("express");
const cors = require("cors");

app.use(
  cors({
    origin: "*",
  }),
);

const authRoutes = require("./routes/auth");
const examRoutes = require("./routes/exam");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);

app.listen(5000, () => console.log("Backend running on http://localhost:5000"));
