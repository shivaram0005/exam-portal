const EXAM_ID = 1;
const BASE_URL = "http://localhost:5000/api/student";

const params = new URLSearchParams(window.location.search);
const studentEmail = params.get("email");

if (!studentEmail) {
  alert("Unauthorized access. Please login.");
  window.location.href = "login.html";
}
let mcqAnswers = {};
let theoryAnswers = {};
let thesisAnswers = {};

/* =======================
   START EXAM
======================= */

async function startExam() {
  const res = await fetch(
    `http://localhost:5000/api/student/exams/${EXAM_ID}/start`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: studentEmail }),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    throw new Error("Failed to start exam");
  }
}

/* =======================
   LOAD EXAM
======================= */
async function loadExam() {
  try {
    await startExam();

    const res = await fetch(`${BASE_URL}/exams/${EXAM_ID}/content`);
    if (!res.ok) throw new Error("Failed to fetch exam");

    const data = await res.json();

    document.getElementById("exam-title").innerText = data.exam.title;
    document.getElementById("exam-description").innerText =
      data.exam.description;

    renderMCQs(data.questions);
    renderTheory(data.questions);
    renderThesis(data.theses);
  } catch (err) {
    console.error(err);
    alert("Unable to load exam.");
  }
}

/* =======================
   MCQ SECTION
======================= */
function renderMCQs(questions) {
  const container = document.getElementById("mcq-section");
  container.innerHTML = "<h2>Section A: MCQ</h2>";

  const mcqs = questions.filter((q) => q.type === "MCQ");

  if (mcqs.length === 0) {
    container.innerHTML += "<p>No MCQ questions.</p>";
    return;
  }

  mcqs.forEach((q, index) => {
    const div = document.createElement("div");

    div.innerHTML = `<p><b>Q${index + 1}.</b> ${q.question}</p>`;

    const options = Array.isArray(q.options)
      ? q.options
      : JSON.parse(q.options || "[]");

    options.forEach((opt) => {
      const label = document.createElement("label");

      label.innerHTML = `
        <input type="radio" name="mcq_${q.id}" value="${opt}">
        ${opt}
      `;

      label.querySelector("input").addEventListener("change", () => {
        mcqAnswers[q.id] = opt;
      });

      div.appendChild(label);
      div.appendChild(document.createElement("br"));
    });

    container.appendChild(div);
    container.appendChild(document.createElement("hr"));
  });
}

/* =======================
   THEORY SECTION
======================= */
function renderTheory(questions) {
  const container = document.getElementById("theory-section");
  container.innerHTML = "<h2>Section B: Theory</h2>";

  const theory = questions.filter((q) => q.type === "THEORY");

  if (theory.length === 0) {
    container.innerHTML += "<p>No Theory questions.</p>";
    return;
  }

  theory.forEach((q, index) => {
    const div = document.createElement("div");

    div.innerHTML = `
      <p><b>Q${index + 1}.</b> ${q.question}</p>
      <textarea rows="4" style="width:100%;"></textarea>
      <br/><br/>
    `;

    div.querySelector("textarea").addEventListener("input", (e) => {
      theoryAnswers[q.id] = e.target.value;
    });

    container.appendChild(div);
    container.appendChild(document.createElement("hr"));
  });
}

/* =======================
   THESIS SECTION
======================= */
function renderThesis(theses) {
  const container = document.getElementById("thesis-section");
  container.innerHTML = "<h2>Section C: Thesis</h2>";

  if (!theses || theses.length === 0) {
    container.innerHTML += "<p>No Thesis available.</p>";
    return;
  }

  theses.forEach((thesis) => {
    const block = document.createElement("div");

    block.innerHTML = `
      <h3>${thesis.title}</h3>
      <p><b>Problem:</b> ${thesis.problem_statement}</p>
      <p><b>Case Study:</b> ${thesis.case_study}</p>
      <br/>
    `;

    thesis.questions.forEach((q, index) => {
      const div = document.createElement("div");

      div.innerHTML = `
        <p><b>Q${index + 1}.</b> ${q.question}</p>
        <textarea rows="4" style="width:100%;"></textarea>
        <br/><br/>
      `;

      div.querySelector("textarea").addEventListener("input", (e) => {
        thesisAnswers[q.id] = e.target.value;
      });

      block.appendChild(div);
    });

    container.appendChild(block);
    container.appendChild(document.createElement("hr"));
  });
}

/* =======================
   SUBMIT EXAM
======================= */
document.getElementById("submit-exam").addEventListener("click", submitExam);

async function submitExam() {
  try {
    if (!studentEmail) {
      alert("Session expired. Reload the page.");
      return;
    }

    const payload = {
      email: studentEmail,
      answers: [
        ...Object.entries(mcqAnswers).map(([id, ans]) => ({
          question_id: Number(id),
          answer: ans,
        })),
        ...Object.entries(theoryAnswers).map(([id, ans]) => ({
          question_id: Number(id),
          answer: ans,
        })),
      ],
      thesisAnswers: Object.entries(thesisAnswers).map(([id, ans]) => ({
        thesis_question_id: Number(id),
        answer: ans,
      })),
    };

    console.log("Submitting:", payload);

    const res = await fetch(`${BASE_URL}/exams/${EXAM_ID}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("Exam submitted successfully!");

    // Redirect back to login
    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert("Submission failed.");
  }
}

loadExam();
