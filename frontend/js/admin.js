const API_BASE = "http://localhost:5000/api/admin";

/* ==============================
   LOAD ATTEMPT SUMMARY
============================== */
async function loadResults() {
  const res = await fetch(`${API_BASE}/results`);
  const data = await res.json();

  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  data.forEach((attempt) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${attempt.email}</td>
      <td>${attempt.mcq_score || 0}</td>
      <td>${attempt.theory_score || 0}</td>
      <td>${attempt.thesis_score || 0}</td>
      <td>${attempt.total_score || 0}</td>
      <td>${attempt.status || "-"}</td>
      <td>
        <button onclick="viewDetails(${attempt.id})">
  View
</button>


      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* ==============================
   VIEW DETAILED ANSWERS
============================== */
async function viewDetails(attemptId) {
  const res = await fetch(`${API_BASE}/results/${attemptId}`);
  const data = await res.json();

  const container = document.getElementById("detailedResult");
  container.innerHTML = "<h3>Detailed Answers</h3>";

  /* =========================
     MCQ + THEORY
  ========================= */
  if (data.mcqTheory && data.mcqTheory.length > 0) {
    data.mcqTheory.forEach((a) => {
      container.innerHTML += `
        <div style="margin-bottom:15px;">
          <b>Type:</b> ${a.type}<br>
          <b>Question:</b> ${a.question}<br>
          <b>Student Answer:</b> ${a.answer}<br>
          <b>Correct Answer:</b> ${a.correct_answer || "-"}<br>
          <b>Marks:</b> ${a.marks ?? 0}
        </div>
        <hr/>
      `;
    });
  }

  /* =========================
     THESIS
  ========================= */
  if (data.thesis && data.thesis.length > 0) {
    container.innerHTML += "<h4>Thesis Answers</h4>";

    data.thesis.forEach((t) => {
      container.innerHTML += `
        <div style="margin-bottom:15px;">
          <b>Question:</b> ${t.question}<br>
          <b>Student Answer:</b> ${t.answer}<br>
          <b>Marks:</b> ${t.marks ?? 0}
        </div>
        <hr/>
      `;
    });
  }

  if (
    (!data.mcqTheory || data.mcqTheory.length === 0) &&
    (!data.thesis || data.thesis.length === 0)
  ) {
    container.innerHTML += "<p>No answers submitted.</p>";
  }
}

/* ==============================
   ADD STUDENT
============================== */
async function addStudent() {
  const email = document.getElementById("studentEmail").value;

  if (!email) {
    alert("Please enter an email");
    return;
  }

  const res = await fetch(`${API_BASE}/add-student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  alert(data.message);

  document.getElementById("studentEmail").value = "";
}

/* ==============================
   ADD QUESTION
============================== */
async function addQuestion() {
  const examId = document.getElementById("examId").value;
  const type = document.getElementById("qType").value;
  const question = document.getElementById("qText").value;
  const optionsText = document.getElementById("qOptions").value;
  const correct_answer = document.getElementById("qAnswer").value;
  const max_marks = document.getElementById("qMarks").value;

  if (!examId || !question) {
    alert("Exam ID and Question are required");
    return;
  }

  const options =
    type === "MCQ" ? optionsText.split(",").map((o) => o.trim()) : null;

  const res = await fetch(`${API_BASE}/exams/${examId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      question,
      options,
      correct_answer,
      max_marks,
    }),
  });

  const data = await res.json();
  alert("Question added successfully");

  document.getElementById("qText").value = "";
  document.getElementById("qOptions").value = "";
  document.getElementById("qAnswer").value = "";
  document.getElementById("qMarks").value = "";
}

async function addThesis() {
  const examId = document.getElementById("thesisExamId").value;
  const title = document.getElementById("thesisTitle").value;
  const problem_statement = document.getElementById("thesisProblem").value;
  const case_study = document.getElementById("thesisCase").value;

  if (!examId || !title || !problem_statement || !case_study) {
    alert("All fields required");
    return;
  }

  const res = await fetch(`${API_BASE}/exams/${examId}/theses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      problem_statement,
      case_study,
    }),
  });

  const data = await res.json();
  alert("Thesis added successfully");
}

async function addThesisQuestion() {
  const thesisId = document.getElementById("thesisId").value;
  const question = document.getElementById("thesisQuestion").value;
  const max_marks = document.getElementById("thesisMarks").value;

  if (!thesisId || !question || !max_marks) {
    alert("All fields required");
    return;
  }

  const res = await fetch(`${API_BASE}/theses/${thesisId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      max_marks,
    }),
  });

  const data = await res.json();
  alert("Thesis question added successfully");
}

/* ==============================
   INIT
============================== */
loadResults();
