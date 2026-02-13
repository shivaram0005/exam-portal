const API_BASE = "https://exam-portal-7xlx.onrender.com/api/auth";

async function login() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Please enter your email");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // ✅ Redirect with email in URL
    window.location.href = `exam.html?email=${encodeURIComponent(email)}`;
  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
}
