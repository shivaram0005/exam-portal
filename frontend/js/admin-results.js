async function loadResults() {
  const res = await fetch("http://localhost:5000/api/admin/results");
  const data = await res.json();

  const container = document.getElementById("results-container");
  container.innerHTML = "";

  const grouped = {};

  // Group MCQ + THEORY
  data.answers.forEach((row) => {
    if (!grouped[row.email]) {
      grouped[row.email] = { mcq: [], theory: [], thesis: [] };
    }

    if (row.type === "MCQ") {
      grouped[row.email].mcq.push(row);
    } else {
      grouped[row.email].theory.push(row);
    }
  });

  // Group THESIS
  data.thesisAnswers.forEach((row) => {
    if (!grouped[row.email]) {
      grouped[row.email] = { mcq: [], theory: [], thesis: [] };
    }
    grouped[row.email].thesis.push(row);
  });

  // Render UI
  Object.keys(grouped).forEach((email) => {
    const studentDiv = document.createElement("div");
    studentDiv.innerHTML = `<h2>${email}</h2>`;

    // MCQ
    studentDiv.innerHTML += "<h3>MCQ</h3>";
    grouped[email].mcq.forEach((q) => {
      studentDiv.innerHTML += `
        <p><b>${q.question}</b></p>
        <p>Answer: ${q.answer}</p>
        <p>Correct: ${q.correct_answer}</p>
        <p>Score: ${q.marks || 0}</p>
        <hr/>
      `;
    });

    // THEORY
    studentDiv.innerHTML += "<h3>Theory</h3>";
    grouped[email].theory.forEach((q) => {
      studentDiv.innerHTML += `
        <p><b>${q.question}</b></p>
        <p>Answer: ${q.answer}</p>
        <p>Marks: ${q.marks || 0}</p>
        <hr/>
      `;
    });

    // THESIS
    studentDiv.innerHTML += "<h3>Thesis</h3>";
    grouped[email].thesis.forEach((q) => {
      studentDiv.innerHTML += `
        <p><b>${q.question}</b></p>
        <p>Answer: ${q.answer}</p>
        <p>Marks: ${q.marks || 0}</p>
        <hr/>
      `;
    });

    container.appendChild(studentDiv);
  });
}

loadResults();
